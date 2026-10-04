import { processInWorker } from './worker-client.mjs?v=82c1073e3bb6';
import { LivePreviewController, supportsLivePreview } from './live-preview.mjs?v=6db69ba51288';

const MAX_DURATION_SECONDS = 30 * 60;
const MAX_CHANNEL_SAMPLES = 33_554_432;
const MIN_SAMPLE_RATE = 8_000;
const MAX_SAMPLE_RATE = 192_000;
const PROCESSING_PRESET = 'default';

const sharedI18n = globalThis.SiteI18n;
if (!sharedI18n || !globalThis.PitchShifterI18n) {
  throw new Error('The language system did not start.');
}

const elements = {
  workspace: document.querySelector('#workspace'),
  file: document.querySelector('#audio-file'),
  chooseFile: document.querySelector('#choose-file'),
  fileName: document.querySelector('#file-name'),
  fileMetadata: document.querySelector('#file-metadata'),
  status: document.querySelector('#status'),
  dropOverlay: document.querySelector('#drop-overlay'),
  semitones: document.querySelector('#semitones'),
  pitchDown: document.querySelector('#pitch-down'),
  pitchUp: document.querySelector('#pitch-up'),
  pitchReset: document.querySelector('#pitch-reset'),
  pitchValue: document.querySelector('#pitch-value'),
  transportPlay: document.querySelector('#transport-play'),
  transportPosition: document.querySelector('#transport-position'),
  transportCurrent: document.querySelector('#transport-current'),
  transportDuration: document.querySelector('#transport-duration'),
  prepareWave: document.querySelector('#prepare-wave'),
  sourcePlayer: document.querySelector('#source-player'),
  shiftedPlayer: document.querySelector('#shifted-player'),
  download: document.querySelector('#download'),
  metricsContainer: document.querySelector('#metrics'),
  metricsEmpty: document.querySelector('#metrics-empty'),
  metrics: {
    total: document.querySelector('#metric-total'),
    dsp: document.querySelector('#metric-dsp'),
    setup: document.querySelector('#metric-setup'),
    wave: document.querySelector('#metric-wave'),
    speed: document.querySelector('#metric-speed'),
    engine: document.querySelector('#metric-engine'),
    preset: document.querySelector('#metric-preset'),
    input: document.querySelector('#metric-input'),
    output: document.querySelector('#metric-output'),
    format: document.querySelector('#metric-format'),
    peak: document.querySelector('#metric-peak'),
  },
};

let selectedFile = null;
let decodedAudio = null;
let operationId = 0;
let playbackId = 0;
let activeController = null;
let busy = false;
let liveLoading = false;
let livePreviewAvailable = supportsLivePreview(window);
let livePreview = null;
let playbackSemitones = 0;
let transportPosition = 0;
let pointerScrubbing = false;
let sourceUrl = null;
let resultUrl = null;
let statusState = {
  key: 'pitch.statusSelect',
  parameters: {},
  tone: 'normal',
  visible: false,
};
let fileDetailsState = {
  name: null,
  nameKey: 'pitch.noFile',
  metadataKey: null,
  parameters: {},
};
let metricsState = null;
let dragDepth = 0;

function t(key, parameters = {}) {
  return sharedI18n.translate(key, parameters);
}

