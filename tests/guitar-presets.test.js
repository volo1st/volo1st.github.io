'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const chordCatalog = require('../tools/guitar-strumming/catalog.js');
const core = require('../tools/guitar-strumming/core.js');
const guitarI18n = require('../tools/guitar-strumming/i18n.js');
const parser = require('../tools/guitar-strumming/parser.js');
const presets = require('../tools/guitar-strumming/preset-catalog.js');
const share = require('../tools/guitar-strumming/share.js');

function expectCode(code) {
  return (error) => {
    assert.equal(error.code, code);
    return true;
  };
}

test('the catalog contains seven unique reviewed presets', () => {
  const entries = presets.listPresets();
  assert.equal(entries.length, 7);
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
  assert.equal(songExercises.length, 3);
  assert.ok(songExercises.every((entry) => entry.rightsNotice.startsWith('Unofficial')));
  assert.ok(Object.isFrozen(entries));
  assert.ok(entries.every((entry) => Object.isFrozen(entry) && Object.isFrozen(entry.tags)));
});

test('two Viva La Vida profiles use one shared arrangement', () => {
  const arrangements = presets.listSharedArrangements();
  const profiles = presets.listExerciseProfiles();
  assert.equal(arrangements.length, 1);
  assert.equal(arrangements[0].id, 'viva-la-vida-v1');
  assert.equal(arrangements[0].originalKey, 'Ab major');
  assert.equal(arrangements[0].chordSource, '| 4 5@8 | 5 | 1 6:m@8 | 6:m |');
  assert.equal(profiles.length, 2);
  assert.ok(profiles.every((profile) => profile.arrangementId === arrangements[0].id));
  assert.deepEqual(profiles.map((profile) => profile.teachingLevel), ['Beginner', 'Intermediate']);
  assert.ok(Object.isFrozen(arrangements) && Object.isFrozen(arrangements[0]));
  assert.ok(Object.isFrozen(profiles) && profiles.every(Object.isFrozen));
});

test('Viva La Vida profiles materialize distinct complete sources from shared music', () => {
  const melody = presets.getPreset('viva-la-vida-melody-backing-c-v1');
  const strumming = presets.getPreset('viva-la-vida-syncopated-strumming-g-v1');
  assert.ok(melody);
  assert.ok(strumming);
  assert.equal(melody.arrangementId, 'viva-la-vida-v1');
  assert.equal(strumming.arrangementId, 'viva-la-vida-v1');
  assert.match(melody.source, /original-key: Ab major\nkey: C major\nnotation: numbers\ncapo: 0/);
  assert.match(strumming.source, /original-key: Ab major\nkey: G major\nnotation: numbers\ncapo: 0/);
  assert.equal(
    melody.source.slice(melody.source.indexOf('chords:')),
    strumming.source.slice(strumming.source.indexOf('chords:')),
  );
  assert.doesNotMatch(melody.source, /\r/);
  assert.doesNotMatch(strumming.source, /\r/);
  assert.notEqual(melody.source, strumming.source);
  assert.equal(presets.getPreset('viva-la-vida-syncopated-strumming-v1'), null);
});

test('Viva La Vida profile titles and goals have both translations', () => {
  for (const profile of presets.listExerciseProfiles()) {
    for (const suffix of ['title', 'goal']) {
      const key = `guitar.preset.${profile.slug}.${suffix}`;
      assert.ok(Object.hasOwn(guitarI18n.catalogs['en-AU'], key), key);
      assert.ok(Object.hasOwn(guitarI18n.catalogs['zh-Hans'], key), key);
    }
  }
});

