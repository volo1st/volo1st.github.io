import { processInWorker } from './worker-client.mjs?v=e74edc3ff06a';
import { encodeWaveChannels } from './wav.mjs?v=3ed2e8357b65';
import { LivePreviewController, supportsLivePreview } from './live-preview.mjs?v=2b4216d0208e';

const PREVIEW_SECONDS = 8;
const PREVIEW_PADDING_SECONDS = 0.5;
const MAX_DURATION_SECONDS = 30 * 60;
const MAX_CHANNEL_SAMPLES = 33_554_432;
const MIN_SAMPLE_RATE = 8_000;
const MAX_SAMPLE_RATE = 192_000;

const sharedI18n = globalThis.SiteI18n;
if (!sharedI18n || !globalThis.PitchShifterI18n) {
  throw new Error('The language system did not start.');
}

const elements = {
  file: document.querySelector('#audio-file'),
  fileDetails: document.querySelector('#file-details'),
  status: document.querySelector('#status'),
  sourceRegion: document.querySelector('#source-player-region'),
  sourcePlayer: document.querySelector('#source-player'),
  semitones: document.querySelector('#semitones'),
  pitchDown: document.querySelector('#pitch-down'),
  pitchUp: document.querySelector('#pitch-up'),
  pitchReset: document.querySelector('#pitch-reset'),
  pitchValue: document.querySelector('#pitch-value'),
  liveRegion: document.querySelector('#live-preview-region'),
  livePlay: document.querySelector('#live-play'),
  livePosition: document.querySelector('#live-position'),
  liveTime: document.querySelector('#live-time'),
  renderedPreviewRegion: document.querySelector('#rendered-preview-region'),
  previewStart: document.querySelector('#preview-start'),
  previewTime: document.querySelector('#preview-time'),
  usePlaybackPosition: document.querySelector('#use-playback-position'),
  createPreview: document.querySelector('#create-preview'),
  previewEmpty: document.querySelector('#preview-empty'),
  previewResult: document.querySelector('#preview-result'),
  previewOriginal: document.querySelector('#preview-original'),
  previewShifted: document.querySelector('#preview-shifted'),
  previewMetric: document.querySelector('#preview-metric'),
  processFull: document.querySelector('#process-full'),
  cancel: document.querySelector('#cancel'),
  completeResult: document.querySelector('#complete-result'),
  shiftedPlayer: document.querySelector('#shifted-player'),
  download: document.querySelector('#download'),
  metrics: {
    total: document.querySelector('#metric-total'),
    dsp: document.querySelector('#metric-dsp'),
    setup: document.querySelector('#metric-setup'),
    wave: document.querySelector('#metric-wave'),
    speed: document.querySelector('#metric-speed'),
    engine: document.querySelector('#metric-engine'),
    input: document.querySelector('#metric-input'),
    output: document.querySelector('#metric-output'),
    format: document.querySelector('#metric-format'),
    peak: document.querySelector('#metric-peak'),
  },
};

let selectedFile = null;
let decodedAudio = null;
let operationId = 0;
let activeController = null;
let busy = false;
let liveLoading = false;
let livePreviewAvailable = supportsLivePreview(window);
let livePreview = null;
let livePosition = 0;
let sourceUrl = null;
let previewOriginalUrl = null;
let previewShiftedUrl = null;
let resultUrl = null;
let statusState = { key: 'pitch.statusSelect', parameters: {}, tone: 'normal' };
let fileDetailsState = { key: 'pitch.noFile', parameters: {} };
let previewMetricState = null;
let metricsState = null;

function t(key, parameters = {}) {
  return sharedI18n.translate(key, parameters);
}

function setStatus(key, parameters = {}, tone = 'normal') {
  statusState = { key, parameters, tone };
  elements.status.textContent = t(key, parameters);
  elements.status.dataset.tone = tone;
}

function revokeUrl(url) {
  if (url) URL.revokeObjectURL(url);
}

