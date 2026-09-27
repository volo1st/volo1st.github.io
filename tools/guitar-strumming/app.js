(function initializePrototype(root) {
  'use strict';

  const core = root.GuitarStrummingCore;
  const catalog = root.GuitarChordCatalog;
  const audioApi = root.GuitarStrummingAudio;
  const START_LEAD_SECONDS = 0.05;
  const SCHEDULE_AHEAD_SECONDS = 0.2;
  const SCHEDULER_INTERVAL_MILLISECONDS = 25;
  const SIMULATED_STALL_MILLISECONDS = 250;

  const elements = {
    play: document.getElementById('play-loop'),
    stop: document.getElementById('stop-loop'),
    downstroke: document.getElementById('test-downstroke'),
    upstroke: document.getElementById('test-upstroke'),
    stall: document.getElementById('simulate-stall'),
    status: document.getElementById('status'),
    statistics: document.getElementById('statistics'),
  };

  const demonstrationSong = {
    bpm: 100,
    gridSize: 8,
    chordBars: [
      [{ chord: 'C', slot: 1 }, { chord: 'G/B', slot: 8 }],
      [{ chord: 'G/B', slot: 1 }],
      [{ chord: 'Am', slot: 1 }, { chord: 'F', slot: 8 }],
      [{ chord: 'F', slot: 1 }],
    ],
    strumBars: [
      ['D', '-', 'D', 'U', '-', 'U', 'D', 'U'],
      ['D', '-', 'D', 'U', '-', 'U', 'D', 'U'],
      ['D', '-', 'D', 'U', '-', 'U', 'D', 'U'],
      ['D', '-', 'D', 'U', '-', 'U', 'D', 'U'],
    ],
  };

  let timeline = null;
  let playableEvents = null;
  let audioEngine = null;
  let scheduleCursor = null;
  let playbackOrigin = 0;
  let schedulerTimer = null;
  let scheduledCount = 0;
  let skippedCount = 0;
  let isPlaying = false;
  let isStarting = false;
  let requestGeneration = 0;

  function initialize() {
    if (!core || !catalog || !audioApi) {
      disableAudio('The prototype scripts did not load.');
      return;
    }
    try {
      timeline = core.normalizeSong(demonstrationSong);
      playableEvents = core.playableEvents(timeline);
      validateDemonstrationChords();
    } catch (error) {
      disableAudio(`The demonstration pattern is invalid. ${error.message}`);
      return;
    }

    elements.play.addEventListener('click', startPlayback);
    elements.stop.addEventListener('click', () => stopPlayback('Playback stopped.'));
    elements.downstroke.addEventListener('click', () => playTestStroke('D'));
    elements.upstroke.addEventListener('click', () => playTestStroke('U'));
    elements.stall.addEventListener('click', simulateStall);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (!audioApi.isSupported()) {
      disableAudio('This browser does not provide the required Web Audio functions.');
      return;
    }
    updateControls();
    updateStatistics();
  }

  function validateDemonstrationChords() {
    const chordIdentifiers = new Set(timeline.events.map((event) => event.activeChord));
    for (const identifier of chordIdentifiers) {
      if (!catalog.getDefaultVoicing(identifier)) {
        throw new Error(`The catalog does not contain ${identifier}.`);
      }
    }
  }

  function getAudioEngine() {
    if (!audioEngine) {
      audioEngine = new audioApi.GuitarAudioEngine();
      audioEngine.ensureContext();
      audioEngine.context.addEventListener('statechange', handleAudioStateChange);
    }
    return audioEngine;
  }

  async function startPlayback() {
    if (isPlaying || isStarting) return;
    isStarting = true;
    requestGeneration += 1;
    const requestId = requestGeneration;
    updateControls();
    setStatus('Starting audio.');

    try {
      const engine = getAudioEngine();
      const context = await engine.ensureRunning();
      if (requestId !== requestGeneration) return;

      scheduleCursor = core.createScheduleCursor();
      playbackOrigin = context.currentTime + START_LEAD_SECONDS;
      scheduledCount = 0;
      skippedCount = 0;
      isPlaying = true;
      pumpScheduler();
      schedulerTimer = root.setInterval(pumpScheduler, SCHEDULER_INTERVAL_MILLISECONDS);
      setStatus('Playing the four-bar loop.');
    } catch (error) {
      stopPlayback(`Audio did not start. ${error.message}`);
    } finally {
      if (requestId === requestGeneration) {
        isStarting = false;
      }
      updateControls();
      updateStatistics();
    }
  }

  function pumpScheduler() {
    if (!isPlaying || !audioEngine || !audioEngine.context) return;
    try {
      const now = audioEngine.context.currentTime;
      const batch = core.collectScheduleBatch({
        timeline,
        events: playableEvents,
        cursor: scheduleCursor,
        originTime: playbackOrigin,
        now,
        horizonTime: now + SCHEDULE_AHEAD_SECONDS,
      });

      for (const event of batch.scheduled) {
        const voicing = catalog.getDefaultVoicing(event.activeChord);
        if (!voicing) {
          throw new Error(`The catalog does not contain ${event.activeChord}.`);
        }
        const stringPitches = core.resolveVoicingPitches(voicing.frets);
        audioEngine.playStrum(stringPitches, event.strumType, event.eventTime);
      }

      scheduleCursor = batch.cursor;
      scheduledCount += batch.scheduled.length;
      skippedCount += batch.skipped.length;
      updateStatistics();
    } catch (error) {
      stopPlayback(`Playback stopped. ${error.message}`);
    }
  }

  function stopPlayback(message) {
    requestGeneration += 1;
    isPlaying = false;
    isStarting = false;
    if (schedulerTimer !== null) {
      root.clearInterval(schedulerTimer);
      schedulerTimer = null;
    }
    if (audioEngine) {
      audioEngine.stopAll();
    }
    updateControls();
    updateStatistics();
    setStatus(message);
  }

  async function playTestStroke(strumType) {
    if (isPlaying || isStarting) return;
    isStarting = true;
    requestGeneration += 1;
    const requestId = requestGeneration;
    updateControls();
    setStatus(strumType === 'D' ? 'Preparing a downstroke.' : 'Preparing an upstroke.');

    try {
      const engine = getAudioEngine();
      const context = await engine.ensureRunning();
      if (requestId !== requestGeneration) return;
      engine.stopAll();
      const voicing = catalog.getDefaultVoicing('C');
      const stringPitches = core.resolveVoicingPitches(voicing.frets);
      engine.playStrum(stringPitches, strumType, context.currentTime + START_LEAD_SECONDS);
      setStatus(strumType === 'D' ? 'Played a C downstroke.' : 'Played a C upstroke.');
    } catch (error) {
      setStatus(`The test stroke did not play. ${error.message}`);
    } finally {
      if (requestId === requestGeneration) {
        isStarting = false;
      }
      updateControls();
      updateStatistics();
    }
  }

  function simulateStall() {
    if (!isPlaying) return;
    const skippedBeforeStall = skippedCount;
    const endTime = root.performance.now() + SIMULATED_STALL_MILLISECONDS;
    while (root.performance.now() < endTime) {
      // This intentional busy loop simulates a blocked user-interface thread.
    }
    pumpScheduler();
    const skippedDuringStall = skippedCount - skippedBeforeStall;
    setStatus(
      `The 250 millisecond stall ended. The scheduler skipped ${skippedDuringStall} late strums.`,
    );
  }

  function handleVisibilityChange() {
    if (document.hidden && (isPlaying || isStarting)) {
      stopPlayback('Playback stopped because the page became hidden. Press Play to start again.');
    }
  }

  function handleAudioStateChange() {
    if (
      isPlaying
      && audioEngine
      && audioEngine.context
      && audioEngine.context.state !== 'running'
    ) {
      stopPlayback(
        `Playback stopped because the audio context is ${audioEngine.context.state}. Press Play to start again.`,
      );
    }
    updateStatistics();
  }

  function disableAudio(message) {
    for (const button of [
      elements.play,
      elements.stop,
      elements.downstroke,
      elements.upstroke,
      elements.stall,
    ]) {
      button.disabled = true;
    }
    setStatus(message);
    elements.statistics.textContent = 'Audio controls are unavailable.';
  }

  function updateControls() {
    elements.play.disabled = isPlaying || isStarting;
    elements.stop.disabled = !isPlaying && !isStarting;
    elements.downstroke.disabled = isPlaying || isStarting;
    elements.upstroke.disabled = isPlaying || isStarting;
    elements.stall.disabled = !isPlaying;
  }

  function updateStatistics() {
    const contextState = audioEngine && audioEngine.context
      ? audioEngine.context.state
      : 'not created';
    const audioSessionType = audioEngine
      ? audioEngine.getAudioSessionType()
      : 'not configured';
    elements.statistics.textContent = [
      `Scheduled strums: ${scheduledCount}.`,
      `Skipped late strums: ${skippedCount}.`,
      `Audio context: ${contextState}.`,
      `Audio session: ${audioSessionType}.`,
    ].join(' ');
  }

  function setStatus(message) {
    elements.status.textContent = message;
  }

  initialize();
}(typeof globalThis !== 'undefined' ? globalThis : this));
