'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repositoryRoot = path.join(__dirname, '..');
const toolRoot = path.join(repositoryRoot, 'tools', 'pitch-shifter');
const pitchI18n = require('../tools/pitch-shifter/i18n.js');

test('Pitch Shifter translations use identical English and Chinese keys', () => {
  assert.deepEqual(
    Object.keys(pitchI18n.catalogs['en-AU']).sort(),
    Object.keys(pitchI18n.catalogs['zh-Hans']).sort(),
  );
});

test('the iOS playback audio session recovery is optional and ordered', async () => {
  const { recoverPlaybackAudioSession } = await import(
    '../tools/pitch-shifter/audio-session.mjs'
  );
  const changes = [];
  const audioSession = {};
  Object.defineProperty(audioSession, 'type', {
    configurable: true,
    get() { return changes.at(-1); },
    set(value) { changes.push(value); },
  });
  const recovered = await recoverPlaybackAudioSession({
    navigator: { audioSession },
    setTimeout(callback, delay) {
      assert.equal(delay, 0);
      changes.push('next task');
      callback();
    },
  });
  assert.equal(recovered, true);
  assert.deepEqual(changes, ['ambient', 'next task', 'playback']);
  assert.equal(await recoverPlaybackAudioSession({ navigator: {} }), false);

  Object.defineProperty(audioSession, 'type', {
    configurable: true,
    get() { return 'auto'; },
    set() { throw new Error('Audio session rejected the change.'); },
  });
  assert.equal(await recoverPlaybackAudioSession({
    navigator: { audioSession },
    setTimeout,
  }), false);
});

test('the WAV encoder writes stereo 16-bit PCM and reports hard clipping', async () => {
  const {
    encodeWaveChannels,
    measurePeakChannels,
    measureWaveRange,
  } = await import(
    '../tools/pitch-shifter/wav.mjs'
  );
  const channels = [
    new Float32Array([-1.5, -0.5, 0, 0.5, 1.5]),
    new Float32Array([0.25, -0.25, 1, -1, 0]),
  ];
  const wave = encodeWaveChannels({ channels, sampleRate: 48_000 });
  const view = new DataView(wave);

  assert.equal(Buffer.from(wave, 0, 4).toString('ascii'), 'RIFF');
  assert.equal(Buffer.from(wave, 8, 4).toString('ascii'), 'WAVE');
  assert.equal(view.getUint16(20, true), 1);
  assert.equal(view.getUint16(22, true), 2);
  assert.equal(view.getUint32(24, true), 48_000);
  assert.equal(view.getUint16(34, true), 16);
  assert.equal(view.getUint32(40, true), 20);
  assert.equal(view.getInt16(44, true), -32_768);
  assert.equal(view.getInt16(46, true), 8_192);
  assert.equal(view.getInt16(60, true), 32_767);
  assert.equal(measurePeakChannels(channels), 1.5);
  assert.deepEqual(measureWaveRange(channels), {
    peak: 1.5,
    clippedSampleCount: 2,
    totalSampleCount: 10,
    clippedSamplePercentage: 20,
  });
  assert.deepEqual(measureWaveRange(channels, 1, 3), {
    peak: 1,
    clippedSampleCount: 0,
    totalSampleCount: 6,
    clippedSamplePercentage: 0,
  });
  assert.equal(channels[0][0], -1.5);
  assert.equal(channels[0][4], 1.5);
});

test('both audio engines keep duration and shift a generated tone by one octave', async () => {
  const [
    { default: createScalarModule },
    { default: createSimdModule },
    { processSignalsmithOffline },
  ] = await Promise.all([
    import('../tools/pitch-shifter/vendor/signalsmith-stretch/SignalsmithStretchScalar.mjs'),
    import('../tools/pitch-shifter/vendor/signalsmith-stretch/SignalsmithStretchSimd.mjs'),
    import('../tools/pitch-shifter/audio-processing.mjs'),
  ]);
  const sampleRate = 48_000;
  const frameCount = sampleRate;
  const left = new Float32Array(frameCount);
  for (let frame = 0; frame < frameCount; frame += 1) {
    left[frame] = Math.sin(2 * Math.PI * 220 * frame / sampleRate) * 0.25;
  }
  const right = left.slice();
  const results = [];
  for (const createModule of [createScalarModule, createSimdModule]) {
    const module = await createModule();
    const result = processSignalsmithOffline(module, {
      channels: [left, right],
      length: frameCount,
      sampleRate,
      semitones: 12,
    });
    assert.equal(result.length, frameCount);
    assert.equal(result.sampleRate, sampleRate);
    assert.equal(result.channels.length, 2);
    assert.ok(result.channels[0].every(Number.isFinite));
    results.push(result);
  }

  const result = results[0];
  let maximumStereoDifference = 0;
  for (let frame = 0; frame < frameCount; frame += 1) {
    maximumStereoDifference = Math.max(
      maximumStereoDifference,
      Math.abs(result.channels[0][frame] - result.channels[1][frame]),
    );
  }
  assert.ok(maximumStereoDifference < 0.001, maximumStereoDifference);

  const measurementStart = 12_000;
  let positiveCrossings = 0;
  for (let frame = measurementStart + 1; frame < frameCount; frame += 1) {
    if (result.channels[0][frame - 1] <= 0 && result.channels[0][frame] > 0) {
      positiveCrossings += 1;
    }
  }
  const measuredFrequency = positiveCrossings / ((frameCount - measurementStart) / sampleRate);
  assert.ok(measuredFrequency > 420 && measuredFrequency < 460, measuredFrequency);

  const defaultResult = processSignalsmithOffline(await createScalarModule(), {
    channels: [left, right],
    length: frameCount,
    sampleRate,
    semitones: 12,
    preset: 'default',
  });
  assert.equal(defaultResult.diagnostics.preset, 'default');
  assert.equal(defaultResult.length, frameCount);
  assert.ok(defaultResult.channels[0].every(Number.isFinite));
});

