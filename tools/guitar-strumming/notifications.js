(function initializeNotifications(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.GuitarStrummingNotifications = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function createNotifications() {
  'use strict';

  const RECOVERY_WARNING_TIMEOUT_MILLISECONDS = 4000;
  const HIDDEN_KEYS = new Set([
    'guitar.status.preparing',
    'guitar.status.ready',
    'guitar.status.readyBar',
    'guitar.status.readyBpm',
    'guitar.status.audioStarting',
    'guitar.status.paused',
    'guitar.status.playing',
    'guitar.status.playingBpm',
    'guitar.status.playingTarget',
    'guitar.status.playingRamp',
  ]);
  const WARNING_KEYS = new Set([
    'guitar.status.tempoCountIn',
    'guitar.status.recovered',
    'guitar.status.hiddenPause',
    'guitar.status.contextPause',
    'guitar.status.screenWakeUnavailable',
  ]);
  const ERROR_KEYS = new Set([
    'guitar.status.audioUnavailable',
    'guitar.status.sourceUnavailable',
    'guitar.status.fixOne',
    'guitar.status.fixMany',
    'guitar.status.timelineUnavailable',
    'guitar.status.bpmRange',
    'guitar.status.fixBpm',
    'guitar.status.fixCountIn',
    'guitar.status.capoRange',
    'guitar.status.fixCapo',
    'guitar.status.fixOriginalKey',
    'guitar.status.fixPlayingKey',
    'guitar.status.swingRange',
    'guitar.status.fixSwing',
    'guitar.status.fixArrangementSpeed',
    'guitar.status.speedTargetLow',
    'guitar.status.enableSpeed',
    'guitar.status.fieldRange',
    'guitar.status.fixRamp',
    'guitar.status.fixBpmRamp',
    'guitar.status.soundToken',
    'guitar.status.soundFailed',
    'guitar.status.audioFailed',
    'guitar.status.stopped',
    'guitar.status.toolFailed',
    'guitar.status.scriptsFailed',
  ]);

  function policyForStatus(key) {
    if (HIDDEN_KEYS.has(key)) {
      return Object.freeze({ visible: false, tone: 'information', timeoutMilliseconds: null });
    }
    if (ERROR_KEYS.has(key)) {
      return Object.freeze({ visible: true, tone: 'error', timeoutMilliseconds: null });
    }
    if (WARNING_KEYS.has(key)) {
      return Object.freeze({
        visible: true,
        tone: 'warning',
        timeoutMilliseconds: key === 'guitar.status.recovered'
          ? RECOVERY_WARNING_TIMEOUT_MILLISECONDS
          : null,
      });
    }
    return Object.freeze({ visible: false, tone: 'information', timeoutMilliseconds: null });
  }

  function createNotifier(options) {
    if (
      !options
      || typeof options.setTimeout !== 'function'
      || typeof options.clearTimeout !== 'function'
      || typeof options.onChange !== 'function'
    ) {
      throw new TypeError('Notification timer functions and an update function are required.');
    }

    let generation = 0;
    let timer = null;
    let current = Object.freeze({
      key: 'guitar.status.preparing',
      parameters: Object.freeze({}),
      ...policyForStatus('guitar.status.preparing'),
    });

    function cancelTimer() {
      if (timer === null) return;
      options.clearTimeout(timer);
      timer = null;
    }

    function show(status) {
      if (!status || typeof status.key !== 'string') {
        throw new TypeError('A notification status key is required.');
      }
      cancelTimer();
      generation += 1;
      const statusGeneration = generation;
      current = Object.freeze({
        key: status.key,
        parameters: Object.freeze({ ...(status.parameters || {}) }),
        ...policyForStatus(status.key),
      });
      options.onChange(current);
      if (current.visible && current.timeoutMilliseconds !== null) {
        timer = options.setTimeout(() => {
          if (generation !== statusGeneration) return;
          timer = null;
          current = Object.freeze({ ...current, visible: false });
          options.onChange(current);
        }, current.timeoutMilliseconds);
      }
    }

    function dismiss() {
      cancelTimer();
      generation += 1;
      current = Object.freeze({ ...current, visible: false });
      options.onChange(current);
    }

    function refresh() {
      options.onChange(current);
    }

    return Object.freeze({ dismiss, refresh, show });
  }

  return Object.freeze({
    RECOVERY_WARNING_TIMEOUT_MILLISECONDS,
    createNotifier,
    policyForStatus,
  });
}));
