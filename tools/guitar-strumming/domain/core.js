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
  const VALID_STRING_COUNTS = new Set([2, 3, 4]);
  const VALID_ARTICULATIONS = new Set(['normal', 'palm-mute', 'dead']);
  const OPEN_STRING_MIDI = Object.freeze([40, 45, 50, 55, 59, 64]);
  const TIMING_EPSILON_SECONDS = 0.000000001;

  function slotDurationSeconds(bpm, gridSize) {
    requireValidTiming(bpm, gridSize);
    return (60 / bpm) * (4 / gridSize);
  }

  function requireValidTiming(bpm, gridSize) {
    requireValidBpm(bpm);
    if (!VALID_GRID_SIZES.includes(gridSize)) {
      throw new RangeError('Grid size must be 8, 16, or 24.');
    }
  }

  function requireValidBpm(bpm) {
    if (!Number.isInteger(bpm) || bpm < 30 || bpm > 300) {
      throw new RangeError('BPM must be a whole number from 30 through 300.');
    }
  }

  function countInDurationSeconds(bpm, countInBars) {
    requireValidBpm(bpm);
    requireValidCountInBars(countInBars);
    return countInBars * 4 * (60 / bpm);
  }

  function countInRemainingBeats(bpm, countInBars, startTime, audioTime) {
    requireValidBpm(bpm);
    requireValidCountInBars(countInBars);
    if (!Number.isFinite(startTime) || startTime < 0) {
      throw new RangeError('Count-in start time must be a non-negative number.');
    }
    if (!Number.isFinite(audioTime) || audioTime < 0) {
      throw new RangeError('Audio time must be a non-negative number.');
    }
    const totalBeats = countInBars * 4;
    if (totalBeats === 0) return null;
    const elapsedBeats = Math.floor(Math.max(0, audioTime - startTime) / (60 / bpm));
    return elapsedBeats >= totalBeats ? null : totalBeats - elapsedBeats;
  }

  function createCountInEvents(bpm, countInBars, startTime) {
    requireValidBpm(bpm);
    requireValidCountInBars(countInBars);
    if (!Number.isFinite(startTime) || startTime < 0) {
      throw new RangeError('Count-in start time must be a non-negative number.');
    }
    const beatDuration = 60 / bpm;
    const events = [];
    for (let absoluteBeatIndex = 0; absoluteBeatIndex < countInBars * 4; absoluteBeatIndex += 1) {
      const beatIndex = (absoluteBeatIndex % 4) + 1;
      events.push(Object.freeze({
        absoluteBeatIndex,
        barIndex: Math.floor(absoluteBeatIndex / 4) + 1,
        beatIndex,
        accented: beatIndex === 1,
        eventTime: startTime + (absoluteBeatIndex * beatDuration),
      }));
    }
    return Object.freeze(events);
  }

  function requireValidCountInBars(countInBars) {
    if (!Number.isInteger(countInBars) || countInBars < 0 || countInBars > 2) {
      throw new RangeError('Count-in must be 0, 1, or 2 bars.');
    }
  }

  function requireValidCapoFret(capoFret) {
    if (!Number.isInteger(capoFret) || capoFret < 0 || capoFret > 12) {
      throw new RangeError('Capo fret must be a whole number from 0 through 12.');
    }
  }

  function requireValidSwingPercent(swingPercent) {
    if (
      swingPercent !== null
      && (!Number.isInteger(swingPercent) || swingPercent < 50 || swingPercent > 75)
    ) {
      throw new RangeError('Swing must be null or a whole number from 50 through 75.');
    }
  }

  function normalizeSong(song) {
    if (!song || typeof song !== 'object') {
      throw new TypeError('Song data is required.');
    }
    requireValidTiming(song.bpm, song.gridSize);
    requireValidCapoFret(song.capoFret);
    requireValidSwingPercent(song.swingPercent);
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
        const strum = strums[slotOffset];
        events.push(Object.freeze({
          barIndex: barOffset + 1,
          slotIndex,
          absoluteSlotIndex: (barOffset * song.gridSize) + slotOffset,
          activeChord,
          direction: strum.direction,
          stringCount: strum.stringCount,
          articulation: strum.articulation,
          accented: strum.accented,
        }));
      }
    }

    return Object.freeze({
      bpm: song.bpm,
      capoFret: song.capoFret,
      swingPercent: song.swingPercent,
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
    return strumBar.map((strum) => {
      if (!strum || typeof strum !== 'object') {
        throw new TypeError('Each strum slot must contain normalized strum data.');
      }
      const { direction, stringCount, articulation, accented } = strum;
      if (direction !== null && direction !== 'D' && direction !== 'U') {
        throw new RangeError('Strum direction must be D, U, or null.');
      }
      if (stringCount !== null && !VALID_STRING_COUNTS.has(stringCount)) {
        throw new RangeError('Strum string count must be 2, 3, 4, or null.');
      }
      if (!VALID_ARTICULATIONS.has(articulation)) {
        throw new RangeError('Strum articulation must be normal, palm-mute, or dead.');
      }
      if (typeof accented !== 'boolean') {
        throw new TypeError('Strum accent state must be true or false.');
      }
      if (
        direction === null
        && (stringCount !== null || articulation !== 'normal' || accented)
      ) {
        throw new RangeError('A no-strum slot cannot contain modifiers.');
      }
      return Object.freeze({ direction, stringCount, articulation, accented });
    });
  }

  function playableEvents(timeline) {
    return timeline.events.filter((event) => event.direction !== null);
  }

  function cycleDurationSeconds(timeline) {
    return timeline.durationSlots * slotDurationSeconds(timeline.bpm, timeline.gridSize);
  }

  function timelineWithBpm(timeline, bpm) {
    requireTimelineShape(timeline);
    requireValidBpm(bpm);
    return Object.freeze({
      ...timeline,
      bpm,
    });
  }

  function requireTimelineShape(timeline) {
    if (!timeline || typeof timeline !== 'object') {
      throw new TypeError('A timeline is required.');
    }
    requireValidTiming(timeline.bpm, timeline.gridSize);
    requireValidCapoFret(timeline.capoFret);
    requireValidSwingPercent(timeline.swingPercent);
    if (!Number.isInteger(timeline.durationSlots) || timeline.durationSlots < 1) {
      throw new RangeError('Timeline duration must be a positive whole number of slots.');
    }
    if (!Array.isArray(timeline.events)) {
      throw new TypeError('Timeline events are required.');
    }
  }

  function tempoRampBpmAfterLoops(startingBpm, stepBpm, loopsPerStep, targetBpm, completedLoops) {
    requireValidBpm(startingBpm);
    requireValidBpm(targetBpm);
    if (!Number.isInteger(stepBpm) || stepBpm < 1 || stepBpm > 20) {
      throw new RangeError('Tempo-ramp step must be a whole number from 1 through 20.');
    }
    if (!Number.isInteger(loopsPerStep) || loopsPerStep < 1 || loopsPerStep > 99) {
      throw new RangeError('Tempo-ramp loop interval must be a whole number from 1 through 99.');
    }
    if (targetBpm <= startingBpm) {
      throw new RangeError('Tempo-ramp target must be greater than the starting BPM.');
    }
    if (!Number.isInteger(completedLoops) || completedLoops < 0) {
      throw new RangeError('Completed-loop count must be a non-negative whole number.');
    }
    const completedSteps = Math.floor(completedLoops / loopsPerStep);
    return Math.min(targetBpm, startingBpm + (completedSteps * stepBpm));
  }

  function defaultTempoRampForTarget(targetBpm) {
    requireValidBpm(targetBpm);
    if (targetBpm === 30) {
      throw new RangeError('Tempo ramp needs a target greater than 30 BPM.');
    }
    const roundedHalf = Math.round((targetBpm / 2) / 5) * 5;
    return Object.freeze({
      startingBpm: Math.max(30, roundedHalf),
      stepBpm: 5,
      loopsPerStep: 3,
      targetBpm,
    });
  }

  function completedLoopsAtTime(segment, audioTime) {
    if (!segment || typeof segment !== 'object') {
      throw new TypeError('A playback segment is required.');
    }
    requireTimelineShape(segment.timeline);
    if (!Number.isFinite(segment.originTime) || segment.originTime < 0) {
      throw new RangeError('Segment origin time must be a non-negative number.');
    }
    if (!Number.isFinite(audioTime) || audioTime < 0) {
      throw new RangeError('Audio time must be a non-negative number.');
    }
    if (
      !Number.isInteger(segment.completedLoopsAtOrigin)
      || segment.completedLoopsAtOrigin < 0
    ) {
      throw new RangeError('Segment completed-loop count must be a non-negative whole number.');
    }
    const elapsed = Math.max(0, audioTime - segment.originTime);
    const elapsedLoops = Math.floor(
      (elapsed + TIMING_EPSILON_SECONDS) / cycleDurationSeconds(segment.timeline),
    );
    return segment.completedLoopsAtOrigin + elapsedLoops;
  }

  function createLoopTempoTransition(currentSegment, nextTimeline, loopsUntilBoundary) {
    if (!currentSegment || typeof currentSegment !== 'object') {
      throw new TypeError('A current playback segment is required.');
    }
    requireTimelineShape(currentSegment.timeline);
    requireTimelineShape(nextTimeline);
    if (
      currentSegment.timeline.gridSize !== nextTimeline.gridSize
      || currentSegment.timeline.durationSlots !== nextTimeline.durationSlots
    ) {
      throw new RangeError('A BPM transition cannot change the grid or song length.');
    }
    if (!Number.isInteger(loopsUntilBoundary) || loopsUntilBoundary < 1) {
      throw new RangeError('Loops until a tempo boundary must be a positive whole number.');
    }
    const audioTime = currentSegment.originTime
      + (loopsUntilBoundary * cycleDurationSeconds(currentSegment.timeline));
    const boundary = Object.freeze({
      absoluteSlot: loopsUntilBoundary * currentSegment.timeline.durationSlots,
      sourceSlot: 0,
      audioTime,
    });
    const events = playableEvents(nextTimeline);
    return Object.freeze({
      boundary,
      segment: Object.freeze({
        timeline: nextTimeline,
        events,
        originTime: audioTime,
        cursor: createScheduleCursor(),
      }),
    });
  }

  function eventTimeSeconds(originTime, loopIndex, event, timeline) {
    if (!Number.isInteger(loopIndex) || loopIndex < 0) {
      throw new RangeError('Loop index must be a non-negative whole number.');
    }
    return originTime
      + (loopIndex * cycleDurationSeconds(timeline))
      + slotPositionSeconds(
        event.absoluteSlotIndex,
        timeline.bpm,
        timeline.gridSize,
        timeline.swingPercent,
      );
  }

  function slotPositionSeconds(slotPosition, bpm, gridSize, swingPercent) {
    requireValidTiming(bpm, gridSize);
    requireValidSwingPercent(swingPercent);
    if (!Number.isFinite(slotPosition) || slotPosition < 0) {
      throw new RangeError('Slot position must be a non-negative number.');
    }
    if (swingPercent === null || swingPercent === 50) {
      return slotPosition * slotDurationSeconds(bpm, gridSize);
    }

    const slotsPerBeat = gridSize / 4;
    const slotsPerEighth = gridSize / 8;
    const completedBeats = Math.floor(slotPosition / slotsPerBeat);
    const slotWithinBeat = slotPosition - (completedBeats * slotsPerBeat);
    const firstEighthShare = swingPercent / 100;
    const beatFraction = slotWithinBeat < slotsPerEighth
      ? (slotWithinBeat / slotsPerEighth) * firstEighthShare
      : firstEighthShare
        + (((slotWithinBeat - slotsPerEighth) / slotsPerEighth) * (1 - firstEighthShare));
    return (completedBeats + beatFraction) * (60 / bpm);
  }

  function createScheduleCursor() {
    return Object.freeze({ loopIndex: 0, eventIndex: 0 });
  }

  function createScheduleCursorAtPosition(events, sourceSlot) {
    if (!Array.isArray(events) || events.length === 0) {
      return createScheduleCursor();
    }
    if (!Number.isFinite(sourceSlot) || sourceSlot < 0) {
      throw new RangeError('Source slot must be a non-negative number.');
    }
    const eventIndex = events.findIndex((event) => event.absoluteSlotIndex >= sourceSlot);
    if (eventIndex === -1) {
      return Object.freeze({ loopIndex: 1, eventIndex: 0 });
    }
    return Object.freeze({ loopIndex: 0, eventIndex });
  }

  function playheadSlotAtTime(originTime, audioTime, timeline) {
    if (timeline.swingPercent === null || timeline.swingPercent === 50) {
      const slotDuration = slotDurationSeconds(timeline.bpm, timeline.gridSize);
      const elapsedSlots = Math.max(0, (audioTime - originTime) / slotDuration);
      return positiveModulo(elapsedSlots, timeline.durationSlots);
    }
    const beatDuration = 60 / timeline.bpm;
    const elapsedBeats = Math.max(0, (audioTime - originTime) / beatDuration);
    const completedBeats = Math.floor(elapsedBeats);
    const beatFraction = elapsedBeats - completedBeats;
    const slotsPerBeat = timeline.gridSize / 4;
    const slotsPerEighth = timeline.gridSize / 8;
    const firstEighthShare = timeline.swingPercent / 100;
    const slotWithinBeat = beatFraction < firstEighthShare
      ? (beatFraction / firstEighthShare) * slotsPerEighth
      : slotsPerEighth
        + (((beatFraction - firstEighthShare) / (1 - firstEighthShare)) * slotsPerEighth);
    const elapsedSlots = (completedBeats * slotsPerBeat) + slotWithinBeat;
    return positiveModulo(elapsedSlots, timeline.durationSlots);
  }

  function nextBarBoundary(originTime, audioTime, timeline) {
    const slotDuration = slotDurationSeconds(timeline.bpm, timeline.gridSize);
    const elapsedSlots = Math.max(0, (audioTime - originTime) / slotDuration);
    const absoluteSlot = (Math.floor(elapsedSlots / timeline.gridSize) + 1)
      * timeline.gridSize;
    return Object.freeze({
      absoluteSlot,
      sourceSlot: absoluteSlot % timeline.durationSlots,
      audioTime: originTime + (absoluteSlot * slotDuration),
    });
  }

  function createTempoTransition(currentSegment, nextTimeline, audioTime) {
    if (
      currentSegment.timeline.gridSize !== nextTimeline.gridSize
      || currentSegment.timeline.durationSlots !== nextTimeline.durationSlots
    ) {
      throw new RangeError('A BPM transition cannot change the grid or song length.');
    }
    const boundary = nextBarBoundary(
      currentSegment.originTime,
      audioTime,
      currentSegment.timeline,
    );
    const nextSlotDuration = slotDurationSeconds(nextTimeline.bpm, nextTimeline.gridSize);
    const events = playableEvents(nextTimeline);
    return Object.freeze({
      boundary,
      segment: Object.freeze({
        timeline: nextTimeline,
        events,
        originTime: boundary.audioTime - (boundary.sourceSlot * nextSlotDuration),
        cursor: createScheduleCursorAtPosition(events, boundary.sourceSlot),
      }),
    });
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

  function selectStringIndexes(stringPitches, direction, stringCount) {
    if (!Array.isArray(stringPitches) || stringPitches.length !== 6) {
      throw new RangeError('A voicing must contain six string pitches.');
    }
    if (direction !== 'D' && direction !== 'U') {
      throw new RangeError('Strum direction must be D or U.');
    }
    if (stringCount !== null && !VALID_STRING_COUNTS.has(stringCount)) {
      throw new RangeError('Strum string count must be 2, 3, 4, or null.');
    }

    const playableStrings = stringPitches
      .map((pitch, stringIndex) => ({ pitch, stringIndex }))
      .filter(({ pitch }) => pitch !== 'x');
    if (playableStrings.some(({ pitch }) => !Number.isFinite(pitch))) {
      throw new TypeError('Each playable string pitch must be a number.');
    }

    const directionMultiplier = direction === 'D' ? 1 : -1;
    playableStrings.sort((left, right) => (
      ((left.pitch - right.pitch) || (left.stringIndex - right.stringIndex))
      * directionMultiplier
    ));
    const selected = stringCount === null
      ? playableStrings
      : playableStrings.slice(0, stringCount);
    return Object.freeze(selected.map(({ stringIndex }) => stringIndex));
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

  function resolveVoicingPitches(frets, capoFret = 0) {
    if (!Array.isArray(frets) || frets.length !== 6) {
      throw new RangeError('A voicing must contain six string values.');
    }
    requireValidCapoFret(capoFret);
    return frets.map((fret, stringIndex) => (
      fret === 'x' ? 'x' : stringMidiNote(stringIndex, fret) + capoFret
    ));
  }

  function positiveModulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  return Object.freeze({
    OPEN_STRING_MIDI,
    VALID_GRID_SIZES,
    collectScheduleBatch,
    completedLoopsAtTime,
    countInDurationSeconds,
    countInRemainingBeats,
    createCountInEvents,
    createScheduleCursor,
    createScheduleCursorAtPosition,
    createLoopTempoTransition,
    createTempoTransition,
    cycleDurationSeconds,
    defaultTempoRampForTarget,
    eventTimeSeconds,
    nextBarBoundary,
    normalizeSong,
    playheadSlotAtTime,
    playableEvents,
    resolveVoicingPitches,
    selectStringIndexes,
    slotPositionSeconds,
    slotDurationSeconds,
    stringMidiNote,
    tempoRampBpmAfterLoops,
    timelineWithBpm,
  });
}));
