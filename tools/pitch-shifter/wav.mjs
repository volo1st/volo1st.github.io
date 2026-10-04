function writeText(view, offset, text) {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
}

function clampSample(sample) {
  return Math.max(-1, Math.min(1, sample));
}

const WAV_PEAK_TARGET = 0.999;

function validateChannels(channels, startFrame, frameCount) {
  if (!Array.isArray(channels) || channels.length < 1 || channels.length > 2) {
    throw new RangeError('WAV encoding requires one or two channels.');
  }
  if (!Number.isInteger(startFrame) || !Number.isInteger(frameCount) || frameCount < 1) {
    throw new RangeError('WAV encoding requires a positive frame range.');
  }
  if (channels.some((channel) => (
    !(channel instanceof Float32Array) || startFrame < 0 || startFrame + frameCount > channel.length
  ))) {
    throw new RangeError('The WAV frame range is outside the channel data.');
  }
}

export function measurePeakChannels(channels, startFrame = 0, frameCount = channels[0]?.length || 0) {
  validateChannels(channels, startFrame, frameCount);
  let peak = 0;
  const endFrame = startFrame + frameCount;
  for (const samples of channels) {
    for (let frame = startFrame; frame < endFrame; frame += 1) {
      peak = Math.max(peak, Math.abs(samples[frame]));
    }
  }
  return peak;
}

export function calculatePeakProtectionGain(peak) {
  if (!Number.isFinite(peak) || peak < 0) {
    throw new RangeError('Peak protection requires a finite, non-negative peak.');
  }
  return peak > 1 ? WAV_PEAK_TARGET / peak : 1;
}

export function encodeWaveChannels({
  channels,
  sampleRate,
  startFrame = 0,
  frameCount = channels[0]?.length || 0,
  gain = 1,
}) {
  validateChannels(channels, startFrame, frameCount);
  if (!Number.isInteger(sampleRate) || sampleRate < 1) {
    throw new RangeError('WAV encoding requires a positive integer sample rate.');
  }
  if (!Number.isFinite(gain) || gain <= 0 || gain > 1) {
    throw new RangeError('WAV encoding gain must be greater than zero and no greater than one.');
  }

  const bytesPerSample = 2;
  const dataSize = frameCount * channels.length * bytesPerSample;
  if (dataSize > 0xffffffff - 44) {
    throw new RangeError('The WAV output is too large for this encoder.');
  }

  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);
  writeText(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeText(view, 8, 'WAVE');
  writeText(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels.length, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels.length * bytesPerSample, true);
  view.setUint16(32, channels.length * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeText(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let frame = startFrame; frame < startFrame + frameCount; frame += 1) {
    for (const samples of channels) {
      const sample = clampSample(samples[frame] * gain);
      const integer = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, Math.round(integer), true);
      offset += bytesPerSample;
    }
  }

  return arrayBuffer;
}
