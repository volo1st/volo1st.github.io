'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const chordCatalog = require('../tools/guitar-strumming/catalog.js');
const core = require('../tools/guitar-strumming/core.js');
const parser = require('../tools/guitar-strumming/parser.js');
const presets = require('../tools/guitar-strumming/preset-catalog.js');

function expectCode(code) {
  return (error) => {
    assert.equal(error.code, code);
    return true;
  };
}

test('the initial catalog contains six unique reviewed presets', () => {
  const entries = presets.listPresets();
  assert.equal(entries.length, 6);
  assert.equal(new Set(entries.map((entry) => entry.slug)).size, entries.length);
  assert.equal(new Set(entries.map((entry) => entry.source)).size, entries.length);
  assert.ok(entries.every((entry) => presets.SLUG_PATTERN.test(entry.slug)));
  assert.ok(entries.every((entry) => entry.teachingGoal.length > 0));
  assert.ok(entries.every((entry) => (
    ['Original exercise', 'Short user transcription'].includes(entry.rightsBasis)
  )));
  assert.ok(entries.every((entry) => (
    ['Exercise', 'Feature demo', 'Song exercise'].includes(entry.presetType)
  )));
  const songExercises = entries.filter((entry) => entry.presetType === 'Song exercise');
  assert.equal(songExercises.length, 2);
  assert.ok(songExercises.every((entry) => entry.rightsNotice.startsWith('Unofficial')));
  assert.ok(Object.isFrozen(entries));
  assert.ok(entries.every((entry) => Object.isFrozen(entry) && Object.isFrozen(entry.tags)));
});

test('every preset passes the normal parser and timeline checks', () => {
  for (const preset of presets.listPresets()) {
    const parsed = parser.parseSongSource(preset.source, { catalog: chordCatalog });
    assert.equal(parsed.ok, true, `${preset.slug}: ${JSON.stringify(parsed.errors)}`);
    assert.doesNotThrow(() => core.normalizeSong(parsed.song), preset.slug);
  }
});

test('the current example is the default preset without duplicated page source', () => {
  const expectedSource = `4/4#8
bpm: 100
count-in: 1
tempo-ramp: off

chords:
| C G/B@8 | G/B | Am F@8 | F |

strum:
| D - D4 U! - U3P D2X U | x4`;
  assert.equal(presets.getDefaultPreset().slug, 'expressive-strumming-demo-v1');
  assert.equal(presets.getDefaultPreset().source, expectedSource);
  assert.equal(presets.getDefaultPreset().presetType, 'Feature demo');

  const html = fs.readFileSync(
    path.join(__dirname, '..', 'tools', 'guitar-strumming', 'index.html'),
    'utf8',
  );
  assert.match(html, /<textarea id="song-source"[^>]*><\/textarea>/);
});

test('catalog validation rejects invalid and duplicate entries', () => {
  const valid = {
    slug: 'valid-exercise-v1',
    title: 'Valid exercise',
    presetType: 'Exercise',
    teachingLevel: 'Beginner',
    teachingGoal: 'Test the catalog rules.',
    tags: ['test'],
    rightsBasis: 'Original exercise',
    source: 'source one',
  };
  assert.throws(
    () => presets.validatePresetEntries([{ ...valid, slug: 'Invalid Slug' }]),
    expectCode('preset_slug_invalid'),
  );
  assert.throws(
    () => presets.validatePresetEntries([valid, { ...valid, source: 'source two' }]),
    expectCode('preset_slug_duplicate'),
  );
  assert.throws(
    () => presets.validatePresetEntries([valid, { ...valid, slug: 'other-exercise-v1' }]),
    expectCode('preset_source_duplicate'),
  );
  assert.throws(
    () => presets.validatePresetEntries([{
      ...valid,
      presetType: 'Song exercise',
      rightsBasis: 'Short user transcription',
    }]),
    expectCode('preset_rights_invalid'),
  );
});

test('preset URL resolution accepts one known preset', () => {
  assert.deepEqual(
    presets.resolvePresetFromUrl('https://example.test/tool?keep=1'),
    { found: false, preset: null },
  );
  const resolved = presets.resolvePresetFromUrl(
    'https://example.test/tool?preset=intermediate-c-g-am-f-v1',
  );
  assert.equal(resolved.found, true);
  assert.equal(resolved.preset, presets.getPreset('intermediate-c-g-am-f-v1'));
});

test('preset URL resolution rejects duplicate, unknown, and conflicting parameters', () => {
  assert.throws(
    () => presets.resolvePresetFromUrl('https://example.test/?preset=a&preset=b'),
    expectCode('preset_parameter_count'),
  );
  assert.throws(
    () => presets.resolvePresetFromUrl('https://example.test/?preset=unknown-v1'),
    expectCode('preset_unknown'),
  );
  assert.throws(
    () => presets.resolvePresetFromUrl(
      'https://example.test/?preset=intermediate-c-g-am-f-v1&song=v1.raw.RA',
    ),
    expectCode('source_parameter_conflict'),
  );
});

test('preset link creation preserves unrelated queries and removes song and fragments', () => {
  const result = presets.createPresetUrl(
    'beginner-g-c-d-em-v1',
    'https://example.test/tools/guitar-strumming/?keep=1&song=v1.raw.RA#section',
  );
  const url = new URL(result.url);
  assert.equal(result.codec, 'preset');
  assert.equal(url.searchParams.get('preset'), 'beginner-g-c-d-em-v1');
  assert.equal(url.searchParams.get('song'), null);
  assert.equal(url.searchParams.get('keep'), '1');
  assert.equal(url.hash, '');
  assert.ok(result.urlLength < 750);
});

test('exact source lookup selects only catalog source', () => {
  const preset = presets.getPreset('seventh-chord-turnaround-v1');
  assert.equal(presets.findPresetBySource(preset.source), preset);
  assert.equal(presets.findPresetBySource(`${preset.source}\n`), null);
});

test('the page loads the preset catalog before the application', () => {
  const html = fs.readFileSync(
    path.join(__dirname, '..', 'tools', 'guitar-strumming', 'index.html'),
    'utf8',
  );
  assert.ok(html.indexOf('src="./preset-catalog.js"') < html.indexOf('src="./app.js"'));
  assert.match(html, /id="song-preset"/);
  assert.match(html, /id="preset-notice-heading"/);
  assert.ok(html.indexOf('id="preset-notice-heading"') > html.indexOf('id="strum-sound-test"'));
});