function replaceUrl(currentUrl, blob) {
  revokeUrl(currentUrl);
  return URL.createObjectURL(blob);
}

function formatBytes(byteCount) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = byteCount;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatClock(seconds) {
  const rounded = Math.max(0, Math.round(seconds));
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const remainingSeconds = rounded % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function formatSeconds(milliseconds) {
  return `${(milliseconds / 1000).toFixed(2)} s`;
}

function formatPeak(peak) {
  if (peak === 0) return '0.0000 (−∞ decibels relative to full scale)';
  const decibels = 20 * Math.log10(peak);
  const prefix = decibels >= 0 ? '+' : '';
  return `${peak.toFixed(4)} (${prefix}${decibels.toFixed(2)} decibels relative to full scale)`;
}

function parseSemitoneValue() {
  if (elements.semitones.value.trim() === '') return null;
  const value = Number(elements.semitones.value);
  return Number.isInteger(value) && value >= -12 && value <= 12 ? value : null;
}

function renderPitchValue() {
  const value = parseSemitoneValue();
  if (value === null) {
    elements.pitchValue.textContent = t('pitch.errorShift');
    return;
  }
  elements.pitchValue.textContent = value === 0
    ? t('pitch.originalPitch')
    : t('pitch.shiftValue', { value: value > 0 ? `+${value}` : value });
}

function renderLivePosition() {
  const duration = decodedAudio?.duration || 0;
  elements.livePosition.value = String(Math.min(duration, livePosition));
  elements.liveTime.value = `${formatClock(livePosition)} / ${formatClock(duration)}`;
}

function renderLiveButton() {
  const playing = Boolean(livePreview?.playing);
  elements.livePlay.textContent = t(playing ? 'pitch.livePause' : 'pitch.livePlay');
  elements.livePlay.setAttribute('aria-pressed', String(playing));
}

function renderFileDetails() {
  elements.fileDetails.textContent = t(fileDetailsState.key, fileDetailsState.parameters);
}

function renderPreviewMetric() {
  if (!previewMetricState) return;
  elements.previewMetric.textContent = t('pitch.previewMetric', previewMetricState);
}

function renderMetrics() {
  if (!metricsState) return;
  const { result, inputDuration } = metricsState;
  const outputDuration = result.length / result.sampleRate;
  const speed = inputDuration / (result.timings.totalMilliseconds / 1000);
  elements.metrics.total.textContent = formatSeconds(result.timings.totalMilliseconds);
  elements.metrics.dsp.textContent = formatSeconds(result.timings.dspMilliseconds);
  elements.metrics.setup.textContent = formatSeconds(result.timings.setupMilliseconds);
  elements.metrics.wave.textContent = formatSeconds(result.timings.encodingMilliseconds);
  elements.metrics.speed.textContent = Number.isFinite(speed)
    ? t('pitch.speedValue', { value: speed.toFixed(2) })
    : '—';
  const engineKey = result.engine === 'bypass'
    ? 'pitch.engineBypass'
    : (result.engine === 'simd' ? 'pitch.engineSimd' : 'pitch.engineScalar');
  elements.metrics.engine.textContent = t(engineKey);
  elements.metrics.input.textContent = `${inputDuration.toFixed(3)} s`;
  elements.metrics.output.textContent = `${outputDuration.toFixed(3)} s`;
  elements.metrics.format.textContent = t(
    result.channelCount === 1 ? 'pitch.formatMono' : 'pitch.formatStereo',
    { rate: result.sampleRate.toLocaleString(sharedI18n.getLanguage()) },
  );
  elements.metrics.peak.textContent = formatPeak(result.peak);
}

function renderDynamicText() {
  elements.status.textContent = t(statusState.key, statusState.parameters);
  renderFileDetails();
  renderPitchValue();
  renderLiveButton();
  renderLivePosition();
  renderPreviewMetric();
  renderMetrics();
}

function clearAudioElement(player) {
  player.pause();
  player.removeAttribute('src');
  player.load();
}

function clearPreview() {
  revokeUrl(previewOriginalUrl);
  revokeUrl(previewShiftedUrl);
  previewOriginalUrl = null;
  previewShiftedUrl = null;
  clearAudioElement(elements.previewOriginal);
  clearAudioElement(elements.previewShifted);
  elements.previewResult.hidden = true;
  elements.previewEmpty.hidden = false;
  elements.previewMetric.textContent = '';
  previewMetricState = null;
}

function clearResult() {
  revokeUrl(resultUrl);
  resultUrl = null;
  clearAudioElement(elements.shiftedPlayer);
  elements.download.removeAttribute('href');
  elements.download.removeAttribute('download');
  elements.completeResult.hidden = true;
  metricsState = null;
  Object.values(elements.metrics).forEach((element) => {
    element.textContent = '—';
  });
}

function clearDerivedResults() {
  clearPreview();
  clearResult();
}

async function releaseLivePreview({ resetPosition = false } = {}) {
  const controller = livePreview;
  livePreview = null;
  if (resetPosition) livePosition = 0;
  renderLiveButton();
  renderLivePosition();
  if (controller) await controller.release();
}

function createLivePreview() {
  if (!decodedAudio || !livePreviewAvailable) return null;
  livePreview = new LivePreviewController(decodedAudio, {
    onTime(position) {
      livePosition = position;
      renderLivePosition();
    },
    onEnded() {
      renderLiveButton();
      setStatus('pitch.statusReady');
      updateControls();
    },
  });
  return livePreview;
}

async function useRenderedPreviewFallback() {
  await releaseLivePreview();
  livePreviewAvailable = false;
  elements.liveRegion.hidden = true;
  elements.renderedPreviewRegion.hidden = false;
  setStatus('pitch.statusLiveUnavailable', {}, 'warning');
  updateControls();
}

function updateControls() {
  const ready = Boolean(decodedAudio);
  const shiftIsValid = parseSemitoneValue() !== null;
  const controlsBusy = busy || liveLoading;
  elements.semitones.disabled = !ready || controlsBusy;
  elements.pitchDown.disabled = !ready || controlsBusy;
  elements.pitchUp.disabled = !ready || controlsBusy;
  elements.pitchReset.disabled = !ready || controlsBusy;
  elements.livePlay.disabled = !ready || controlsBusy || !shiftIsValid || !livePreviewAvailable;
  elements.livePosition.disabled = !ready || controlsBusy || !livePreviewAvailable;
  elements.previewStart.disabled = !ready || controlsBusy || !decodedAudio
    || decodedAudio.duration <= PREVIEW_SECONDS || livePreviewAvailable;
  elements.usePlaybackPosition.disabled = !ready || controlsBusy || livePreviewAvailable;
  elements.createPreview.disabled = !ready || controlsBusy || !shiftIsValid || livePreviewAvailable;
  elements.processFull.disabled = !ready || controlsBusy || !shiftIsValid;
  elements.cancel.disabled = !busy || !activeController;
}

function setBusy(value) {
  busy = value;
  updateControls();
}

function readSemitones() {
  const value = parseSemitoneValue();
  if (value === null) {
    throw new RangeError(t('pitch.errorShift'));
  }
  return value;
}

function updateLivePitch(value) {
  if (!livePreview || value === null) return;
  livePreview.setSemitones(value).catch(() => {
    useRenderedPreviewFallback();
  });
}

function setSemitones(value) {
  const number = Number(value);
  elements.semitones.value = String(Math.max(-12, Math.min(12, Number.isFinite(number) ? number : 0)));
  clearDerivedResults();
  renderPitchValue();
  const semitones = parseSemitoneValue();
  updateLivePitch(semitones);
  if (decodedAudio) {
    setStatus(livePreview?.playing ? 'pitch.statusLivePlaying' : 'pitch.statusReady');
  }
  updateControls();
}

function createAudioBuffer(channelCount, length, sampleRate) {
  return new AudioBuffer({ numberOfChannels: channelCount, length, sampleRate });
}

function copyAudioRange(source, startFrame, frameCount) {
  const output = createAudioBuffer(source.numberOfChannels, frameCount, source.sampleRate);
  for (let channel = 0; channel < source.numberOfChannels; channel += 1) {
    output.copyToChannel(
      source.getChannelData(channel).subarray(startFrame, startFrame + frameCount),
      channel,
    );
  }
  return output;
}

function waveFromAudioBuffer(audioBuffer) {
  const channels = Array.from(
    { length: audioBuffer.numberOfChannels },
    (_, channel) => audioBuffer.getChannelData(channel),
  );
  return new Blob([encodeWaveChannels({
    channels,
    sampleRate: audioBuffer.sampleRate,
  })], { type: 'audio/wav' });
}

function createPreviewExcerpt(source, startSeconds) {
  const centralStart = Math.min(
    Math.round(startSeconds * source.sampleRate),
    Math.max(0, source.length - 1),
  );
  const centralLength = Math.min(
    Math.round(PREVIEW_SECONDS * source.sampleRate),
    source.length - centralStart,
  );
  const padding = Math.round(PREVIEW_PADDING_SECONDS * source.sampleRate);
  const contextStart = Math.max(0, centralStart - padding);
  const contextEnd = Math.min(source.length, centralStart + centralLength + padding);
  return {
    input: copyAudioRange(source, contextStart, contextEnd - contextStart),
    original: copyAudioRange(source, centralStart, centralLength),
    trimStart: centralStart - contextStart,
    trimLength: centralLength,
  };
}

function findSuggestedPreviewStart(source) {
  if (source.duration <= PREVIEW_SECONDS) return 0;
  const windowFrames = Math.round(PREVIEW_SECONDS * source.sampleRate);
  const hopFrames = Math.round(2 * source.sampleRate);
  const sampleStride = Math.max(1, Math.round(source.sampleRate / 200));
  let bestStart = 0;
  let bestEnergy = -1;

  for (let start = 0; start + windowFrames <= source.length; start += hopFrames) {
    let energy = 0;
    let sampleCount = 0;
    for (let frame = start; frame < start + windowFrames; frame += sampleStride) {
      for (let channel = 0; channel < source.numberOfChannels; channel += 1) {
        const sample = source.getChannelData(channel)[frame];
        energy += sample * sample;
        sampleCount += 1;
      }
    }
    const meanEnergy = energy / sampleCount;
    if (meanEnergy > bestEnergy) {
      bestEnergy = meanEnergy;
      bestStart = start;
    }
  }
  return bestStart / source.sampleRate;
}

async function decodeFile(file) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error(t('pitch.errorAudioApi'));
  const context = new AudioContextClass();
  try {
    return await context.decodeAudioData(await file.arrayBuffer());
  } catch (error) {
    throw new Error(t('pitch.errorDecode'));
  } finally {
    await context.close();
  }
}

