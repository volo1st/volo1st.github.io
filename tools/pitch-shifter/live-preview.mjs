const UPDATE_SECONDS = 0.1;

async function createSignalsmithNode(audioContext, options) {
  const { default: SignalsmithStretch } = await import(
    './vendor/signalsmith-stretch/SignalsmithStretchRealtime.mjs?v=97530b11d5bc'
  );
  return SignalsmithStretch(audioContext, options);
}

export function supportsLivePreview(root = globalThis) {
  const AudioContextClass = root.AudioContext || root.webkitAudioContext;
  return Boolean(root.isSecureContext && AudioContextClass && root.AudioWorkletNode);
}

export class LivePreviewController {
  constructor(audioBuffer, {
    onTime = () => {},
    onEnded = () => {},
    createStretchNode = createSignalsmithNode,
    createAudioContext = null,
    preset = 'default',
  } = {}) {
    if (preset !== 'cheaper' && preset !== 'default') {
      throw new RangeError('The processing preset must be cheaper or default.');
    }
    this.audioBuffer = audioBuffer;
    this.onTime = onTime;
    this.onEnded = onEnded;
    this.createStretchNode = createStretchNode;
    this.createAudioContext = createAudioContext;
    this.preset = preset;
    this.context = null;
    this.node = null;
    this.playing = false;
    this.position = 0;
    this.ending = false;
  }

  async initialize() {
    if (this.node) return;
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!this.createAudioContext && !AudioContextClass) {
      throw new Error('The browser does not provide an audio context.');
    }

    const context = this.createAudioContext
      ? this.createAudioContext(this.audioBuffer.sampleRate)
      : new AudioContextClass({ sampleRate: this.audioBuffer.sampleRate });
    this.context = context;

    try {
      await context.resume();
      const channelCount = this.audioBuffer.numberOfChannels;
      const node = await this.createStretchNode(context, {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [channelCount],
        channelCount,
        channelCountMode: 'explicit',
      });
      this.node = node;
      node.connect(context.destination);
      await node.configure({ preset: this.preset });
      await node.setUpdateInterval(UPDATE_SECONDS, (seconds) => {
        this.handleTimeUpdate(seconds);
      });

      const channels = Array.from(
        { length: channelCount },
        (_, channel) => this.audioBuffer.getChannelData(channel).slice(),
      );
      await node.addBuffers(channels, channels.map((channel) => channel.buffer));
    } catch (error) {
      await this.release();
      throw error;
    }
  }

  handleTimeUpdate(seconds) {
    if (!Number.isFinite(seconds)) return;
    const duration = this.audioBuffer.duration;
    this.position = Math.max(0, Math.min(duration, seconds));
    this.onTime(this.position);
    if (this.playing && seconds >= duration && !this.ending) {
      this.ending = true;
      this.playing = false;
      this.node.schedule({ active: false, output: this.context.currentTime })
        .catch(() => {})
        .finally(() => {
          this.ending = false;
          this.onEnded();
        });
    }
  }

  async play(position, semitones) {
    await this.initialize();
    await this.context.resume();
    this.position = position >= this.audioBuffer.duration ? 0 : Math.max(0, position);
    await this.node.schedule({
      active: true,
      input: this.position,
      output: this.context.currentTime,
      rate: 1,
      semitones,
      tonalityHz: 8_000,
      formantSemitones: 0,
      formantCompensation: false,
      formantBaseHz: 0,
      loopStart: 0,
      loopEnd: 0,
    });
    this.playing = true;
    this.onTime(this.position);
  }

  async pause() {
    if (!this.node || !this.playing) return this.position;
    const result = await this.node.schedule({
      active: false,
      output: this.context.currentTime,
    });
    this.playing = false;
    if (Number.isFinite(result?.input)) {
      this.position = Math.max(0, Math.min(this.audioBuffer.duration, result.input));
    }
    this.onTime(this.position);
    return this.position;
  }

  async seek(position, semitones) {
    this.position = Math.max(0, Math.min(this.audioBuffer.duration, position));
    if (this.node) {
      await this.node.schedule({
        active: this.playing,
        input: this.position,
        output: this.context.currentTime,
        rate: 1,
        semitones,
      });
    }
    this.onTime(this.position);
  }

  async setSemitones(semitones) {
    if (!this.node) return;
    await this.node.schedule({
      active: this.playing,
      output: this.context.currentTime,
      semitones,
    });
  }

  async release() {
    const node = this.node;
    const context = this.context;
    this.node = null;
    this.context = null;
    this.playing = false;
    this.position = 0;
    this.ending = false;

    if (node) {
      try { await node.schedule({ active: false }); } catch (error) { /* Best-effort cleanup. */ }
      try { await node.dropBuffers(); } catch (error) { /* Best-effort cleanup. */ }
      try { node.disconnect(); } catch (error) { /* Best-effort cleanup. */ }
      try { node.port.close(); } catch (error) { /* Best-effort cleanup. */ }
    }
    if (context && context.state !== 'closed') {
      try { await context.close(); } catch (error) { /* Best-effort cleanup. */ }
    }
  }
}
