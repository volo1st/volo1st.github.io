(function initializeApplication(root) {
  'use strict';

  const core = root.GuitarStrummingCore;
  const parser = root.GuitarStrummingParser;
  const catalog = root.GuitarChordCatalog;
  const audioApi = root.GuitarStrummingAudio;
  const START_LEAD_SECONDS = 0.05;
  const SCHEDULE_AHEAD_SECONDS = 0.2;
  const SCHEDULER_INTERVAL_MILLISECONDS = 25;
  const BOUNDARY_EPSILON_SECONDS = 0.000001;

  const elements = {
    source: document.getElementById('song-source'),
    bpmNumber: document.getElementById('bpm-number'),
    bpmRange: document.getElementById('bpm-range'),
    countIn: document.getElementById('count-in'),
    validationSummary: document.getElementById('validation-summary'),
    validationErrors: document.getElementById('validation-errors'),
    songSummary: document.getElementById('song-summary'),
    playPause: document.getElementById('play-pause'),
    restart: document.getElementById('restart'),
    status: document.getElementById('playback-status'),
  };

  let parsedSong = null;
  let parsedTimeline = null;
  let musicalContentKey = null;
  let lastValidSource = null;
  let audioEngine = null;
  let audioSupported = false;
  let playbackState = 'paused';
  let playheadSlot = 0;
  let activeSegment = null;
  let pendingTransition = null;
  let schedulerTimer = null;
  let requestGeneration = 0;
  let skippedLateStrums = 0;
  let countInEndTime = null;
  let countInRequired = false;

  function initialize() {
    if (!core || !parser || !catalog || !audioApi) {
      showFatalError('The tool scripts did not load. Reload the page.');
      return;
    }

    elements.source.addEventListener('input', () => validateSource('text'));
    elements.bpmNumber.addEventListener('input', () => {
      updateBpmFromControl(elements.bpmNumber.value);
    });
    elements.bpmRange.addEventListener('input', () => {
      updateBpmFromControl(elements.bpmRange.value);
    });
    elements.countIn.addEventListener('change', () => {
      updateCountInFromControl(elements.countIn.value);
    });
    elements.playPause.addEventListener('click', handlePlayPause);
    elements.restart.addEventListener('click', restartPlayback);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    audioSupported = audioApi.isSupported();
    validateSource('initial');
    if (!audioSupported) {
      setPlaybackStatus('Audio is unavailable in this browser. You can still edit and validate the song.');
    }
    updateControls();
  }

  function validateSource(origin) {
    const source = elements.source.value;
    const previousSong = parsedSong;
    const previousContentKey = musicalContentKey;
    const previousSource = lastValidSource;
    const result = parser.parseSongSource(source, { catalog });

    if (!result.ok) {
      parsedSong = null;
      parsedTimeline = null;
      musicalContentKey = null;
      lastValidSource = null;
      haltPlayback({ resetPosition: true });
      countInRequired = false;
      elements.countIn.value = '';
      renderValidationErrors(result.errors);
      renderSongSummary();
      setPlaybackStatus(
        result.errors.length === 1
          ? 'Playback is unavailable until you fix the error.'
          : `Playback is unavailable until you fix ${result.errors.length} errors.`,
      );
      updateControls();
      return;
    }

    let nextTimeline;
    try {
      nextTimeline = core.normalizeSong(result.song);
    } catch (error) {
      parsedSong = null;
      parsedTimeline = null;
      musicalContentKey = null;
      lastValidSource = null;
      haltPlayback({ resetPosition: true });
      countInRequired = false;
      elements.countIn.value = '';
      renderValidationErrors([{
        code: 'timeline_error',
        line: null,
        section: null,
        bar: null,
        slot: null,
        message: `The normalized timeline is invalid. ${error.message}`,
      }]);
      renderSongSummary();
      setPlaybackStatus('Playback is unavailable because timeline creation failed.');
      updateControls();
      return;
    }

    const nextContentKey = parser.musicalContentKey(result.song);
    const sourceChanged = previousSource !== null && source !== previousSource;
    const neutralPreviousSource = previousSource === null
      ? null
      : parser.replaceBpmDirective(previousSource, '__BPM__');
    const neutralNextSource = parser.replaceBpmDirective(source, '__BPM__');
    const bpmOnlyChange = Boolean(
      previousSong
      && sourceChanged
      && previousContentKey === nextContentKey
      && previousSong.bpm !== result.song.bpm
      && neutralPreviousSource === neutralNextSource,
    );

    parsedSong = result.song;
    parsedTimeline = nextTimeline;
    musicalContentKey = nextContentKey;
    lastValidSource = source;
    renderValidationErrors([]);
    renderSongSummary();
    synchronizeBpmControls(result.song.bpm);
    synchronizeCountInControl(result.song.countInBars);

    if (sourceChanged && bpmOnlyChange) {
      if (playbackState === 'playing') {
        if (countInEndTime !== null) {
          haltPlayback({ resetPosition: true });
          countInRequired = parsedSong.countInBars > 0;
          setPlaybackStatus('BPM changed. Press Play to start the new count-in.');
        } else {
          requestTempoChange(nextTimeline);
        }
      } else {
        setPlaybackStatus(`BPM is ${result.song.bpm}. Press Play when you are ready.`);
      }
    } else if (sourceChanged) {
      haltPlayback({ resetPosition: true });
      countInRequired = parsedSong.countInBars > 0;
      setPlaybackStatus('The source changed. Playback is ready at bar 1, slot 1.');
    } else if (origin === 'initial') {
      countInRequired = parsedSong.countInBars > 0;
      setPlaybackStatus('The song is valid. Press Play when you are ready.');
    } else if (!previousSong) {
      haltPlayback({ resetPosition: true });
      countInRequired = parsedSong.countInBars > 0;
      setPlaybackStatus('The song is valid. Playback is ready at bar 1, slot 1.');
    } else if (origin === 'bpm-control') {
      setPlaybackStatus(`BPM is ${result.song.bpm}. Press Play when you are ready.`);
    }

    updateControls();
  }

  function updateBpmFromControl(rawValue) {
    const updatedSource = parser.replaceBpmDirective(elements.source.value, rawValue);
    if (updatedSource === null) {
      setPlaybackStatus('Fix the bpm: directive before you use the BPM controls.');
      return;
    }
    elements.source.value = updatedSource;
    validateSource('bpm-control');
  }

  function synchronizeBpmControls(bpm) {
    elements.bpmNumber.value = String(bpm);
    elements.bpmRange.value = String(bpm);
  }

  function updateCountInFromControl(rawValue) {
    const previousValue = parsedSong ? String(parsedSong.countInBars) : '';
    const updatedSource = parser.replaceCountInDirective(elements.source.value, rawValue);
    if (updatedSource === null) {
      elements.countIn.value = previousValue;
      setPlaybackStatus('Fix the count-in: directive before you use the Count-in control.');
      return;
    }
    elements.source.value = updatedSource;
    validateSource('count-in-control');
  }

  function synchronizeCountInControl(countInBars) {
    elements.countIn.value = String(countInBars);
  }

  async function handlePlayPause() {
    if (playbackState === 'playing') {
      pausePlayback('Playback paused.');
      return;
    }
    if (playbackState === 'starting' || !parsedTimeline || !audioSupported) return;

    playbackState = 'starting';
    requestGeneration += 1;
    const requestId = requestGeneration;
    updateControls();
    setPlaybackStatus('Starting audio.');

    try {
      const engine = getAudioEngine();
      const context = await engine.ensureRunning();
      if (requestId !== requestGeneration) return;
      const useCountIn = countInRequired && playheadSlot === 0;
      const countInBars = beginPlaybackAtPosition(context, playheadSlot, useCountIn);
      setPlaybackStartStatus(countInBars);
    } catch (error) {
      haltPlayback({ resetPosition: false });
      setPlaybackStatus(`Audio did not start. ${error.message}`);
    } finally {
      if (requestId === requestGeneration && playbackState === 'starting') {
        playbackState = 'paused';
      }
      updateControls();
    }
  }

  function beginPlaybackAtPosition(context, sourceSlot, useCountIn) {
    clearSchedulerTimer();
    const slotDuration = core.slotDurationSeconds(parsedTimeline.bpm, parsedTimeline.gridSize);
    const normalizedSourceSlot = sourceSlot % parsedTimeline.durationSlots;
    const events = core.playableEvents(parsedTimeline);
    const countInBars = useCountIn ? parsedSong.countInBars : 0;
    const countInStartTime = context.currentTime + START_LEAD_SECONDS;
    const countInEvents = core.createCountInEvents(
      parsedTimeline.bpm,
      countInBars,
      countInStartTime,
    );
    for (const event of countInEvents) {
      audioEngine.playCountInClick(event.eventTime, event.accented);
    }
    const startTime = countInStartTime + core.countInDurationSeconds(
      parsedTimeline.bpm,
      countInBars,
    );
    activeSegment = {
      timeline: parsedTimeline,
      events,
      originTime: startTime - (normalizedSourceSlot * slotDuration),
      cursor: core.createScheduleCursorAtPosition(events, normalizedSourceSlot),
    };
    pendingTransition = null;
    countInEndTime = countInBars > 0 ? startTime : null;
    countInRequired = false;
    playheadSlot = normalizedSourceSlot;
    skippedLateStrums = 0;
    playbackState = 'playing';
    pumpScheduler();
    schedulerTimer = root.setInterval(pumpScheduler, SCHEDULER_INTERVAL_MILLISECONDS);
    updateControls();
    return countInBars;
  }

  function pausePlayback(message) {
    requestGeneration += 1;
    if (activeSegment && audioEngine && audioEngine.context) {
      promoteTempoTransition(audioEngine.context.currentTime);
      playheadSlot = core.playheadSlotAtTime(
        activeSegment.originTime,
        audioEngine.context.currentTime,
        activeSegment.timeline,
      );
    }
    clearSchedulerTimer();
    if (audioEngine) audioEngine.stopAll();
    activeSegment = null;
    pendingTransition = null;
    countInEndTime = null;
    playbackState = 'paused';
    setPlaybackStatus(message);
    updateControls();
  }

  function haltPlayback(options) {
    requestGeneration += 1;
    clearSchedulerTimer();
    if (audioEngine) audioEngine.stopAll();
    activeSegment = null;
    pendingTransition = null;
    countInEndTime = null;
    playbackState = 'paused';
    if (options.resetPosition) playheadSlot = 0;
    updateControls();
  }

  function restartPlayback() {
    if (!parsedTimeline || !audioSupported || playbackState === 'starting') return;
    playheadSlot = 0;
    pendingTransition = null;
    countInRequired = parsedSong.countInBars > 0;
    if (audioEngine) audioEngine.stopAll();

    if (playbackState === 'playing' && audioEngine && audioEngine.context) {
      const countInBars = beginPlaybackAtPosition(audioEngine.context, 0, countInRequired);
      setPlaybackStartStatus(countInBars);
    } else {
      activeSegment = null;
      setPlaybackStatus('Ready at bar 1, slot 1.');
      updateControls();
    }
  }

  function requestTempoChange(nextTimeline) {
    if (!activeSegment || !audioEngine || !audioEngine.context) return;
    const now = audioEngine.context.currentTime;
    promoteTempoTransition(now);
    const transition = core.createTempoTransition(activeSegment, nextTimeline, now);
    audioEngine.cancelScheduledFrom(transition.boundary.audioTime);
    pendingTransition = {
      boundary: transition.boundary,
      segment: {
        timeline: transition.segment.timeline,
        events: transition.segment.events,
        originTime: transition.segment.originTime,
        cursor: transition.segment.cursor,
      },
    };
    pumpScheduler();
    const barNumber = (transition.boundary.sourceSlot / nextTimeline.gridSize) + 1;
    setPlaybackStatus(`BPM will change to ${nextTimeline.bpm} at bar ${barNumber}.`);
  }

  function pumpScheduler() {
    if (
      playbackState !== 'playing'
      || !activeSegment
      || !audioEngine
      || !audioEngine.context
    ) return;

    try {
      const now = audioEngine.context.currentTime;
      if (countInEndTime !== null && now >= countInEndTime - BOUNDARY_EPSILON_SECONDS) {
        countInEndTime = null;
        setPlaybackStatus('Playing. The song will loop.');
      }
      promoteTempoTransition(now);
      const horizonTime = now + SCHEDULE_AHEAD_SECONDS;

      if (pendingTransition) {
        const oldHorizon = Math.min(
          horizonTime,
          pendingTransition.boundary.audioTime - BOUNDARY_EPSILON_SECONDS,
        );
        scheduleSegment(activeSegment, now, oldHorizon);
        scheduleSegment(pendingTransition.segment, now, horizonTime);
      } else {
        scheduleSegment(activeSegment, now, horizonTime);
      }
    } catch (error) {
      pausePlayback(`Playback stopped. ${error.message}`);
    }
  }

  function scheduleSegment(segment, now, horizonTime) {
    if (segment.events.length === 0 || horizonTime < now) return;
    const batch = core.collectScheduleBatch({
      timeline: segment.timeline,
      events: segment.events,
      cursor: segment.cursor,
      originTime: segment.originTime,
      now,
      horizonTime,
    });

    for (const event of batch.scheduled) {
      const voicing = catalog.getDefaultVoicing(event.activeChord);
      if (!voicing) {
        throw new Error(`The catalog does not contain ${event.activeChord}.`);
      }
      const stringPitches = core.resolveVoicingPitches(voicing.frets);
      audioEngine.playStrum(stringPitches, event.strumType, event.eventTime);
    }

    segment.cursor = batch.cursor;
    if (batch.skipped.length > 0) {
      skippedLateStrums += batch.skipped.length;
      setPlaybackStatus(
        `Playback recovered after a delay. Skipped late strums: ${skippedLateStrums}.`,
      );
    }
  }

  function promoteTempoTransition(now) {
    if (!pendingTransition || now < pendingTransition.boundary.audioTime) return;
    activeSegment = pendingTransition.segment;
    pendingTransition = null;
    if (playbackState === 'playing') {
      setPlaybackStatus(`Playing at ${activeSegment.timeline.bpm} beats per minute.`);
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

  function handleVisibilityChange() {
    if (document.hidden && (playbackState === 'playing' || playbackState === 'starting')) {
      pausePlayback('Playback paused because the page became hidden. Press Play to continue.');
    }
  }

  function handleAudioStateChange() {
    if (
      playbackState === 'playing'
      && audioEngine
      && audioEngine.context
      && audioEngine.context.state !== 'running'
    ) {
      pausePlayback(
        `Playback paused because the audio context is ${audioEngine.context.state}. Press Play to continue.`,
      );
    }
  }

  function clearSchedulerTimer() {
    if (schedulerTimer !== null) {
      root.clearInterval(schedulerTimer);
      schedulerTimer = null;
    }
  }

  function renderValidationErrors(errors) {
    elements.validationErrors.replaceChildren();
    if (errors.length === 0) {
      elements.validationErrors.hidden = true;
      elements.validationSummary.textContent = 'Input is valid.';
      elements.validationSummary.className = 'validation-summary valid';
      return;
    }

    for (const error of errors) {
      const listItem = document.createElement('li');
      listItem.textContent = parser.formatValidationError(error);
      elements.validationErrors.append(listItem);
    }
    elements.validationErrors.hidden = false;
    elements.validationSummary.textContent = errors.length === 1
      ? 'Input has 1 error.'
      : `Input has ${errors.length} errors.`;
    elements.validationSummary.className = 'validation-summary invalid';
  }

  function renderSongSummary() {
    if (!parsedSong) {
      elements.songSummary.textContent = 'No playable song is available.';
      return;
    }
    elements.songSummary.textContent = [
      `${parsedSong.chordBars.length} bars.`,
      `Grid size ${parsedSong.gridSize}.`,
      `${parsedSong.bpm} beats per minute.`,
      parsedSong.countInBars === 0
        ? 'Count-in is off.'
        : `${parsedSong.countInBars}-bar count-in.`,
      'Looping is on.',
    ].join(' ');
  }

  function updateControls() {
    const playbackAvailable = Boolean(parsedTimeline) && audioSupported;
    elements.playPause.disabled = !playbackAvailable || playbackState === 'starting';
    elements.restart.disabled = !playbackAvailable || playbackState === 'starting';
    elements.playPause.textContent = playbackState === 'playing' ? 'Pause' : 'Play';
    elements.playPause.setAttribute('aria-pressed', String(playbackState === 'playing'));
  }

  function showFatalError(message) {
    elements.validationSummary.textContent = message;
    elements.validationSummary.className = 'validation-summary invalid';
    elements.playPause.disabled = true;
    elements.restart.disabled = true;
    elements.bpmNumber.disabled = true;
    elements.bpmRange.disabled = true;
    elements.countIn.disabled = true;
    setPlaybackStatus(message);
  }

  function setPlaybackStatus(message) {
    elements.status.textContent = message;
  }

  function setPlaybackStartStatus(countInBars) {
    if (countInBars === 0) {
      setPlaybackStatus('Playing. The song will loop.');
      return;
    }
    const unit = countInBars === 1 ? 'bar' : 'bars';
    setPlaybackStatus(`Counting in for ${countInBars} ${unit}.`);
  }

  initialize();
}(typeof globalThis !== 'undefined' ? globalThis : this));