test('the production interface keeps processing local and hides incomplete output', () => {
  const html = fs.readFileSync(path.join(toolRoot, 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(toolRoot, 'app.mjs'), 'utf8');
  const bootstrap = fs.readFileSync(path.join(toolRoot, 'bootstrap.js'), 'utf8');
  const css = fs.readFileSync(path.join(toolRoot, 'styles.css'), 'utf8');
  const livePreview = fs.readFileSync(path.join(toolRoot, 'live-preview.mjs'), 'utf8');
  const worker = fs.readFileSync(path.join(toolRoot, 'processing-worker.mjs'), 'utf8');

  assert.match(html, /id="audio-file"[^>]*type="file"/);
  assert.match(html, /id="choose-file"[^>]*aria-controls="audio-file"[^>]*aria-describedby="file-metadata"/);
  assert.match(html, /id="file-button-text"/);
  assert.doesNotMatch(html, /id="file-name"/);
  assert.match(html, /id="file-metadata"><\/p>/);
  assert.match(html, /<output id="semitones"[^>]*aria-live="polite"[^>]*>0<\/output>/);
  assert.doesNotMatch(html, /<input id="semitones"/);
  assert.ok([...html.matchAll(/class="pitch-symbol-icon"/g)].length >= 3);
  assert.doesNotMatch(html, /class="control-label"/);
  assert.doesNotMatch(html, /playback-original|playback-shifted/);
  assert.match(html, /id="pitch-reset"[^>]*class="[^"]*icon-button/);
  assert.match(html, /id="transport-play"[^>]*class="[^"]*icon-button[^>]*data-playing="false"[^>]*disabled/);
  assert.match(html, /id="play-icon"/);
  assert.match(html, /id="pause-icon"/);
  assert.match(html, /id="transport-position"[^>]*type="range"[^>]*disabled/);
  assert.match(html, /id="transport-current"/);
  assert.match(html, /id="transport-duration"/);
  assert.match(html, /id="shift-audio"[^>]*data-i18n="pitch\.shift"[^>]*disabled/);
  assert.match(html, /id="download"[^>]*hidden/);
  assert.doesNotMatch(html, /id="cancel"/);
  assert.match(html, /id="source-player"[^>]*hidden/);
  assert.match(html, /id="shifted-player"[^>]*hidden/);
  assert.match(html, /id="drop-overlay"[^>]*hidden/);
  assert.match(html, /id="processing-details"[^>]*class="info-section"/);
  assert.match(html, /id="metrics-empty"/);
  assert.match(html, /id="metrics"[^>]*hidden/);
  assert.match(html, /id="metric-clipping"/);
  assert.match(html, /data-i18n="pitch\.aboutPeakProtection"/);
  assert.match(html, /<details class="info-section">[\s\S]*pitch\.aboutTool/);
  assert.doesNotMatch(html, /\bopen(?:=""|\s|>)/);
  assert.doesNotMatch(html, /<audio[^>]*\bcontrols\b/);
  assert.doesNotMatch(html, /rendered-preview|preview-result|create-preview/);
  assert.match(css, /\[hidden\][\s\S]*display: none !important/);
  assert.match(css, /#transport-position[\s\S]*touch-action: pan-y/);
  assert.match(css, /#transport-position::-(?:webkit-slider-thumb|moz-range-thumb)/);
  assert.doesNotMatch(css, /#semitones[\s\S]*appearance: textfield/);
  assert.match(css, /\.pitch-actions[\s\S]*display: flex[\s\S]*justify-content: center/);
  assert.match(css, /grid-template-columns: 2\.75rem minmax\(0, 1fr\) 2\.75rem/);
  assert.match(css, /data-preview-pending="true"[\s\S]*opacity: 1/);
  assert.match(css, /#transport-play\[data-playing="true"\]/);
  assert.match(app, /MAX_DURATION_SECONDS = 30 \* 60/);
  assert.match(app, /MAX_CHANNEL_SAMPLES = 33_554_432/);
  assert.match(app, /activeController\?\.abort\(\)/);
  assert.match(app, /pointerScrubbing = true/);
  assert.match(app, /document\.addEventListener\('drop'/);
  assert.match(app, /elements\.shiftedPlayer\.src = resultUrl/);
  assert.match(app, /elements\.download\.href = resultUrl/);
  assert.match(app, /PROCESSING_PRESET = 'default'/);
  assert.match(app, /EXTENSIVE_CLIPPING_PERCENTAGE = 1/);
  assert.match(app, /preset: PROCESSING_PRESET/);
  assert.match(app, /transportPlay\.dataset\.playing = String\(playing\)/);
  assert.match(app, /fileButtonText\.textContent = hasFile/);
  assert.match(app, /playMediaElement\(elements\.shiftedPlayer\)/);
  assert.match(app, /playMediaElement\(elements\.sourcePlayer\)/);
  assert.match(app, /recoverPlaybackAudioSession\(window\)/);
  assert.match(livePreview, /recoverPlaybackAudioSession\(globalThis\)/);
  assert.match(app, /else if \(livePreviewAvailable\)[\s\S]*controller\.play\(transportPosition, semitones\)/);
  assert.doesNotMatch(app, /PREVIEW_SECONDS|encodeWaveSegment/);
  assert.match(bootstrap, /status\.dataset\.visible = 'true'/);
  assert.match(worker, /await SimdModule\(\)/);
  assert.match(worker, /await ScalarModule\(\)/);
  assert.match(worker, /measureWaveRange\(result\.channels, trimStart, trimLength\)/);
  assert.doesNotMatch(worker, /outputGain|gainReductionDecibels/);
  assert.match(worker, /encodeWaveChannels/);

  for (const source of [html, app, livePreview, worker]) {
    assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
  }
});

test('the live preview uses the selected preset and releases its copied buffers', async () => {
  const { LivePreviewController, supportsLivePreview } = await import(
    '../tools/pitch-shifter/live-preview.mjs'
  );
  assert.equal(supportsLivePreview({
    isSecureContext: true,
    AudioContext() {},
    AudioWorkletNode() {},
  }), true);
  assert.equal(supportsLivePreview({
    isSecureContext: false,
    AudioContext() {},
    AudioWorkletNode() {},
  }), false);

  const calls = [];
  let timeCallback = null;
  let nodeOptions = null;
  const node = {
    port: { close() { calls.push(['closePort']); } },
    connect() { calls.push(['connect']); },
    disconnect() { calls.push(['disconnect']); },
    async configure(options) { calls.push(['configure', options]); },
    async setUpdateInterval(seconds, callback) {
      calls.push(['setUpdateInterval', seconds]);
      timeCallback = callback;
    },
    async addBuffers(channels, transfer) {
      calls.push(['addBuffers', channels.length, transfer.length]);
    },
    async schedule(options) {
      calls.push(['schedule', options]);
      return { input: 1.25 };
    },
    async dropBuffers() { calls.push(['dropBuffers']); },
  };
  const context = {
    currentTime: 4,
    destination: {},
    state: 'running',
    async resume() { calls.push(['resume']); },
    async close() { calls.push(['closeContext']); this.state = 'closed'; },
  };
  const channelData = [new Float32Array(96_000), new Float32Array(96_000)];
  const audioBuffer = {
    duration: 2,
    numberOfChannels: 2,
    getChannelData(channel) { return channelData[channel]; },
  };
  const times = [];
  let ended = false;
  const controller = new LivePreviewController(audioBuffer, {
    preset: 'default',
    onTime(position) { times.push(position); },
    onEnded() { ended = true; },
    createAudioContext() { return context; },
    async createStretchNode(audioContext, options) {
      assert.equal(audioContext, context);
      nodeOptions = options;
      return node;
    },
  });

  await controller.play(0.5, 3);
  assert.deepEqual(calls.find((call) => call[0] === 'configure'), [
    'configure',
    { preset: 'default' },
  ]);
  assert.equal(new LivePreviewController(audioBuffer).preset, 'default');
  assert.equal(nodeOptions.numberOfInputs, 1);
  assert.deepEqual(nodeOptions.outputChannelCount, [2]);
  assert.deepEqual(calls.find((call) => call[0] === 'addBuffers'), [
    'addBuffers',
    2,
    2,
  ]);
  assert.ok(calls.some((call) => call[0] === 'schedule'
    && call[1].active === true
    && call[1].input === 0.5
    && call[1].semitones === 3));
  await controller.setSemitones(-2);
  await controller.seek(1, -2);
  await controller.pause();
  assert.equal(controller.position, 1.25);
  timeCallback(2);
  assert.equal(ended, false);
  await controller.release();
  assert.ok(calls.some((call) => call[0] === 'dropBuffers'));
  assert.ok(calls.some((call) => call[0] === 'disconnect'));
  assert.ok(calls.some((call) => call[0] === 'closeContext'));
  assert.ok(times.length >= 3);
});

test('the pinned Signalsmith artifacts and licences match the dependency record', () => {
  const expectedHashes = {
    'SignalsmithStretchScalar.mjs': '7349f115b3d694b769094debea2df4996f93ab027fe4627fefc841bb9f0a33e1',
    'SignalsmithStretchSimd.mjs': 'd8556ea43ff1e82b113994f64129fdb8ccaf86cc64d17dc1b6c11ee107e1ac93',
    'SignalsmithStretchRealtime.mjs': '97530b11d5bc01015af4cde40d6aa55ff10c40aa1294ca4c8c5762027d517a46',
  };
  const vendorRoot = path.join(toolRoot, 'vendor', 'signalsmith-stretch');
  for (const [filename, expectedHash] of Object.entries(expectedHashes)) {
    const actualHash = crypto
      .createHash('sha256')
      .update(fs.readFileSync(path.join(vendorRoot, filename)))
      .digest('hex');
    assert.equal(actualHash, expectedHash);
  }

  assert.match(fs.readFileSync(path.join(vendorRoot, 'LICENSE.txt'), 'utf8'), /MIT License/);
  assert.match(
    fs.readFileSync(path.join(vendorRoot, 'LICENSE-signalsmith-linear.txt'), 'utf8'),
    /MIT License/,
  );
  const dependencyRecord = fs.readFileSync(path.join(toolRoot, 'docs', 'DEPENDENCIES.md'), 'utf8');
  assert.match(dependencyRecord, /a670068d9aeb64913331d5cc29337b19a457a7df/);
  assert.match(dependencyRecord, /de55e6a50ffcf6f8f43f649692d94691c7025151/);
  for (const expectedHash of Object.values(expectedHashes)) {
    assert.match(dependencyRecord, new RegExp(expectedHash));
  }
});

test('Pitch Shifter module references use current content hashes', () => {
  const references = [
    ['bootstrap.js', './app.mjs'],
    ['app.mjs', './worker-client.mjs'],
    ['app.mjs', './live-preview.mjs'],
    ['app.mjs', './audio-session.mjs'],
    ['live-preview.mjs', './audio-session.mjs'],
    [
      'live-preview.mjs',
      './vendor/signalsmith-stretch/SignalsmithStretchRealtime.mjs',
    ],
    ['worker-client.mjs', './processing-worker.mjs'],
    ['processing-worker.mjs', './audio-processing.mjs'],
    ['processing-worker.mjs', './wav.mjs'],
    [
      'processing-worker.mjs',
      './vendor/signalsmith-stretch/SignalsmithStretchScalar.mjs',
    ],
    [
      'processing-worker.mjs',
      './vendor/signalsmith-stretch/SignalsmithStretchSimd.mjs',
    ],
  ];

  for (const [sourceName, reference] of references) {
    const sourcePath = path.join(toolRoot, sourceName);
    const targetPath = path.resolve(path.dirname(sourcePath), reference);
    const expectedHash = crypto
      .createHash('sha256')
      .update(fs.readFileSync(targetPath))
      .digest('hex')
      .slice(0, 12);
    const source = fs.readFileSync(sourcePath, 'utf8');
    assert.ok(source.includes(`${reference}?v=${expectedHash}`), `${sourceName}: ${reference}`);
  }
});

test('Pitch Shifter provides local home-screen metadata', () => {
  const html = fs.readFileSync(path.join(toolRoot, 'index.html'), 'utf8');
  const manifest = JSON.parse(fs.readFileSync(path.join(toolRoot, 'manifest.webmanifest'), 'utf8'));

  assert.match(html, /<link rel="apple-touch-icon" href="[^"]+pitch-key-512\.png/);
  assert.equal(manifest.name, 'Pitch Shifter');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.background_color, '#f4f1e8');
  assert.equal(manifest.theme_color, '#f4f1e8');
  assert.deepEqual(manifest.icons.map((icon) => icon.sizes), ['512x512']);
  const [iconReference, declaredHash] = manifest.icons[0].src.split('?v=');
  const icon = fs.readFileSync(path.resolve(toolRoot, iconReference));
  const actualHash = crypto.createHash('sha256').update(icon).digest('hex').slice(0, 12);
  assert.equal(declaredHash, actualHash);
});