test('Viva La Vida profiles resolve to their intended sounding chords', () => {
  const cases = [
    ['viva-la-vida-melody-backing-c-v1', [['F', 'G'], ['G'], ['C', 'Am'], ['Am']]],
    ['viva-la-vida-syncopated-strumming-g-v1', [['C', 'D'], ['D'], ['G', 'Em'], ['Em']]],
  ];
  for (const [slug, expected] of cases) {
    const parsed = parser.parseSongSource(presets.getPreset(slug).source, { catalog: chordCatalog });
    assert.equal(parsed.ok, true);
    assert.deepEqual(
      parsed.song.chordBars.map((bar) => bar.map((change) => change.soundingChord)),
      expected,
    );
    assert.doesNotThrow(() => core.normalizeSong(parsed.song));
  }
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
capo: 0
swing: off

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

test('shared-arrangement validation rejects invalid composition safely', () => {
  const arrangement = presets.listSharedArrangements()[0];
  const profile = presets.listExerciseProfiles()[0];
  assert.throws(
    () => presets.validateArrangementEntries([arrangement, { ...arrangement }]),
    expectCode('arrangement_id_duplicate'),
  );
  assert.throws(
    () => presets.createExercisePresets([], [profile]),
    expectCode('arrangement_reference_missing'),
  );
  const { bpm: unusedBpm, ...profileWithoutBpm } = profile;
  assert.equal(unusedBpm, 135);
  assert.throws(
    () => presets.createExercisePresets([arrangement], [profileWithoutBpm]),
    expectCode('exercise_profile_default_missing'),
  );
  assert.throws(
    () => presets.createExercisePresets(
      [{ ...arrangement, chordSource: '| 9 5@8 | 5 | 1 6:m@8 | 6:m |' }],
      [profile],
    ),
    expectCode('preset_materialized_source_invalid'),
  );
  assert.throws(
    () => presets.createExercisePresets(
      [arrangement],
      [profile, { ...profile, slug: 'duplicate-source-v1' }],
    ),
    expectCode('preset_source_duplicate'),
  );
  assert.throws(
    () => presets.createExercisePresets(
      [arrangement],
      [{ ...profile, playingKey: 'A minor' }],
    ),
    expectCode('exercise_profile_key_mode_mismatch'),
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

test('exercise identity ignores practice settings but keeps musical settings', () => {
  const preset = presets.getPreset('intermediate-c-g-am-f-v1');
  const bpmChanged = parser.replaceBpmDirective(preset.source, '105');
  const countInChanged = parser.replaceCountInDirective(preset.source, '2');
  const rampChanged = parser.replaceTempoRampDirective(preset.source, '+5/3/120');
  const speedUpChanged = parser.replaceTempoRampDirective(
    parser.replaceBpmDirective(preset.source, '40'),
    '+5/3/80',
  );

  for (const source of [preset.source, bpmChanged, countInChanged, rampChanged, speedUpChanged]) {
    assert.equal(presets.findPresetByExerciseIdentity(source), preset);
  }

  assert.equal(
    presets.findPresetByExerciseIdentity(preset.source.replace('| C | G | Am | F |', '| C | D | Am | F |')),
    null,
  );
  assert.equal(
    presets.findPresetByExerciseIdentity(parser.replaceCapoDirective(preset.source, '2')),
    null,
  );
  assert.equal(
    presets.findPresetByExerciseIdentity(parser.replaceSwingDirective(preset.source, '60')),
    null,
  );
  assert.equal(presets.findPresetByExerciseIdentity('not an arrangement'), null);
});

test('exercise identity can select another matching exercise profile', () => {
  const melody = presets.getPreset('viva-la-vida-melody-backing-c-v1');
  const strumming = presets.getPreset('viva-la-vida-syncopated-strumming-g-v1');
  const changedKey = parser.replaceKeyDirective(melody.source, 'G major');
  assert.equal(presets.findPresetByExerciseIdentity(changedKey), strumming);
  assert.equal(
    presets.findPresetByExerciseIdentity(
      parser.replaceOriginalKeyDirective(melody.source, 'Bb major'),
    ),
    null,
  );
});

test('catalog exercise identities reject practice-setting ambiguity', () => {
  const first = presets.getPreset('intermediate-c-g-am-f-v1');
  const second = {
    ...first,
    slug: 'same-exercise-v1',
    source: parser.replaceBpmDirective(first.source, '105'),
  };
  assert.throws(
    () => presets.validatePresetExerciseIdentities([first, second]),
    expectCode('preset_exercise_identity_duplicate'),
  );
  assert.throws(
    () => presets.validatePresetExerciseIdentities([{ ...second, source: 'invalid' }]),
    expectCode('preset_exercise_identity_invalid'),
  );
});

test('materialized preset source uses a preset URL and edited source uses a full URL', async () => {
  const preset = presets.getPreset('viva-la-vida-melody-backing-c-v1');
  const editedSource = preset.source.replace('bpm: 135', 'bpm: 100');
  assert.equal(presets.findPresetBySource(preset.source), preset);
  assert.equal(presets.findPresetBySource(editedSource), null);

  const presetUrl = presets.createPresetUrl(preset.slug, 'https://example.test/tool');
  assert.equal(new URL(presetUrl.url).searchParams.get('preset'), preset.slug);
  const sourceUrl = await share.createShareUrl(editedSource, 'https://example.test/tool');
  assert.equal(new URL(sourceUrl.url).searchParams.get('preset'), null);
  assert.ok(new URL(sourceUrl.url).searchParams.has('song'));
});

test('the page loads the preset catalog before the application', () => {
  const html = fs.readFileSync(
    path.join(__dirname, '..', 'tools', 'guitar-strumming', 'index.html'),
    'utf8',
  );
  assert.ok(html.indexOf('src="./preset-catalog.js?') < html.indexOf('src="./app.js?'));
  assert.match(html, /id="song-preset"/);
  assert.match(html, /id="preset-notice-heading"/);
  assert.ok(html.indexOf('id="preset-notice-heading"') > html.indexOf('id="strum-sound-test"'));
});
