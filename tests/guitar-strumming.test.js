'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const catalog = require('../tools/guitar-strumming/catalog.js');
const core = require('../tools/guitar-strumming/core.js');
const parser = require('../tools/guitar-strumming/parser.js');

const expectedChordIdentifiers = [
  'A', 'Am', 'Bb', 'Bm', 'C', 'Cm', 'D', 'Dm', 'Em', 'F', 'F#m', 'G',
  'Am7', 'C7', 'Cmaj7', 'D7', 'G7', 'Cadd9', 'Dsus4', 'G5',
  'Am/G', 'C/E', 'D/F#', 'G/B',
];

function makeDemonstrationSong({ bpm = 100, gridSize = 8 } = {}) {
  const pattern = Array.from({ length: gridSize }, (_, index) => (
    ['D', '-', 'D', 'U', '-', 'U', 'D', 'U'][index % 8]
  ));
  return {
    bpm,
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

chords:
| C G/B@8 | G/B | Am F@8 | F |

strum:
| D - D U - U D U | x4`;

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
  const dVoicing = catalog.getDefaultVoicing('D').frets;
  assert.deepEqual(core.stringOrder(dVoicing, 'D'), [2, 3, 4, 5]);
  assert.deepEqual(core.stringOrder(dVoicing, 'U'), [5, 4, 3, 2]);
});

test('the core resolves a catalog voicing to six string pitches', () => {
  const cVoicing = catalog.getDefaultVoicing('C').frets;
  assert.deepEqual(core.resolveVoicingPitches(cVoicing), ['x', 48, 52, 55, 60, 64]);
});

test('a chord change is active before a strum at the same slot', () => {
  const timeline = core.normalizeSong(makeDemonstrationSong());
  const event = timeline.events.find((item) => item.barIndex === 1 && item.slotIndex === 8);
  assert.equal(event.strumType, 'U');
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
  assert.deepEqual(result.song.strumBars[0], ['D', '-', 'D', 'U', '-', 'U', 'D', 'U']);
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
    '4/4#8\nbpm: 100\ncount-in: 1\nchords:',
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
    assert.equal(error.line, 6);
  }
});

test('the parser rejects unsupported chords and reports their source bar', () => {
  const source = validSource.replace('G/B@8', 'Bdim@8');
  const result = parser.parseSongSource(source, { catalog });
  const error = result.errors.find((item) => item.code === 'chord_unsupported');
  assert.ok(error);
  assert.equal(error.line, 6);
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

test('musical content keys ignore BPM and include grid and event content', () => {
  const first = parser.parseSongSource(validSource, { catalog }).song;
  const second = parser.parseSongSource(validSource.replace('bpm: 100', 'bpm: 140'), { catalog }).song;
  const changed = parser.parseSongSource(validSource.replace('G/B@8', 'D@8'), { catalog }).song;
  assert.equal(parser.musicalContentKey(first), parser.musicalContentKey(second));
  assert.notEqual(parser.musicalContentKey(first), parser.musicalContentKey(changed));
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

test('the default source in the page is valid', () => {
  const htmlPath = path.join(__dirname, '..', 'tools', 'guitar-strumming', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const match = html.match(/<textarea id="song-source"[^>]*>([\s\S]*?)<\/textarea>/);
  assert.ok(match);
  const result = parser.parseSongSource(match[1], { catalog });
  assert.equal(result.ok, true);
});
