'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const adjuster = require('../style-guide/icon-adjuster.js');

function element(dataset = {}) {
  const listeners = {};
  return {
    dataset, value: '', textContent: '', disabled: true, listeners,
    style: { values: {}, setProperty(key, value) { this.values[key] = value; } },
    addEventListener(type, handler) { listeners[type] = handler; },
    emit(type) { return listeners[type](); },
    focus() { this.focused = true; },
    select() { this.selected = true; },
  };
}

function fixture(clipboard) {
  const output = element(), copy = element(), status = element();
  const editors = Object.keys(adjuster.defaults()).map(name => {
    const fields = ['scalePercent', 'centerX', 'centerY'].map(setting => element({ setting }));
    const frames = Array.from({ length: 3 }, () => element());
    const images = Array.from({ length: 3 }, () => element({ originalSrc: `${name}-original.png` }));
    const reset = element(), warning = element(), fieldset = element();
    return {
      dataset: { iconEditor: name }, fields, frames, images, reset, warning, fieldset,
      querySelectorAll(selector) {
        return { '[data-setting]': fields, '[data-preview-frame]': frames, '[data-preview-image]': images }[selector];
      },
      querySelector(selector) {
        return { '[data-icon-reset]': reset, '[data-icon-warning]': warning, fieldset }[selector];
      },
    };
  });
  const root = {
    querySelector(selector) {
      return { '[data-icon-settings]': output, '[data-icon-copy]': copy, '[data-icon-copy-status]': status }[selector];
    },
    querySelectorAll() { return editors; },
  };
  return { output, copy, status, editors, controller: adjuster.initialize(root, clipboard) };
}

test('preview coordinates reproduce source-centered uniform transforms', () => {
  const settings = adjuster.defaults();
  const preview = adjuster.transform('guitar-strum-machine', settings['guitar-strum-machine']);
  assert.equal(preview.scale, 0.86);
  assert.ok(Math.abs(preview.xPercent - (256 - 255.5 * 0.86) / 512 * 100) < 1e-10);
  assert.ok(Math.abs(preview.yPercent - (260 - 255 * 0.86) / 512 * 100) < 1e-10);
  for (const [name, values] of Object.entries(settings)) assert.equal(adjuster.transform(name, values).clipped, false);
  assert.equal(adjuster.transform('metronome', { scalePercent: 150, centerX: 128, centerY: 128 }).clipped, true);
});

test('one number input updates all three previews and exports independent settings', () => {
  const ui = fixture();
  const metro = ui.editors[1];
  assert.equal(metro.fieldset.disabled, false);
  assert.equal(metro.fields[0].value, '114');
  metro.fields[0].value = '125';
  metro.fields[0].emit('input');
  assert.equal(ui.controller.getSettings().metronome.scalePercent, 125);
  assert.equal(ui.controller.getSettings().tuner.scalePercent, 106);
  for (const frame of metro.frames) assert.equal(frame.style.values['--icon-scale'], '1.25');
  for (const image of metro.images) assert.equal(image.src, 'metronome-original.png');
  const saved = JSON.parse(ui.output.value);
  assert.equal(saved.format, 'volo1st-icon-settings-v1');
  assert.equal(saved.canvasSize, 512);
  assert.deepEqual(saved.icons, ui.controller.getSettings());
  assert.equal(metro.fields[0].value, '125');
  metro.fields[1].value = '320';
  metro.fields[1].emit('input');
  assert.equal(ui.controller.getSettings().metronome.centerX, 320);
});

test('reset affects only the selected icon and clipping recovers', () => {
  const ui = fixture();
  const metro = ui.editors[1], tuner = ui.editors[2];
  tuner.fields[0].value = '100'; tuner.fields[0].emit('input');
  for (const [field, value] of metro.fields.map((field, index) => [field, index === 0 ? '150' : '128'])) {
    field.value = value; field.emit('input');
  }
  assert.match(metro.warning.textContent, /outside the canvas/);
  metro.reset.emit('click');
  assert.deepEqual(ui.controller.getSettings().metronome, adjuster.defaults().metronome);
  assert.equal(ui.controller.getSettings().tuner.scalePercent, 100);
  assert.equal(metro.warning.textContent, '');
});

test('invalid values retain the prior setting and extreme values stay in range', () => {
  assert.equal(adjuster.normalize('scalePercent', '', 114), 114);
  assert.equal(adjuster.normalize('scalePercent', 'invalid', 114), 114);
  assert.equal(adjuster.normalize('scalePercent', Infinity, 114), 114);
  assert.equal(adjuster.normalize('scalePercent', 999, 114), 150);
  assert.equal(adjuster.normalize('centerX', -1, 256), 128);
});

test('copy writes the current export and warns if settings change during copying', async () => {
  let copied, finish;
  const ui = fixture({ writeText(value) { copied = value; return new Promise(resolve => { finish = resolve; }); } });
  const pending = ui.copy.emit('click');
  assert.equal(ui.copy.disabled, true);
  assert.equal(copied, ui.output.value);
  ui.editors[0].fields[0].value = '90'; ui.editors[0].fields[0].emit('input');
  finish(); await pending;
  assert.match(ui.status.textContent, /Earlier settings copied/);
  assert.equal(ui.copy.disabled, false);
  const success = fixture({ writeText: async () => {} });
  await success.copy.emit('click');
  assert.match(success.status.textContent, /^Settings copied/);
});

test('clipboard rejection selects a usable manual export without losing settings', async () => {
  for (const clipboard of [{}, { writeText: async () => { throw new Error('Denied'); } }]) {
    const ui = fixture(clipboard);
    const saved = ui.output.value;
    await ui.copy.emit('click');
    assert.equal(ui.output.value, saved);
    assert.equal(ui.output.focused, true);
    assert.equal(ui.output.selected, true);
    assert.match(ui.status.textContent, /settings are selected/);
    assert.equal(ui.copy.disabled, false);
  }
});


test('number fields preserve incomplete typing and commit normalized whole numbers', () => {
  const ui = fixture();
  const field = ui.editors[1].fields[0];
  const originalExport = ui.output.value;
  for (const draft of ['', '1', '114.5', '999']) {
    field.value = draft;
    field.emit('input');
    assert.equal(field.value, draft);
    assert.equal(ui.output.value, originalExport);
  }
  field.emit('change');
  assert.equal(field.value, '150');
  assert.equal(ui.controller.getSettings().metronome.scalePercent, 150);
  field.value = '';
  field.emit('input');
  field.emit('change');
  assert.equal(field.value, '150');
  field.value = '110.5';
  field.emit('change');
  assert.equal(field.value, '111');
  assert.equal(ui.controller.getSettings().metronome.scalePercent, 111);
});