function setStatus(key, parameters = {}, tone = 'normal', visible = tone !== 'normal') {
  statusState = { key, parameters, tone, visible };
  elements.status.textContent = t(key, parameters);
  elements.status.dataset.tone = tone;
  elements.status.dataset.visible = String(visible);
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

function readSemitones() {
  const value = parseSemitoneValue();
  if (value === null) throw new RangeError(t('pitch.errorShift'));
  return value;
}

function renderPitchValue() {
  const value = parseSemitoneValue();
  if (value === null) {
    elements.pitchValue.textContent = t('pitch.errorShift');
    return;
  }
  const displayValue = value > 0 ? `+${value}` : String(value);
  elements.pitchValue.textContent = value === 0
    ? t('pitch.originalPitch')
    : t('pitch.shiftValue', { value: displayValue });
}

function renderFileDetails() {
  elements.fileName.textContent = fileDetailsState.name
    || t(fileDetailsState.nameKey, fileDetailsState.parameters);
  elements.fileMetadata.hidden = !fileDetailsState.metadataKey;
  elements.fileMetadata.textContent = fileDetailsState.metadataKey
    ? t(fileDetailsState.metadataKey, fileDetailsState.parameters)
    : '';
}

function renderTransportPosition() {
  const duration = decodedAudio?.duration || 0;
  const position = Math.max(0, Math.min(duration, transportPosition));
  elements.transportPosition.max = String(duration);
  elements.transportPosition.value = String(position);
  const currentText = formatClock(position);
  const durationText = formatClock(duration);
  const positionText = `${currentText} / ${durationText}`;
  elements.transportCurrent.textContent = currentText;
  elements.transportDuration.textContent = durationText;
  const progress = duration > 0 ? position / duration * 100 : 0;
  elements.transportPosition.style.setProperty('--transport-progress', `${progress}%`);
  elements.transportPosition.setAttribute('aria-valuetext', positionText);
}

function isTransportPlaying() {
  if (resultUrl) return !elements.shiftedPlayer.paused;
  if (livePreviewAvailable) return Boolean(livePreview?.playing);
  return playbackSemitones === 0 && !elements.sourcePlayer.paused;
}

function renderTransportButton() {
  const playing = isTransportPlaying();
  const label = t(playing ? 'pitch.pause' : 'pitch.play');
  elements.transportPlay.setAttribute('aria-label', label);
  elements.transportPlay.dataset.playing = String(playing);
}

function renderMetrics() {
  if (!metricsState) return;
  elements.metricsEmpty.hidden = true;
  elements.metricsContainer.hidden = false;
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
  const presetKey = result.diagnostics.preset === 'bypass'
    ? 'pitch.presetBypass'
    : (result.diagnostics.preset === 'default' ? 'pitch.presetDefault' : 'pitch.presetCheaper');
  elements.metrics.preset.textContent = t(presetKey);
  elements.metrics.input.textContent = `${inputDuration.toFixed(3)} s`;
  elements.metrics.output.textContent = `${outputDuration.toFixed(3)} s`;
  elements.metrics.format.textContent = t(
    result.channelCount === 1 ? 'pitch.formatMono' : 'pitch.formatStereo',
    { rate: result.sampleRate.toLocaleString(sharedI18n.getLanguage()) },
  );
  elements.metrics.peak.textContent = formatPeak(result.peak);
}

function renderActions() {
  elements.workspace.setAttribute('aria-busy', String(busy));
  elements.prepareWave.hidden = Boolean(resultUrl);
  elements.prepareWave.textContent = t(busy ? 'pitch.preparingWave' : 'pitch.prepareWave');
  elements.download.hidden = !resultUrl;
}

function renderDynamicText() {
  elements.status.textContent = t(statusState.key, statusState.parameters);
  renderFileDetails();
  renderPitchValue();
  renderTransportPosition();
  renderTransportButton();
  renderActions();
  renderMetrics();
}

function clearAudioElement(player) {
  player.pause();
  player.removeAttribute('src');
  player.load();
}

function clearMetrics() {
  metricsState = null;
  elements.metricsContainer.hidden = true;
  elements.metricsEmpty.hidden = false;
  Object.values(elements.metrics).forEach((element) => {
    element.textContent = '—';
  });
}

function clearResult() {
  revokeUrl(resultUrl);
  resultUrl = null;
  clearAudioElement(elements.shiftedPlayer);
  elements.download.removeAttribute('href');
  elements.download.removeAttribute('download');
  clearMetrics();
  renderActions();
}

function updateControls() {
  const ready = Boolean(decodedAudio);
  const shiftIsValid = parseSemitoneValue() !== null;
  const controlsBusy = busy || liveLoading;
  elements.chooseFile.disabled = controlsBusy;
  elements.file.disabled = controlsBusy;
  elements.semitones.disabled = !ready || controlsBusy;
  elements.pitchDown.disabled = !ready || controlsBusy;
  elements.pitchUp.disabled = !ready || controlsBusy;
  elements.pitchReset.disabled = !ready || controlsBusy;
  elements.transportPlay.disabled = !ready || controlsBusy || !shiftIsValid
    || (playbackSemitones !== 0 && !livePreviewAvailable && !resultUrl);
  elements.transportPosition.disabled = !ready || controlsBusy;
  elements.prepareWave.disabled = !ready || controlsBusy || !shiftIsValid;
}

function setBusy(value) {
  busy = value;
  renderActions();
  updateControls();
}

function setPlayerTime(player, position) {
  const setTime = () => {
    try {
      player.currentTime = position;
    } catch (error) {
      // The next metadata event retries the same position.
    }
  };
  setTime();
  if (player.readyState === 0) {
    player.addEventListener('loadedmetadata', setTime, { once: true });
  }
}

async function releaseLivePreview() {
  const controller = livePreview;
  livePreview = null;
  renderTransportButton();
  if (controller) await controller.release();
}

function createLivePreview() {
  if (!decodedAudio || !livePreviewAvailable) return null;
  livePreview = new LivePreviewController(decodedAudio, {
    preset: PROCESSING_PRESET,
    onTime(position) {
      if (resultUrl || pointerScrubbing) return;
      transportPosition = position;
      renderTransportPosition();
    },
    onEnded() {
      if (!resultUrl) {
        transportPosition = decodedAudio?.duration || 0;
        renderTransportPosition();
        renderTransportButton();
      }
    },
  });
  return livePreview;
}

async function handleLiveFailure() {
  await releaseLivePreview();
  livePreviewAvailable = false;
  setStatus('pitch.statusLiveUnavailable', {}, 'warning', true);
  renderTransportButton();
  updateControls();
}

async function pauseTransport() {
  playbackId += 1;
  if (resultUrl) {
    elements.shiftedPlayer.pause();
    if (Number.isFinite(elements.shiftedPlayer.currentTime)) {
      transportPosition = elements.shiftedPlayer.currentTime;
    }
  } else if (livePreview?.playing) {
    try {
      transportPosition = await livePreview.pause();
    } catch (error) {
      await handleLiveFailure();
    }
  } else {
    elements.sourcePlayer.pause();
    if (Number.isFinite(elements.sourcePlayer.currentTime)) {
      transportPosition = elements.sourcePlayer.currentTime;
    }
  }
  renderTransportPosition();
  renderTransportButton();
}

async function playTransport() {
  if (!decodedAudio || busy || liveLoading) return;
  const semitones = readSemitones();
  playbackSemitones = semitones;
  const duration = decodedAudio.duration;
  if (transportPosition >= duration - 0.05) transportPosition = 0;
  const currentPlayback = playbackId + 1;
  playbackId = currentPlayback;

  elements.sourcePlayer.pause();
  elements.shiftedPlayer.pause();
  try {
    if (resultUrl) {
      if (livePreview?.playing) await livePreview.pause();
      setPlayerTime(elements.shiftedPlayer, transportPosition);
      await elements.shiftedPlayer.play();
    } else if (livePreviewAvailable) {
      const controller = livePreview || createLivePreview();
      if (!controller) {
        await handleLiveFailure();
        return;
      }
      liveLoading = true;
      setStatus('pitch.statusLivePreparing');
      updateControls();
      await controller.play(transportPosition, semitones);
      if (currentPlayback !== playbackId) {
        await controller.pause();
        return;
      }
      setStatus('pitch.statusLivePlaying');
    } else if (semitones === 0) {
      setPlayerTime(elements.sourcePlayer, transportPosition);
      await elements.sourcePlayer.play();
    } else {
      await handleLiveFailure();
    }
  } catch (error) {
    if (currentPlayback !== playbackId) return;
    if (!resultUrl && livePreviewAvailable) {
      await handleLiveFailure();
      if (semitones === 0) {
        try {
          setPlayerTime(elements.sourcePlayer, transportPosition);
          await elements.sourcePlayer.play();
        } catch (sourceError) {
          setStatus(
            'pitch.errorPlayback',
            { detail: sourceError.message || sourceError },
            'error',
            true,
          );
        }
      }
    } else {
      setStatus('pitch.errorPlayback', { detail: error.message || error }, 'error', true);
    }
  } finally {
    liveLoading = false;
    renderTransportPosition();
    renderTransportButton();
    updateControls();
  }
}

async function seekTransport(position) {
  if (!decodedAudio) return;
  transportPosition = Math.max(0, Math.min(decodedAudio.duration, position));
  try {
    if (resultUrl) {
      setPlayerTime(elements.shiftedPlayer, transportPosition);
    } else if (livePreview) {
      await livePreview.seek(transportPosition, readSemitones());
    } else if (playbackSemitones === 0) {
      setPlayerTime(elements.sourcePlayer, transportPosition);
    }
  } catch (error) {
    if (!resultUrl && livePreview) await handleLiveFailure();
  }
  renderTransportPosition();
}

async function applyPitchChange() {
  const value = parseSemitoneValue();
  const previousValue = playbackSemitones;
  const sourceWasPlaying = !livePreviewAvailable && previousValue === 0
    && !elements.sourcePlayer.paused;
  const generatedWasPlaying = Boolean(resultUrl) && !elements.shiftedPlayer.paused;
  const liveWasPlaying = !resultUrl && Boolean(livePreview?.playing);
  const wasPlaying = sourceWasPlaying || generatedWasPlaying || liveWasPlaying;
  const changesPlaybackPath = value === null
    || generatedWasPlaying
    || (sourceWasPlaying && value !== 0);

  if (wasPlaying && changesPlaybackPath) await pauseTransport();
  playbackSemitones = value;
  clearResult();
  renderPitchValue();

  if (value === null) {
    updateControls();
    return;
  }

  if (livePreview) {
    try {
      await livePreview.setSemitones(value);
    } catch (error) {
      await handleLiveFailure();
      if (value === 0 && liveWasPlaying) await playTransport();
      return;
    }
  }
  if (decodedAudio) {
    setStatus(
      value !== 0 && !livePreviewAvailable
        ? 'pitch.statusLiveUnavailable'
        : 'pitch.statusReady',
      {},
      value !== 0 && !livePreviewAvailable ? 'warning' : 'normal',
      value !== 0 && !livePreviewAvailable,
    );
  }
  updateControls();
  if (wasPlaying && changesPlaybackPath && (value === 0 || livePreviewAvailable)) {
    await playTransport();
  }
}

function setSemitones(value) {
  const number = Number(value);
  elements.semitones.value = String(Math.max(
    -12,
    Math.min(12, Number.isFinite(number) ? number : 0),
  ));
  applyPitchChange();
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

async function loadFile(file) {
  stopActiveOperation();
  playbackId += 1;
  const currentOperation = operationId;
  await pauseTransport();
  await releaseLivePreview();
  if (currentOperation !== operationId) return;

  selectedFile = file;
  decodedAudio = null;
  playbackSemitones = parseSemitoneValue();
  transportPosition = 0;
  clearResult();
  revokeUrl(sourceUrl);
  sourceUrl = null;
  clearAudioElement(elements.sourcePlayer);
  fileDetailsState = {
    name: file.name,
    nameKey: null,
    metadataKey: 'pitch.fileSize',
    parameters: {
      size: formatBytes(file.size),
    },
  };
  renderFileDetails();
  renderTransportPosition();
  setStatus('pitch.statusDecoding', { filename: file.name });
  setBusy(true);

  try {
    const audioBuffer = await decodeFile(file);
    if (currentOperation !== operationId) return;
    validateDecodedAudio(audioBuffer);
    decodedAudio = audioBuffer;
    sourceUrl = URL.createObjectURL(file);
    elements.sourcePlayer.src = sourceUrl;
    fileDetailsState = {
      name: file.name,
      nameKey: null,
      metadataKey: 'pitch.fileMetadata',
      parameters: {
        size: formatBytes(file.size),
        duration: formatClock(audioBuffer.duration),
        channels: t(audioBuffer.numberOfChannels === 1 ? 'pitch.mono' : 'pitch.stereo'),
        rate: audioBuffer.sampleRate.toLocaleString(sharedI18n.getLanguage()),
      },
    };
    renderFileDetails();
    renderTransportPosition();
    setStatus('pitch.statusReady');
  } catch (error) {
    if (currentOperation !== operationId) return;
    decodedAudio = null;
    setStatus('pitch.errorProcessing', { detail: error.message }, 'error', true);
  } finally {
    if (currentOperation === operationId) setBusy(false);
  }
}

elements.chooseFile.addEventListener('click', () => {
  elements.file.value = '';
  elements.file.click();
});

elements.file.addEventListener('change', () => {
  const file = elements.file.files[0];
  if (file) loadFile(file);
});

elements.semitones.addEventListener('input', () => {
  applyPitchChange();
});
elements.semitones.addEventListener('change', () => {
  if (parseSemitoneValue() === null) {
    setStatus('pitch.errorShift', {}, 'error', true);
  }
});
elements.pitchDown.addEventListener('click', () => {
  setSemitones(Number(elements.semitones.value) - 1);
});
elements.pitchUp.addEventListener('click', () => {
  setSemitones(Number(elements.semitones.value) + 1);
});
elements.pitchReset.addEventListener('click', () => setSemitones(0));

elements.transportPlay.addEventListener('click', async () => {
  if (isTransportPlaying()) {
    await pauseTransport();
  } else {
    await playTransport();
  }
});

elements.transportPosition.addEventListener('pointerdown', () => {
  pointerScrubbing = true;
});
elements.transportPosition.addEventListener('input', () => {
  transportPosition = Number(elements.transportPosition.value);
  renderTransportPosition();
  if (!pointerScrubbing) seekTransport(transportPosition);
});
elements.transportPosition.addEventListener('change', () => {
  const position = Number(elements.transportPosition.value);
  pointerScrubbing = false;
  seekTransport(position);
});
elements.transportPosition.addEventListener('pointercancel', () => {
  const position = Number(elements.transportPosition.value);
  pointerScrubbing = false;
  seekTransport(position);
});

elements.prepareWave.addEventListener('click', async () => {
  if (!decodedAudio || !selectedFile || busy || liveLoading) return;
  let semitones;
  try {
    semitones = readSemitones();
  } catch (error) {
    setStatus('pitch.errorShift', {}, 'error', true);
    return;
  }

  await pauseTransport();
  const currentOperation = operationId + 1;
  operationId = currentOperation;
  activeController = new AbortController();
  clearResult();
  setBusy(true);
  setStatus('pitch.statusProcessing');

  try {
    await releaseLivePreview();
    if (currentOperation !== operationId) return;
    const result = await processInWorker(
      decodedAudio,
      { semitones, preset: PROCESSING_PRESET },
      activeController.signal,
    );
    if (currentOperation !== operationId) return;
    resultUrl = replaceUrl(resultUrl, result.wave);
    elements.shiftedPlayer.src = resultUrl;
    elements.download.href = resultUrl;
    elements.download.download = safeOutputName(selectedFile.name, semitones);
    metricsState = { result, inputDuration: decodedAudio.duration };
    renderMetrics();
    setStatus(
      result.peak > 1 ? 'pitch.statusClipResult' : 'pitch.statusComplete',
      {},
      result.peak > 1 ? 'warning' : 'normal',
      result.peak > 1,
    );
  } catch (error) {
    if (currentOperation === operationId && error.name !== 'AbortError') {
      clearResult();
      setStatus('pitch.errorProcessing', { detail: error.message }, 'error', true);
    }
  } finally {
    if (currentOperation === operationId) {
      activeController = null;
      setBusy(false);
    }
  }
});

for (const player of [elements.sourcePlayer, elements.shiftedPlayer]) {
  player.addEventListener('timeupdate', () => {
    const isActive = (resultUrl && player === elements.shiftedPlayer)
      || (!resultUrl && !livePreviewAvailable
        && playbackSemitones === 0 && player === elements.sourcePlayer);
    if (!isActive || pointerScrubbing) return;
    transportPosition = player.currentTime;
    renderTransportPosition();
  });
  player.addEventListener('play', renderTransportButton);
  player.addEventListener('pause', renderTransportButton);
  player.addEventListener('ended', () => {
    transportPosition = decodedAudio?.duration || 0;
    renderTransportPosition();
    renderTransportButton();
  });
}

function hasFileDrag(event) {
  return Array.from(event.dataTransfer?.types || []).includes('Files');
}

function hideDropOverlay() {
  dragDepth = 0;
  elements.dropOverlay.hidden = true;
}

document.addEventListener('dragenter', (event) => {
  if (!hasFileDrag(event)) return;
  event.preventDefault();
  dragDepth += 1;
  if (!busy && !liveLoading) elements.dropOverlay.hidden = false;
});

document.addEventListener('dragover', (event) => {
  if (!hasFileDrag(event)) return;
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = busy || liveLoading ? 'none' : 'copy';
  }
});

document.addEventListener('dragleave', (event) => {
  if (!hasFileDrag(event)) return;
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) elements.dropOverlay.hidden = true;
});

document.addEventListener('drop', (event) => {
  if (!hasFileDrag(event)) return;
  event.preventDefault();
  hideDropOverlay();
  if (busy || liveLoading) return;
  const files = Array.from(event.dataTransfer?.files || []);
  if (files.length !== 1) {
    setStatus('pitch.errorOneFile', {}, 'error', true);
    return;
  }
  loadFile(files[0]);
});

window.addEventListener('blur', hideDropOverlay);

window.addEventListener('site-language-change', () => {
  if (decodedAudio && fileDetailsState.metadataKey === 'pitch.fileMetadata') {
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
  [sourceUrl, resultUrl].forEach(revokeUrl);
});

renderDynamicText();
updateControls();