function validateDecodedAudio(audioBuffer) {
  if (audioBuffer.numberOfChannels < 1 || audioBuffer.numberOfChannels > 2) {
    throw new Error(t('pitch.errorChannels', { count: audioBuffer.numberOfChannels }));
  }
  if (!Number.isFinite(audioBuffer.duration) || audioBuffer.duration <= 0) {
    throw new Error(t('pitch.errorDecode'));
  }
  if (audioBuffer.duration > MAX_DURATION_SECONDS) {
    throw new Error(t('pitch.errorDuration'));
  }
  if (audioBuffer.length * audioBuffer.numberOfChannels > MAX_CHANNEL_SAMPLES) {
    throw new Error(t('pitch.errorMemory'));
  }
  if (audioBuffer.sampleRate < MIN_SAMPLE_RATE || audioBuffer.sampleRate > MAX_SAMPLE_RATE) {
    throw new Error(t('pitch.errorSampleRate'));
  }
}

function safeOutputName(filename, semitones) {
  const base = filename.replace(/\.[^.]+$/, '').replace(/[. ]+$/, '') || 'shifted-audio';
  const shift = semitones === 0
    ? 'original-pitch'
    : `${semitones > 0 ? 'plus' : 'minus'}-${Math.abs(semitones)}`;
  return `${base}-shifted-${shift}.wav`;
}

