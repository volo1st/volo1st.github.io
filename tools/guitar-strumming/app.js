(function initializeApplication(root) {
  'use strict';

  const core = root.GuitarStrummingCore;
  const parser = root.GuitarStrummingParser;
  const catalog = root.GuitarChordCatalog;
  const audioApi = root.GuitarStrummingAudio;
  const shareApi = root.GuitarStrummingShare;
  const presetApi = root.GuitarStrummingPresets;
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
    soundTest: document.getElementById('strum-sound-test'),
    soundTestButtons: [...document.querySelectorAll('[data-strum-token]')],
    copyShareLink: document.getElementById('copy-share-link'),
    copySource: document.getElementById('copy-source'),
    shareStatus: document.getElementById('share-status'),
    manualShareCopy: document.getElementById('manual-share-copy'),
    manualShareLink: document.getElementById('manual-share-link'),
    preset: document.getElementById('song-preset'),
    presetGoal: document.getElementById('preset-goal'),
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
  let rampCurrentBpm = null;
  let rampCompletedLoops = 0;
  let preparedShare = null;
  let sharePreparationGeneration = 0;
  let copyRequestGeneration = 0;
  let sourceReplacementBaseline = null;

  async function initialize() {
    if (!core || !parser || !catalog || !audioApi || !shareApi || !presetApi) {
      showFatalError('The tool scripts did not load. Reload the page.');
      return;
    }

    populatePresetOptions();
    elements.source.addEventListener('input', () => {
      clearSourceParametersAfterSourceChange();
      validateSource('text');
    });
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
    elements.soundTest.addEventListener('click', handleSoundTestClick);
    elements.copyShareLink.addEventListener('click', handleCopyShareLink);
    elements.copySource.addEventListener('click', handleCopySource);
    elements.preset.addEventListener('change', handlePresetChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    audioSupported = audioApi.isSupported();
    const sourceOrigin = await loadInitialSource();
    if (sourceOrigin === null) return;
    validateSource(sourceOrigin);
    if (!audioSupported) {
      setPlaybackStatus('Audio is unavailable in this browser. You can still edit and validate the song.');
    }
    updateControls();
  }

  async function loadInitialSource() {
    try {
      const presetResult = presetApi.resolvePresetFromUrl(root.location.href);
      if (presetResult.found) {
        elements.source.value = presetResult.preset.source;
        sourceReplacementBaseline = presetResult.preset.source;
        synchronizePresetSelection(presetResult.preset.source);
        setShareStatus(`Loaded preset: ${presetResult.preset.title}.`);
        return 'preset';
      }

      const decoded = await shareApi.decodeSongFromUrl(root.location.href);
      if (decoded.found) {
        elements.source.value = decoded.source;
        sourceReplacementBaseline = decoded.source;
        synchronizePresetSelection(decoded.source);
        setShareStatus(`Loaded a ${decoded.codec} share link.`);
        return 'shared';
      }

      const defaultPreset = presetApi.getDefaultPreset();
      elements.source.value = defaultPreset.source;
      sourceReplacementBaseline = defaultPreset.source;
      synchronizePresetSelection(defaultPreset.source);
      setShareStatus(`Loaded preset: ${defaultPreset.title}.`);
      return 'initial';
    } catch (error) {
      elements.source.value = '';
      sourceReplacementBaseline = null;
      synchronizePresetSelection('');
      parsedSong = null;
      parsedTimeline = null;
      musicalContentKey = null;
      lastValidSource = null;
      haltPlayback({ resetPosition: true });
      countInRequired = false;
      elements.countIn.value = '';
      invalidatePreparedShare('The requested source did not load.');
      renderValidationErrors([{
        code: `transport_${error.code || 'decode_failed'}`,
        line: null,
        section: null,
        bar: null,
        slot: null,
        field: 'share',
        message: error.message || 'The requested source did not load.',
      }]);
      renderSongSummary();
      setPlaybackStatus('Playback is unavailable because the requested source did not load.');
      updateControls();
      return null;
    }
  }

  function validateSource(origin) {
    const source = elements.source.value;
    synchronizePresetSelection(source);
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
      invalidatePreparedShare('Fix the source before you create a share link.');
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
      invalidatePreparedShare('Fix the timeline before you create a share link.');
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
      && !previousSong.tempoRamp.enabled
      && !result.song.tempoRamp.enabled
      && neutralPreviousSource === neutralNextSource,
    );
    const activeRampSettingChanged = Boolean(
      previousSong
      && sourceChanged
      && (previousSong.tempoRamp.enabled || result.song.tempoRamp.enabled)
      && (
        previousSong.bpm !== result.song.bpm
        || JSON.stringify(previousSong.tempoRamp) !== JSON.stringify(result.song.tempoRamp)
      )
    );

    parsedSong = result.song;
    parsedTimeline = nextTimeline;
    musicalContentKey = nextContentKey;
    lastValidSource = source;
    renderValidationErrors([]);
    renderSongSummary();
    synchronizeBpmControls(result.song.bpm);
    synchronizeCountInControl(result.song.countInBars);
    prepareShareUrl(source);
    if (rampCurrentBpm === null) resetTempoRampState();

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
      setPlaybackStatus(activeRampSettingChanged
        ? 'The tempo-ramp settings changed. Playback reset to bar 1, slot 1.'
        : 'The source changed. Playback is ready at bar 1, slot 1.');
    } else if (origin === 'initial') {
      resetTempoRampState();
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

  function populatePresetOptions() {
    for (const preset of presetApi.listPresets()) {
      const option = document.createElement('option');
      option.value = preset.slug;
      option.textContent = preset.presetType === 'Exercise'
        ? `${preset.teachingLevel}: ${preset.title}`
        : `${preset.presetType}: ${preset.title}`;
      elements.preset.append(option);
    }
  }

  function synchronizePresetSelection(source) {
    const preset = presetApi.findPresetBySource(source);
    elements.preset.value = preset ? preset.slug : '';
    elements.presetGoal.textContent = preset
      ? `${preset.teachingLevel}. ${preset.teachingGoal}`
      : 'Custom source. Select a preset to replace it with a catalog exercise.';
  }

  function handlePresetChange() {
    const preset = presetApi.getPreset(elements.preset.value);
    if (!preset) {
      synchronizePresetSelection(elements.source.value);
      return;
    }

    const hasSessionEdits = sourceReplacementBaseline !== null
      && elements.source.value !== sourceReplacementBaseline;
    if (
      hasSessionEdits
      && !root.confirm('Replace the current source with this preset? Your current edits will be lost.')
    ) {
      synchronizePresetSelection(elements.source.value);
      setShareStatus('Preset loading was cancelled. The current source is unchanged.');
      return;
    }

    try {
      const presetLink = presetApi.createPresetUrl(preset.slug, root.location.href);
      root.history.replaceState(null, '', presetLink.url);
    } catch (error) {
      setShareStatus('The preset loaded, but the browser could not update the current URL.');
    }

    elements.source.value = preset.source;
    sourceReplacementBaseline = preset.source;
    synchronizePresetSelection(preset.source);
    validateSource('preset');
  }

  function updateBpmFromControl(rawValue) {
    const updatedSource = parser.replaceBpmDirective(elements.source.value, rawValue);
    if (updatedSource === null) {
      setPlaybackStatus('Fix the bpm: directive before you use the BPM controls.');
      return;
    }
    clearSourceParametersAfterSourceChange();
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
    clearSourceParametersAfterSourceChange();
    elements.source.value = updatedSource;
    validateSource('count-in-control');
  }

  function synchronizeCountInControl(countInBars) {
    elements.countIn.value = String(countInBars);
  }

  async function prepareShareUrl(source) {
    sharePreparationGeneration += 1;
    const generation = sharePreparationGeneration;
    preparedShare = null;
    setShareStatus('Preparing the share link.');
    updateControls();

    try {
      const matchingPreset = presetApi.findPresetBySource(source);
      const result = matchingPreset
        ? presetApi.createPresetUrl(matchingPreset.slug, root.location.href)
        : await shareApi.createShareUrl(source, root.location.href);
      if (generation !== sharePreparationGeneration || elements.source.value !== source) return;
      preparedShare = Object.freeze({ ...result, source });
      const codecName = result.codec === 'preset'
        ? 'preset'
        : (result.codec === 'gzip' ? 'gzip' : 'raw');
      setShareStatus(`Share link is ready. Format: ${codecName}. Length: ${result.urlLength} characters.`);
    } catch (error) {
      if (generation !== sharePreparationGeneration || elements.source.value !== source) return;
      preparedShare = null;
      setShareStatus(error.message || 'The share link is unavailable.');
    }
    updateControls();
  }

  function invalidatePreparedShare(message) {
    sharePreparationGeneration += 1;
    copyRequestGeneration += 1;
    preparedShare = null;
    hideManualShareLink();
    setShareStatus(message);
    updateControls();
  }

  function clearSourceParametersAfterSourceChange() {
    sharePreparationGeneration += 1;
    copyRequestGeneration += 1;
    preparedShare = null;
    hideManualShareLink();

    try {
      const url = new URL(root.location.href);
      if (url.searchParams.has('song') || url.searchParams.has('preset')) {
        url.searchParams.delete('song');
        url.searchParams.delete('preset');
        root.history.replaceState(null, '', url.href);
      }
    } catch (error) {
      setShareStatus('The browser could not remove the old source parameter.');
    }
  }

  function handleCopyShareLink() {
    if (!preparedShare || preparedShare.source !== elements.source.value) return;
    const share = preparedShare;
    copyRequestGeneration += 1;
    const requestId = copyRequestGeneration;

    try {
      root.history.replaceState(null, '', share.url);
    } catch (error) {
      setShareStatus('The browser could not put the share link in the current URL.');
      return;
    }

    writeClipboard(share.url).then(() => {
      if (requestId !== copyRequestGeneration) return;
      hideManualShareLink();
      setShareStatus(`Copied the ${share.codec} share link. Length: ${share.urlLength} characters.`);
    }, () => {
      if (requestId !== copyRequestGeneration) return;
      showManualShareLink(share.url);
      setShareStatus('Automatic copy failed. Copy the selected share link manually.');
    });
  }

  function handleCopySource() {
    const source = elements.source.value;
    copyRequestGeneration += 1;
    const requestId = copyRequestGeneration;
    writeClipboard(source).then(() => {
      if (requestId !== copyRequestGeneration) return;
      setShareStatus('Copied the exact source text.');
    }, () => {
      if (requestId !== copyRequestGeneration) return;
      elements.source.focus();
      elements.source.select();
      setShareStatus('Automatic copy failed. Copy the selected source text manually.');
    });
  }

  function writeClipboard(text) {
    if (!root.navigator || !root.navigator.clipboard || !root.navigator.clipboard.writeText) {
      return Promise.reject(new Error('Clipboard access is unavailable.'));
    }
    try {
      return Promise.resolve(root.navigator.clipboard.writeText(text));
    } catch (error) {
      return Promise.reject(error);
    }
  }

  function showManualShareLink(url) {
    elements.manualShareLink.value = url;
    elements.manualShareCopy.hidden = false;
    elements.manualShareLink.focus();
    elements.manualShareLink.select();
  }

  function hideManualShareLink() {
    elements.manualShareCopy.hidden = true;
    elements.manualShareLink.value = '';
  }

  function setShareStatus(message) {
    elements.shareStatus.textContent = message;
  }

  async function handleSoundTestClick(event) {
    const button = event.target.closest('[data-strum-token]');
    if (!button || !elements.soundTest.contains(button) || button.disabled) return;

    const token = button.dataset.strumToken;
    const parsedToken = parser.parseStrumTokenValue(token);
    if (!parsedToken.ok) {
      setPlaybackStatus(`The sound-test token ${token} is invalid.`);
      return;
    }

    if (playbackState === 'playing') {
      pausePlayback('Song playback paused for the sound test.');
    } else {
      haltPlayback({ resetPosition: false });
    }
    const requestId = requestGeneration;
    setPlaybackStatus(`Starting the ${token} sound test.`);

    try {
      const engine = getAudioEngine();
      const context = await engine.ensureRunning();
      if (requestId !== requestGeneration) return;
      engine.stopAll();
      const voicing = catalog.getDefaultVoicing('G');
      if (!voicing) throw new Error('The catalog does not contain G.');
      const stringPitches = core.resolveVoicingPitches(voicing.frets);
      engine.playStrum(
        stringPitches,
        parsedToken.strum,
        context.currentTime + START_LEAD_SECONDS,
      );
      setPlaybackStatus(`Sound test played ${token} on a G chord.`);
    } catch (error) {
      haltPlayback({ resetPosition: false });
      setPlaybackStatus(`The sound test did not start. ${error.message}`);
    }
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
    const playbackTimeline = parsedSong.tempoRamp.enabled
      ? core.timelineWithBpm(parsedTimeline, rampCurrentBpm)
      : parsedTimeline;
    const slotDuration = core.slotDurationSeconds(playbackTimeline.bpm, playbackTimeline.gridSize);
    const normalizedSourceSlot = sourceSlot % playbackTimeline.durationSlots;
    const events = core.playableEvents(playbackTimeline);
    const countInBars = useCountIn ? parsedSong.countInBars : 0;
    const countInStartTime = context.currentTime + START_LEAD_SECONDS;
    const countInEvents = core.createCountInEvents(
      playbackTimeline.bpm,
      countInBars,
      countInStartTime,
    );
    for (const event of countInEvents) {
      audioEngine.playCountInClick(event.eventTime, event.accented);
    }
    const startTime = countInStartTime + core.countInDurationSeconds(
      playbackTimeline.bpm,
      countInBars,
    );
    activeSegment = {
      timeline: playbackTimeline,
      events,
      originTime: startTime - (normalizedSourceSlot * slotDuration),
      cursor: core.createScheduleCursorAtPosition(events, normalizedSourceSlot),
      completedLoopsAtOrigin: rampCompletedLoops,
    };
    pendingTransition = null;
    countInEndTime = countInBars > 0 ? startTime : null;
    countInRequired = false;
    playheadSlot = normalizedSourceSlot;
    skippedLateStrums = 0;
    playbackState = 'playing';
    planTempoRampTransition();
    pumpScheduler();
    schedulerTimer = root.setInterval(pumpScheduler, SCHEDULER_INTERVAL_MILLISECONDS);
    updateControls();
    return countInBars;
  }

  function pausePlayback(message) {
    requestGeneration += 1;
    if (activeSegment && audioEngine && audioEngine.context) {
      promoteTempoTransition(audioEngine.context.currentTime);
      synchronizeTempoRampProgress(audioEngine.context.currentTime);
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
    if (options.resetPosition) {
      playheadSlot = 0;
      resetTempoRampState();
    }
    updateControls();
  }

  function restartPlayback() {
    if (!parsedTimeline || !audioSupported || playbackState === 'starting') return;
    playheadSlot = 0;
    pendingTransition = null;
    resetTempoRampState();
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
      kind: 'manual',
      boundary: transition.boundary,
      segment: {
        timeline: transition.segment.timeline,
        events: transition.segment.events,
        originTime: transition.segment.originTime,
        cursor: transition.segment.cursor,
        completedLoopsAtOrigin: rampCompletedLoops,
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
      audioEngine.playStrum(stringPitches, {
        direction: event.direction,
        stringCount: event.stringCount,
        articulation: event.articulation,
        accented: event.accented,
      }, event.eventTime);
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
    let tempoChanged = false;
    while (
      pendingTransition
      && now >= pendingTransition.boundary.audioTime - BOUNDARY_EPSILON_SECONDS
    ) {
      const promoted = pendingTransition;
      activeSegment = promoted.segment;
      pendingTransition = null;
      rampCurrentBpm = activeSegment.timeline.bpm;
      if (promoted.kind === 'ramp') {
        rampCompletedLoops = promoted.completedLoopsAtBoundary;
        planTempoRampTransition();
      }
      tempoChanged = true;
    }
    synchronizeTempoRampProgress(now);
    if (tempoChanged && playbackState === 'playing') {
      setPlaybackStatus(tempoRampPlaybackStatus());
    }
  }

  function planTempoRampTransition() {
    if (
      !parsedSong
      || !parsedSong.tempoRamp.enabled
      || !activeSegment
      || pendingTransition
      || rampCurrentBpm >= parsedSong.tempoRamp.targetBpm
    ) return;

    const ramp = parsedSong.tempoRamp;
    const completedRemainder = rampCompletedLoops % ramp.loopsPerStep;
    const loopsUntilBoundary = completedRemainder === 0
      ? ramp.loopsPerStep
      : ramp.loopsPerStep - completedRemainder;
    const completedLoopsAtBoundary = rampCompletedLoops + loopsUntilBoundary;
    const nextBpm = core.tempoRampBpmAfterLoops(
      parsedSong.bpm,
      ramp.stepBpm,
      ramp.loopsPerStep,
      ramp.targetBpm,
      completedLoopsAtBoundary,
    );
    const nextTimeline = core.timelineWithBpm(parsedTimeline, nextBpm);
    const transition = core.createLoopTempoTransition(
      activeSegment,
      nextTimeline,
      loopsUntilBoundary,
    );
    pendingTransition = {
      kind: 'ramp',
      completedLoopsAtBoundary,
      boundary: transition.boundary,
      segment: {
        timeline: transition.segment.timeline,
        events: transition.segment.events,
        originTime: transition.segment.originTime,
        cursor: transition.segment.cursor,
        completedLoopsAtOrigin: completedLoopsAtBoundary,
      },
    };
  }

  function synchronizeTempoRampProgress(now) {
    if (!parsedSong || !parsedSong.tempoRamp.enabled || !activeSegment) return;
    rampCompletedLoops = core.completedLoopsAtTime(activeSegment, now);
  }

  function resetTempoRampState() {
    rampCurrentBpm = parsedSong ? parsedSong.bpm : null;
    rampCompletedLoops = 0;
  }

  function tempoRampPlaybackStatus() {
    if (!parsedSong || !parsedSong.tempoRamp.enabled) {
      return `Playing at ${activeSegment.timeline.bpm} beats per minute.`;
    }
    if (rampCurrentBpm >= parsedSong.tempoRamp.targetBpm) {
      return `Playing at the target tempo of ${rampCurrentBpm} beats per minute.`;
    }
    return `Playing at ${rampCurrentBpm} beats per minute. Completed loops: ${rampCompletedLoops}.`;
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
      parsedSong.tempoRamp.enabled
        ? `Tempo ramp: +${parsedSong.tempoRamp.stepBpm} BPM every ${parsedSong.tempoRamp.loopsPerStep} loops, target ${parsedSong.tempoRamp.targetBpm} BPM.`
        : 'Tempo ramp is off.',
      'Looping is on.',
    ].join(' ');
  }

  function updateControls() {
    const playbackAvailable = Boolean(parsedTimeline) && audioSupported;
    elements.playPause.disabled = !playbackAvailable || playbackState === 'starting';
    elements.restart.disabled = !playbackAvailable || playbackState === 'starting';
    elements.playPause.textContent = playbackState === 'playing' ? 'Pause' : 'Play';
    elements.playPause.setAttribute('aria-pressed', String(playbackState === 'playing'));
    elements.copyShareLink.disabled = !preparedShare
      || preparedShare.source !== elements.source.value;
    elements.copySource.disabled = false;
    for (const button of elements.soundTestButtons) {
      button.disabled = !audioSupported || playbackState === 'starting';
    }
  }

  function showFatalError(message) {
    elements.validationSummary.textContent = message;
    elements.validationSummary.className = 'validation-summary invalid';
    elements.playPause.disabled = true;
    elements.restart.disabled = true;
    elements.bpmNumber.disabled = true;
    elements.bpmRange.disabled = true;
    elements.countIn.disabled = true;
    elements.preset.disabled = true;
    elements.copyShareLink.disabled = true;
    elements.copySource.disabled = true;
    for (const button of elements.soundTestButtons) button.disabled = true;
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

  initialize().catch((error) => {
    showFatalError(`The tool did not start. ${error.message}`);
  });
}(typeof globalThis !== 'undefined' ? globalThis : this));
