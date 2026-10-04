import ScalarModule from './vendor/signalsmith-stretch/SignalsmithStretchScalar.mjs?v=7349f115b3d6';
import SimdModule from './vendor/signalsmith-stretch/SignalsmithStretchSimd.mjs?v=d8556ea43ff1';
import { processSignalsmithOffline } from './audio-processing.mjs?v=d8fb3d144753';
import {
  calculatePeakProtectionGain,
  encodeWaveChannels,
  measurePeakChannels,
} from './wav.mjs?v=57e908795253';

async function createModule() {
  try {
    return { module: await SimdModule(), engine: 'simd' };
  } catch (simdError) {
    try {
      return { module: await ScalarModule(), engine: 'scalar' };
    } catch (scalarError) {
      throw new Error(`The audio engine could not start. ${scalarError.message || scalarError}`);
    }
  }
}

self.addEventListener('message', async (event) => {
  try {
    const { trimStart = 0, trimLength = event.data.length, ...settings } = event.data;
    let engine = 'bypass';
    let result = {
      channels: settings.channels,
      length: settings.length,
      sampleRate: settings.sampleRate,
      diagnostics: { preset: 'bypass' },
      timings: { setupMilliseconds: 0, processingMilliseconds: 0 },
    };
    if (settings.semitones !== 0) {
      const moduleSetupStartedAt = performance.now();
      const selected = await createModule();
      const moduleSetupMilliseconds = performance.now() - moduleSetupStartedAt;
      engine = selected.engine;
      result = processSignalsmithOffline(selected.module, settings);
      result.timings.setupMilliseconds += moduleSetupMilliseconds;
    }
    const encodingStartedAt = performance.now();
    const peak = measurePeakChannels(result.channels, trimStart, trimLength);
    const outputGain = calculatePeakProtectionGain(peak);
    const gainReductionDecibels = outputGain < 1 ? -20 * Math.log10(outputGain) : 0;
    const wave = encodeWaveChannels({
      channels: result.channels,
      sampleRate: result.sampleRate,
      startFrame: trimStart,
      frameCount: trimLength,
      gain: outputGain,
    });
    const encodingMilliseconds = performance.now() - encodingStartedAt;

    self.postMessage({
      type: 'complete',
      wave,
      length: trimLength,
      sampleRate: result.sampleRate,
      channelCount: result.channels.length,
      peak,
      outputGain,
      gainReductionDecibels,
      engine,
      diagnostics: result.diagnostics,
      timings: {
        ...result.timings,
        encodingMilliseconds,
      },
    }, [wave]);
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error && error.message ? error.message : 'The audio engine failed.',
    });
  }
});