function stopActiveOperation() {
  activeController?.abort();
  activeController = null;
  operationId += 1;
  setBusy(false);
}

elements.file.addEventListener('change', async () => {
  stopActiveOperation();
  liveLoading = false;
  const currentOperation = operationId;
  selectedFile = elements.file.files[0] || null;
  decodedAudio = null;
  clearDerivedResults();
  await releaseLivePreview({ resetPosition: true });
  if (currentOperation !== operationId) return;
  revokeUrl(sourceUrl);
  sourceUrl = null;
  clearAudioElement(elements.sourcePlayer);
  elements.sourceRegion.hidden = true;

  if (!selectedFile) {
    fileDetailsState = { key: 'pitch.noFile', parameters: {} };
    renderFileDetails();
    setStatus('pitch.statusSelect');
    updateControls();
    return;
  }

  fileDetailsState = {
    key: 'pitch.fileDetails',
    parameters: {
      filename: selectedFile.name,
      size: formatBytes(selectedFile.size),
      duration: '—',
      channels: '—',
      rate: '—',
    },
  };
  renderFileDetails();
  setStatus('pitch.statusDecoding', { filename: selectedFile.name });
  setBusy(true);

  try {
    const audioBuffer = await decodeFile(selectedFile);
    if (currentOperation !== operationId) return;
    validateDecodedAudio(audioBuffer);
    decodedAudio = audioBuffer;
    sourceUrl = URL.createObjectURL(selectedFile);
    elements.sourcePlayer.src = sourceUrl;
    elements.sourceRegion.hidden = false;
    livePosition = 0;
    elements.livePosition.max = String(audioBuffer.duration);
    renderLivePosition();
    elements.liveRegion.hidden = !livePreviewAvailable;
    elements.renderedPreviewRegion.hidden = livePreviewAvailable;
    const maximumStart = Math.max(0, audioBuffer.duration - PREVIEW_SECONDS);
    elements.previewStart.max = String(maximumStart);
    elements.previewStart.value = String(Math.min(
      maximumStart,
      findSuggestedPreviewStart(audioBuffer),
    ));
    elements.previewTime.value = formatClock(Number(elements.previewStart.value));
    fileDetailsState = {
      key: 'pitch.fileDetails',
      parameters: {
        filename: selectedFile.name,
        size: formatBytes(selectedFile.size),
        duration: formatClock(audioBuffer.duration),
        channels: t(audioBuffer.numberOfChannels === 1 ? 'pitch.mono' : 'pitch.stereo'),
        rate: audioBuffer.sampleRate.toLocaleString(sharedI18n.getLanguage()),
      },
    };
    renderFileDetails();
    setStatus(livePreviewAvailable ? 'pitch.statusReady' : 'pitch.statusLiveUnavailable', {}, livePreviewAvailable ? 'normal' : 'warning');
  } catch (error) {
    if (currentOperation !== operationId) return;
    decodedAudio = null;
    fileDetailsState = {
      key: 'pitch.fileDetails',
      parameters: {
        filename: selectedFile.name,
        size: formatBytes(selectedFile.size),
        duration: '—',
        channels: '—',
        rate: '—',
      },
    };
    renderFileDetails();
    setStatus('pitch.errorProcessing', { detail: error.message }, 'error');
  } finally {
    if (currentOperation === operationId) setBusy(false);
  }
});

