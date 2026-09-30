(function initializeHarmony(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.GuitarHarmony = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function createHarmony() {
  'use strict';

  const NATURAL_PITCH_CLASSES = Object.freeze({
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  });
  const LETTERS = Object.freeze(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  const MODE_INTERVALS = Object.freeze({
    major: Object.freeze([0, 2, 4, 5, 7, 9, 11]),
    minor: Object.freeze([0, 2, 3, 5, 7, 8, 10]),
  });
  const CANONICAL_TONICS = Object.freeze({
    major: Object.freeze(['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']),
    minor: Object.freeze(['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']),
  });
  const QUALITY_SUFFIXES = Object.freeze({
    '': '',
    m: 'm',
    7: '7',
    maj7: 'maj7',
    m7: 'm7',
    sus2: 'sus2',
    sus4: 'sus4',
    add9: 'add9',
    5: '5',
  });
  const NUMBER_CHORD_PATTERN = /^([b#]?)([1-7])(?::(maj7|m7|sus2|sus4|add9|m|7|5))?(?:\/([b#]?)([1-7]))?$/;

  function parseKey(value) {
    const input = String(value).trim();
    const normalized = input.replaceAll('♭', 'b').replaceAll('♯', '#');
    const match = normalized.match(/^([A-G])([b#]?)\s+(major|minor)$/);
    if (!match) {
      return Object.freeze({ ok: false, code: 'key_format', input });
    }
    const pitchClass = modulo(
      NATURAL_PITCH_CLASSES[match[1]] + accidentalOffset(match[2]),
      12,
    );
    const mode = match[3];
    const canonicalTonic = CANONICAL_TONICS[mode][pitchClass];
    return Object.freeze({
      ok: true,
      key: makeKey({
        input,
        tonic: `${match[1]}${match[2]}`,
        pitchClass,
        mode,
        canonicalTonic,
      }),
    });
  }

  function keyFromPitchClass(pitchClass, mode) {
    if (!Number.isInteger(pitchClass)) {
      throw new TypeError('Key pitch class must be a whole number.');
    }
    if (!Object.hasOwn(MODE_INTERVALS, mode)) {
      throw new RangeError('Key mode must be major or minor.');
    }
    const normalizedPitchClass = modulo(pitchClass, 12);
    const canonicalTonic = CANONICAL_TONICS[mode][normalizedPitchClass];
    return makeKey({
      input: `${canonicalTonic} ${mode}`,
      tonic: canonicalTonic,
      pitchClass: normalizedPitchClass,
      mode,
      canonicalTonic,
    });
  }

  function makeKey(options) {
    const key = {
      input: options.input,
      tonic: options.tonic,
      pitchClass: options.pitchClass,
      mode: options.mode,
      canonicalTonic: options.canonicalTonic,
      canonicalText: `${options.canonicalTonic} ${options.mode}`,
    };
    key.scale = Object.freeze(createScaleSpellings(key));
    return Object.freeze(key);
  }

  function createScaleSpellings(key) {
    const tonic = parsePitchName(key.canonicalTonic);
    const tonicLetterIndex = LETTERS.indexOf(tonic.letter);
    return MODE_INTERVALS[key.mode].map((interval, index) => {
      const letter = LETTERS[(tonicLetterIndex + index) % LETTERS.length];
      const targetPitchClass = modulo(key.pitchClass + interval, 12);
      return spellPitch(letter, targetPitchClass);
    });
  }

  function parseNumberChord(value) {
    const input = String(value).trim();
    const normalized = input.replaceAll('♭', 'b').replaceAll('♯', '#');
    const match = normalized.match(NUMBER_CHORD_PATTERN);
    if (!match) {
      return Object.freeze({ ok: false, code: 'number_chord_format', input });
    }
    const rootAccidental = accidentalOffset(match[1]);
    const degree = Number(match[2]);
    const quality = match[3] || '';
    const bassAccidental = match[4] === undefined ? null : accidentalOffset(match[4]);
    const bassDegree = match[5] === undefined ? null : Number(match[5]);
    return Object.freeze({
      ok: true,
      chord: Object.freeze({
        input,
        normalized,
        degree,
        rootAccidental,
        quality,
        bassDegree,
        bassAccidental,
      }),
    });
  }

  function resolveNumberChord(numberChord, playingKey, capoFret) {
    requireNumberChord(numberChord);
    requireKey(playingKey);
    requireCapo(capoFret);
    const shapeKey = keyFromPitchClass(playingKey.pitchClass - capoFret, playingKey.mode);
    const soundingChord = chordIdentifier(numberChord, playingKey);
    const shapeChord = chordIdentifier(numberChord, shapeKey);
    return Object.freeze({ soundingChord, shapeChord, shapeKey });
  }

  function listCapoConfigurations(numberChords, playingKey, catalog, maximumFret = 12) {
    if (!Array.isArray(numberChords) || numberChords.length === 0) {
      throw new TypeError('At least one number chord is required.');
    }
    requireKey(playingKey);
    if (!catalog || typeof catalog.getChord !== 'function') {
      throw new TypeError('A chord catalog is required.');
    }
    if (!Number.isInteger(maximumFret) || maximumFret < 0 || maximumFret > 12) {
      throw new RangeError('Maximum capo fret must be from 0 through 12.');
    }
    const configurations = [];
    for (let capoFret = 0; capoFret <= maximumFret; capoFret += 1) {
      const resolved = numberChords.map((chord) => resolveNumberChord(chord, playingKey, capoFret));
      const progression = resolved.map((item) => item.shapeChord);
      const shapes = unique(progression);
      const missingShapes = shapes.filter((identifier) => !catalog.getChord(identifier));
      configurations.push(Object.freeze({
        capoFret,
        shapeKey: resolved[0].shapeKey,
        progression: Object.freeze(progression),
        shapes: Object.freeze(shapes),
        missingShapes: Object.freeze(missingShapes),
        available: missingShapes.length === 0,
      }));
    }
    return Object.freeze(configurations);
  }

  function formatChordGuide(song, view) {
    if (!song || song.notation !== 'numbers' || !Array.isArray(song.chordBars)) {
      throw new TypeError('A parsed number arrangement is required.');
    }
    if (!['shapes', 'numbers', 'sounding'].includes(view)) {
      throw new RangeError('Chord view must be shapes, numbers, or sounding.');
    }
    return song.chordBars.map((bar) => {
      const changes = bar.map((change) => {
        const identifier = view === 'numbers'
          ? change.sourceChord
          : (view === 'sounding' ? change.soundingChord : change.chord);
        return `${identifier}${change.slot === 1 ? '' : `@${change.slot}`}`;
      });
      return `| ${changes.join(' ')} |`;
    }).join(' ');
  }

  function chordIdentifier(numberChord, key) {
    const root = alteredScalePitch(key, numberChord.degree, numberChord.rootAccidental);
    const suffix = QUALITY_SUFFIXES[numberChord.quality];
    const bass = numberChord.bassDegree === null
      ? ''
      : `/${alteredScalePitch(key, numberChord.bassDegree, numberChord.bassAccidental)}`;
    return `${root}${suffix}${bass}`;
  }

  function alteredScalePitch(key, degree, alteration) {
    const baseSpelling = key.scale[degree - 1];
    const parsed = parsePitchName(baseSpelling);
    const targetPitchClass = modulo(parsed.pitchClass + alteration, 12);
    return spellPitch(parsed.letter, targetPitchClass);
  }

  function parsePitchName(value) {
    const match = String(value).match(/^([A-G])(bb|##|b|#)?$/);
    if (!match) throw new RangeError(`Invalid pitch spelling: ${value}.`);
    const offset = match[2] ? accidentalOffset(match[2]) : 0;
    return Object.freeze({
      letter: match[1],
      pitchClass: modulo(NATURAL_PITCH_CLASSES[match[1]] + offset, 12),
    });
  }

  function spellPitch(letter, pitchClass) {
    let difference = modulo(pitchClass - NATURAL_PITCH_CLASSES[letter], 12);
    if (difference > 6) difference -= 12;
    const accidental = accidentalText(difference);
    return `${letter}${accidental}`;
  }

  function accidentalOffset(accidental) {
    return [...accidental].reduce((total, character) => (
      total + (character === '#' ? 1 : -1)
    ), 0);
  }

  function accidentalText(offset) {
    if (offset === 0) return '';
    if (offset === 1) return '#';
    if (offset === 2) return '##';
    if (offset === -1) return 'b';
    if (offset === -2) return 'bb';
    throw new RangeError('Pitch spelling needs more than two accidentals.');
  }

  function requireKey(key) {
    if (
      !key
      || typeof key !== 'object'
      || !Number.isInteger(key.pitchClass)
      || !Object.hasOwn(MODE_INTERVALS, key.mode)
      || !Array.isArray(key.scale)
    ) {
      throw new TypeError('A parsed key is required.');
    }
  }

  function requireNumberChord(chord) {
    if (
      !chord
      || typeof chord !== 'object'
      || !Number.isInteger(chord.degree)
      || chord.degree < 1
      || chord.degree > 7
      || !Object.hasOwn(QUALITY_SUFFIXES, chord.quality)
    ) {
      throw new TypeError('A parsed number chord is required.');
    }
  }

  function requireCapo(capoFret) {
    if (!Number.isInteger(capoFret) || capoFret < 0 || capoFret > 12) {
      throw new RangeError('Capo fret must be from 0 through 12.');
    }
  }

  function modulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  function unique(values) {
    return [...new Set(values)];
  }

  return Object.freeze({
    formatChordGuide,
    keyFromPitchClass,
    listCapoConfigurations,
    parseKey,
    parseNumberChord,
    resolveNumberChord,
  });
}));
