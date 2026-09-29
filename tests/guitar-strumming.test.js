'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const catalog = require('../tools/guitar-strumming/catalog.js');
const core = require('../tools/guitar-strumming/core.js');
const harmony = require('../tools/guitar-strumming/harmony.js');
const parser = require('../tools/guitar-strumming/parser.js');
const siteI18n = require('../assets/i18n.js');
const guitarI18n = require('../tools/guitar-strumming/i18n.js');
require('../tools/guitar-strumming/audio-engine.js');

const audioApi = globalThis.GuitarStrummingAudio;

const expectedChordIdentifiers = [
  'A', 'Am', 'Bb', 'Bm', 'C', 'Cm', 'D', 'Dm', 'Em', 'F', 'F#m', 'G',
  'Am7', 'C7', 'Cmaj7', 'D7', 'G7', 'Cadd9', 'Dsus4', 'G5',
  'Am/G', 'C/E', 'D/F#', 'G/B',
];

function makeStrum(direction, overrides = {}) {
  return {
    direction,
    stringCount: overrides.stringCount ?? null,
    articulation: overrides.articulation || 'normal',
    accented: overrides.accented || false,
  };
}

class FakeAudioParam {
  constructor() {
    this.value = 0;
    this.events = [];
  }

  setValueAtTime(value, time) {
    this.value = value;
    this.events.push({ method: 'set', value, time });
  }

  exponentialRampToValueAtTime(value, time) {
    this.value = value;
    this.events.push({ method: 'ramp', value, time });
  }

  cancelScheduledValues(time) {
    this.events.push({ method: 'cancel', time });
  }
}

class FakeAudioNode {
  connect() {}

  disconnect() {}
}

class FakeSourceNode extends FakeAudioNode {
  addEventListener() {}

  start(time) {
    this.startTime = time;
  }

  stop(time) {
    this.stopTime = time;
  }
}

class FakeAudioContext {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
    this.sampleRate = 1000;
    this.destination = new FakeAudioNode();
    this.sources = [];
    this.filters = [];
    this.gains = [];
  }

  createGain() {
    const node = new FakeAudioNode();
    node.gain = new FakeAudioParam();
    this.gains.push(node);
    return node;
  }

  createDynamicsCompressor() {
    const node = new FakeAudioNode();
    node.threshold = new FakeAudioParam();
    node.knee = new FakeAudioParam();
    node.ratio = new FakeAudioParam();
    node.attack = new FakeAudioParam();
    node.release = new FakeAudioParam();
    return node;
  }

  createBufferSource() {
    const node = new FakeSourceNode();
    this.sources.push(node);
    return node;
  }

  createBiquadFilter() {
    const node = new FakeAudioNode();
    node.frequency = new FakeAudioParam();
    node.Q = new FakeAudioParam();
    this.filters.push(node);
    return node;
  }

  createBuffer(channelCount, frameCount) {
    assert.equal(channelCount, 1);
    const samples = new Float32Array(frameCount);
    return {
      length: frameCount,
      getChannelData: () => samples,
    };
  }
}

function renderStrum(stringPitches, strum) {
  const engine = new audioApi.GuitarAudioEngine();
  engine.ensureContext();
  engine.playStrum(stringPitches, strum, 1);
  return engine.context;
}

function makeDemonstrationSong({ bpm = 100, gridSize = 8, swingPercent = null } = {}) {
  const pattern = Array.from({ length: gridSize }, (_, index) => (
    [
      makeStrum('D'),
      makeStrum(null),
      makeStrum('D'),
      makeStrum('U'),
      makeStrum(null),
      makeStrum('U'),
      makeStrum('D'),
      makeStrum('U'),
    ][index % 8]
  ));
  return {
    bpm,
    capoFret: 0,
    swingPercent,
    gridSize,
    chordBars: [
      [{ chord: 'C', slot: 1 }, { chord: 'G/B', slot: gridSize }],
      [{ chord: 'G/B', slot: 1 }],
      [{ chord: 'Am', slot: 1 }, { chord: 'F', slot: gridSize }],
      [{ chord: 'F', slot: 1 }],
    ],
    strumBars: [pattern, pattern, pattern, pattern],
  };
}

const validSource = `4/4#8
bpm: 100
count-in: 1
tempo-ramp: off
capo: 0
swing: off

chords:
| C G/B@8 | G/B | Am F@8 | F |

strum:
| D - D U - U D U | x4`;

const validNumberSource = `4/4#8
bpm: 100
count-in: 1
tempo-ramp: off
original-key: Bb major
key: Bb major
notation: numbers
capo: 3
swing: off

chords:
| 1/3 | 4:add9 | 5:7 | 6:m |

strum:
| D - D U - U D U | x4`;

const transposableNumberSource = `4/4#8
bpm: 100
count-in: 1
tempo-ramp: off
original-key: G major
key: D major
notation: numbers
capo: 0
swing: off

chords:
| 1 | 4 | 5 | 6:m |

strum:
| D - D U - U D U | x4`;