elements.semitones.addEventListener('input', () => {
  clearDerivedResults();
  renderPitchValue();
  const value = parseSemitoneValue();
  if (value !== null) {
    updateLivePitch(value);
    setStatus(livePreview?.playing ? 'pitch.statusLivePlaying' : 'pitch.statusReady');
  }
  updateControls();
});
elements.semitones.addEventListener('change', () => {
  try {
    readSemitones();
  } catch (error) {
    setStatus('pitch.errorShift', {}, 'error');
  }
});
elements.pitchDown.addEventListener('click', () => setSemitones(Number(elements.semitones.value) - 1));
elements.pitchUp.addEventListener('click', () => setSemitones(Number(elements.semitones.value) + 1));
elements.pitchReset.addEventListener('click', () => setSemitones(0));

elements.livePlay.addEventListener('click', async () => {
  if (!decodedAudio || busy || liveLoading || !livePreviewAvailable) return;
  const currentOperation = operationId;
  const controller = livePreview || createLivePreview();
  if (!controller) return;

  liveLoading = true;
  updateControls();
  try {
    if (controller.playing) {
      await controller.pause();
      if (currentOperation !== operationId) return;
      setStatus('pitch.statusLivePaused');
    } else {
      document.querySelectorAll('audio').forEach((player) => player.pause());
      setStatus('pitch.statusLivePreparing');
      await controller.play(livePosition, readSemitones());
      if (currentOperation !== operationId) {
        await controller.release();
        return;
      }
      setStatus('pitch.statusLivePlaying');
    }
    renderLiveButton();
  } catch (error) {
    if (currentOperation === operationId) await useRenderedPreviewFallback();
  } finally {
    if (currentOperation === operationId) {
      liveLoading = false;
      updateControls();
    }
  }
});

