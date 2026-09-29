(function initializeScreenWakeLock(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.GuitarScreenWakeLock = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function createScreenWakeLockApi() {
  'use strict';

  function createController(options) {
    if (!options || typeof options.onUnavailable !== 'function') {
      throw new TypeError('A wake-lock warning function is required.');
    }

    const navigatorObject = options.navigator;
    const documentObject = options.document;
    const wakeLock = navigatorObject && navigatorObject.wakeLock;
    const supported = Boolean(wakeLock && typeof wakeLock.request === 'function');
    let requested = false;
    let sentinel = null;
    let pendingRequest = null;
    let generation = 0;
    let warningReported = false;

    function documentIsHidden() {
      return Boolean(documentObject && documentObject.hidden);
    }

    function reportUnavailable() {
      if (warningReported || !requested) return;
      warningReported = true;
      options.onUnavailable();
    }

    function releaseSentinel(lock) {
      if (!lock || lock.released || typeof lock.release !== 'function') return;
      try {
        Promise.resolve(lock.release()).catch(() => {});
      } catch (error) {
        // The browser already controls the lock. There is no recovery action here.
      }
    }

    function handleRelease(lock) {
      if (sentinel !== lock) return;
      sentinel = null;
      if (requested && !documentIsHidden()) reportUnavailable();
    }

    function acquire() {
      if (!requested || documentIsHidden()) return Promise.resolve(false);
      if (sentinel && !sentinel.released) return Promise.resolve(true);
      if (pendingRequest) return pendingRequest;
      if (!supported) {
        reportUnavailable();
        return Promise.resolve(false);
      }

      const requestGeneration = generation;
      let result;
      try {
        result = wakeLock.request('screen');
      } catch (error) {
        reportUnavailable();
        return Promise.resolve(false);
      }

      const request = Promise.resolve(result).then((lock) => {
        if (pendingRequest === request) pendingRequest = null;
        if (!requested || generation !== requestGeneration) {
          releaseSentinel(lock);
          return false;
        }
        sentinel = lock;
        if (typeof lock.addEventListener === 'function') {
          lock.addEventListener('release', () => handleRelease(lock), { once: true });
        }
        return !lock.released;
      }, () => {
        if (pendingRequest === request) pendingRequest = null;
        if (requested && generation === requestGeneration) reportUnavailable();
        return false;
      });
      pendingRequest = request;
      return request;
    }

    function start() {
      if (!requested) {
        requested = true;
        warningReported = false;
        generation += 1;
      }
      return acquire();
    }

    function stop() {
      requested = false;
      warningReported = false;
      generation += 1;
      const lock = sentinel;
      sentinel = null;
      releaseSentinel(lock);
    }

    function handleVisibilityChange() {
      if (!requested || documentIsHidden()) return Promise.resolve(false);
      return acquire();
    }

    return Object.freeze({
      handleVisibilityChange,
      isHeld: () => Boolean(sentinel && !sentinel.released),
      isSupported: () => supported,
      start,
      stop,
    });
  }

  return Object.freeze({ createController });
}));