test('key parsing uses canonical major and natural-minor spellings', () => {
  const aSharp = harmony.parseKey('A# major');
  const bFlatUnicode = harmony.parseKey('B♭ major');
  const aMinor = harmony.parseKey('A minor');

  assert.equal(aSharp.ok, true);
  assert.equal(aSharp.key.canonicalText, 'Bb major');
  assert.deepEqual(aSharp.key.scale, ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A']);
  assert.equal(bFlatUnicode.key.canonicalText, 'Bb major');
  assert.deepEqual(aMinor.key.scale, ['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  assert.equal(harmony.parseKey('H major').code, 'key_format');
});

test('number chords use explicit qualities, accidentals, bass degrees, and capo shapes', () => {
  const playingKey = harmony.parseKey('Bb major').key;
  const examples = [
    ['1/3', 'Bb/D', 'G/B'],
    ['4:add9', 'Ebadd9', 'Cadd9'],
    ['5:7', 'F7', 'D7'],
    ['6:m', 'Gm', 'Em'],
  ];

  for (const [token, soundingChord, shapeChord] of examples) {
    const parsed = harmony.parseNumberChord(token);
    const resolved = harmony.resolveNumberChord(parsed.chord, playingKey, 3);
    assert.equal(parsed.ok, true);
    assert.equal(resolved.soundingChord, soundingChord);
    assert.equal(resolved.shapeChord, shapeChord);
    assert.equal(resolved.shapeKey.canonicalText, 'G major');
  }

  const altered = harmony.parseNumberChord('#4:m7');
  assert.equal(altered.chord.degree, 4);
  assert.equal(altered.chord.rootAccidental, 1);
  assert.equal(altered.chord.quality, 'm7');
  assert.equal(harmony.parseNumberChord('6m').code, 'number_chord_format');
});

test('minor number roots are mode-relative and chord quality stays explicit', () => {
  const key = harmony.parseKey('A minor').key;
  const tokens = ['1:m', '6', '3', '7'];
  const identifiers = tokens.map((token) => harmony.resolveNumberChord(
    harmony.parseNumberChord(token).chord,
    key,
    0,
  ).soundingChord);
  assert.deepEqual(identifiers, ['Am', 'F', 'C', 'G']);
  assert.equal(
    harmony.resolveNumberChord(harmony.parseNumberChord('1').chord, key, 0).soundingChord,
    'A',
  );
  assert.equal(
    harmony.resolveNumberChord(harmony.parseNumberChord('#7').chord, key, 0).soundingChord,
    'G#',
  );
  assert.equal(
    harmony.resolveNumberChord(harmony.parseNumberChord('6').chord, key, 0).soundingChord,
    'F',
  );
  assert.equal(
    harmony.resolveNumberChord(harmony.parseNumberChord('6:m').chord, key, 0).soundingChord,
    'Fm',
  );
});

test('capo configurations report supported and missing shape chords', () => {
  const key = harmony.parseKey('Bb major').key;
  const chords = ['1/3', '4:add9', '5:7', '6:m']
    .map((token) => harmony.parseNumberChord(token).chord);
  const configurations = harmony.listCapoConfigurations(chords, key, catalog);
  const capoThree = configurations.find((configuration) => configuration.capoFret === 3);
  const noCapo = configurations.find((configuration) => configuration.capoFret === 0);

  assert.equal(configurations.length, 13);
  assert.equal(capoThree.shapeKey.canonicalText, 'G major');
  assert.deepEqual(capoThree.progression, ['G/B', 'Cadd9', 'D7', 'Em']);
  assert.deepEqual(capoThree.shapes, ['G/B', 'Cadd9', 'D7', 'Em']);
  assert.equal(capoThree.available, true);
  assert.equal(noCapo.available, false);
  assert.ok(noCapo.missingShapes.includes('Bb/D'));
});

test('the parser resolves a number arrangement into playable shape chords', () => {
  const result = parser.parseSongSource(validNumberSource, { catalog });
  assert.equal(result.ok, true);
  assert.equal(result.song.notation, 'numbers');
  assert.equal(result.song.originalKey.canonicalText, 'Bb major');
  assert.equal(result.song.playingKey.canonicalText, 'Bb major');
  assert.equal(result.song.capoFret, 3);
  assert.deepEqual(
    result.song.chordBars.map((bar) => bar[0].chord),
    ['G/B', 'Cadd9', 'D7', 'Em'],
  );
  assert.deepEqual(
    result.song.chordBars.map((bar) => bar[0].soundingChord),
    ['Bb/D', 'Ebadd9', 'F7', 'Gm'],
  );
  assert.deepEqual(
    core.normalizeSong(result.song).events.filter((event) => event.slotIndex === 1)
      .map((event) => event.activeChord),
    ['G/B', 'Cadd9', 'D7', 'Em'],
  );
});

test('playing-key changes preserve the original key, number tokens, and capo', () => {
  const changedSource = parser.replaceKeyDirective(transposableNumberSource, 'G major');
  const result = parser.parseSongSource(changedSource, { catalog });

  assert.equal(result.ok, true);
  assert.equal(result.song.originalKey.canonicalText, 'G major');
  assert.equal(result.song.playingKey.canonicalText, 'G major');
  assert.equal(result.song.capoFret, 0);
  assert.deepEqual(
    result.song.chordBars.map((bar) => bar[0].sourceChord),
    ['1', '4', '5', '6:m'],
  );
  assert.deepEqual(
    result.song.chordBars.map((bar) => bar[0].soundingChord),
    ['G', 'C', 'D', 'Em'],
  );
});

test('an original B-flat arrangement can sound in G with no capo', () => {
  const source = validNumberSource
    .replace('\nkey: Bb major', '\nkey: G major')
    .replace('capo: 3', 'capo: 0')
    .replace('| 1/3 | 4:add9 | 5:7 | 6:m |', '| 1 | 5 | 6:m | 4 |');
  const result = parser.parseSongSource(source, { catalog });

  assert.equal(result.ok, true);
  assert.equal(result.song.originalKey.canonicalText, 'Bb major');
  assert.equal(result.song.playingKey.canonicalText, 'G major');
  assert.deepEqual(
    result.song.chordBars.map((bar) => bar[0].soundingChord),
    ['G', 'D', 'Em', 'C'],
  );
});

test('capo changes preserve the playing key and sounding chords', () => {
  const withoutCapo = parser.parseSongSource(transposableNumberSource, { catalog });
  const withCapo = parser.parseSongSource(
    parser.replaceCapoDirective(transposableNumberSource, '2'),
    { catalog },
  );

  assert.equal(withoutCapo.ok, true);
  assert.equal(withCapo.ok, true);
  assert.equal(withCapo.song.playingKey.canonicalText, 'D major');
  assert.deepEqual(
    withCapo.song.chordBars.map((bar) => bar[0].soundingChord),
    withoutCapo.song.chordBars.map((bar) => bar[0].soundingChord),
  );
  assert.deepEqual(
    withoutCapo.song.chordBars.map((bar) => bar[0].chord),
    ['D', 'G', 'A', 'Bm'],
  );
  assert.deepEqual(
    withCapo.song.chordBars.map((bar) => bar[0].chord),
    ['C', 'F', 'G', 'Am'],
  );
});

test('returning to the original key changes only the playing key and derived chords', () => {
  const returnedSource = parser.replaceKeyDirective(transposableNumberSource, 'G major');
  assert.equal(
    returnedSource,
    transposableNumberSource.replace('key: D major', 'key: G major'),
  );
  const result = parser.parseSongSource(returnedSource, { catalog });
  assert.equal(result.ok, true);
  assert.equal(result.song.originalKey.canonicalText, 'G major');
  assert.deepEqual(
    result.song.chordBars.map((bar) => bar[0].sourceChord),
    ['1', '4', '5', '6:m'],
  );
  assert.deepEqual(
    result.song.chordBars.map((bar) => bar[0].chord),
    ['G', 'C', 'D', 'Em'],
  );
});

test('equivalent number and shape arrangements produce equivalent audio events', () => {
  const numberSong = parser.parseSongSource(validNumberSource, { catalog });
  const shapeSource = validNumberSource
    .replace('original-key: Bb major\nkey: Bb major\nnotation: numbers\n', '')
    .replace('| 1/3 | 4:add9 | 5:7 | 6:m |', '| G/B | Cadd9 | D7 | Em |');
  const shapeSong = parser.parseSongSource(shapeSource, { catalog });

  assert.equal(numberSong.ok, true);
  assert.equal(shapeSong.ok, true);
  assert.deepEqual(core.normalizeSong(numberSong.song), core.normalizeSong(shapeSong.song));
});

test('chord-guide views are read-only projections of the source', () => {
  const result = parser.parseSongSource(validNumberSource, { catalog });
  const before = JSON.stringify(result.song);

  assert.equal(
    harmony.formatChordGuide(result.song, 'shapes'),
    '| G/B | | Cadd9 | | D7 | | Em |',
  );
  assert.equal(
    harmony.formatChordGuide(result.song, 'numbers'),
    '| 1/3 | | 4:add9 | | 5:7 | | 6:m |',
  );
  assert.equal(
    harmony.formatChordGuide(result.song, 'sounding'),
    '| Bb/D | | Ebadd9 | | F7 | | Gm |',
  );
  assert.equal(JSON.stringify(result.song), before);
});

test('the practice chord guide keeps shapes in the closed student view', () => {
  const numberResult = parser.parseSongSource(validNumberSource, { catalog });
  const shapeResult = parser.parseSongSource(
    validNumberSource
      .replace('original-key: Bb major\nkey: Bb major\nnotation: numbers\n', '')
      .replace('| 1/3 | 4:add9 | 5:7 | 6:m |', '| G/B | Cadd9 | D7 | Em |'),
    { catalog },
  );

  assert.equal(
    harmony.formatPracticeChordGuide(numberResult.song, 'numbers', false),
    '| G/B | | Cadd9 | | D7 | | Em |',
  );
  assert.equal(
    harmony.formatPracticeChordGuide(numberResult.song, 'sounding', true),
    '| Bb/D | | Ebadd9 | | F7 | | Gm |',
  );
  assert.equal(
    harmony.formatPracticeChordGuide(shapeResult.song, 'numbers', true),
    '| G/B | | Cadd9 | | D7 | | Em |',
  );
});

test('number arrangements require ordered keys with matching modes', () => {
  const cases = [
    [validNumberSource.replace('original-key: Bb major\n', ''), 'original_key_missing'],
    [validNumberSource.replace('key: Bb major\n', ''), 'key_missing'],
    [validNumberSource.replace('notation: numbers\n', ''), 'notation_missing'],
    [validNumberSource.replace('notation: numbers', 'notation: nashville'), 'notation_format'],
    [validNumberSource.replace('key: Bb major', 'key: G minor'), 'key_mode_mismatch'],
    [validNumberSource.replace('original-key: Bb major', 'original-key: unknown'), 'original_key_format'],
  ];
  for (const [source, code] of cases) {
    const result = parser.parseSongSource(source, { catalog });
    assert.equal(result.ok, false, code);
    assert.ok(result.errors.some((error) => error.code === code), code);
  }
});

test('number arrangements report duplicated number directives', () => {
  const cases = [
    [validNumberSource.replace(
      'original-key: Bb major\nkey: Bb major',
      'original-key: Bb major\noriginal-key: Bb major\nkey: Bb major',
    ), 'original_key_duplicate'],
    [validNumberSource.replace(
      'key: Bb major\nnotation: numbers',
      'key: Bb major\nkey: Bb major\nnotation: numbers',
    ), 'key_duplicate'],
    [validNumberSource.replace(
      'notation: numbers\ncapo: 3',
      'notation: numbers\nnotation: numbers\ncapo: 3',
    ), 'notation_duplicate'],
  ];
  for (const [source, code] of cases) {
    const result = parser.parseSongSource(source, { catalog });
    assert.equal(result.ok, false);
    assert.equal(result.errors[0].code, code);
    assert.ok(Number.isInteger(result.errors[0].line));
  }
});

test('number arrangements reject named tokens and unsupported resolved shapes', () => {
  const named = parser.parseSongSource(validNumberSource.replace('1/3', 'G/B'), { catalog });
  const unsupported = parser.parseSongSource(validNumberSource.replace('1/3', '3:7'), { catalog });

  assert.ok(named.errors.some((error) => error.code === 'number_chord_format'));
  const error = unsupported.errors.find((item) => item.code === 'number_shape_unsupported');
  assert.equal(error.parameters.token, '3:7');
  assert.equal(error.parameters.soundingChord, 'D7');
  assert.equal(error.parameters.shapeChord, 'B7');
  assert.equal(unsupported.candidateSong.notation, 'numbers');
  assert.equal(unsupported.candidateSong.chordBars[0][0].numberChord.normalized, '3:7');
});

test('the initial catalog contains the 24 required chord identifiers', () => {
  assert.deepEqual(catalog.listCanonicalIdentifiers(), expectedChordIdentifiers);
  for (const identifier of expectedChordIdentifiers) {
    const entry = catalog.getChord(identifier);
    const voicing = catalog.getDefaultVoicing(identifier);
    assert.equal(entry.id, identifier);
    assert.ok(voicing);
    assert.equal(voicing.frets.length, 6);
    for (const fret of voicing.frets) {
      assert.ok(fret === 'x' || (Number.isInteger(fret) && fret >= 0));
    }
  }
  assert.equal(catalog.getChord('Bdim'), null);
});

test('stroke direction skips excluded strings and reverses string order', () => {
  const dVoicing = core.resolveVoicingPitches(catalog.getDefaultVoicing('D').frets);
  assert.deepEqual(core.selectStringIndexes(dVoicing, 'D', null), [2, 3, 4, 5]);
  assert.deepEqual(core.selectStringIndexes(dVoicing, 'U', null), [5, 4, 3, 2]);
});

test('partial strums select low or high playable pitches', () => {
  const pitches = [60, 45, 'x', 55, 59, 64];
  assert.deepEqual(core.selectStringIndexes(pitches, 'D', null), [1, 3, 4, 0, 5]);
  assert.deepEqual(core.selectStringIndexes(pitches, 'U', null), [5, 0, 4, 3, 1]);
  assert.deepEqual(core.selectStringIndexes(pitches, 'D', 2), [1, 3]);
  assert.deepEqual(core.selectStringIndexes(pitches, 'U', 3), [5, 0, 4]);
  assert.deepEqual(core.selectStringIndexes(['x', 'x', 'x', 55, 59, 64], 'D', 4), [3, 4, 5]);
});

test('the audio engine gives each articulation a distinct envelope and sound path', (context) => {
  const originalAudioContext = globalThis.AudioContext;
  globalThis.AudioContext = FakeAudioContext;
  context.after(() => {
    if (originalAudioContext === undefined) {
      delete globalThis.AudioContext;
    } else {
      globalThis.AudioContext = originalAudioContext;
    }
  });

  const pitches = core.resolveVoicingPitches(catalog.getDefaultVoicing('C').frets);
  const normal = renderStrum(pitches, makeStrum('D', { stringCount: 2 }));
  const accented = renderStrum(
    pitches,
    makeStrum('D', { stringCount: 2, accented: true }),
  );
  const palmMute = renderStrum(
    pitches,
    makeStrum('D', { stringCount: 2, articulation: 'palm-mute' }),
  );
  const accentedPalmMute = renderStrum(
    pitches,
    makeStrum('D', { stringCount: 2, articulation: 'palm-mute', accented: true }),
  );
  const dead = renderStrum(
    pitches,
    makeStrum('U', { stringCount: 3, articulation: 'dead' }),
  );
  const accentedDead = renderStrum(
    pitches,
    makeStrum('U', { stringCount: 3, articulation: 'dead', accented: true }),
  );

  assert.equal(normal.sources.length, 2);
  assert.equal(palmMute.sources.length, 2);
  assert.equal(dead.sources.length, 3);
  assert.equal(normal.filters[0].type, 'lowpass');
  assert.equal(palmMute.filters[0].type, 'lowpass');
  assert.ok(palmMute.filters[0].frequency.value < normal.filters[0].frequency.value);
  assert.ok(palmMute.sources[0].stopTime < normal.sources[0].stopTime);
  assert.ok(accented.filters[0].frequency.value > normal.filters[0].frequency.value);
  assert.ok(accentedPalmMute.filters[0].frequency.value > palmMute.filters[0].frequency.value);
  assert.equal(dead.filters[0].type, 'bandpass');
  assert.equal(dead.sources[0].buffer.length, 110);

  const normalPeak = normal.gains[1].gain.events.find((event) => event.method === 'ramp').value;
  const accentPeak = accented.gains[1].gain.events.find((event) => event.method === 'ramp').value;
  assert.ok(accentPeak > normalPeak);
  const normalPeakTime = normal.gains[1].gain.events.find((event) => event.method === 'ramp').time;
  const accentPeakTime = accented.gains[1].gain.events.find((event) => event.method === 'ramp').time;
  assert.ok(accentPeakTime < normalPeakTime);
  const deadPeak = dead.gains[1].gain.events.find((event) => event.method === 'ramp').value;
  const accentedDeadPeak = accentedDead.gains[1].gain.events
    .find((event) => event.method === 'ramp').value;
  assert.ok(accentedDeadPeak > deadPeak);
});

test('the core resolves a catalog voicing to six string pitches', () => {
  const cVoicing = catalog.getDefaultVoicing('C').frets;
  assert.deepEqual(core.resolveVoicingPitches(cVoicing), ['x', 48, 52, 55, 60, 64]);
});

test('capo raises every played string and preserves muted strings', () => {
  const cVoicing = catalog.getDefaultVoicing('C').frets;
  assert.deepEqual(core.resolveVoicingPitches(cVoicing, 2), ['x', 50, 54, 57, 62, 66]);

  const allStrings = core.resolveVoicingPitches([0, 1, 2, 3, 4, 5], 12);
  assert.deepEqual(allStrings, [52, 58, 64, 70, 75, 81]);
  assert.throws(() => core.resolveVoicingPitches(cVoicing, 13), /0 through 12/);
});

test('a chord change is active before a strum at the same slot', () => {
  const timeline = core.normalizeSong(makeDemonstrationSong());
  const event = timeline.events.find((item) => item.barIndex === 1 && item.slotIndex === 8);
  assert.equal(event.direction, 'U');
  assert.equal(event.stringCount, null);
  assert.equal(event.articulation, 'normal');
  assert.equal(event.accented, false);
  assert.equal(event.activeChord, 'G/B');
});

test('event timestamps do not accumulate drift through 1,000 loops', () => {
  for (const gridSize of [8, 16, 24]) {
    for (const bpm of [30, 300]) {
      const timeline = core.normalizeSong(makeDemonstrationSong({ bpm, gridSize }));
      const event = core.playableEvents(timeline).at(-1);
      const slotDuration = core.slotDurationSeconds(bpm, gridSize);
      const originTime = 12.345;
      for (let loopIndex = 0; loopIndex < 1000; loopIndex += 1) {
        const expected = originTime
          + ((loopIndex * timeline.durationSlots + event.absoluteSlotIndex) * slotDuration);
        const actual = core.eventTimeSeconds(originTime, loopIndex, event, timeline);
        assert.ok(Math.abs(actual - expected) <= 0.000001);
      }
    }
  }
});

test('50 percent swing is equivalent to straight timing', () => {
  for (const gridSize of [8, 16, 24]) {
    const slotDuration = core.slotDurationSeconds(137, gridSize);
    for (let slotPosition = 0; slotPosition <= gridSize * 2; slotPosition += 1) {
      const expected = slotPosition * slotDuration;
      assert.ok(Math.abs(
        core.slotPositionSeconds(slotPosition, 137, gridSize, null) - expected,
      ) <= 0.000000001);
      assert.ok(Math.abs(
        core.slotPositionSeconds(slotPosition, 137, gridSize, 50) - expected,
      ) <= 0.000000001);
    }
  }
});

test('swing divides eighth-note pairs across every supported grid', () => {
  const expectedFirstBeatOffsets = new Map([
    [8, [0, 0.6, 1]],
    [16, [0, 0.3, 0.6, 0.8, 1]],
    [24, [0, 0.2, 0.4, 0.6, 0.7333333333333333, 0.8666666666666667, 1]],
  ]);
  for (const [gridSize, expectedOffsets] of expectedFirstBeatOffsets) {
    const actualOffsets = expectedOffsets.map((unused, slotPosition) => (
      core.slotPositionSeconds(slotPosition, 60, gridSize, 60)
    ));
    actualOffsets.forEach((actual, index) => {
      assert.ok(Math.abs(actual - expectedOffsets[index]) <= 0.000000001);
    });
  }
});

test('swing keeps beat, bar, loop, and repeated-loop boundaries unchanged', () => {
  for (const gridSize of [8, 16, 24]) {
    const straight = core.normalizeSong(makeDemonstrationSong({ bpm: 123, gridSize }));
    const swung = core.normalizeSong(makeDemonstrationSong({
      bpm: 123,
      gridSize,
      swingPercent: 67,
    }));
    const beatSlots = gridSize / 4;
    for (let beatIndex = 0; beatIndex <= 4; beatIndex += 1) {
      assert.equal(
        core.slotPositionSeconds(beatIndex * beatSlots, 123, gridSize, 67),
        beatIndex * (60 / 123),
      );
    }
    assert.equal(core.cycleDurationSeconds(swung), core.cycleDurationSeconds(straight));

    const event = core.playableEvents(swung).at(-1);
    const firstTime = core.eventTimeSeconds(12.345, 0, event, swung);
    const distantTime = core.eventTimeSeconds(12.345, 999, event, swung);
    assert.ok(Math.abs(
      (distantTime - firstTime) - (999 * core.cycleDurationSeconds(swung)),
    ) <= 0.000001);
  }
});

test('the swung playhead converts audio time back to its source slot', () => {
  for (const gridSize of [8, 16, 24]) {
    const timeline = core.normalizeSong(makeDemonstrationSong({
      bpm: 115,
      gridSize,
      swingPercent: 67,
    }));
    const positions = [0, 0.5, 1, (gridSize / 4) + 0.5, gridSize - 0.5];
    for (const slotPosition of positions) {
      const audioTime = 7 + core.slotPositionSeconds(slotPosition, 115, gridSize, 67);
      const recovered = core.playheadSlotAtTime(7, audioTime, timeline);
      assert.ok(Math.abs(recovered - slotPosition) <= 0.000001);
    }
  }
});

test('a 100 millisecond UI stall does not miss an event with the prototype horizon', () => {
  const timeline = core.normalizeSong(makeDemonstrationSong({ bpm: 300, gridSize: 24 }));
  const events = core.playableEvents(timeline);
  const originTime = 0.05;
  const firstBatch = core.collectScheduleBatch({
    timeline,
    events,
    cursor: core.createScheduleCursor(),
    originTime,
    now: 0,
    horizonTime: 0.2,
  });
  const afterStall = core.collectScheduleBatch({
    timeline,
    events,
    cursor: firstBatch.cursor,
    originTime,
    now: 0.1,
    horizonTime: 0.3,
  });
  assert.equal(firstBatch.skipped.length, 0);
  assert.equal(afterStall.skipped.length, 0);
});

test('recovery from a longer UI stall skips late events without scheduling a burst', () => {
  const timeline = core.normalizeSong(makeDemonstrationSong({ bpm: 300, gridSize: 24 }));
  const events = core.playableEvents(timeline);
  const originTime = 0.05;
  const firstBatch = core.collectScheduleBatch({
    timeline,
    events,
    cursor: core.createScheduleCursor(),
    originTime,
    now: 0,
    horizonTime: 0.2,
  });
  const recoveredBatch = core.collectScheduleBatch({
    timeline,
    events,
    cursor: firstBatch.cursor,
    originTime,
    now: 0.5,
    horizonTime: 0.7,
  });
  assert.ok(recoveredBatch.skipped.length > 0);
  assert.ok(recoveredBatch.scheduled.length > 0);
  assert.ok(recoveredBatch.scheduled.every((event) => event.eventTime >= 0.5));
});

test('the parser accepts whitespace, lowercase strums, and repeats in both sections', () => {
  const source = `
    4/4 # 8
    bpm: 120
    count-in: 2
    tempo-ramp: off
    capo: 0
    swing: off

    chords:
    | C G/B@8 | x2

    strum:
    | d - d u - u d u | x2
  `;
  const result = parser.parseSongSource(source, { catalog });
  assert.equal(result.ok, true);
  assert.equal(result.song.bpm, 120);
  assert.equal(result.song.countInBars, 2);
  assert.equal(result.song.gridSize, 8);
  assert.equal(result.song.chordBars.length, 2);
  assert.equal(result.song.strumBars.length, 2);
  assert.deepEqual(result.song.strumBars[0], [
    makeStrum('D'),
    makeStrum(null),
    makeStrum('D'),
    makeStrum('U'),
    makeStrum(null),
    makeStrum('U'),
    makeStrum('D'),
    makeStrum('U'),
  ]);
});

test('the parser normalizes string range, articulation, and accent modifiers', () => {
  const source = validSource.replace(
    'D - D U - U D U',
    'd u! d4 U4 d3p D2P! u3x U4X!',
  );
  const result = parser.parseSongSource(source, { catalog });
  assert.equal(result.ok, true);
  assert.deepEqual(result.song.strumBars[0], [
    makeStrum('D'),
    makeStrum('U', { accented: true }),
    makeStrum('D', { stringCount: 4 }),
    makeStrum('U', { stringCount: 4 }),
    makeStrum('D', { stringCount: 3, articulation: 'palm-mute' }),
    makeStrum('D', { stringCount: 2, articulation: 'palm-mute', accented: true }),
    makeStrum('U', { stringCount: 3, articulation: 'dead' }),
    makeStrum('U', { stringCount: 4, articulation: 'dead', accented: true }),
  ]);

  const timeline = core.normalizeSong(result.song);
  assert.deepEqual(
    timeline.events.slice(0, 8).map((event) => ({
      direction: event.direction,
      stringCount: event.stringCount,
      articulation: event.articulation,
      accented: event.accented,
    })),
    result.song.strumBars[0],
  );
});

test('the parser rejects unsupported modifiers and modifier order', () => {
  const invalidTokens = ['D5', 'DP3', 'D!3', 'D3PX', 'D3Q', 'D!!', 'X', 'DD', '-!'];
  for (const token of invalidTokens) {
    const source = validSource.replace('D - D U - U D U', `${token} - D U - U D U`);
    const result = parser.parseSongSource(source, { catalog });
    const error = result.errors.find((item) => item.code === 'strum_token_invalid');
    assert.ok(error, `${token} was not rejected`);
    assert.equal(error.line, 12);
    assert.equal(error.section, 'strum');
    assert.equal(error.bar, 1);
    assert.equal(error.slot, 1);
  }
});

test('single-token parsing uses the song token grammar', () => {
  const valid = parser.parseStrumTokenValue('d3p!');
  assert.equal(valid.ok, true);
  assert.deepEqual(
    valid.strum,
    makeStrum('D', { stringCount: 3, articulation: 'palm-mute', accented: true }),
  );
  const invalid = parser.parseStrumTokenValue('DP3');
  assert.equal(invalid.ok, false);
  assert.equal(invalid.strum, null);
  assert.equal(invalid.errors[0].code, 'strum_token_invalid');
});

test('the parser accepts byte order mark input and CRLF line ends', () => {
  const source = `\uFEFF${validSource.replace(/\n/g, '\r\n')}`;
  const result = parser.parseSongSource(source, { catalog });
  assert.equal(result.ok, true);
});

test('the parser reports empty and incomplete input', () => {
  const empty = parser.parseSongSource('  \n', { catalog });
  assert.equal(empty.errors[0].code, 'source_empty');

  const incomplete = parser.parseSongSource(
    '4/4#8\nbpm: 100\ncount-in: 1\ntempo-ramp: off\ncapo: 0\nswing: off\nchords:',
    { catalog },
  );
  assert.ok(incomplete.errors.some((error) => error.code === 'strum_section_missing'));
});

test('the parser accepts count-in values 0, 1, and 2', () => {
  for (const countInBars of [0, 1, 2]) {
    const source = validSource.replace('count-in: 1', `count-in: ${countInBars}`);
    const result = parser.parseSongSource(source, { catalog });
    assert.equal(result.ok, true);
    assert.equal(result.song.countInBars, countInBars);
  }
});

test('the parser rejects missing, duplicate, malformed, and out-of-range count-in directives', () => {
  const cases = [
    [validSource.replace('count-in: 1\n', ''), 'count_in_missing'],
    [validSource.replace('chords:', 'count-in: 2\nchords:'), 'count_in_duplicate'],
    [validSource.replace('count-in: 1', 'count-in: one'), 'count_in_format'],
    [validSource.replace('count-in: 1', 'count-in: 3'), 'count_in_range'],
  ];
  for (const [source, code] of cases) {
    const result = parser.parseSongSource(source, { catalog });
    const error = result.errors.find((item) => item.code === code);
    assert.ok(error, `${code} was not reported`);
    assert.equal(error.field, 'count-in');
  }
});

test('the parser accepts disabled and enabled tempo ramps', () => {
  const disabled = parser.parseSongSource(validSource, { catalog });
  assert.equal(disabled.ok, true);
  assert.deepEqual(disabled.song.tempoRamp, {
    enabled: false,
    stepBpm: null,
    loopsPerStep: null,
    targetBpm: null,
  });

  const enabled = parser.parseSongSource(
    validSource.replace('tempo-ramp: off', 'tempo-ramp: +5 / 2 / 120'),
    { catalog },
  );
  assert.equal(enabled.ok, true);
  assert.deepEqual(enabled.song.tempoRamp, {
    enabled: true,
    stepBpm: 5,
    loopsPerStep: 2,
    targetBpm: 120,
  });
  assert.ok(Object.isFrozen(enabled.song.tempoRamp));
});

test('the parser rejects missing, duplicate, and misplaced tempo-ramp directives', () => {
  const cases = [
    [validSource.replace('tempo-ramp: off\n', ''), 'tempo_ramp_missing'],
    [validSource.replace('chords:', 'tempo-ramp: off\nchords:'), 'tempo_ramp_duplicate'],
    [validSource.replace('strum:', 'tempo-ramp: off\nstrum:'), 'tempo_ramp_duplicate'],
  ];
  for (const [source, code] of cases) {
    const result = parser.parseSongSource(source, { catalog });
    const error = result.errors.find((item) => item.code === code);
    assert.ok(error, `${code} was not reported`);
    assert.equal(error.field, 'tempo-ramp');
  }
});

test('the parser reports independent tempo-ramp field errors', () => {
  const cases = [
    ['5/2/120', 'tempo_ramp_sign', 'tempo-ramp-step'],
    ['+five/2/120', 'tempo_ramp_step_format', 'tempo-ramp-step'],
    ['+0/2/120', 'tempo_ramp_step_range', 'tempo-ramp-step'],
    ['+5/two/120', 'tempo_ramp_loops_format', 'tempo-ramp-loops'],
    ['+5/100/120', 'tempo_ramp_loops_range', 'tempo-ramp-loops'],
    ['+5/2/one-twenty', 'tempo_ramp_target_format', 'tempo-ramp-target'],
    ['+5/2/301', 'tempo_ramp_target_range', 'tempo-ramp-target'],
    ['+5/2/100', 'tempo_ramp_target_start', 'tempo-ramp-target'],
  ];
  for (const [value, code, field] of cases) {
    const source = validSource.replace('tempo-ramp: off', `tempo-ramp: ${value}`);
    const result = parser.parseSongSource(source, { catalog });
    const error = result.errors.find((item) => item.code === code);
    assert.ok(error, `${code} was not reported`);
    assert.equal(error.field, field);
  }

  const combined = parser.parseSongSource(
    validSource.replace('tempo-ramp: off', 'tempo-ramp: +0/100/301'),
    { catalog },
  );
  assert.deepEqual(
    combined.errors.map((error) => error.field),
    ['tempo-ramp-step', 'tempo-ramp-loops', 'tempo-ramp-target'],
  );
});

test('the parser accepts capo frets 0 through 12', () => {
  for (const capoFret of [0, 1, 7, 12]) {
    const source = validSource.replace('capo: 0', `capo: ${capoFret}`);
    const result = parser.parseSongSource(source, { catalog });
    assert.equal(result.ok, true);
    assert.equal(result.song.capoFret, capoFret);
    assert.equal(core.normalizeSong(result.song).capoFret, capoFret);
  }
});

test('the parser rejects missing, duplicate, misplaced, and invalid capo directives', () => {
  const cases = [
    [validSource.replace('capo: 0\n', ''), 'capo_missing'],
    [validSource.replace('chords:', 'capo: 2\nchords:'), 'capo_duplicate'],
    [validSource.replace('strum:', 'capo: 2\nstrum:'), 'capo_duplicate'],
    [validSource.replace('capo: 0', 'capo: one'), 'capo_format'],
    [validSource.replace('capo: 0', 'capo: 1.5'), 'capo_format'],
    [validSource.replace('capo: 0', 'capo: 13'), 'capo_range'],
  ];
  for (const [source, code] of cases) {
    const result = parser.parseSongSource(source, { catalog });
    const error = result.errors.find((item) => item.code === code);
    assert.ok(error, `${code} was not reported`);
    assert.equal(error.field, 'capo');
  }
});

test('the parser accepts disabled and numeric swing values', () => {
  const disabled = parser.parseSongSource(validSource, { catalog });
  assert.equal(disabled.ok, true);
  assert.equal(disabled.song.swingPercent, null);

  for (const swingPercent of [50, 62, 67, 75]) {
    const source = validSource.replace('swing: off', `swing: ${swingPercent}`);
    const result = parser.parseSongSource(source, { catalog });
    assert.equal(result.ok, true);
    assert.equal(result.song.swingPercent, swingPercent);
    assert.equal(core.normalizeSong(result.song).swingPercent, swingPercent);
  }
});

test('the parser rejects missing, duplicate, misplaced, and invalid swing directives', () => {
  const cases = [
    [validSource.replace('swing: off\n', ''), 'swing_missing'],
    [validSource.replace('chords:', 'swing: 60\nchords:'), 'swing_duplicate'],
    [validSource.replace('strum:', 'swing: 60\nstrum:'), 'swing_duplicate'],
    [validSource.replace('swing: off', 'swing: triplet'), 'swing_format'],
    [validSource.replace('swing: off', 'swing: 67.5'), 'swing_format'],
    [validSource.replace('swing: off', 'swing: 49'), 'swing_range'],
    [validSource.replace('swing: off', 'swing: 76'), 'swing_range'],
  ];
  for (const [source, code] of cases) {
    const result = parser.parseSongSource(source, { catalog });
    const error = result.errors.find((item) => item.code === code);
    assert.ok(error, `${code} was not reported`);
    assert.equal(error.field, 'swing');
  }
});

test('the parser expands xN to N total bars', () => {
  const result = parser.parseSongSource(validSource, { catalog });
  assert.equal(result.ok, true);
  assert.equal(result.song.chordBars.length, 4);
  assert.equal(result.song.strumBars.length, 4);
});

test('the parser rejects document-order and unknown-directive errors', () => {
  const wrongOrder = parser.parseSongSource(`4/4#8
tempo: 100
count-in: 1
tempo-ramp: off
capo: 0
swing: off
chords:
| C |
strum:
| D - D - D - D - |`, { catalog });
  assert.equal(wrongOrder.ok, false);
  assert.ok(wrongOrder.errors.some((error) => error.code === 'unknown_directive'));

  const unknownInSection = parser.parseSongSource(`${validSource}
foo: bar`, { catalog });
  assert.equal(unknownInSection.ok, false);
  assert.ok(unknownInSection.errors.some((error) => error.code === 'unknown_directive'));
});

test('the parser rejects invalid BPM and grid values', () => {
  const badGrid = parser.parseSongSource(validSource.replace('4/4#8', '4/4#12'), { catalog });
  const badBpm = parser.parseSongSource(validSource.replace('bpm: 100', 'bpm: 30.5'), { catalog });
  assert.ok(badGrid.errors.some((error) => error.code === 'grid_range'));
  assert.ok(badBpm.errors.some((error) => error.code === 'bpm_format'));
});

test('the parser rejects invalid chord-change slots with musical locations', () => {
  const cases = [
    ['| C@1 |', 'chord_start_explicit_slot'],
    ['| C G |', 'chord_change_slot_missing'],
    ['| C G@9 |', 'chord_change_slot_range'],
    ['| C G@5 Am@5 |', 'chord_change_slot_order'],
    ['| C G@6 Am@4 |', 'chord_change_slot_order'],
  ];
  for (const [barSource, code] of cases) {
    const source = validSource.replace('| C G/B@8 | G/B | Am F@8 | F |', barSource);
    const result = parser.parseSongSource(source, { catalog });
    const error = result.errors.find((item) => item.code === code);
    assert.ok(error, `${code} was not reported`);
    assert.equal(error.section, 'chords');
    assert.equal(error.line, 9);
  }
});

test('the parser rejects unsupported chords and reports their source bar', () => {
  const source = validSource.replace('G/B@8', 'Bdim@8');
  const result = parser.parseSongSource(source, { catalog });
  const error = result.errors.find((item) => item.code === 'chord_unsupported');
  assert.ok(error);
  assert.equal(error.line, 9);
  assert.equal(error.bar, 1);
  assert.equal(error.slot, 8);
});

test('the parser rejects invalid strum tokens and slot counts', () => {
  const source = validSource.replace('D - D U - U D U', 'D - X U');
  const result = parser.parseSongSource(source, { catalog });
  assert.ok(result.errors.some((error) => error.code === 'strum_token_invalid'));
  assert.ok(result.errors.some((error) => error.code === 'strum_slot_count'));
});

test('the parser rejects repeat and expanded bar-count limits', () => {
  const invalidRepeat = parser.parseSongSource(validSource.replace('x4', 'x1'), { catalog });
  assert.ok(invalidRepeat.errors.some((error) => error.code === 'repeat_range'));

  const overflowSource = `4/4#8
bpm: 100
count-in: 1
tempo-ramp: off
capo: 0
swing: off
chords:
| C | x999 | C | x2
strum:
| D - D - D - D - | x999 | D - D - D - D - | x2`;
  const overflow = parser.parseSongSource(overflowSource, { catalog });
  assert.ok(overflow.errors.some((error) => error.code === 'repeat_overflow'));
});

test('the parser accepts the maximum single repeat count', () => {
  const source = `4/4#8
bpm: 100
count-in: 1
tempo-ramp: off
capo: 0
swing: off
chords:
| C | x999
strum:
| - - - - - - - - | x999`;
  const result = parser.parseSongSource(source, { catalog });
  assert.equal(result.ok, true);
  assert.equal(result.song.chordBars.length, 999);
});

test('the parser rejects mismatched expanded bar counts', () => {
  const result = parser.parseSongSource(validSource.replace('x4', 'x3'), { catalog });
  assert.ok(result.errors.some((error) => error.code === 'bar_count_mismatch'));
});

test('BPM replacement changes only the BPM directive value and preserves line ends', () => {
  const crlfSource = validSource.replace(/\n/g, '\r\n');
  const replaced = parser.replaceBpmDirective(crlfSource, '138');
  assert.equal(replaced, crlfSource.replace('bpm: 100', 'bpm: 138'));
  assert.equal(parser.replaceBpmDirective('4/4#8\nchords:', '100'), null);
});

test('count-in replacement changes only its value and preserves line ends', () => {
  const crlfSource = validSource.replace(/\n/g, '\r\n');
  const replaced = parser.replaceCountInDirective(crlfSource, '2');
  assert.equal(replaced, crlfSource.replace('count-in: 1', 'count-in: 2'));
  assert.equal(parser.replaceCountInDirective('4/4#8\nbpm: 100\nchords:', '1'), null);
  assert.equal(
    parser.replaceCountInDirective('count-in: 1\ncount-in: 2', '0'),
    null,
  );
});

test('key replacements change one directive and preserve CRLF line ends', () => {
  const crlfSource = validNumberSource.replace(/\n/g, '\r\n');
  assert.equal(
    parser.replaceOriginalKeyDirective(crlfSource, 'A# major'),
    crlfSource.replace('original-key: Bb major', 'original-key: A# major'),
  );
  assert.equal(
    parser.replaceKeyDirective(crlfSource, 'G major'),
    crlfSource.replace('\r\nkey: Bb major', '\r\nkey: G major'),
  );
  assert.equal(parser.replaceKeyDirective('key: G major\nkey: D major', 'C major'), null);
});

test('the original key is reference metadata and does not change musical content', () => {
  const original = parser.parseSongSource(transposableNumberSource, { catalog });
  const changed = parser.parseSongSource(
    parser.replaceOriginalKeyDirective(transposableNumberSource, 'Bb major'),
    { catalog },
  );
  assert.equal(original.ok, true);
  assert.equal(changed.ok, true);
  assert.equal(parser.musicalContentKey(original.song), parser.musicalContentKey(changed.song));
});

test('tempo-ramp replacement supports compact and spaced directive values', () => {
  const compact = parser.replaceTempoRampDirective(validSource, '+5/3/135');
  assert.equal(compact, validSource.replace('tempo-ramp: off', 'tempo-ramp: +5/3/135'));

  const spacedSource = validSource.replace('tempo-ramp: off', 'tempo-ramp: +5 / 2 / 120   ');
  const spaced = parser.replaceTempoRampDirective(spacedSource, 'off');
  assert.equal(spaced, validSource.replace('tempo-ramp: off', 'tempo-ramp: off   '));
  assert.equal(parser.replaceTempoRampDirective('tempo-ramp: off\ntempo-ramp: off', 'off'), null);
});

test('capo replacement preserves LF and CRLF line ends', () => {
  assert.equal(
    parser.replaceCapoDirective(validSource, '7'),
    validSource.replace('capo: 0', 'capo: 7'),
  );
  const crlfSource = validSource.replace(/\n/g, '\r\n');
  assert.equal(
    parser.replaceCapoDirective(crlfSource, '12'),
    crlfSource.replace('capo: 0', 'capo: 12'),
  );
  assert.equal(parser.replaceCapoDirective('capo: 0\ncapo: 1', '2'), null);
});

test('swing replacement preserves LF and CRLF line ends', () => {
  assert.equal(
    parser.replaceSwingDirective(validSource, '67'),
    validSource.replace('swing: off', 'swing: 67'),
  );
  const crlfSource = validSource.replace(/\n/g, '\r\n');
  assert.equal(
    parser.replaceSwingDirective(crlfSource, '75'),
    crlfSource.replace('swing: off', 'swing: 75'),
  );
  assert.equal(parser.replaceSwingDirective('swing: off\nswing: 60', '50'), null);
});

test('tempo-ramp enable and disable replacements preserve valid source', () => {
  const fixed135 = validSource.replace('bpm: 100', 'bpm: 135');
  const startingSource = parser.replaceBpmDirective(fixed135, '70');
  const enabledSource = parser.replaceTempoRampDirective(startingSource, '+5/3/135');
  const enabled = parser.parseSongSource(enabledSource, { catalog });
  assert.equal(enabled.ok, true);
  assert.equal(enabled.song.bpm, 70);
  assert.deepEqual(enabled.song.tempoRamp, {
    enabled: true,
    stepBpm: 5,
    loopsPerStep: 3,
    targetBpm: 135,
  });

  const targetSource = parser.replaceBpmDirective(enabledSource, '135');
  const disabledSource = parser.replaceTempoRampDirective(targetSource, 'off');
  const disabled = parser.parseSongSource(disabledSource, { catalog });
  assert.equal(disabled.ok, true);
  assert.equal(disabled.song.bpm, 135);
  assert.equal(disabled.song.tempoRamp.enabled, false);
});

test('count-in events use exact quarter-note timing and accent beat 1', () => {
  const events = core.createCountInEvents(120, 2, 10);
  assert.equal(events.length, 8);
  assert.deepEqual(
    events.filter((event) => event.accented).map((event) => event.absoluteBeatIndex),
    [0, 4],
  );
  assert.deepEqual(events.map((event) => event.eventTime), [10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5]);
  assert.equal(core.countInDurationSeconds(120, 2), 4);
  assert.equal(10 + core.countInDurationSeconds(120, 2), 14);
});

test('count-in timing supports its full BPM and bar ranges', () => {
  assert.equal(core.createCountInEvents(30, 0, 0).length, 0);
  assert.equal(core.countInDurationSeconds(30, 2), 16);
  assert.equal(core.countInDurationSeconds(300, 1), 0.8);
  assert.throws(() => core.createCountInEvents(120, 3, 0), /0, 1, or 2/);
  assert.throws(() => core.createCountInEvents(120, 1, -1), /non-negative/);
});

test('musical content keys ignore BPM and include capo, swing, grid, and event content', () => {
  const first = parser.parseSongSource(validSource, { catalog }).song;
  const second = parser.parseSongSource(validSource.replace('bpm: 100', 'bpm: 140'), { catalog }).song;
  const changed = parser.parseSongSource(validSource.replace('G/B@8', 'D@8'), { catalog }).song;
  const capoChanged = parser.parseSongSource(validSource.replace('capo: 0', 'capo: 2'), { catalog }).song;
  const swingChanged = parser.parseSongSource(validSource.replace('swing: off', 'swing: 60'), { catalog }).song;
  assert.equal(parser.musicalContentKey(first), parser.musicalContentKey(second));
  assert.notEqual(parser.musicalContentKey(first), parser.musicalContentKey(changed));
  assert.notEqual(parser.musicalContentKey(first), parser.musicalContentKey(capoChanged));
  assert.notEqual(parser.musicalContentKey(first), parser.musicalContentKey(swingChanged));
});

test('playhead calculation preserves a paused musical position', () => {
  const timeline = core.normalizeSong(makeDemonstrationSong({ bpm: 100, gridSize: 8 }));
  const slotDuration = core.slotDurationSeconds(100, 8);
  const originTime = 10;
  const sourceSlot = core.playheadSlotAtTime(originTime, originTime + (10.5 * slotDuration), timeline);
  assert.equal(sourceSlot, 10.5);
  const wrapped = core.playheadSlotAtTime(
    originTime,
    originTime + ((timeline.durationSlots + 2) * slotDuration),
    timeline,
  );
  assert.ok(Math.abs(wrapped - 2) < 0.000001);
});

test('a schedule cursor starts at the next event for a preserved position', () => {
  const timeline = core.normalizeSong(makeDemonstrationSong());
  const events = core.playableEvents(timeline);
  const cursor = core.createScheduleCursorAtPosition(events, 3.5);
  assert.equal(events[cursor.eventIndex].absoluteSlotIndex, 5);
  const wrapped = core.createScheduleCursorAtPosition(events, timeline.durationSlots - 0.5);
  assert.deepEqual(wrapped, { loopIndex: 1, eventIndex: 0 });
});

test('a BPM transition maps the next bar boundary to the new tempo', () => {
  const currentTimeline = core.normalizeSong(makeDemonstrationSong({ bpm: 100, gridSize: 8 }));
  const nextTimeline = core.normalizeSong(makeDemonstrationSong({ bpm: 120, gridSize: 8 }));
  const currentSegment = {
    timeline: currentTimeline,
    events: core.playableEvents(currentTimeline),
    originTime: 10,
    cursor: core.createScheduleCursor(),
  };
  const transition = core.createTempoTransition(currentSegment, nextTimeline, 10.65);
  assert.equal(transition.boundary.absoluteSlot, 8);
  assert.equal(transition.boundary.sourceSlot, 8);
  assert.ok(Math.abs(transition.boundary.audioTime - 12.4) < 0.000001);

  const firstEvent = transition.segment.events[transition.segment.cursor.eventIndex];
  const firstEventTime = core.eventTimeSeconds(
    transition.segment.originTime,
    transition.segment.cursor.loopIndex,
    firstEvent,
    transition.segment.timeline,
  );
  assert.ok(firstEventTime >= transition.boundary.audioTime);
});

test('tempo-ramp BPM calculation caps a partial final step at the target', () => {
  assert.equal(core.tempoRampBpmAfterLoops(100, 5, 2, 112, 0), 100);
  assert.equal(core.tempoRampBpmAfterLoops(100, 5, 2, 112, 1), 100);
  assert.equal(core.tempoRampBpmAfterLoops(100, 5, 2, 112, 2), 105);
  assert.equal(core.tempoRampBpmAfterLoops(100, 5, 2, 112, 4), 110);
  assert.equal(core.tempoRampBpmAfterLoops(100, 5, 2, 112, 6), 112);
  assert.equal(core.tempoRampBpmAfterLoops(100, 5, 2, 112, 1000), 112);
});

test('the default tempo ramp starts at rounded half speed', () => {
  assert.deepEqual(core.defaultTempoRampForTarget(135), {
    startingBpm: 70,
    stepBpm: 5,
    loopsPerStep: 3,
    targetBpm: 135,
  });
  assert.equal(core.defaultTempoRampForTarget(120).startingBpm, 60);
  assert.equal(core.defaultTempoRampForTarget(134).startingBpm, 65);
  assert.equal(core.defaultTempoRampForTarget(59).startingBpm, 30);
  assert.equal(core.defaultTempoRampForTarget(31).startingBpm, 30);
  assert.throws(() => core.defaultTempoRampForTarget(30), /target greater than 30/);
});

test('loop tempo transitions use exact audio-clock boundaries', () => {
  const baseTimeline = core.normalizeSong(makeDemonstrationSong({
    bpm: 100,
    gridSize: 8,
    swingPercent: 67,
  }));
  const currentSegment = {
    timeline: baseTimeline,
    events: core.playableEvents(baseTimeline),
    originTime: 10,
    cursor: core.createScheduleCursor(),
    completedLoopsAtOrigin: 0,
  };
  const nextTimeline = core.timelineWithBpm(baseTimeline, 105);
  const transition = core.createLoopTempoTransition(currentSegment, nextTimeline, 2);
  const expectedBoundary = 10 + (2 * core.cycleDurationSeconds(baseTimeline));
  assert.equal(transition.boundary.sourceSlot, 0);
  assert.ok(Math.abs(transition.boundary.audioTime - expectedBoundary) < 0.000001);
  assert.equal(transition.segment.originTime, transition.boundary.audioTime);
  assert.equal(transition.segment.timeline.bpm, 105);
  assert.equal(transition.segment.timeline.swingPercent, 67);
});

test('completed-loop state supports pause, resume, and 1,000 loops', () => {
  const timeline = core.normalizeSong(makeDemonstrationSong({ bpm: 137, gridSize: 24 }));
  const cycleDuration = core.cycleDurationSeconds(timeline);
  const segment = {
    timeline,
    originTime: 5,
    completedLoopsAtOrigin: 7,
  };
  assert.equal(core.completedLoopsAtTime(segment, 5 + (0.75 * cycleDuration)), 7);
  assert.equal(core.completedLoopsAtTime(segment, 5 + cycleDuration), 8);
  assert.equal(core.completedLoopsAtTime(segment, 5 + (993 * cycleDuration)), 1000);

  const resumedSegment = {
    timeline,
    originTime: 100 - (0.75 * cycleDuration),
    completedLoopsAtOrigin: 7,
  };
  assert.equal(core.completedLoopsAtTime(resumedSegment, 100), 7);
  assert.equal(core.completedLoopsAtTime(resumedSegment, 100 + (0.25 * cycleDuration)), 8);
});

test('exact transitions can advance across several tempo boundaries after a stall', () => {
  const baseTimeline = core.normalizeSong(makeDemonstrationSong({ bpm: 100, gridSize: 8 }));
  let segment = {
    timeline: baseTimeline,
    events: core.playableEvents(baseTimeline),
    originTime: 2,
    cursor: core.createScheduleCursor(),
    completedLoopsAtOrigin: 0,
  };
  const boundaryTimes = [];
  for (const bpm of [105, 110, 112]) {
    const transition = core.createLoopTempoTransition(
      segment,
      core.timelineWithBpm(baseTimeline, bpm),
      2,
    );
    boundaryTimes.push(transition.boundary.audioTime);
    segment = {
      ...transition.segment,
      completedLoopsAtOrigin: segment.completedLoopsAtOrigin + 2,
    };
  }
  assert.ok(boundaryTimes[0] < boundaryTimes[1]);
  assert.ok(boundaryTimes[1] < boundaryTimes[2]);
  assert.equal(segment.timeline.bpm, 112);
  assert.equal(segment.completedLoopsAtOrigin, 6);

  const stalledNow = boundaryTimes[2] + (0.5 * core.cycleDurationSeconds(segment.timeline));
  assert.equal(core.completedLoopsAtTime(segment, stalledNow), 6);
  const events = core.playableEvents(segment.timeline);
  const recovered = core.collectScheduleBatch({
    timeline: segment.timeline,
    events,
    cursor: core.createScheduleCursor(),
    originTime: segment.originTime,
    now: stalledNow,
    horizonTime: stalledNow + 0.2,
  });
  assert.ok(recovered.skipped.length > 0);
  assert.ok(recovered.scheduled.every((event) => event.eventTime >= stalledNow));
});

test('the page contains the mobile practice interface and valid sound-test tokens', () => {
  const htmlPath = path.join(__dirname, '..', 'tools', 'guitar-strumming', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const soundTestTokens = [...html.matchAll(/data-strum-token="([^"]+)"/g)]
    .map((tokenMatch) => tokenMatch[1]);
  assert.equal(soundTestTokens.length, 20);
  assert.ok(soundTestTokens.every((token) => parser.parseStrumTokenValue(token).ok));
  assert.match(html, /<title>Guitar Strum Machine<\/title>/);
  assert.match(html, /<section class="practice-workspace"/);
  assert.match(html, /data-i18n="guitar\.preset">Exercise<\/label>/);
  assert.match(html, /data-i18n="guitar\.startOver">Start over<\/button>/);
  assert.doesNotMatch(html, /id="song-summary"/);
  assert.match(html, /id="practice-chord-guide-region"[^>]*hidden/);
  assert.match(html, /id="chord-guide"/);
  assert.match(html, /<details id="practice-options"/);
  assert.match(html, /<summary[^>]*>Practice options<\/summary>/);
  assert.match(html, /<details id="arrangement-editor">/);
  assert.match(html, /<summary[^>]*>Arrange and share<\/summary>/);
  assert.match(html, /<details id="help">/);
  assert.doesNotMatch(
    html,
    /<details id="(?:practice-options|arrangement-editor|help|strum-sound-test)"[^>]*\sopen(?:\s|>)/,
  );
  assert.ok(html.indexOf('class="practice-workspace"') < html.indexOf('id="arrangement-editor"'));
  assert.match(html, /<details id="strum-sound-test">/);
  assert.ok(html.indexOf('id="help"') < html.indexOf('id="strum-sound-test"'));
  assert.ok(html.indexOf('id="strum-sound-test"') < html.indexOf('class="preset-notice"'));
  assert.match(html, /id="tempo-ramp-mode"/);
  assert.match(html, /id="tempo-ramp-fields"[^>]*hidden/);
  assert.match(html, /for="tempo-ramp-step"/);
  assert.match(html, /for="tempo-ramp-loops"/);
  assert.match(html, /for="tempo-ramp-target"/);
  assert.match(html, /id="capo-fret"/);
  assert.match(html, /for="capo-fret"/);
  assert.match(html, /id="number-chord-controls"[^>]*hidden/);
  assert.match(html, /data-chord-view="shapes"[^>]*aria-pressed="true"/);
  assert.match(html, /data-chord-view="numbers"/);
  assert.match(html, /data-chord-view="sounding"/);
  assert.doesNotMatch(html, /<details id="key-shapes"/);
  assert.match(html, /id="original-key"/);
  assert.match(html, /id="playing-key"/);
  assert.match(html, /id="guitar-configuration"/);
  assert.match(html, /id="return-original-key"/);
  assert.ok(html.indexOf('src="./harmony.js') < html.indexOf('src="./parser.js'));
  assert.match(html, /id="swing-feel"/);
  assert.match(html, /for="swing-feel"/);
  assert.match(html, /Use swing: off for straight timing/);
  assert.match(html, /src="\.\.\/\.\.\/assets\/i18n\.js\?v=[a-f0-9]{12}"/);
  assert.match(html, /src="\.\/i18n\.js\?v=[a-f0-9]{12}"/);
  assert.match(html, /data-language="en-AU"/);
  assert.match(html, /data-language="zh-Hans"/);
  const capoOptions = html.match(/<select id="capo-fret"[^>]*>([\s\S]*?)<\/select>/)[1];
  assert.equal([...capoOptions.matchAll(/<option /g)].length, 13);
  const swingOptions = html.match(/<select id="swing-feel"[^>]*>([\s\S]*?)<\/select>/)[1];
  assert.deepEqual(
    [...swingOptions.matchAll(/<option value="([^"]+)"[^>]*>/g)].map((match) => match[1]),
    ['off', '55', '60', '67', '75'],
  );

  const css = fs.readFileSync(
    path.join(__dirname, '..', 'tools', 'guitar-strumming', 'styles.css'),
    'utf8',
  );
  assert.match(css, /\.language-switcher button\[aria-pressed="false"\]:hover/);
  assert.doesNotMatch(css, /\.language-switcher button:hover:not\(:disabled\)/);
  assert.match(css, /button,\s*select,\s*summary,\s*a\s*\{[^}]*touch-action:\s*manipulation/s);
  assert.doesNotMatch(html, /user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i);
  assert.match(css, /\.tempo-ramp-fields\s*\{[^}]*grid-template-columns/s);
  assert.match(css, /\.practice-options-grid,[\s\S]*grid-template-columns:\s*repeat\(2/);
  assert.match(css, /#play-pause\[aria-pressed="true"\]/);
  assert.match(css, /\.language-switcher button\[aria-pressed="true"\]/);
  assert.match(css, /\.chord-guide-scroll\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(css, /\.chord-view-switcher button\[aria-pressed="false"\]:hover/);
  assert.match(css, /\.key-controls-grid\s*\{[^}]*grid-template-columns/s);
  assert.match(css, /\.setting-field select\s*\{[^}]*width:/s);
  assert.match(css, /@media \(max-width: 38rem\)/);

  const app = fs.readFileSync(
    path.join(__dirname, '..', 'tools', 'guitar-strumming', 'app.js'),
    'utf8',
  );
  assert.match(app, /replaceSwingDirective\(elements\.source\.value, rawValue\)/);
  assert.match(app, /guitar\.swingCustom/);
  assert.match(app, /data-custom-swing/);
  assert.match(app, /localStorage\.setItem\('guitar-strumming-chord-view'/);
  assert.match(app, /harmony\.formatPracticeChordGuide\(song, chordView, elements\.editor\.open\)/);
  assert.match(app, /elements\.editor\.addEventListener\('toggle', renderPracticeDisplay\)/);
  assert.match(app, /elements\.editor\.open = true/);
});

test('guitar translations have matching keys and format dynamic validation errors', () => {
  assert.deepEqual(
    Object.keys(guitarI18n.catalogs['en-AU']).sort(),
    Object.keys(guitarI18n.catalogs['zh-Hans']).sort(),
  );

  const appSource = fs.readFileSync(
    path.join(__dirname, '..', 'tools', 'guitar-strumming', 'app.js'),
    'utf8',
  );
  const usedKeys = [...appSource.matchAll(/'((?:guitar\.)[A-Za-z0-9_.]+)'/g)]
    .map((match) => match[1]);
  for (const key of usedKeys) {
    assert.ok(Object.hasOwn(guitarI18n.catalogs['en-AU'], key), key);
    assert.ok(Object.hasOwn(guitarI18n.catalogs['zh-Hans'], key), key);
  }

  const result = parser.parseSongSource(validSource.replace('G/B@8', 'G/B@99'), { catalog });
  const error = result.errors.find((item) => item.code === 'chord_change_slot_range');
  assert.deepEqual(error.parameters, { gridSize: 8 });
  const numberResult = parser.parseSongSource(
    validNumberSource.replace('1/3', '3:7'),
    { catalog },
  );
  const numberError = numberResult.errors.find(
    (item) => item.code === 'number_shape_unsupported',
  );

  siteI18n.setLanguage('zh-Hans');
  try {
    assert.equal(guitarI18n.translate('guitar.play'), '播放');
    assert.equal(
      guitarI18n.formatValidationError(error),
      '第 9 行 — 和弦、第 1 小节、第 99 格：和弦更换格位必须为 2 至 8。',
    );
    assert.match(
      guitarI18n.formatValidationError(numberError),
      /3:7.*D7.*B7/,
    );
  } finally {
    siteI18n.setLanguage('en-AU');
  }
});
