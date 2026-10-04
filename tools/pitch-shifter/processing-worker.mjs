import ScalarModule from './vendor/signalsmith-stretch/SignalsmithStretchScalar.mjs?v=7349f115b3d6';
import SimdModule from './vendor/signalsmith-stretch/SignalsmithStretchSimd.mjs?v=d8556ea43ff1';
import { processSignalsmithOffline } from './audio-processing.mjs?v=d8fb3d144753';
import {
  encodeWaveChannels,
  measureWaveRange,
} from './wav.mjs?v=e786a45957bd';

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
    const outputFormat = settings.outputFormat || 'wav';
    if (outputFormat !== 'wav' && outputFormat !== 'mp3') {
      throw new RangeError('The output format must be WAV or MP3.');
    }
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
    const range = measureWaveRange(result.channels, trimStart, trimLength);
    let file;
    let mimeType;
    let outputSampleRate = result.sampleRate;
    let bitrateKilobits = null;
    if (outputFormat === 'mp3') {
      const { encodeMp3Channels } = await import('./mp3.mjs?v=7528b6927b55');
      const mp3 = await encodeMp3Channels({
        channels: result.channels,
        sampleRate: result.sampleRate,
        startFrame: trimStart,
        frameCount: trimLength,
      });
      file = mp3.buffer;
      mimeType = 'audio/mpeg';
      outputSampleRate = mp3.outputSampleRate;
      bitrateKilobits = mp3.bitrateKilobits;
    } else {
      file = encodeWaveChannels({
        channels: result.channels,
        sampleRate: result.sampleRate,
        startFrame: trimStart,
        frameCount: trimLength,
      });
      mimeType = 'audio/wav';
    }
    const encodingMilliseconds = performance.now() - encodingStartedAt;

    self.postMessage({
      type: 'complete',
      file,
      mimeType,
      outputFormat,
      outputSampleRate,
      bitrateKilobits,
      length: trimLength,
      sampleRate: result.sampleRate,
      channelCount: result.channels.length,
      ...range,
      engine,
      diagnostics: result.diagnostics,
      timings: {
        ...result.timings,
        encodingMilliseconds,
      },
    }, [file]);
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error && error.message ? error.message : 'The audio engine failed.',
    });
  }
});
