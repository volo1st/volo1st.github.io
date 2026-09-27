(function initializeCore(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.GuitarStrummingCore = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function createCore() {
  'use strict';

  const VALID_GRID_SIZES = Object.freeze([8, 16, 24]);
  const VALID_STRUM_TYPES = new Set(['D', 'U', '-']);
  const OPEN_STRING_MIDI = Object.freeze([40, 45, 50, 55, 59, 64]);

  function slotDurationSeconds(bpm, gridSize) {
    requireValidTiming(bpm, gridSize);
    return (60 / bpm) * (4 / gridSize);
  }

  function requireValidTiming(bpm, gridSize) {
    if (!Number.isInteger(bpm) || bpm < 30 || bpm > 300) {
      throw new RangeError('BPM must be a whole number from 30 through 300.');
    }
    if (!VALID_GRID_SIZES.includes(gridSize)) {
      throw new RangeError('Grid size must be 8, 16, or 24.');
    }
  }

  function normalizeSong(song) {
    if (!song || typeof song !== 'object') {
      throw new TypeError('Song data is required.');
    }
    requireValidTiming(song.bpm, song.gridSize);
    if (!Array.isArray(song.chordBars) || !Array.isArray(song.strumBars)) {
      throw new TypeError('Chord bars and strum bars are required.');
    }
    if (song.chordBars.length === 0 || song.chordBars.length !== song.strumBars.length) {
      throw new RangeError('Chord bars and strum bars must have the same non-zero length.');
    }

    const events = [];
    for (let barOffset = 0; barOffset < song.chordBars.length; barOffset += 1) {
      const chordChanges = validateChordBar(song.chordBars[barOffset], song.gridSize);
      const strums = validateStrumBar(song.strumBars[barOffset], song.gridSize);
      let activeChord = chordChanges[0].chord;
      let nextChangeIndex = 1;

      for (let slotOffset = 0; slotOffset < song.gridSize; slotOffset += 1) {
        const slotIndex = slotOffset + 1;
        while (
          nextChangeIndex < chordChanges.length
          && chordChanges[nextChangeIndex].slot === slotIndex
        ) {
          activeChord = chordChanges[nextChangeIndex].chord;
          nextChangeIndex += 1;
        }
        events.push(Object.freeze({
          barIndex: barOffset + 1,
          slotIndex,
          absoluteSlotIndex: (barOffset * song.gridSize) + slotOffset,
          activeChord,
          strumType: strums[slotOffset],
        }));
      }
    }

    return Object.freeze({
      bpm: song.bpm,
      gridSize: song.gridSize,
      barCount: song.chordBars.length,
      durationSlots: song.chordBars.length * song.gridSize,
      events: Object.freeze(events),
    });
  }

  function validateChordBar(chordBar, gridSize) {
    if (!Array.isArray(chordBar) || chordBar.length === 0) {
      throw new RangeError('Each chord bar must contain a starting chord.');
    }
    let previousSlot = 0;
    return chordBar.map((change, index) => {
      if (!change || typeof change.chord !== 'string' || change.chord === '') {
        throw new TypeError('Each chord change must contain a chord identifier.');
      }
      if (!Number.isInteger(change.slot)) {
        throw new TypeError('Each chord-change slot must be a whole number.');
      }
      if (index === 0 && change.slot !== 1) {
        throw new RangeError('Each chord bar must start at slot 1.');
      }
      if (change.slot <= previousSlot || change.slot > gridSize) {
        throw new RangeError('Chord-change slots must be unique, ascending, and inside the grid.');
      }
      previousSlot = change.slot;
      return Object.freeze({ chord: change.chord, slot: change.slot });
    });
  }

  function validateStrumBar(strumBar, gridSize) {
    if (!Array.isArray(strumBar) || strumBar.length !== gridSize) {
      throw new RangeError(`Each strum bar must contain ${gridSize} slots.`);
    }
    return strumBar.map((token) => {
      if (typeof token !== 'string' || !VALID_STRUM_TYPES.has(token.toUpperCase())) {
        throw new RangeError(`Invalid strum token: ${String(token)}`);
      }
      return token.toUpperCase();
    });
  }

  function playableEvents(timeline) {
    return timeline.events.filter((event) => event.strumType !== '-');
  }

  function cycleDurationSeconds(timeline) {
    return timeline.durationSlots * slotDurationSeconds(timeline.bpm, timeline.gridSize);
  }

  function eventTimeSeconds(originTime, loopIndex, event, timeline) {
    if (!Number.isInteger(loopIndex) || loopIndex < 0) {
      throw new RangeError('Loop index must be a non-negative whole number.');
    }
    const slotDuration = slotDurationSeconds(timeline.bpm, timeline.gridSize);
    return originTime
      + (loopIndex * timeline.durationSlots * slotDuration)
      + (event.absoluteSlotIndex * slotDuration);
  }

  function createScheduleCursor() {
    return Object.freeze({ loopIndex: 0, eventIndex: 0 });
  }

  function collectScheduleBatch(options) {
    const {
      timeline,
      events,
      cursor,
      originTime,
      now,
      horizonTime,
    } = options;
    if (!Array.isArray(events) || events.length === 0) {
      throw new RangeError('At least one playable event is required.');
    }
    if (horizonTime < now) {
      throw new RangeError('The scheduling horizon cannot be earlier than the current time.');
    }

    let loopIndex = cursor.loopIndex;
    let eventIndex = cursor.eventIndex;
    const scheduled = [];
    const skipped = [];

    while (true) {
      const event = events[eventIndex];
      const eventTime = eventTimeSeconds(originTime, loopIndex, event, timeline);
      if (eventTime > horizonTime) break;

      const occurrence = Object.freeze({ ...event, loopIndex, eventTime });
      if (eventTime < now) {
        skipped.push(occurrence);
      } else {
        scheduled.push(occurrence);
      }

      eventIndex += 1;
      if (eventIndex === events.length) {
        eventIndex = 0;
        loopIndex += 1;
      }
    }

    return Object.freeze({
      scheduled: Object.freeze(scheduled),
      skipped: Object.freeze(skipped),
      cursor: Object.freeze({ loopIndex, eventIndex }),
    });
  }

  function stringOrder(frets, strumType) {
    if (!Array.isArray(frets) || frets.length !== 6) {
      throw new RangeError('A voicing must contain six string values.');
    }
    const playedStrings = frets
      .map((fret, stringIndex) => ({ fret, stringIndex }))
      .filter(({ fret }) => fret !== 'x')
      .map(({ stringIndex }) => stringIndex);
    const normalizedType = String(strumType).toUpperCase();
    if (normalizedType === 'D') return playedStrings;
    if (normalizedType === 'U') return playedStrings.reverse();
    throw new RangeError('Strum type must be D or U.');
  }

  function stringMidiNote(stringIndex, fret) {
    if (!Number.isInteger(stringIndex) || stringIndex < 0 || stringIndex >= 6) {
      throw new RangeError('String index must be from 0 through 5.');
    }
    if (!Number.isInteger(fret) || fret < 0) {
      throw new RangeError('Fret must be a non-negative whole number.');
    }
    return OPEN_STRING_MIDI[stringIndex] + fret;
  }

  function resolveVoicingPitches(frets) {
    if (!Array.isArray(frets) || frets.length !== 6) {
      throw new RangeError('A voicing must contain six string values.');
    }
    return frets.map((fret, stringIndex) => (
      fret === 'x' ? 'x' : stringMidiNote(stringIndex, fret)
    ));
  }

  return Object.freeze({
    OPEN_STRING_MIDI,
    VALID_GRID_SIZES,
    collectScheduleBatch,
    createScheduleCursor,
    cycleDurationSeconds,
    eventTimeSeconds,
    normalizeSong,
    playableEvents,
    resolveVoicingPitches,
    slotDurationSeconds,
    stringMidiNote,
    stringOrder,
  });
}));
