function abortError() {
  return new DOMException('Processing was cancelled.', 'AbortError');
}

export function processInWorker(input, settings, signal) {
  return new Promise((resolve, reject) => {
    const totalStartedAt = performance.now();
    const copyStartedAt = performance.now();
    const channels = Array.from(
      { length: input.numberOfChannels },
      (_, channel) => input.getChannelData(channel).slice(),
    );
    const inputCopyMilliseconds = performance.now() - copyStartedAt;
    const transfer = channels.map((channel) => channel.buffer);
    const worker = new Worker('./processing-worker.mjs?v=61bc8b58ef42', { type: 'module' });

    const stop = () => {
      worker.terminate();
      signal?.removeEventListener('abort', onAbort);
    };
    const onAbort = () => {
      stop();
      reject(abortError());
    };

    if (signal?.aborted) {
      onAbort();
      return;
    }
    signal?.addEventListener('abort', onAbort, { once: true });

    worker.addEventListener('message', (event) => {
      if (event.data.type === 'error') {
        stop();
        reject(new Error(event.data.message));
        return;
      }
      if (event.data.type !== 'complete') return;

      const totalMilliseconds = performance.now() - totalStartedAt;
      stop();
      resolve({
        wave: new Blob([event.data.wave], { type: 'audio/wav' }),
        length: event.data.length,
        sampleRate: event.data.sampleRate,
        channelCount: event.data.channelCount,
        peak: event.data.peak,
        clippedSampleCount: event.data.clippedSampleCount,
        totalSampleCount: event.data.totalSampleCount,
        clippedSamplePercentage: event.data.clippedSamplePercentage,
        engine: event.data.engine,
        diagnostics: event.data.diagnostics,
        timings: {
          totalMilliseconds,
          inputCopyMilliseconds,
          setupMilliseconds: event.data.timings.setupMilliseconds,
          dspMilliseconds: event.data.timings.processingMilliseconds,
          encodingMilliseconds: event.data.timings.encodingMilliseconds,
        },
      });
    });

    worker.addEventListener('error', (event) => {
      stop();
      reject(new Error(event.message || 'The processing worker failed.'));
    });

    worker.postMessage({
      channels,
      length: input.length,
      sampleRate: input.sampleRate,
      ...settings,
    }, transfer);
  });
}