elements.livePosition.addEventListener('input', () => {
  livePosition = Number(elements.livePosition.value);
  renderLivePosition();
});

elements.livePosition.addEventListener('change', async () => {
  if (!decodedAudio || !livePreview) return;
  try {
    await livePreview.seek(livePosition, readSemitones());
  } catch (error) {
    await useRenderedPreviewFallback();
  }
});

elements.previewStart.addEventListener('input', () => {
  elements.previewTime.value = formatClock(Number(elements.previewStart.value));
  clearPreview();
});

elements.usePlaybackPosition.addEventListener('click', () => {
  if (!decodedAudio) return;
  const maximumStart = Math.max(0, decodedAudio.duration - PREVIEW_SECONDS);
  elements.previewStart.value = String(Math.min(maximumStart, elements.sourcePlayer.currentTime));
  elements.previewTime.value = formatClock(Number(elements.previewStart.value));
  clearPreview();
});

elements.createPreview.addEventListener('click', async () => {
  if (!decodedAudio || busy || liveLoading) return;
  let semitones;
  try {
    semitones = readSemitones();
  } catch (error) {
    setStatus('pitch.errorShift', {}, 'error');
    return;
  }

  const currentOperation = operationId + 1;
  operationId = currentOperation;
  activeController = new AbortController();
  clearPreview();
  setBusy(true);
  setStatus('pitch.statusPreview');
  const excerpt = createPreviewExcerpt(decodedAudio, Number(elements.previewStart.value));

  try {
    const result = await processInWorker(excerpt.input, {
      semitones,
      trimStart: excerpt.trimStart,
      trimLength: excerpt.trimLength,
    }, activeController.signal);
    if (currentOperation !== operationId) return;
    previewOriginalUrl = replaceUrl(previewOriginalUrl, waveFromAudioBuffer(excerpt.original));
    previewShiftedUrl = replaceUrl(previewShiftedUrl, result.wave);
    elements.previewOriginal.src = previewOriginalUrl;
    elements.previewShifted.src = previewShiftedUrl;
    const processedSeconds = excerpt.input.duration;
    const estimatedSeconds = result.timings.totalMilliseconds / 1000
      / processedSeconds * decodedAudio.duration;
    previewMetricState = {
      time: formatSeconds(result.timings.totalMilliseconds),
      estimate: `${formatClock(estimatedSeconds * 0.9)}–${formatClock(estimatedSeconds * 1.25)}`,
    };
    renderPreviewMetric();
    elements.previewEmpty.hidden = true;
    elements.previewResult.hidden = false;
    setStatus(result.peak > 1 ? 'pitch.statusClipPreview' : 'pitch.statusPreviewReady', {}, result.peak > 1 ? 'warning' : 'normal');
  } catch (error) {
    if (currentOperation === operationId && error.name !== 'AbortError') {
      setStatus('pitch.errorProcessing', { detail: error.message }, 'error');
    }
  } finally {
    if (currentOperation === operationId) {
      activeController = null;
      setBusy(false);
    }
  }
});

