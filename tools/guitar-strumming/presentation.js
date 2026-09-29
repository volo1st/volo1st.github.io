(function initializePresentation(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.GuitarStrummingPresentation = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function createPresentation() {
  'use strict';

  const BASE_CARD_WIDTH_REM = 15;
  const MAX_CARD_WIDTH_REM = 240;
  const LABEL_GAP_REM = 0.4;
  const VALID_VIEWS = new Set(['shapes', 'numbers', 'sounding']);

  function createChordTimeline(song, requestedView, arrangementOpen) {
    requireSong(song);
    if (!VALID_VIEWS.has(requestedView)) {
      throw new RangeError('Chord view must be shapes, numbers, or sounding.');
    }
    const view = song.notation === 'numbers' && arrangementOpen
      ? requestedView
      : 'shapes';
    const bars = song.chordBars.map((bar, barIndex) => (
      createBar(bar, barIndex, song.chordBars.length, song.gridSize, song.notation, view)
    ));
    return Object.freeze({
      gridSize: song.gridSize,
      subdivisionsPerBeat: song.gridSize / 4,
      view,
      bars: Object.freeze(bars),
    });
  }

  function createReadyPlaybackCue(timeline) {
    requireTimeline(timeline);
    return Object.freeze({
      mode: 'ready',
      current: null,
    });
  }

  function playbackCueAtSlot(timeline, sourceSlot) {
    requireTimeline(timeline);
    if (!Number.isFinite(sourceSlot) || sourceSlot < 0) {
      throw new RangeError('The playback slot must be a non-negative number.');
    }

    const durationSlots = timeline.bars.length * timeline.gridSize;
    const normalizedSlot = sourceSlot % durationSlots;
    const barIndex = Math.floor(normalizedSlot / timeline.gridSize);
    const slotInBar = normalizedSlot - (barIndex * timeline.gridSize);
    const bar = timeline.bars[barIndex];
    let changeIndex = 0;
    for (let index = 1; index < bar.changes.length; index += 1) {
      if (bar.changes[index].slot - 1 > slotInBar) break;
      changeIndex = index;
    }

    const current = Object.freeze({ barIndex, changeIndex });
    return Object.freeze({ mode: 'position', current });
  }

  function createBar(bar, barIndex, barCount, gridSize, notation, view) {
    if (!Array.isArray(bar) || bar.length === 0) {
      throw new TypeError('Each chord bar must contain at least one chord change.');
    }
    if (!bar[0] || bar[0].slot !== 1) {
      throw new TypeError('Each chord bar must start with a chord at slot 1.');
    }
    let previousSlot = 0;
    const changes = bar.map((change, changeIndex) => {
      requireChange(change, gridSize, previousSlot);
      previousSlot = change.slot;
      const nextChange = bar[changeIndex + 1];
      const endSlot = nextChange ? nextChange.slot : gridSize + 1;
      const label = chordLabel(change, notation, view);
      const position = musicalPosition(change.slot, gridSize);
      return {
        label,
        slot: change.slot,
        endSlot,
        start: (change.slot - 1) / gridSize,
        end: (endSlot - 1) / gridSize,
        beatNumber: position.beatNumber,
        subdivisionNumber: position.subdivisionNumber,
        subdivisionsPerBeat: position.subdivisionsPerBeat,
        timingCue: timingCue(position, gridSize, change.slot),
      };
    });
    const layout = layoutLabels(changes);
    return Object.freeze({
      number: barIndex + 1,
      total: barCount,
      minWidthRem: layout.minWidthRem,
      labelLaneCount: layout.labelLaneCount,
      changes: Object.freeze(layout.changes.map((change) => Object.freeze(change))),
    });
  }

  function musicalPosition(slot, gridSize) {
    const subdivisionsPerBeat = gridSize / 4;
    return Object.freeze({
      beatNumber: Math.floor((slot - 1) / subdivisionsPerBeat) + 1,
      subdivisionNumber: ((slot - 1) % subdivisionsPerBeat) + 1,
      subdivisionsPerBeat,
    });
  }

  function timingCue(position, gridSize, slot) {
    if (slot === 1) return '';
    const beat = String(position.beatNumber);
    if (gridSize === 8) {
      return position.subdivisionNumber === 1 ? beat : `${beat} &`;
    }
    if (gridSize === 16) {
      const suffixes = ['', ' e', ' &', ' a'];
      return `${beat}${suffixes[position.subdivisionNumber - 1]}`;
    }
    return position.subdivisionNumber === 1 ? beat : '';
  }

  function chordLabel(change, notation, view) {
    let label;
    if (notation === 'numbers' && view === 'numbers') {
      label = change.sourceChord;
    } else if (notation === 'numbers' && view === 'sounding') {
      label = change.soundingChord;
    } else {
      label = change.chord;
    }
    if (typeof label !== 'string' || label.length === 0) {
      throw new TypeError('Each chord change must have a display label.');
    }
    return label;
  }

  function layoutLabels(changes) {
    for (
      let minWidthRem = BASE_CARD_WIDTH_REM;
      minWidthRem <= MAX_CARD_WIDTH_REM;
      minWidthRem += 1
    ) {
      const result = tryLabelLayout(changes, minWidthRem);
      if (result) {
        return {
          minWidthRem,
          labelLaneCount: result.some((change) => change.labelLane === 1) ? 2 : 1,
          changes: result,
        };
      }
    }
    throw new RangeError('Chord labels cannot fit in two rows.');
  }

  function tryLabelLayout(changes, cardWidthRem) {
    const lanes = [[], []];
    const result = [];
    for (const change of changes) {
      const interval = labelInterval(change, cardWidthRem);
      const lane = lanes.findIndex((entries) => (
        entries.every((entry) => !intervalsOverlap(entry, interval, cardWidthRem))
      ));
      if (lane === -1) return null;
      lanes[lane].push(interval);
      result.push({
        ...change,
        labelLane: lane,
        labelAlign: interval.align,
      });
    }
    return result;
  }

  function labelInterval(change, cardWidthRem) {
    const labelWidthRem = estimateLabelWidthRem(change.label, change.timingCue);
    const width = labelWidthRem / cardWidthRem;
    const centeredStart = change.start - (width / 2);
    const centeredEnd = change.start + (width / 2);
    if (centeredStart < 0) {
      return { start: change.start, end: change.start + width, align: 'start' };
    }
    if (centeredEnd > 1) {
      return { start: change.start - width, end: change.start, align: 'end' };
    }
    return { start: centeredStart, end: centeredEnd, align: 'center' };
  }

  function estimateLabelWidthRem(label, cue) {
    const labelWidth = [...label].length * 0.72;
    const cueWidth = [...cue].length * 0.52;
    return Math.max(2.4, labelWidth + (cue ? cueWidth + 0.3 : 0) + 0.8);
  }

  function intervalsOverlap(left, right, cardWidthRem) {
    const gap = LABEL_GAP_REM / cardWidthRem;
    return left.start < right.end + gap && right.start < left.end + gap;
  }

  function requireSong(song) {
    if (
      !song
      || !Number.isInteger(song.gridSize)
      || song.gridSize <= 0
      || song.gridSize % 4 !== 0
      || !Array.isArray(song.chordBars)
      || song.chordBars.length === 0
    ) {
      throw new TypeError('A parsed 4/4 arrangement is required.');
    }
  }

  function requireTimeline(timeline) {
    if (
      !timeline
      || !Number.isInteger(timeline.gridSize)
      || timeline.gridSize <= 0
      || !Array.isArray(timeline.bars)
      || timeline.bars.length === 0
      || timeline.bars.some((bar) => !Array.isArray(bar.changes) || bar.changes.length === 0)
    ) {
      throw new TypeError('A complete chord timeline is required.');
    }
  }

  function requireChange(change, gridSize, previousSlot) {
    if (
      !change
      || !Number.isInteger(change.slot)
      || change.slot < 1
      || change.slot > gridSize
      || change.slot <= previousSlot
    ) {
      throw new TypeError('Chord changes must use unique ascending slots in the bar.');
    }
  }

  return Object.freeze({
    createChordTimeline,
    createReadyPlaybackCue,
    musicalPosition,
    playbackCueAtSlot,
  });
}));
