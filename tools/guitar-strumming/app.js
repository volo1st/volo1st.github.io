(function initializeApplication(root) {
  'use strict';

  const core = root.GuitarStrummingCore;
  const parser = root.GuitarStrummingParser;
  const catalog = root.GuitarChordCatalog;
  const harmony = root.GuitarHarmony;
  const presentation = root.GuitarStrummingPresentation;
  const notifications = root.GuitarStrummingNotifications;
  const screenWakeLockApi = root.GuitarScreenWakeLock;
  const audioApi = root.GuitarStrummingAudio;
  const shareApi = root.GuitarStrummingShare;
  const presetApi = root.GuitarStrummingPresets;
  const i18n = root.GuitarStrummingI18n;
  const START_LEAD_SECONDS = 0.05;
  const SCHEDULE_AHEAD_SECONDS = 0.2;
  const SCHEDULER_INTERVAL_MILLISECONDS = 25;
  const BOUNDARY_EPSILON_SECONDS = 0.000001;

  const elements = {
    editor: document.getElementById('arrangement-editor'),
    source: document.getElementById('song-source'),
    bpmNumberLabel: document.getElementById('bpm-number-label'),
    bpmNumber: document.getElementById('bpm-number'),
    bpmRangeLabel: document.getElementById('bpm-range-label'),
    bpmRange: document.getElementById('bpm-range'),
    countIn: document.getElementById('count-in'),
    capoFret: document.getElementById('capo-fret'),
    swingFeel: document.getElementById('swing-feel'),
    tempoRampMode: document.getElementById('tempo-ramp-mode'),
    tempoRampFields: document.getElementById('tempo-ramp-fields'),
    tempoRampStep: document.getElementById('tempo-ramp-step'),
    tempoRampLoops: document.getElementById('tempo-ramp-loops'),
    tempoRampTarget: document.getElementById('tempo-ramp-target'),
    validationSummary: document.getElementById('validation-summary'),
    validationErrors: document.getElementById('validation-errors'),
    practiceChordGuideRegion: document.getElementById('practice-chord-guide-region'),
    numberChordControls: document.getElementById('number-chord-controls'),
    keySummary: document.getElementById('key-summary'),
    chordViewButtons: [...document.querySelectorAll('[data-chord-view]')],
    chordGuide: document.getElementById('chord-guide'),
    chordGuideScroll: document.getElementById('chord-guide-scroll'),
    chordPresentationError: document.getElementById('chord-presentation-error'),
    originalKey: document.getElementById('original-key'),
    playingKey: document.getElementById('playing-key'),
    guitarConfiguration: document.getElementById('guitar-configuration'),
    returnOriginalKey: document.getElementById('return-original-key'),
    keyShapesStatus: document.getElementById('key-shapes-status'),
    legacyCapoControl: document.getElementById('legacy-capo-control'),
    playPause: document.getElementById('play-pause'),
    restart: document.getElementById('restart'),
    status: document.getElementById('playback-status'),
    playbackToast: document.getElementById('playback-toast'),
    dismissPlaybackToast: document.getElementById('dismiss-playback-toast'),
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
  let numberDraftSong = null;
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
  let countInStartTime = null;
  let countInEndTime = null;
  let countInDisplayedBeats = null;
  let countInRequired = false;
  let rampCurrentBpm = null;
  let rampCompletedLoops = 0;
  let chordTimeline = null;
  let renderedChordTimeline = [];
  let playbackPresentationState = Object.freeze({ mode: 'none', current: null });
  let playbackPresentationFrame = null;
  let playbackPresentationStartTime = null;
  let chordTimelineFollowing = true;
  let followedChordBarIndex = null;
  let preparedShare = null;
  let sharePreparationGeneration = 0;
  let copyRequestGeneration = 0;
  let sourceReplacementBaseline = null;
  let currentPlaybackStatus = { key: 'guitar.status.preparing', parameters: {} };
  let playbackNotifier = null;
  let screenWakeLock = null;
  let currentShareStatus = { key: 'guitar.share.preparing', parameters: {} };
  let currentValidationErrors = [];
  let fatalValidationStatus = null;
  let chordView = loadChordView();

  async function initialize() {
    if (
      !core
      || !parser
      || !catalog
      || !harmony
      || !presentation
      || !notifications
      || !screenWakeLockApi
      || !audioApi
      || !shareApi
      || !presetApi
      || !i18n
    ) {
      showFatalError('guitar.status.scriptsFailed');
      return;
    }

    playbackNotifier = notifications.createNotifier({
      setTimeout: (callback, delay) => root.setTimeout(callback, delay),
      clearTimeout: (timer) => root.clearTimeout(timer),
      onChange: renderPlaybackNotification,
    });
    screenWakeLock = screenWakeLockApi.createController({
      navigator: root.navigator,
      document,
      onUnavailable() {
        if (playbackState === 'playing' || playbackState === 'starting') {
          setPlaybackStatus('guitar.status.screenWakeUnavailable');
        }
      },
    });
    playbackNotifier.show(currentPlaybackStatus);
    renderPresetOptions();
    elements.source.addEventListener('input', () => {
      clearSourceParametersAfterSourceChange();
      validateSource('text');
    });
    elements.bpmNumber.addEventListener('change', () => {
      updateBpmFromControl(elements.bpmNumber.value);
    });
    elements.bpmRange.addEventListener('input', () => {
      updateBpmFromControl(elements.bpmRange.value);
    });
    elements.countIn.addEventListener('change', () => {
      updateCountInFromControl(elements.countIn.value);
    });
    elements.capoFret.addEventListener('change', () => {
      updateCapoFromControl(elements.capoFret.value);
    });
    elements.originalKey.addEventListener('change', () => {
      updateOriginalKeyFromControl(elements.originalKey.value);
    });
    elements.playingKey.addEventListener('change', () => {
      updatePlayingKeyFromControl(elements.playingKey.value);
    });
    elements.guitarConfiguration.addEventListener('change', () => {
      updateCapoFromControl(elements.guitarConfiguration.value);
    });
    elements.returnOriginalKey.addEventListener('click', returnToOriginalKey);
    for (const button of elements.chordViewButtons) {
      button.addEventListener('click', () => setChordView(button.dataset.chordView));
    }
    elements.editor.addEventListener('toggle', renderPracticeDisplay);
    elements.swingFeel.addEventListener('change', () => {
      updateSwingFromControl(elements.swingFeel.value);
    });
    elements.tempoRampMode.addEventListener('change', () => {
      updateTempoRampMode(elements.tempoRampMode.value);
    });
    for (const rampField of [
      elements.tempoRampStep,
      elements.tempoRampLoops,
      elements.tempoRampTarget,
    ]) {
      rampField.addEventListener('change', updateTempoRampFromControls);
    }
    elements.playPause.addEventListener('click', handlePlayPause);
    elements.restart.addEventListener('click', restartPlayback);
    elements.dismissPlaybackToast.addEventListener('click', () => playbackNotifier.dismiss());
    elements.chordGuideScroll.addEventListener('pointerdown', suspendChordTimelineFollowing, {
      passive: true,
    });
    elements.chordGuideScroll.addEventListener('wheel', suspendChordTimelineFollowing, {
      passive: true,
    });
    elements.chordGuideScroll.addEventListener('keydown', handleChordTimelineKeydown);
    elements.soundTest.addEventListener('click', handleSoundTestClick);
    elements.copyShareLink.addEventListener('click', handleCopyShareLink);
    elements.copySource.addEventListener('click', handleCopySource);
    elements.preset.addEventListener('change', handlePresetChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    root.addEventListener('site-language-change', renderLocalizedContent);
    document.addEventListener('DOMContentLoaded', renderLocalizedContent, { once: true });

    audioSupported = audioApi.isSupported();
    const sourceOrigin = await loadInitialSource();
    if (sourceOrigin === null) return;
    validateSource(sourceOrigin);
    if (!audioSupported) {
      setPlaybackStatus('guitar.status.audioUnavailable');
    }
    updateControls();
  }

  async function loadInitialSource() {
    try {
      const presetResult = presetApi.resolvePresetFromUrl(root.location.href);
      if (presetResult.found) {
        elements.source.value = presetResult.preset.source;
        sourceReplacementBaseline = presetResult.preset.source;
        setShareStatus('guitar.share.loadedPreset', { presetSlug: presetResult.preset.slug });
        return 'preset';
      }

      const decoded = await shareApi.decodeSongFromUrl(root.location.href);
      if (decoded.found) {
        elements.source.value = decoded.source;
        sourceReplacementBaseline = decoded.source;
        setShareStatus('guitar.share.loadedLink', { codec: decoded.codec });
        return 'shared';
      }

      const defaultPreset = presetApi.getDefaultPreset();
      elements.source.value = defaultPreset.source;
      sourceReplacementBaseline = defaultPreset.source;
      setShareStatus('guitar.share.loadedPreset', { presetSlug: defaultPreset.slug });
      return 'initial';
    } catch (error) {
      elements.source.value = '';
      sourceReplacementBaseline = null;
      synchronizePresetSelection('', null);
      parsedSong = null;
      numberDraftSong = null;
      parsedTimeline = null;
      musicalContentKey = null;
      lastValidSource = null;
      haltPlayback({ resetPosition: true });
      countInRequired = false;
      elements.countIn.value = '';
      elements.capoFret.value = '';
      synchronizeSwingControl(undefined);
      synchronizeBpmControls(null);
      synchronizeTempoRampControls(null);
      invalidatePreparedShare('guitar.share.requestFailed');
      renderValidationErrors([{
        code: 'transport_load_failed',
        line: null,
        section: null,
        bar: null,
        slot: null,
        field: 'share',
        message: error.message || 'The requested source did not load.',
      }]);
      renderPracticeDisplay();
      setPlaybackStatus('guitar.status.sourceUnavailable');
      updateControls();
      return null;
    }
  }

  function validateSource(origin) {
    const source = elements.source.value;
    const previousSong = parsedSong;
    const previousContentKey = musicalContentKey;
    const previousSource = lastValidSource;
    const result = parser.parseSongSource(source, { catalog });

    if (!result.ok) {
      synchronizePresetSelection(source, null);
      parsedSong = null;
      numberDraftSong = result.candidateSong || null;
      parsedTimeline = null;
      musicalContentKey = null;
      lastValidSource = null;
      haltPlayback({ resetPosition: true });
      countInRequired = false;
      elements.countIn.value = '';
      elements.capoFret.value = '';
      synchronizeSwingControl(undefined);
      synchronizeBpmControls(null);
      synchronizeTempoRampControls(null);
      invalidatePreparedShare('guitar.share.fixSource');
      renderValidationErrors(result.errors);
      renderPracticeDisplay();
      setPlaybackStatus(
        result.errors.length === 1 ? 'guitar.status.fixOne' : 'guitar.status.fixMany',
        { count: result.errors.length },
      );
      updateControls();
      return;
    }

    let nextTimeline;
    try {
      nextTimeline = core.normalizeSong(result.song);
    } catch (error) {
      synchronizePresetSelection(source, result.song);
      parsedSong = null;
      parsedTimeline = null;
      musicalContentKey = null;
      lastValidSource = null;
      haltPlayback({ resetPosition: true });
      countInRequired = false;
      elements.countIn.value = '';
      elements.capoFret.value = '';
      synchronizeSwingControl(undefined);
      synchronizeBpmControls(null);
      synchronizeTempoRampControls(null);
      invalidatePreparedShare('guitar.share.fixTimeline');
      renderValidationErrors([{
        code: 'timeline_error',
        line: null,
        section: null,
        bar: null,
        slot: null,
        message: `The normalized timeline is invalid. ${error.message}`,
      }]);
      renderPracticeDisplay();
      setPlaybackStatus('guitar.status.timelineUnavailable');
      updateControls();
      return;
    }

    synchronizePresetSelection(source, result.song);
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
    const originalKeyOnlyChange = Boolean(
      previousSong
      && previousSong.notation === 'numbers'
      && result.song.notation === 'numbers'
      && sourceChanged
      && previousContentKey === nextContentKey
      && previousSong.originalKey.canonicalText !== result.song.originalKey.canonicalText
      && parser.replaceOriginalKeyDirective(previousSource, '__ORIGINAL_KEY__')
        === parser.replaceOriginalKeyDirective(source, '__ORIGINAL_KEY__')
    );

    parsedSong = result.song;
    numberDraftSong = null;
    parsedTimeline = nextTimeline;
    musicalContentKey = nextContentKey;
    lastValidSource = source;
    renderValidationErrors([]);
    renderPracticeDisplay();
    synchronizeBpmControls(result.song);
    synchronizeCountInControl(result.song.countInBars);
    synchronizeCapoControl(result.song.capoFret);
    synchronizeSwingControl(result.song.swingPercent);
    synchronizeTempoRampControls(result.song);
    prepareShareUrl(source);
    if (rampCurrentBpm === null) resetTempoRampState();

    if (sourceChanged && bpmOnlyChange) {
      if (playbackState === 'playing') {
        if (countInEndTime !== null) {
          haltPlayback({ resetPosition: true });
          countInRequired = parsedSong.countInBars > 0;
          setPlaybackStatus('guitar.status.tempoCountIn');
        } else {
          requestTempoChange(nextTimeline);
        }
      } else {
        setPlaybackStatus('guitar.status.readyBpm', { bpm: result.song.bpm });
      }
    } else if (sourceChanged && originalKeyOnlyChange) {
      setPlaybackStatus('guitar.status.originalKeyChanged');
    } else if (sourceChanged) {
      haltPlayback({ resetPosition: true });
      countInRequired = parsedSong.countInBars > 0;
      setPlaybackStatus(activeRampSettingChanged
        ? 'guitar.status.speedChanged'
        : 'guitar.status.arrangementChanged');
    } else if (origin === 'initial') {
      resetTempoRampState();
      countInRequired = parsedSong.countInBars > 0;
      showReadyPlaybackPresentation();
      setPlaybackStatus('guitar.status.ready');
    } else if (!previousSong) {
      haltPlayback({ resetPosition: true });
      countInRequired = parsedSong.countInBars > 0;
      setPlaybackStatus('guitar.status.readyBar');
    } else if (origin === 'bpm-control') {
      setPlaybackStatus('guitar.status.readyBpm', { bpm: result.song.bpm });
    }

    updateControls();
    if (origin === 'preset' || origin === 'initial' || origin === 'shared') {
      enableChordTimelineFollowing();
      scrollChordTimelineToStart(previousSong !== null);
    }
  }

  function renderPresetOptions() {
    const selectedValue = elements.preset.value;
    const customOption = document.createElement('option');
    customOption.value = '';
    customOption.textContent = t('guitar.customArrangement');
    elements.preset.replaceChildren(customOption);
    for (const preset of presetApi.listPresets()) {
      const option = document.createElement('option');
      option.value = preset.slug;
      const category = preset.presetType === 'Exercise'
        ? translatedPresetLevel(preset)
        : translatedPresetType(preset);
      option.textContent = t('guitar.preset.label', {
        category,
        title: translatedPresetTitle(preset),
      });
      elements.preset.append(option);
    }
    elements.preset.value = selectedValue;
  }

  function synchronizePresetSelection(source, song) {
    const preset = arguments.length > 1
      ? presetApi.findPresetByExerciseSong(song)
      : presetApi.findPresetByExerciseIdentity(source);
    elements.preset.value = preset ? preset.slug : '';
    elements.presetGoal.textContent = preset
      ? t('guitar.preset.goal', {
        level: translatedPresetLevel(preset),
        goal: translatedPresetGoal(preset),
      })
      : t('guitar.presetPrompt');
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
      && !root.confirm(t('guitar.confirmPreset'))
    ) {
      synchronizePresetSelection(elements.source.value);
      setShareStatus('guitar.share.cancelled');
      return;
    }

    try {
      const presetLink = presetApi.createPresetUrl(preset.slug, root.location.href);
      root.history.replaceState(null, '', presetLink.url);
    } catch (error) {
      setShareStatus('guitar.share.urlUpdateFailed');
    }

    elements.source.value = preset.source;
    sourceReplacementBaseline = preset.source;
    validateSource('preset');
  }

  function updateBpmFromControl(rawValue) {
    const maximum = parsedSong && parsedSong.tempoRamp.enabled
      ? parsedSong.tempoRamp.targetBpm - 1
      : 300;
    if (!/^\d+$/.test(rawValue) || Number(rawValue) < 30 || Number(rawValue) > maximum) {
      if (parsedSong) synchronizeBpmControls(parsedSong);
      setPlaybackStatus('guitar.status.bpmRange', { maximum });
      return;
    }
    const updatedSource = parser.replaceBpmDirective(elements.source.value, rawValue);
    if (updatedSource === null) {
      setPlaybackStatus('guitar.status.fixBpm');
      return;
    }
    clearSourceParametersAfterSourceChange();
    elements.source.value = updatedSource;
    validateSource('bpm-control');
  }

  function synchronizeBpmControls(song) {
    if (!song) {
      elements.bpmNumberLabel.textContent = t('guitar.tempo');
      elements.bpmRangeLabel.textContent = t('guitar.tempoSlider');
      elements.bpmNumber.max = '300';
      elements.bpmRange.max = '300';
      return;
    }
    const maximum = song.tempoRamp.enabled ? song.tempoRamp.targetBpm - 1 : 300;
    elements.bpmNumberLabel.textContent = song.tempoRamp.enabled
      ? t('guitar.startingTempo')
      : t('guitar.tempo');
    elements.bpmRangeLabel.textContent = song.tempoRamp.enabled
      ? t('guitar.startingTempoSlider')
      : t('guitar.tempoSlider');
    elements.bpmNumber.max = String(maximum);
    elements.bpmRange.max = String(maximum);
    elements.bpmNumber.value = String(song.bpm);
    elements.bpmRange.value = String(song.bpm);
  }

  function updateCountInFromControl(rawValue) {
    const previousValue = parsedSong ? String(parsedSong.countInBars) : '';
    const updatedSource = parser.replaceCountInDirective(elements.source.value, rawValue);
    if (updatedSource === null) {
      elements.countIn.value = previousValue;
      setPlaybackStatus('guitar.status.fixCountIn');
      return;
    }
    clearSourceParametersAfterSourceChange();
    elements.source.value = updatedSource;
    validateSource('count-in-control');
  }

  function synchronizeCountInControl(countInBars) {
    elements.countIn.value = String(countInBars);
  }

  function updateCapoFromControl(rawValue) {
    const previousValue = parsedSong ? String(parsedSong.capoFret) : '';
    if (!/^\d+$/.test(rawValue) || Number(rawValue) < 0 || Number(rawValue) > 12) {
      elements.capoFret.value = previousValue;
      setPlaybackStatus('guitar.status.capoRange');
      return;
    }
    const updatedSource = parser.replaceCapoDirective(elements.source.value, rawValue);
    if (updatedSource === null) {
      elements.capoFret.value = previousValue;
      setPlaybackStatus('guitar.status.fixCapo');
      return;
    }
    applyControlSource(updatedSource, 'capo-control');
  }

  function synchronizeCapoControl(capoFret) {
    elements.capoFret.value = String(capoFret);
  }

  function updateOriginalKeyFromControl(value) {
    const song = currentNumberSong();
    if (!song) return;
    const updatedSource = parser.replaceOriginalKeyDirective(elements.source.value, value);
    if (updatedSource === null) {
      renderPracticeDisplay();
      setPlaybackStatus('guitar.status.fixOriginalKey');
      return;
    }
    applyControlSource(updatedSource, 'original-key-control');
  }

  function updatePlayingKeyFromControl(value) {
    const song = currentNumberSong();
    if (!song) return;
    const updatedSource = parser.replaceKeyDirective(elements.source.value, value);
    if (updatedSource === null) {
      renderPracticeDisplay();
      setPlaybackStatus('guitar.status.fixPlayingKey');
      return;
    }
    applyControlSource(updatedSource, 'playing-key-control');
  }

  function returnToOriginalKey() {
    const song = currentNumberSong();
    if (!song) return;
    updatePlayingKeyFromControl(song.originalKey.canonicalText);
  }

  function setChordView(value) {
    if (!['shapes', 'numbers', 'sounding'].includes(value)) return;
    chordView = value;
    try {
      root.localStorage.setItem('guitar-strumming-chord-view', value);
    } catch (_error) {
      // Keep the selected view for this page session.
    }
    renderPracticeDisplay();
  }

  function loadChordView() {
    try {
      const saved = root.localStorage.getItem('guitar-strumming-chord-view');
      if (['shapes', 'numbers', 'sounding'].includes(saved)) return saved;
    } catch (_error) {
      // Use the first-use default when storage is unavailable.
    }
    return 'shapes';
  }

  function currentNumberSong() {
    const song = parsedSong || numberDraftSong;
    return song && song.notation === 'numbers' ? song : null;
  }

  function updateSwingFromControl(rawValue) {
    const previousValue = parsedSong && parsedSong.swingPercent !== null
      ? String(parsedSong.swingPercent)
      : 'off';
    if (
      rawValue !== 'off'
      && (!/^\d+$/.test(rawValue) || Number(rawValue) < 50 || Number(rawValue) > 75)
    ) {
      synchronizeSwingControl(parsedSong ? parsedSong.swingPercent : undefined);
      setPlaybackStatus('guitar.status.swingRange');
      return;
    }
    const updatedSource = parser.replaceSwingDirective(elements.source.value, rawValue);
    if (updatedSource === null) {
      elements.swingFeel.value = previousValue;
      setPlaybackStatus('guitar.status.fixSwing');
      return;
    }
    applyControlSource(updatedSource, 'swing-control');
  }

  function synchronizeSwingControl(swingPercent) {
    const oldCustomOption = elements.swingFeel.querySelector('[data-custom-swing]');
    if (oldCustomOption) oldCustomOption.remove();
    if (swingPercent === undefined) {
      elements.swingFeel.value = '';
      return;
    }

    const value = swingPercent === null ? 'off' : String(swingPercent);
    const hasStandardOption = [...elements.swingFeel.options]
      .some((option) => option.value === value);
    if (!hasStandardOption) {
      const customOption = document.createElement('option');
      customOption.value = value;
      customOption.textContent = t('guitar.swingCustom', { value });
      customOption.dataset.customSwing = 'true';
      elements.swingFeel.append(customOption);
    }
    elements.swingFeel.value = value;
  }

  function updateTempoRampMode(mode) {
    if (!parsedSong) {
      synchronizeTempoRampControls(null);
      setPlaybackStatus('guitar.status.fixArrangementSpeed');
      return;
    }

    if (mode === 'increase' && !parsedSong.tempoRamp.enabled) {
      let ramp;
      try {
        ramp = core.defaultTempoRampForTarget(parsedSong.bpm);
      } catch (error) {
        synchronizeTempoRampControls(parsedSong);
        setPlaybackStatus('guitar.status.speedTargetLow');
        return;
      }
      applyTempoRampSourceChange(
        ramp.startingBpm,
        `+${ramp.stepBpm}/${ramp.loopsPerStep}/${ramp.targetBpm}`,
      );
      return;
    }

    if (mode === 'off' && parsedSong.tempoRamp.enabled) {
      applyTempoRampSourceChange(parsedSong.tempoRamp.targetBpm, 'off');
      return;
    }

    synchronizeTempoRampControls(parsedSong);
  }

  function updateTempoRampFromControls() {
    if (!parsedSong || !parsedSong.tempoRamp.enabled) {
      synchronizeTempoRampControls(parsedSong);
      setPlaybackStatus('guitar.status.enableSpeed');
      return;
    }

    const fields = [
      {
        element: elements.tempoRampStep,
        labelKey: 'guitar.status.fieldStep',
        minimum: 1,
        maximum: 20,
      },
      {
        element: elements.tempoRampLoops,
        labelKey: 'guitar.status.fieldLoops',
        minimum: 1,
        maximum: 99,
      },
      {
        element: elements.tempoRampTarget,
        labelKey: 'guitar.status.fieldTarget',
        minimum: parsedSong.bpm + 1,
        maximum: 300,
      },
    ];
    const values = [];
    for (const field of fields) {
      const rawValue = field.element.value;
      const value = Number(rawValue);
      if (
        !/^\d+$/.test(rawValue)
        || value < field.minimum
        || value > field.maximum
      ) {
        synchronizeTempoRampControls(parsedSong);
        setPlaybackStatus('guitar.status.fieldRange', {
          fieldKey: field.labelKey,
          minimum: field.minimum,
          maximum: field.maximum,
        });
        return;
      }
      values.push(value);
    }

    const updatedSource = parser.replaceTempoRampDirective(
      elements.source.value,
      `+${values[0]}/${values[1]}/${values[2]}`,
    );
    if (updatedSource === null) {
      synchronizeTempoRampControls(parsedSong);
      setPlaybackStatus('guitar.status.fixRamp');
      return;
    }
    applyControlSource(updatedSource, 'tempo-ramp-control');
  }

  function applyTempoRampSourceChange(bpm, tempoRampValue) {
    const bpmSource = parser.replaceBpmDirective(elements.source.value, bpm);
    const updatedSource = bpmSource === null
      ? null
      : parser.replaceTempoRampDirective(bpmSource, tempoRampValue);
    if (updatedSource === null) {
      synchronizeTempoRampControls(parsedSong);
      setPlaybackStatus('guitar.status.fixBpmRamp');
      return;
    }
    applyControlSource(updatedSource, 'tempo-ramp-control');
  }

  function applyControlSource(updatedSource, origin) {
    clearSourceParametersAfterSourceChange();
    elements.source.value = updatedSource;
    validateSource(origin);
  }

  function synchronizeTempoRampControls(song) {
    const enabled = Boolean(song && song.tempoRamp.enabled);
    elements.tempoRampMode.value = song ? (enabled ? 'increase' : 'off') : '';
    elements.tempoRampFields.hidden = !enabled;
    if (!enabled) {
      elements.tempoRampStep.value = '';
      elements.tempoRampLoops.value = '';
      elements.tempoRampTarget.value = '';
      return;
    }
    elements.tempoRampStep.value = String(song.tempoRamp.stepBpm);
    elements.tempoRampLoops.value = String(song.tempoRamp.loopsPerStep);
    elements.tempoRampTarget.min = String(song.bpm + 1);
    elements.tempoRampTarget.value = String(song.tempoRamp.targetBpm);
  }

  async function prepareShareUrl(source) {
    sharePreparationGeneration += 1;
    const generation = sharePreparationGeneration;
    preparedShare = null;
    setShareStatus('guitar.share.preparing');
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
      setShareStatus('guitar.share.ready', {
        format: codecName,
        length: result.urlLength,
      });
    } catch (error) {
      if (generation !== sharePreparationGeneration || elements.source.value !== source) return;
      preparedShare = null;
      setShareStatus('guitar.share.unavailable', { detail: error.message || '' });
    }
    updateControls();
  }

  function invalidatePreparedShare(key, parameters = {}) {
    sharePreparationGeneration += 1;
    copyRequestGeneration += 1;
    preparedShare = null;
    hideManualShareLink();
    setShareStatus(key, parameters);
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
      setShareStatus('guitar.share.removeOldFailed');
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
      setShareStatus('guitar.share.putUrlFailed');
      return;
    }

    writeClipboard(share.url).then(() => {
      if (requestId !== copyRequestGeneration) return;
      hideManualShareLink();
      setShareStatus('guitar.share.copiedLink', {
        codec: share.codec,
        length: share.urlLength,
      });
    }, () => {
      if (requestId !== copyRequestGeneration) return;
      showManualShareLink(share.url);
      setShareStatus('guitar.share.copyLinkFailed');
    });
  }

  function handleCopySource() {
    const source = elements.source.value;
    copyRequestGeneration += 1;
    const requestId = copyRequestGeneration;
    writeClipboard(source).then(() => {
      if (requestId !== copyRequestGeneration) return;
      setShareStatus('guitar.share.copiedSource');
    }, () => {
      if (requestId !== copyRequestGeneration) return;
      elements.source.focus();
      elements.source.select();
      setShareStatus('guitar.share.copySourceFailed');
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

  function setShareStatus(key, parameters = {}) {
    currentShareStatus = { key, parameters };
    renderShareStatus();
  }

  async function handleSoundTestClick(event) {
    const button = event.target.closest('[data-strum-token]');
    if (!button || !elements.soundTest.contains(button) || button.disabled) return;

    const token = button.dataset.strumToken;
    const parsedToken = parser.parseStrumTokenValue(token);
    if (!parsedToken.ok) {
      setPlaybackStatus('guitar.status.soundToken', { token });
      return;
    }

    if (playbackState === 'playing') {
      pausePlayback('guitar.status.soundPaused');
    } else {
      haltPlayback({ resetPosition: false });
    }
    const requestId = requestGeneration;
    setPlaybackStatus('guitar.status.soundStarting', { token });

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
      setPlaybackStatus('guitar.status.soundPlayed', { token });
    } catch (error) {
      haltPlayback({ resetPosition: false });
      setPlaybackStatus('guitar.status.soundFailed', { detail: error.message });
    }
  }

  async function handlePlayPause() {
    if (playbackState === 'playing') {
      pausePlayback('guitar.status.paused');
      return;
    }
    if (playbackState === 'starting' || !parsedTimeline || !audioSupported) return;

    enableChordTimelineFollowing();
    playbackState = 'starting';
    requestGeneration += 1;
    const requestId = requestGeneration;
    updateControls();
    setPlaybackStatus('guitar.status.audioStarting');

    try {
      const engine = getAudioEngine();
      const context = await engine.ensureRunning();
      if (requestId !== requestGeneration) return;
      const useCountIn = countInRequired && playheadSlot === 0;
      const countInBars = beginPlaybackAtPosition(context, playheadSlot, useCountIn);
      setPlaybackStartStatus(countInBars);
      screenWakeLock.start();
    } catch (error) {
      haltPlayback({ resetPosition: false });
      clearPlaybackPresentation();
      setPlaybackStatus('guitar.status.audioFailed', { detail: error.message });
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
    const normalizedSourceSlot = sourceSlot % playbackTimeline.durationSlots;
    const events = core.playableEvents(playbackTimeline);
    const countInBars = useCountIn ? parsedSong.countInBars : 0;
    const scheduledCountInStartTime = context.currentTime + START_LEAD_SECONDS;
    const countInEvents = core.createCountInEvents(
      playbackTimeline.bpm,
      countInBars,
      scheduledCountInStartTime,
    );
    for (const event of countInEvents) {
      audioEngine.playCountInClick(event.eventTime, event.accented);
    }
    const startTime = scheduledCountInStartTime + core.countInDurationSeconds(
      playbackTimeline.bpm,
      countInBars,
    );
    activeSegment = {
      timeline: playbackTimeline,
      events,
      originTime: startTime - core.slotPositionSeconds(
        normalizedSourceSlot,
        playbackTimeline.bpm,
        playbackTimeline.gridSize,
        playbackTimeline.swingPercent,
      ),
      cursor: core.createScheduleCursorAtPosition(events, normalizedSourceSlot),
      completedLoopsAtOrigin: rampCompletedLoops,
    };
    pendingTransition = null;
    countInStartTime = countInBars > 0 ? scheduledCountInStartTime : null;
    countInEndTime = countInBars > 0 ? startTime : null;
    countInDisplayedBeats = countInBars > 0 ? countInBars * 4 : null;
    playbackPresentationStartTime = startTime;
    countInRequired = false;
    playheadSlot = normalizedSourceSlot;
    skippedLateStrums = 0;
    playbackState = 'playing';
    planTempoRampTransition();
    pumpScheduler();
    schedulerTimer = root.setInterval(pumpScheduler, SCHEDULER_INTERVAL_MILLISECONDS);
    startPlaybackPresentationLoop();
    updateControls();
    return countInBars;
  }

  function pausePlayback(statusKey, parameters = {}) {
    requestGeneration += 1;
    if (activeSegment && audioEngine && audioEngine.context) {
      const now = audioEngine.context.currentTime;
      if (playbackPresentationStartTime === null || now >= playbackPresentationStartTime) {
        promoteTempoTransition(now);
        synchronizeTempoRampProgress(now);
        playheadSlot = core.playheadSlotAtTime(
          activeSegment.originTime,
          now,
          activeSegment.timeline,
        );
        updatePlaybackPresentationAtTime(now);
      }
    }
    clearSchedulerTimer();
    stopPlaybackPresentationLoop();
    if (audioEngine) audioEngine.stopAll();
    activeSegment = null;
    pendingTransition = null;
    countInStartTime = null;
    countInEndTime = null;
    countInDisplayedBeats = null;
    playbackPresentationStartTime = null;
    playbackState = 'paused';
    screenWakeLock.stop();
    setPlaybackStatus(statusKey, parameters);
    updateControls();
  }

  function haltPlayback(options) {
    requestGeneration += 1;
    clearSchedulerTimer();
    stopPlaybackPresentationLoop();
    if (audioEngine) audioEngine.stopAll();
    activeSegment = null;
    pendingTransition = null;
    countInStartTime = null;
    countInEndTime = null;
    countInDisplayedBeats = null;
    playbackPresentationStartTime = null;
    playbackState = 'paused';
    screenWakeLock.stop();
    if (options.resetPosition) {
      playheadSlot = 0;
      resetTempoRampState();
      showReadyPlaybackPresentation();
    }
    updateControls();
  }

  function restartPlayback() {
    if (!parsedTimeline || !audioSupported || playbackState === 'starting') return;
    playheadSlot = 0;
    pendingTransition = null;
    resetTempoRampState();
    countInRequired = parsedSong.countInBars > 0;
    enableChordTimelineFollowing();
    showReadyPlaybackPresentation();
    scrollChordTimelineToStart(true);
    if (audioEngine) audioEngine.stopAll();

    if (playbackState === 'playing' && audioEngine && audioEngine.context) {
      const countInBars = beginPlaybackAtPosition(audioEngine.context, 0, countInRequired);
      setPlaybackStartStatus(countInBars);
    } else {
      activeSegment = null;
      setPlaybackStatus('guitar.status.readyBar');
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
    setPlaybackStatus('guitar.status.bpmChange', {
      bpm: nextTimeline.bpm,
      bar: barNumber,
    });
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
        countInStartTime = null;
        countInEndTime = null;
        countInDisplayedBeats = null;
        updateControls();
        setPlaybackStatus('guitar.status.playing');
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
      pausePlayback('guitar.status.stopped', { detail: error.message });
      clearPlaybackPresentation();
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
      const stringPitches = core.resolveVoicingPitches(
        voicing.frets,
        segment.timeline.capoFret,
      );
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
      setPlaybackStatus('guitar.status.recovered', { count: skippedLateStrums });
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
      const status = tempoRampPlaybackStatus();
      setPlaybackStatus(status.key, status.parameters);
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
      return {
        key: 'guitar.status.playingBpm',
        parameters: { bpm: activeSegment.timeline.bpm },
      };
    }
    if (rampCurrentBpm >= parsedSong.tempoRamp.targetBpm) {
      return {
        key: 'guitar.status.playingTarget',
        parameters: { bpm: rampCurrentBpm },
      };
    }
    return {
      key: 'guitar.status.playingRamp',
      parameters: { bpm: rampCurrentBpm, loops: rampCompletedLoops },
    };
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
      pausePlayback('guitar.status.hiddenPause');
      return;
    }
    if (!document.hidden && playbackState === 'playing') {
      screenWakeLock.handleVisibilityChange();
    }
  }

  function handleAudioStateChange() {
    if (
      playbackState === 'playing'
      && audioEngine
      && audioEngine.context
      && audioEngine.context.state !== 'running'
    ) {
      pausePlayback('guitar.status.contextPause', { state: audioEngine.context.state });
    }
  }

  function clearSchedulerTimer() {
    if (schedulerTimer !== null) {
      root.clearInterval(schedulerTimer);
      schedulerTimer = null;
    }
  }

  function t(key, parameters = {}) {
    return i18n ? i18n.translate(key, parameters) : key;
  }

  function translatedPresetTitle(preset) {
    const key = `guitar.preset.${preset.slug}.title`;
    const value = t(key);
    return value === key ? preset.title : value;
  }

  function translatedPresetGoal(preset) {
    const key = `guitar.preset.${preset.slug}.goal`;
    const value = t(key);
    return value === key ? preset.teachingGoal : value;
  }

  function translatedPresetLevel(preset) {
    const key = preset.teachingLevel === 'Beginner'
      ? 'guitar.preset.level.beginner'
      : 'guitar.preset.level.intermediate';
    return t(key);
  }

  function translatedPresetType(preset) {
    const keyByType = {
      Exercise: 'guitar.preset.type.exercise',
      'Feature demo': 'guitar.preset.type.feature',
      'Song exercise': 'guitar.preset.type.song',
    };
    const key = keyByType[preset.presetType];
    return key ? t(key) : preset.presetType;
  }

  function renderPlaybackStatus() {
    if (playbackNotifier) {
      playbackNotifier.refresh();
      return;
    }
    renderPlaybackNotification({
      ...currentPlaybackStatus,
      visible: true,
      tone: 'error',
    });
  }

  function renderPlaybackNotification(notification) {
    const parameters = { ...notification.parameters };
    if (parameters.fieldKey) {
      parameters.field = t(parameters.fieldKey);
      delete parameters.fieldKey;
    }
    elements.status.textContent = t(notification.key, parameters);
    elements.playbackToast.dataset.tone = notification.tone;
    elements.playbackToast.hidden = !notification.visible;
  }

  function renderShareStatus() {
    const parameters = { ...currentShareStatus.parameters };
    if (parameters.presetSlug) {
      const preset = presetApi.getPreset(parameters.presetSlug);
      parameters.title = preset ? translatedPresetTitle(preset) : parameters.presetSlug;
      delete parameters.presetSlug;
    }
    elements.shareStatus.textContent = t(currentShareStatus.key, parameters);
  }

  function renderLocalizedContent() {
    if (!i18n || !presetApi) return;
    renderPresetOptions();
    synchronizePresetSelection(elements.source.value, parsedSong);
    synchronizeBpmControls(parsedSong);
    synchronizeSwingControl(parsedSong ? parsedSong.swingPercent : undefined);
    renderPracticeDisplay();
    if (fatalValidationStatus) {
      elements.validationSummary.textContent = t(
        fatalValidationStatus.key,
        fatalValidationStatus.parameters,
      );
    } else {
      renderValidationErrors(currentValidationErrors, false);
    }
    renderPlaybackStatus();
    renderShareStatus();
    updateControls();
  }

  function renderValidationErrors(errors, openEditor = true) {
    currentValidationErrors = [...errors];
    fatalValidationStatus = null;
    elements.validationErrors.replaceChildren();
    if (errors.length === 0) {
      elements.validationErrors.hidden = true;
      elements.validationSummary.textContent = t('guitar.validation.valid');
      elements.validationSummary.className = 'validation-summary valid';
      return;
    }

    if (openEditor) elements.editor.open = true;
    for (const error of errors) {
      const listItem = document.createElement('li');
      listItem.textContent = i18n.formatValidationError(error);
      elements.validationErrors.append(listItem);
    }
    elements.validationErrors.hidden = false;
    elements.validationSummary.textContent = errors.length === 1
      ? t('guitar.validation.one')
      : t('guitar.validation.many', { count: errors.length });
    elements.validationSummary.className = 'validation-summary invalid';
  }

  function renderPracticeDisplay() {
    const song = currentNumberSong() || parsedSong;
    elements.practiceChordGuideRegion.hidden = !song;
    elements.chordGuide.replaceChildren();
    chordTimeline = null;
    renderedChordTimeline = [];
    elements.chordGuideScroll.hidden = false;
    elements.chordPresentationError.hidden = true;
    if (song) {
      try {
        chordTimeline = presentation.createChordTimeline(
          song,
          chordView,
          elements.editor.open,
        );
        renderChordTimeline(chordTimeline);
        applyPlaybackPresentation(playbackPresentationState, true);
      } catch (_error) {
        clearPlaybackPresentation();
        chordTimeline = null;
        renderedChordTimeline = [];
        elements.chordGuideScroll.hidden = true;
        elements.chordPresentationError.hidden = false;
        elements.chordPresentationError.textContent = t('guitar.presentationUnavailable');
      }
    } else {
      clearPlaybackPresentation();
    }

    const isNumberSong = Boolean(song && song.notation === 'numbers');
    elements.numberChordControls.hidden = !isNumberSong;
    elements.legacyCapoControl.hidden = isNumberSong;
    if (!isNumberSong) return;

    const shapeKey = harmony.keyFromPitchClass(
      song.playingKey.pitchClass - song.capoFret,
      song.playingKey.mode,
    );
    const summaryParameters = {
      originalKey: displayMusicText(song.originalKey.canonicalText),
      playingKey: displayMusicText(song.playingKey.canonicalText),
      shapeKey: displayMusicText(shapeKey.canonicalTonic),
      capo: song.capoFret,
    };
    elements.keySummary.textContent = sameKey(song.originalKey, song.playingKey)
      ? t(song.capoFret === 0 ? 'guitar.keySummarySameNoCapo' : 'guitar.keySummarySame', summaryParameters)
      : t(song.capoFret === 0 ? 'guitar.keySummaryChangedNoCapo' : 'guitar.keySummaryChanged', summaryParameters);

    for (const button of elements.chordViewButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.chordView === chordView));
    }
    renderKeyOptions(elements.originalKey, song.originalKey, song.originalKey.mode);
    renderKeyOptions(elements.playingKey, song.playingKey, song.originalKey.mode);
    renderGuitarConfigurations(song);
    elements.returnOriginalKey.disabled = sameKey(song.originalKey, song.playingKey);
    elements.keyShapesStatus.textContent = t('guitar.configurationHelp');
  }

  function renderChordTimeline(timeline) {
    const fragment = document.createDocumentFragment();
    for (const bar of timeline.bars) {
      const card = document.createElement('li');
      card.className = 'chord-bar-card';
      card.style.setProperty('--bar-min-width', `${bar.minWidthRem}rem`);

      const barNumber = document.createElement('span');
      barNumber.className = 'chord-bar-number';
      barNumber.textContent = t('guitar.barNumber', { number: bar.number });
      card.append(barNumber);

      const labelLanes = document.createElement('div');
      labelLanes.className = 'chord-label-lanes';
      labelLanes.style.setProperty('--label-lane-count', String(bar.labelLaneCount));
      const renderedChanges = [];
      for (const change of bar.changes) {
        const label = document.createElement('span');
        label.className = `chord-change-label align-${change.labelAlign}`;
        label.style.left = `${change.start * 100}%`;
        label.style.setProperty('--label-lane', String(change.labelLane));

        const chordName = document.createElement('span');
        chordName.className = 'chord-name';
        chordName.textContent = displayMusicText(change.label);
        label.append(chordName);

        if (change.timingCue) {
          const timingCue = document.createElement('span');
          timingCue.className = 'chord-timing-cue';
          timingCue.textContent = change.timingCue;
          label.append(timingCue);
        }
        labelLanes.append(label);
        renderedChanges.push({ label, region: null });
      }
      card.append(labelLanes);

      const durationBand = document.createElement('div');
      durationBand.className = 'chord-duration-band';
      durationBand.setAttribute('aria-hidden', 'true');
      for (const [changeIndex, change] of bar.changes.entries()) {
        const region = document.createElement('span');
        region.className = changeIndex % 2 === 0
          ? 'chord-duration-region'
          : 'chord-duration-region alternate';
        region.style.left = `${change.start * 100}%`;
        region.style.width = `${(change.end - change.start) * 100}%`;
        durationBand.append(region);
        renderedChanges[changeIndex].region = region;
      }
      card.append(durationBand);
      fragment.append(card);
      renderedChordTimeline.push({ card, changes: renderedChanges });
    }
    elements.chordGuide.append(fragment);
  }

  function showReadyPlaybackPresentation() {
    if (!chordTimeline) {
      clearPlaybackPresentation();
      return;
    }
    applyPlaybackPresentation(presentation.createReadyPlaybackCue(chordTimeline));
  }

  function clearPlaybackPresentation() {
    applyPlaybackPresentation(Object.freeze({ mode: 'none', current: null }));
  }

  function applyPlaybackPresentation(state, force = false) {
    const cuePositions = [state.current].filter(Boolean);
    const positionsFit = cuePositions.every((position) => (
      renderedChordTimeline[position.barIndex]
      && renderedChordTimeline[position.barIndex].changes[position.changeIndex]
    ));
    if (!positionsFit) {
      state = Object.freeze({ mode: 'none', current: null });
    }
    const stateKey = JSON.stringify(state);
    if (!force && stateKey === JSON.stringify(playbackPresentationState)) return;

    for (const bar of renderedChordTimeline) {
      for (const change of bar.changes) {
        change.label.classList.remove('is-current');
        change.label.removeAttribute('aria-current');
        change.region.classList.remove('is-current');
      }
    }

    playbackPresentationState = state;
    if (state.current) {
      const currentBar = renderedChordTimeline[state.current.barIndex];
      const currentChange = currentBar.changes[state.current.changeIndex];
      currentChange.label.classList.add('is-current');
      currentChange.label.setAttribute('aria-current', 'true');
      currentChange.region.classList.add('is-current');
    }

    const activeBarIndex = state.current
      ? state.current.barIndex
      : state.mode === 'ready' ? 0 : null;
    if (activeBarIndex !== null) followChordTimelineToBar(activeBarIndex, true);
  }

  function updatePlaybackPresentationAtTime(audioTime) {
    if (!chordTimeline || !activeSegment) return true;
    if (
      playbackPresentationStartTime !== null
      && audioTime < playbackPresentationStartTime
    ) return true;

    try {
      const segment = pendingTransition
        && audioTime >= pendingTransition.boundary.audioTime - BOUNDARY_EPSILON_SECONDS
        ? pendingTransition.segment
        : activeSegment;
      const sourceSlot = core.playheadSlotAtTime(
        segment.originTime,
        audioTime,
        segment.timeline,
      );
      applyPlaybackPresentation(presentation.playbackCueAtSlot(chordTimeline, sourceSlot));
      return true;
    } catch (_error) {
      failPlaybackPresentation();
      return false;
    }
  }

  function startPlaybackPresentationLoop() {
    stopPlaybackPresentationLoop();
    if (typeof root.requestAnimationFrame !== 'function') {
      failPlaybackPresentation();
      return;
    }

    function updateFrame() {
      playbackPresentationFrame = null;
      if (playbackState === 'playing' && audioEngine && audioEngine.context) {
        updateCountInButtonAtTime(audioEngine.context.currentTime);
      }
      if (
        playbackState !== 'playing'
        || !audioEngine
        || !audioEngine.context
        || !updatePlaybackPresentationAtTime(audioEngine.context.currentTime)
      ) return;
      playbackPresentationFrame = root.requestAnimationFrame(updateFrame);
    }

    playbackPresentationFrame = root.requestAnimationFrame(updateFrame);
  }

  function stopPlaybackPresentationLoop() {
    if (playbackPresentationFrame === null) return;
    if (typeof root.cancelAnimationFrame === 'function') {
      root.cancelAnimationFrame(playbackPresentationFrame);
    }
    playbackPresentationFrame = null;
  }

  function updateCountInButtonAtTime(audioTime) {
    if (countInStartTime === null || !activeSegment || !parsedSong) return;
    const remainingBeats = core.countInRemainingBeats(
      activeSegment.timeline.bpm,
      parsedSong.countInBars,
      countInStartTime,
      audioTime,
    );
    if (remainingBeats === countInDisplayedBeats) return;
    countInDisplayedBeats = remainingBeats;
    updateControls();
  }

  function failPlaybackPresentation() {
    stopPlaybackPresentationLoop();
    try {
      clearPlaybackPresentation();
    } catch (_error) {
      playbackPresentationState = Object.freeze({ mode: 'none', current: null });
    }
    elements.chordPresentationError.hidden = false;
    elements.chordPresentationError.textContent = t('guitar.playbackPresentationUnavailable');
  }

  function enableChordTimelineFollowing() {
    chordTimelineFollowing = true;
    followedChordBarIndex = null;
    const activeBarIndex = playbackPresentationState.current
      ? playbackPresentationState.current.barIndex
      : playbackPresentationState.mode === 'ready' ? 0 : null;
    if (activeBarIndex !== null) followChordTimelineToBar(activeBarIndex, true);
  }

  function suspendChordTimelineFollowing() {
    chordTimelineFollowing = false;
  }

  function handleChordTimelineKeydown(event) {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) {
      suspendChordTimelineFollowing();
    }
  }

  function followChordTimelineToBar(barIndex, smooth) {
    if (!chordTimelineFollowing || followedChordBarIndex === barIndex) return;
    const renderedBar = renderedChordTimeline[barIndex];
    if (!renderedBar) return;
    const containerRect = elements.chordGuideScroll.getBoundingClientRect();
    const barRect = renderedBar.card.getBoundingClientRect();
    const left = Math.max(
      0,
      elements.chordGuideScroll.scrollLeft + barRect.left - containerRect.left - 10,
    );
    elements.chordGuideScroll.scrollTo({
      left,
      behavior: smooth ? 'smooth' : 'auto',
    });
    followedChordBarIndex = barIndex;
  }

  function scrollChordTimelineToStart(smooth) {
    if (typeof elements.chordGuideScroll.scrollTo === 'function') {
      elements.chordGuideScroll.scrollTo({
        left: 0,
        behavior: smooth ? 'smooth' : 'auto',
      });
      followedChordBarIndex = 0;
      return;
    }
    elements.chordGuideScroll.scrollLeft = 0;
    followedChordBarIndex = 0;
  }

  function renderKeyOptions(select, selectedKey, mode) {
    const options = [];
    for (let pitchClass = 0; pitchClass < 12; pitchClass += 1) {
      const key = harmony.keyFromPitchClass(pitchClass, mode);
      const option = document.createElement('option');
      option.value = key.canonicalText;
      option.textContent = displayMusicText(key.canonicalText);
      option.selected = key.pitchClass === selectedKey.pitchClass;
      options.push(option);
    }
    select.replaceChildren(...options);
  }

  function renderGuitarConfigurations(song) {
    const numberChords = [];
    const seen = new Set();
    for (const bar of song.chordBars) {
      for (const change of bar) {
        if (!change.numberChord || seen.has(change.numberChord.normalized)) continue;
        seen.add(change.numberChord.normalized);
        numberChords.push(change.numberChord);
      }
    }
    const configurations = harmony.listCapoConfigurations(numberChords, song.playingKey, catalog);
    const options = configurations.map((configuration) => {
      const option = document.createElement('option');
      option.value = String(configuration.capoFret);
      const parameters = {
        shapeKey: displayMusicText(configuration.shapeKey.canonicalTonic),
        fret: configuration.capoFret,
        shapes: configuration.progression.map(displayMusicText).join(' '),
        missing: configuration.missingShapes.map(displayMusicText).join(', '),
      };
      option.textContent = configuration.available
        ? t(configuration.capoFret === 0
          ? 'guitar.configurationNoCapo'
          : 'guitar.configurationCapo', parameters)
        : t('guitar.configurationUnavailable', parameters);
      option.disabled = !configuration.available;
      option.selected = configuration.capoFret === song.capoFret;
      return option;
    });
    elements.guitarConfiguration.replaceChildren(...options);
  }

  function sameKey(left, right) {
    return left.pitchClass === right.pitchClass && left.mode === right.mode;
  }

  function displayMusicText(value) {
    return String(value).replaceAll('bb', '♭♭').replaceAll('##', '♯♯')
      .replaceAll('b', '♭').replaceAll('#', '♯');
  }

  function updateControls() {
    const playbackAvailable = Boolean(parsedTimeline) && audioSupported;
    const rampEnabled = Boolean(parsedSong && parsedSong.tempoRamp.enabled);
    const numberSong = currentNumberSong();
    elements.playPause.disabled = !playbackAvailable || playbackState === 'starting';
    elements.restart.disabled = !playbackAvailable || playbackState === 'starting';
    elements.playPause.textContent = playbackState === 'playing'
      ? countInDisplayedBeats === null
        ? t('guitar.pause')
        : t('guitar.pauseCountIn', { count: countInDisplayedBeats })
      : t('guitar.play');
    elements.playPause.setAttribute('aria-pressed', String(playbackState === 'playing'));
    elements.copyShareLink.disabled = !preparedShare
      || preparedShare.source !== elements.source.value;
    elements.copySource.disabled = false;
    elements.tempoRampMode.disabled = !parsedSong || playbackState === 'starting';
    elements.capoFret.disabled = !parsedSong || playbackState === 'starting';
    elements.originalKey.disabled = !numberSong || playbackState === 'starting';
    elements.playingKey.disabled = !numberSong || playbackState === 'starting';
    elements.guitarConfiguration.disabled = !numberSong || playbackState === 'starting';
    elements.returnOriginalKey.disabled = !numberSong
      || sameKey(numberSong.originalKey, numberSong.playingKey)
      || playbackState === 'starting';
    elements.swingFeel.disabled = !parsedSong || playbackState === 'starting';
    for (const rampField of [
      elements.tempoRampStep,
      elements.tempoRampLoops,
      elements.tempoRampTarget,
    ]) {
      rampField.disabled = !rampEnabled || playbackState === 'starting';
    }
    for (const button of elements.soundTestButtons) {
      button.disabled = !audioSupported || playbackState === 'starting';
    }
  }

  function showFatalError(key, parameters = {}) {
    fatalValidationStatus = { key, parameters };
    elements.editor.open = true;
    elements.validationSummary.textContent = t(key, parameters);
    elements.validationSummary.className = 'validation-summary invalid';
    elements.playPause.disabled = true;
    elements.restart.disabled = true;
    elements.bpmNumber.disabled = true;
    elements.bpmRange.disabled = true;
    elements.countIn.disabled = true;
    elements.capoFret.disabled = true;
    elements.swingFeel.disabled = true;
    elements.tempoRampMode.disabled = true;
    elements.tempoRampStep.disabled = true;
    elements.tempoRampLoops.disabled = true;
    elements.tempoRampTarget.disabled = true;
    elements.preset.disabled = true;
    elements.copyShareLink.disabled = true;
    elements.copySource.disabled = true;
    for (const button of elements.soundTestButtons) button.disabled = true;
    setPlaybackStatus(key, parameters);
  }

  function setPlaybackStatus(key, parameters = {}) {
    currentPlaybackStatus = { key, parameters };
    if (playbackNotifier) {
      playbackNotifier.show(currentPlaybackStatus);
    } else {
      renderPlaybackStatus();
    }
  }

  function setPlaybackStartStatus(countInBars) {
    if (countInBars === 0) {
      setPlaybackStatus('guitar.status.playing');
      return;
    }
    setPlaybackStatus(
      countInBars === 1 ? 'guitar.status.countInOne' : 'guitar.status.countInMany',
      { count: countInBars },
    );
  }

  initialize().catch((error) => {
    showFatalError('guitar.status.toolFailed', { detail: error.message });
  });
}(typeof globalThis !== 'undefined' ? globalThis : this));
