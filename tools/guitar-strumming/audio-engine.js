(function initializeAudioEngine(root, factory) {
  'use strict';
  root.GuitarStrummingAudio = factory(root, root.GuitarStrummingCore);
}(typeof globalThis !== 'undefined' ? globalThis : this, function createAudioApi(root, core) {
  'use strict';

  const BUFFER_VARIATION_COUNT = 3;
  const PLUCK_DURATION_SECONDS = 2.4;
  const PALM_MUTE_DURATION_SECONDS = 0.38;
  const DEAD_STRUM_DURATION_SECONDS = 0.11;
  const COUNT_IN_CLICK_DURATION_SECONDS = 0.055;
  const RESUME_TIMEOUT_MILLISECONDS = 2000;

  function isSupported() {
    return Boolean(root.AudioContext || root.webkitAudioContext);
  }

  class GuitarAudioEngine {
    constructor() {
      if (!core) {
        throw new Error('The guitar timing core is unavailable.');
      }
      if (!isSupported()) {
        throw new Error('This browser does not provide the required Web Audio functions.');
      }
      this.context = null;
      this.masterGain = null;
      this.activeVoices = new Set();
      this.bufferCache = new Map();
      this.variationCounter = 0;
    }

    async ensureRunning() {
      this.ensureContext();
      if (this.context.state !== 'running') {
        await promiseWithTimeout(
          this.context.resume(),
          RESUME_TIMEOUT_MILLISECONDS,
          'The audio context did not start. Press Play to try again.',
        );
      }
      await this.configurePlaybackAudioSession();
      if (this.context.state !== 'running') {
        throw new Error(`The audio context is ${this.context.state}. Press Play to try again.`);
      }
      return this.context;
    }

    async configurePlaybackAudioSession() {
      const audioSession = root.navigator && root.navigator.audioSession;
      if (!audioSession || !('type' in audioSession)) return;
      audioSession.type = 'ambient';
      await new Promise((resolve) => root.setTimeout(resolve, 0));
      audioSession.type = 'playback';
    }

    getAudioSessionType() {
      const audioSession = root.navigator && root.navigator.audioSession;
      if (!audioSession || !('type' in audioSession)) return 'not available';
      return audioSession.type;
    }

    ensureContext() {
      if (this.context) return;
      const AudioContextConstructor = root.AudioContext || root.webkitAudioContext;
      this.context = new AudioContextConstructor({ latencyHint: 'interactive' });

      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.58;

      const compressor = this.context.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 12;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.2;

      this.masterGain.connect(compressor);
      compressor.connect(this.context.destination);
    }

    playStrum(stringPitches, strum, when) {
      if (!this.context || this.context.state !== 'running') {
        throw new Error('The audio context is not running.');
      }
      if (!strum || typeof strum !== 'object') {
        throw new TypeError('Normalized strum data is required.');
      }
      if (!['normal', 'palm-mute', 'dead'].includes(strum.articulation)) {
        throw new RangeError('The strum articulation is invalid.');
      }
      const stringIndexes = core.selectStringIndexes(
        stringPitches,
        strum.direction,
        strum.stringCount,
      );
      const stringDelay = strum.direction === 'D' ? 0.010 : 0.008;
      const baseVelocity = strum.direction === 'D' ? 0.24 : 0.19;
      const articulationLevel = strum.articulation === 'palm-mute'
        ? 0.86
        : (strum.articulation === 'dead' ? (strum.accented ? 0.72 : 0.54) : 1);
      const accentLevel = strum.accented
        ? (strum.articulation === 'dead' ? 1.35 : 1.65)
        : 1;
      const velocity = baseVelocity * articulationLevel * accentLevel;

      stringIndexes.forEach((stringIndex, attackIndex) => {
        const midiNote = stringPitches[stringIndex];
        const attackTime = when + (attackIndex * stringDelay);
        if (strum.articulation === 'dead') {
          this.playDeadString(midiNote, attackTime, velocity, when);
        } else {
          this.playString(
            midiNote,
            attackTime,
            velocity,
            when,
            strum.articulation === 'palm-mute',
            strum.accented,
          );
        }
      });
    }

    playCountInClick(when, accented) {
      if (!this.context || this.context.state !== 'running') {
        throw new Error('The audio context is not running.');
      }
      const source = this.context.createOscillator();
      const gain = this.context.createGain();
      const velocity = accented ? 0.18 : 0.11;

      source.type = 'triangle';
      source.frequency.setValueAtTime(accented ? 1320 : 880, when);
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(velocity, when + 0.002);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        when + COUNT_IN_CLICK_DURATION_SECONDS,
      );

      source.connect(gain);
      gain.connect(this.masterGain);

      const voice = { source, gain, scheduledEventTime: when };
      this.activeVoices.add(voice);
      source.addEventListener('ended', () => {
        source.disconnect();
        gain.disconnect();
        this.activeVoices.delete(voice);
      }, { once: true });

      source.start(when);
      source.stop(when + COUNT_IN_CLICK_DURATION_SECONDS + 0.01);
    }

    playString(midiNote, when, velocity, scheduledEventTime, palmMuted, accented) {
      const source = this.context.createBufferSource();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      const variation = this.variationCounter % BUFFER_VARIATION_COUNT;
      const duration = palmMuted ? PALM_MUTE_DURATION_SECONDS : PLUCK_DURATION_SECONDS;
      this.variationCounter += 1;

      source.buffer = this.getPluckBuffer(midiNote, variation);
      filter.type = 'lowpass';
      const baseFilterFrequency = palmMuted
        ? Math.min(3000, Math.max(750, midiToFrequency(midiNote) * 5))
        : Math.min(7500, Math.max(1400, midiToFrequency(midiNote) * 14));
      filter.frequency.value = accented
        ? Math.min(palmMuted ? 4200 : 9000, baseFilterFrequency * 1.6)
        : baseFilterFrequency;
      filter.Q.value = palmMuted ? 0.5 : 0.35;

      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(velocity, when + (accented ? 0.002 : 0.004));
      gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      const voice = { source, filter, gain, scheduledEventTime };
      this.activeVoices.add(voice);
      source.addEventListener('ended', () => {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
        this.activeVoices.delete(voice);
      }, { once: true });

      source.start(when);
      source.stop(when + duration + 0.01);
    }

    playDeadString(midiNote, when, velocity, scheduledEventTime) {
      const source = this.context.createBufferSource();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      const variation = this.variationCounter % BUFFER_VARIATION_COUNT;
      this.variationCounter += 1;

      source.buffer = this.getDeadStrumBuffer(variation);
      filter.type = 'bandpass';
      filter.frequency.value = Math.min(2600, Math.max(1100, midiToFrequency(midiNote) * 6));
      filter.Q.value = 0.65;

      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(velocity, when + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + DEAD_STRUM_DURATION_SECONDS);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      const voice = { source, filter, gain, scheduledEventTime };
      this.activeVoices.add(voice);
      source.addEventListener('ended', () => {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
        this.activeVoices.delete(voice);
      }, { once: true });

      source.start(when);
      source.stop(when + DEAD_STRUM_DURATION_SECONDS + 0.01);
    }

    getPluckBuffer(midiNote, variation) {
      const cacheKey = `${midiNote}:${variation}`;
      if (this.bufferCache.has(cacheKey)) {
        return this.bufferCache.get(cacheKey);
      }

      const sampleRate = this.context.sampleRate;
      const frequency = midiToFrequency(midiNote);
      const period = Math.max(2, Math.round(sampleRate / frequency));
      const frameCount = Math.ceil(sampleRate * PLUCK_DURATION_SECONDS);
      const buffer = this.context.createBuffer(1, frameCount, sampleRate);
      const samples = buffer.getChannelData(0);
      const random = createSeededRandom((midiNote * 97) + (variation * 7919));

      for (let index = 0; index < period; index += 1) {
        const pickEnvelope = Math.sin((Math.PI * (index + 1)) / (period + 1));
        samples[index] = ((random() * 2) - 1) * pickEnvelope;
      }

      const feedback = 0.996;
      for (let index = period; index < frameCount; index += 1) {
        samples[index] = feedback * 0.5 * (
          samples[index - period]
          + samples[index - period + 1]
        );
      }

      this.bufferCache.set(cacheKey, buffer);
      return buffer;
    }

    getDeadStrumBuffer(variation) {
      const cacheKey = `dead:${variation}`;
      if (this.bufferCache.has(cacheKey)) {
        return this.bufferCache.get(cacheKey);
      }

      const sampleRate = this.context.sampleRate;
      const frameCount = Math.ceil(sampleRate * DEAD_STRUM_DURATION_SECONDS);
      const buffer = this.context.createBuffer(1, frameCount, sampleRate);
      const samples = buffer.getChannelData(0);
      const random = createSeededRandom(0x51F15E + (variation * 7919));

      for (let index = 0; index < frameCount; index += 1) {
        const envelope = 1 - (index / frameCount);
        samples[index] = ((random() * 2) - 1) * envelope;
      }

      this.bufferCache.set(cacheKey, buffer);
      return buffer;
    }

    stopAll() {
      if (!this.context) return;
      const stopTime = this.context.currentTime + 0.02;
      for (const voice of this.activeVoices) {
        try {
          voice.gain.gain.cancelScheduledValues(this.context.currentTime);
          voice.gain.gain.setValueAtTime(0.05, this.context.currentTime);
          voice.gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);
          voice.source.stop(stopTime);
        } catch (error) {
          if (error.name !== 'InvalidStateError') throw error;
        }
      }
    }

    cancelScheduledFrom(audioTime) {
      if (!this.context) return;
      for (const voice of this.activeVoices) {
        if (voice.scheduledEventTime < audioTime) continue;
        try {
          voice.source.stop(this.context.currentTime);
        } catch (error) {
          if (error.name !== 'InvalidStateError') throw error;
        }
      }
    }
  }

  function midiToFrequency(midiNote) {
    return 440 * (2 ** ((midiNote - 69) / 12));
  }

  function createSeededRandom(seed) {
    let state = seed >>> 0;
    return function nextRandom() {
      state += 0x6D2B79F5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function promiseWithTimeout(promise, timeoutMilliseconds, message) {
    return new Promise((resolve, reject) => {
      const timeoutId = root.setTimeout(() => reject(new Error(message)), timeoutMilliseconds);
      Promise.resolve(promise).then(
        (value) => {
          root.clearTimeout(timeoutId);
          resolve(value);
        },
        (error) => {
          root.clearTimeout(timeoutId);
          reject(error);
        },
      );
    });
  }

  return Object.freeze({ GuitarAudioEngine, isSupported });
}));
