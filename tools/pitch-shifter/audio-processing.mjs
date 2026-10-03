const DEFAULT_CHUNK_SIZE = 65_536;

function now() {
  return globalThis.performance ? globalThis.performance.now() : Date.now();
}

function getMemory(module) {
  return module.exports ? module.exports.memory.buffer : module.HEAP8.buffer;
}

function createViews(module, pointer, channelCount, capacity) {
  const memory = getMemory(module);
  const channelBytes = capacity * Float32Array.BYTES_PER_ELEMENT;
  const inputs = [];
  const outputs = [];

  for (let channel = 0; channel < channelCount; channel += 1) {
    inputs.push(new Float32Array(memory, pointer + channelBytes * channel, capacity));
    outputs.push(new Float32Array(
      memory,
      pointer + channelBytes * (channel + channelCount),
      capacity,
    ));
  }

  return { inputs, outputs };
}

function copyOutput(module, pointer, channelCount, capacity, sourceOffset, frameCount, target) {
  const sourceEnd = sourceOffset + frameCount;
  const targetStart = Math.max(0, sourceOffset);
  const targetEnd = Math.min(target[0].length, sourceEnd);
  if (targetEnd <= targetStart) return;

  const sourceStart = targetStart - sourceOffset;
  const copyLength = targetEnd - targetStart;
  const { outputs } = createViews(module, pointer, channelCount, capacity);
  outputs.forEach((output, channel) => {
    target[channel].set(output.subarray(sourceStart, sourceStart + copyLength), targetStart);
  });
}

function validateInput(channels, length, sampleRate, semitones) {
  if (!Array.isArray(channels) || channels.length < 1 || channels.length > 2) {
    throw new RangeError('Signalsmith processing requires one or two channels.');
  }
  if (!Number.isInteger(length) || length < 1) {
    throw new RangeError('Signalsmith processing requires a positive frame count.');
  }
  if (channels.some((channel) => !(channel instanceof Float32Array) || channel.length !== length)) {
    throw new RangeError('Each input channel must contain the declared frame count.');
  }
  if (!Number.isFinite(sampleRate) || sampleRate < 8_000 || sampleRate > 192_000) {
    throw new RangeError('The sample rate must be from 8 kHz through 192 kHz.');
  }
  if (!Number.isInteger(semitones) || semitones < -12 || semitones > 12) {
    throw new RangeError('The pitch shift must be a whole number from -12 through +12.');
  }
}

export function processSignalsmithOffline(module, {
  channels,
  length,
  sampleRate,
  semitones,
  chunkSize = DEFAULT_CHUNK_SIZE,
}) {
  validateInput(channels, length, sampleRate, semitones);
  const setupStartedAt = now();
  module._main();
  module._presetCheaper(channels.length, sampleRate);
  module._setTransposeSemitones(semitones, 8_000 / sampleRate);
  module._setFormantSemitones(0, false);
  module._setFormantBase(0);

  const inputLatency = module._inputLatency();
  const outputLatency = module._outputLatency();
  const capacity = Math.max(chunkSize, inputLatency, outputLatency);
  const pointer = module._setBuffers(channels.length, capacity);
  const outputChannels = channels.map(() => new Float32Array(length));
  const setupMilliseconds = now() - setupStartedAt;
  const processingStartedAt = now();

  let views = createViews(module, pointer, channels.length, capacity);
  views.inputs.forEach((input, channel) => {
    input.fill(0, 0, inputLatency);
    input.set(channels[channel].subarray(0, Math.min(length, inputLatency)));
  });
  module._seek(inputLatency, 1);

  let inputPosition = inputLatency;
  let processedFrames = 0;
  while (processedFrames < length) {
    const frameCount = Math.min(chunkSize, length - processedFrames);
    views = createViews(module, pointer, channels.length, capacity);
    views.inputs.forEach((input, channel) => {
      const available = Math.max(0, Math.min(frameCount, length - inputPosition));
      if (available > 0) {
        input.set(channels[channel].subarray(inputPosition, inputPosition + available), 0);
      }
      if (available < frameCount) input.fill(0, available, frameCount);
    });

    module._process(frameCount, frameCount);
    copyOutput(
      module,
      pointer,
      channels.length,
      capacity,
      processedFrames - outputLatency,
      frameCount,
      outputChannels,
    );
    inputPosition += frameCount;
    processedFrames += frameCount;
  }

  module._flush(outputLatency);
  copyOutput(
    module,
    pointer,
    channels.length,
    capacity,
    length - outputLatency,
    outputLatency,
    outputChannels,
  );

  return {
    channels: outputChannels,
    length,
    sampleRate,
    diagnostics: { chunkSize, inputLatency, outputLatency, preset: 'cheaper' },
    timings: {
      setupMilliseconds,
      processingMilliseconds: now() - processingStartedAt,
    },
  };
}
