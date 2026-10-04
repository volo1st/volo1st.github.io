const MP3_BITRATE_KILOBITS = 320;
const DEFAULT_CHUNK_SIZE = 65_536;
const ENCODER_SCRIPT = './vendor/wasm-media-encoders/WasmMediaEncoder.min.js?v=dd4e17abf537';
const ENCODER_WASM = './vendor/wasm-media-encoders/mp3.wasm?v=85e81719250b';

let encoderFactoryPromise = null;
let wasmBytesPromise = null;

function validateChannels(channels, sampleRate, startFrame, frameCount) {
  if (!Array.isArray(channels) || channels.length < 1 || channels.length > 2) {
    throw new RangeError('MP3 encoding requires one or two channels.');
  }
  if (channels.some((channel) => !(channel instanceof Float32Array))) {
    throw new TypeError('Each MP3 input channel must use 32-bit floating-point samples.');
  }
  if (!Number.isFinite(sampleRate) || sampleRate < 8_000 || sampleRate > 192_000) {
    throw new RangeError('The MP3 input sample rate must be from 8 kHz through 192 kHz.');
  }
  if (!Number.isInteger(startFrame) || startFrame < 0) {
    throw new RangeError('The MP3 start frame must be a non-negative integer.');
  }
  if (!Number.isInteger(frameCount) || frameCount < 1) {
    throw new RangeError('The MP3 frame count must be a positive integer.');
  }
  if (channels.some((channel) => startFrame + frameCount > channel.length)) {
    throw new RangeError('The MP3 frame range exceeds an input channel.');
  }
}

export function selectMp3SampleRate(inputSampleRate) {
  if (inputSampleRate < 38_050) return 32_000;
  if (inputSampleRate < 46_050) return 44_100;
  return 48_000;
}

async function loadEncoderFactory() {
  if (!encoderFactoryPromise) {
    encoderFactoryPromise = import(ENCODER_SCRIPT).then((module) => {
      const api = globalThis.WasmMediaEncoder || module.default || module;
      const factory = api.createEncoder;
      if (typeof factory !== 'function') {
        throw new Error('The local MP3 encoder script did not start.');
      }
      return factory;
    });
  }
  return encoderFactoryPromise;
}

async function loadWasmBytes() {
  if (!wasmBytesPromise) {
    const wasmUrl = new URL(ENCODER_WASM, import.meta.url);
    wasmBytesPromise = fetch(wasmUrl).then(async (response) => {
      if (!response.ok) {
        throw new Error(`The local MP3 encoder module returned HTTP ${response.status}.`);
      }
      return response.arrayBuffer();
    });
  }
  return wasmBytesPromise;
}

function clampSample(sample) {
  return Math.max(-1, Math.min(1, sample));
}

export async function encodeMp3Channels({
  channels,
  sampleRate,
  startFrame = 0,
  frameCount = channels[0]?.length ?? 0,
  chunkSize = DEFAULT_CHUNK_SIZE,
}) {
  validateChannels(channels, sampleRate, startFrame, frameCount);
  if (!Number.isInteger(chunkSize) || chunkSize < 1) {
    throw new RangeError('The MP3 chunk size must be a positive integer.');
  }

  const [createEncoder, wasmBytes] = await Promise.all([
    loadEncoderFactory(),
    loadWasmBytes(),
  ]);
  const outputSampleRate = selectMp3SampleRate(sampleRate);
  const encoder = await createEncoder('audio/mpeg', wasmBytes);
  encoder.configure({
    channels: channels.length,
    sampleRate,
    outputSampleRate,
    bitrate: MP3_BITRATE_KILOBITS,
  });

  const chunks = [];
  let byteLength = 0;
  const endFrame = startFrame + frameCount;
  for (let offset = startFrame; offset < endFrame; offset += chunkSize) {
    const currentFrameCount = Math.min(chunkSize, endFrame - offset);
    const input = channels.map((channel) => {
      const copy = new Float32Array(currentFrameCount);
      for (let frame = 0; frame < currentFrameCount; frame += 1) {
        copy[frame] = clampSample(channel[offset + frame]);
      }
      return copy;
    });
    const chunk = encoder.encode(input).slice();
    chunks.push(chunk);
    byteLength += chunk.byteLength;
  }

  const finalChunk = encoder.finalize().slice();
  chunks.push(finalChunk);
  byteLength += finalChunk.byteLength;

  const output = new Uint8Array(byteLength);
  let outputOffset = 0;
  for (const chunk of chunks) {
    output.set(chunk, outputOffset);
    outputOffset += chunk.byteLength;
  }

  return {
    buffer: output.buffer,
    bitrateKilobits: MP3_BITRATE_KILOBITS,
    outputSampleRate,
  };
}
