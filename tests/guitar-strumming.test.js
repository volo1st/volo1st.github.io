'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const catalog = require('../tools/guitar-strumming/catalog.js');
const core = require('../tools/guitar-strumming/core.js');

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