elements.processFull.addEventListener('click', async () => {
  if (!decodedAudio || !selectedFile || busy || liveLoading) return;
  let semitones;
  try {
    semitones = readSemitones();
  } catch (error) {
    setStatus('pitch.errorShift', {}, 'error');
    return;
  }

  const currentOperation = operationId + 1;
  operationId = currentOperation;
  activeController = new AbortController();
  clearResult();
  setBusy(true);
  setStatus('pitch.statusProcessing');
  document.querySelectorAll('audio').forEach((player) => player.pause());

  try {
    await releaseLivePreview();
    if (currentOperation !== operationId) return;
    const result = await processInWorker(decodedAudio, { semitones }, activeController.signal);
    if (currentOperation !== operationId) return;
    resultUrl = replaceUrl(resultUrl, result.wave);
    elements.shiftedPlayer.src = resultUrl;
    elements.download.href = resultUrl;
    elements.download.download = safeOutputName(selectedFile.name, semitones);
    elements.completeResult.hidden = false;
    metricsState = { result, inputDuration: decodedAudio.duration };
    renderMetrics();
    setStatus(result.peak > 1 ? 'pitch.statusClipResult' : 'pitch.statusComplete', {}, result.peak > 1 ? 'warning' : 'normal');
  } catch (error) {
    if (currentOperation === operationId && error.name !== 'AbortError') {
      clearResult();
      setStatus('pitch.errorProcessing', { detail: error.message }, 'error');
    }
  } finally {
    if (currentOperation === operationId) {
      activeController = null;
      setBusy(false);
    }
  }
});

elements.cancel.addEventListener('click', () => {
  if (!activeController) return;
  activeController.abort();
  activeController = null;
  operationId += 1;
  clearDerivedResults();
  setBusy(false);
  setStatus('pitch.statusCancelled');
});

document.querySelectorAll('audio').forEach((player) => {
  player.addEventListener('play', () => {
    if (livePreview?.playing) {
      livePreview.pause().then(() => {
        renderLiveButton();
        setStatus('pitch.statusLivePaused');
        updateControls();
      }).catch(() => {
        useRenderedPreviewFallback();
      });
    }
    document.querySelectorAll('audio').forEach((otherPlayer) => {
      if (otherPlayer !== player) otherPlayer.pause();
    });
  });
});

window.addEventListener('site-language-change', () => {
  if (decodedAudio && fileDetailsState.key === 'pitch.fileDetails') {
    fileDetailsState.parameters.channels = t(
      decodedAudio.numberOfChannels === 1 ? 'pitch.mono' : 'pitch.stereo',
    );
    fileDetailsState.parameters.rate = decodedAudio.sampleRate.toLocaleString(
      sharedI18n.getLanguage(),
    );
  }
  renderDynamicText();
});

window.addEventListener('beforeunload', () => {
  activeController?.abort();
  livePreview?.release();
  [sourceUrl, previewOriginalUrl, previewShiftedUrl, resultUrl].forEach(revokeUrl);
});

elements.liveRegion.hidden = !livePreviewAvailable;
elements.renderedPreviewRegion.hidden = livePreviewAvailable;
renderPitchValue();
renderLiveButton();
renderLivePosition();
updateControls();
