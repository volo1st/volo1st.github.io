(function initializeParser(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.GuitarStrummingParser = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function createParser() {
  'use strict';

  const VALID_GRID_SIZES = new Set([8, 16, 24]);
  const MAX_EXPANDED_BARS = 1000;
  const STRUM_TOKEN_PATTERN = /^([DU])([234]?)([PX]?)(!?)$/i;

  function parseSongSource(source, options = {}) {
    const catalog = options.catalog || null;
    const sourceText = String(source).replace(/^\uFEFF/, '');
    const sourceLines = sourceText.split(/\r?\n/);
    const lines = sourceLines
      .map((text, index) => ({ text: text.trim(), line: index + 1 }))
      .filter((entry) => entry.text !== '');
    const errors = [];

    if (lines.length === 0) {
      addError(errors, 'source_empty', 1, null, null, null, 'source', 'Enter a song.');
      return makeResult(null, errors);
    }

    const gridSize = parseHeader(lines[0], errors);
    const bpm = parseBpm(lines[1], errors);

    const countInEntry = lines[2];
    if (!countInEntry || !/^count-in\s*:/.test(countInEntry.text)) {
      addError(
        errors,
        !countInEntry || countInEntry.text === 'chords:' || /^tempo-ramp\s*:/.test(countInEntry.text)
          ? 'count_in_missing'
          : directiveCode(countInEntry && countInEntry.text),
        countInEntry ? countInEntry.line : null,
        null,
        null,
        null,
        'count-in',
        'Expected count-in: 0, 1, or 2 after the BPM directive.',
      );
      return makeResult(null, errors);
    }
    const countInBars = parseCountIn(countInEntry, errors);

    const tempoRampEntry = lines[3];
    if (!tempoRampEntry || !/^tempo-ramp\s*:/.test(tempoRampEntry.text)) {
      addError(
        errors,
        !tempoRampEntry || tempoRampEntry.text === 'chords:' || /^capo\s*:/.test(tempoRampEntry.text)
          ? 'tempo_ramp_missing'
          : directiveCode(tempoRampEntry && tempoRampEntry.text),
        tempoRampEntry ? tempoRampEntry.line : null,
        null,
        null,
        null,
        'tempo-ramp',
        'Expected tempo-ramp: off or a value such as +5/2/120 after the count-in directive.',
      );
      return makeResult(null, errors);
    }
    const tempoRamp = parseTempoRamp(tempoRampEntry, bpm, errors);

    const capoEntry = lines[4];
    if (!capoEntry || !/^capo\s*:/.test(capoEntry.text)) {
      addError(
        errors,
        !capoEntry || capoEntry.text === 'chords:'
          ? 'capo_missing'
          : directiveCode(capoEntry && capoEntry.text),
        capoEntry ? capoEntry.line : null,
        null,
        null,
        null,
        'capo',
        'Expected capo: followed by a whole number from 0 through 12 after tempo-ramp.',
      );
      return makeResult(null, errors);
    }
    const capoFret = parseCapo(capoEntry, errors);

    if (!lines[5] || lines[5].text !== 'chords:') {
      const entry = lines[5] || lines.at(-1);
      const isDuplicateCountIn = entry && /^count-in\s*:/.test(entry.text);
      const isDuplicateTempoRamp = entry && /^tempo-ramp\s*:/.test(entry.text);
      const isDuplicateCapo = entry && /^capo\s*:/.test(entry.text);
      addError(
        errors,
        isDuplicateCountIn
          ? 'count_in_duplicate'
          : (isDuplicateTempoRamp
            ? 'tempo_ramp_duplicate'
            : (isDuplicateCapo ? 'capo_duplicate' : directiveCode(entry && entry.text))),
        entry ? entry.line : sourceLines.length,
        null,
        null,
        null,
        isDuplicateCountIn
          ? 'count-in'
          : (isDuplicateTempoRamp
            ? 'tempo-ramp'
            : (isDuplicateCapo ? 'capo' : 'document')),
        isDuplicateCountIn
          ? 'The count-in: directive can occur only once.'
          : (isDuplicateTempoRamp
            ? 'The tempo-ramp: directive can occur only once.'
            : (isDuplicateCapo
              ? 'The capo: directive can occur only once.'
              : 'Expected chords: after the capo directive.')),
      );
      return makeResult(null, errors);
    }

    const strumLabelIndex = lines.findIndex((entry, index) => (
      index > 5 && entry.text === 'strum:'
    ));
    if (strumLabelIndex === -1) {
      addError(
        errors,
        'strum_section_missing',
        sourceLines.length,
        'strum',
        null,
        null,
        'section',
        'Add one strum: section after the chord bars.',
      );
      return makeResult(null, errors);
    }

    const duplicateChordLabel = lines.find((entry, index) => index > 5 && entry.text === 'chords:');
    if (duplicateChordLabel) {
      addError(
        errors,
        'chords_section_duplicate',
        duplicateChordLabel.line,
        'chords',
        null,
        null,
        'section',
        'The chords: section can occur only once.',
      );
    }
    const duplicateStrumLabel = lines.find((entry, index) => (
      index > strumLabelIndex && entry.text === 'strum:'
    ));
    if (duplicateStrumLabel) {
      addError(
        errors,
        'strum_section_duplicate',
        duplicateStrumLabel.line,
        'strum',
        null,
        null,
        'section',
        'The strum: section can occur only once.',
      );
    }

    const chordLines = lines.slice(6, strumLabelIndex);
    const strumLines = lines.slice(strumLabelIndex + 1);
    if (chordLines.length === 0) {
      addError(
        errors,
        'chords_section_empty',
        lines[5].line,
        'chords',
        null,
        null,
        'section',
        'Add at least one chord bar.',
      );
    }
    if (strumLines.length === 0) {
      addError(
        errors,
        'strum_section_empty',
        lines[strumLabelIndex].line,
        'strum',
        null,
        null,
        'section',
        'Add at least one strum bar.',
      );
    }

    const chordBars = parseSectionBars({
      lines: chordLines,
      section: 'chords',
      gridSize,
      catalog,
      errors,
    });
    const strumBars = parseSectionBars({
      lines: strumLines,
      section: 'strum',
      gridSize,
      catalog,
      errors,
    });

    if (chordBars.length !== strumBars.length) {
      addError(
        errors,
        'bar_count_mismatch',
        lines[strumLabelIndex].line,
        'strum',
        null,
        null,
        'section',
        `The chord section has ${chordBars.length} bars. The strum section has ${strumBars.length} bars.`,
      );
    }

    if (
      errors.length > 0
      || gridSize === null
      || bpm === null
      || countInBars === null
      || tempoRamp === null
      || capoFret === null
    ) {
      return makeResult(null, errors);
    }

    const song = Object.freeze({
      bpm,
      countInBars,
      tempoRamp,
      capoFret,
      gridSize,
      chordBars: Object.freeze(chordBars.map((bar) => Object.freeze(bar.changes))),
      strumBars: Object.freeze(strumBars.map((bar) => Object.freeze(bar.tokens))),
    });
    return makeResult(song, errors);
  }

  function parseHeader(entry, errors) {
    if (!entry) {
      addError(errors, 'header_missing', 1, null, null, null, 'header', 'Add the 4/4 grid header.');
      return null;
    }
    const match = entry.text.match(/^4\/4\s*#\s*(\S+)$/);
    if (!match) {
      addError(
        errors,
        'header_invalid',
        entry.line,
        null,
        null,
        null,
        'header',
        'Use a header such as 4/4#8.',
      );
      return null;
    }
    if (!/^\d+$/.test(match[1])) {
      addError(
        errors,
        'grid_format',
        entry.line,
        null,
        null,
        null,
        'grid',
        'Grid size must be 8, 16, or 24.',
      );
      return null;
    }
    const gridSize = Number(match[1]);
    if (!VALID_GRID_SIZES.has(gridSize)) {
      addError(
        errors,
        'grid_range',
        entry.line,
        null,
        null,
        null,
        'grid',
        'Grid size must be 8, 16, or 24.',
      );
      return null;
    }
    return gridSize;
  }

  function parseBpm(entry, errors) {
    if (!entry) {
      addError(errors, 'bpm_missing', 1, null, null, null, 'bpm', 'Add the bpm: directive.');
      return null;
    }
    const match = entry.text.match(/^bpm\s*:\s*(\S+)$/);
    if (!match) {
      addError(
        errors,
        directiveCode(entry.text),
        entry.line,
        null,
        null,
        null,
        'bpm',
        'Use bpm: followed by a whole number from 30 through 300.',
      );
      return null;
    }
    if (!/^\d+$/.test(match[1])) {
      addError(
        errors,
        'bpm_format',
        entry.line,
        null,
        null,
        null,
        'bpm',
        'BPM must be a whole number from 30 through 300.',
      );
      return null;
    }
    const bpm = Number(match[1]);
    if (bpm < 30 || bpm > 300) {
      addError(
        errors,
        'bpm_range',
        entry.line,
        null,
        null,
        null,
        'bpm',
        'BPM must be from 30 through 300.',
      );
      return null;
    }
    return bpm;
  }

  function parseCountIn(entry, errors) {
    const match = entry.text.match(/^count-in\s*:\s*(\S+)$/);
    if (!match || !/^\d+$/.test(match[1])) {
      addError(
        errors,
        'count_in_format',
        entry.line,
        null,
        null,
        null,
        'count-in',
        'Count-in must be 0, 1, or 2 bars.',
      );
      return null;
    }
    const countInBars = Number(match[1]);
    if (countInBars < 0 || countInBars > 2) {
      addError(
        errors,
        'count_in_range',
        entry.line,
        null,
        null,
        null,
        'count-in',
        'Count-in must be 0, 1, or 2 bars.',
      );
      return null;
    }
    return countInBars;
  }

  function parseTempoRamp(entry, startingBpm, errors) {
    const match = entry.text.match(/^tempo-ramp\s*:\s*(.*)$/);
    if (!match || match[1] === '') {
      addError(
        errors,
        'tempo_ramp_format',
        entry.line,
        null,
        null,
        null,
        'tempo-ramp',
        'Use tempo-ramp: off or a value such as +5/2/120.',
      );
      return null;
    }

    const value = match[1].trim();
    if (value === 'off') {
      return Object.freeze({
        enabled: false,
        stepBpm: null,
        loopsPerStep: null,
        targetBpm: null,
      });
    }

    const parts = value.split('/').map((part) => part.trim());
    if (parts.length !== 3) {
      addError(
        errors,
        'tempo_ramp_format',
        entry.line,
        null,
        null,
        null,
        'tempo-ramp',
        'Use +step/loops/target, such as +5/2/120.',
      );
      return null;
    }

    const errorCount = errors.length;
    const [stepPart, loopsPart, targetPart] = parts;
    if (!stepPart.startsWith('+')) {
      addError(
        errors,
        'tempo_ramp_sign',
        entry.line,
        null,
        null,
        null,
        'tempo-ramp-step',
        'The tempo-ramp step must start with +.',
      );
    }

    const stepText = stepPart.startsWith('+') ? stepPart.slice(1) : stepPart;
    const stepBpm = parseTempoRampInteger({
      text: stepText,
      minimum: 1,
      maximum: 20,
      formatCode: 'tempo_ramp_step_format',
      rangeCode: 'tempo_ramp_step_range',
      field: 'tempo-ramp-step',
      label: 'Tempo-ramp step',
      line: entry.line,
      errors,
    });
    const loopsPerStep = parseTempoRampInteger({
      text: loopsPart,
      minimum: 1,
      maximum: 99,
      formatCode: 'tempo_ramp_loops_format',
      rangeCode: 'tempo_ramp_loops_range',
      field: 'tempo-ramp-loops',
      label: 'Tempo-ramp loop interval',
      line: entry.line,
      errors,
    });
    const targetBpm = parseTempoRampInteger({
      text: targetPart,
      minimum: 30,
      maximum: 300,
      formatCode: 'tempo_ramp_target_format',
      rangeCode: 'tempo_ramp_target_range',
      field: 'tempo-ramp-target',
      label: 'Tempo-ramp target',
      line: entry.line,
      errors,
    });

    if (
      targetBpm !== null
      && startingBpm !== null
      && targetBpm <= startingBpm
    ) {
      addError(
        errors,
        'tempo_ramp_target_start',
        entry.line,
        null,
        null,
        null,
        'tempo-ramp-target',
        'The tempo-ramp target must be greater than the starting BPM.',
      );
    }

    if (errors.length !== errorCount) return null;
    return Object.freeze({
      enabled: true,
      stepBpm,
      loopsPerStep,
      targetBpm,
    });
  }

  function parseTempoRampInteger(options) {
    const {
      text,
      minimum,
      maximum,
      formatCode,
      rangeCode,
      field,
      label,
      line,
      errors,
    } = options;
    if (!/^\d+$/.test(text)) {
      addError(
        errors,
        formatCode,
        line,
        null,
        null,
        null,
        field,
        `${label} must be a whole number from ${minimum} through ${maximum}.`,
      );
      return null;
    }
    const value = Number(text);
    if (value < minimum || value > maximum) {
      addError(
        errors,
        rangeCode,
        line,
        null,
        null,
        null,
        field,
        `${label} must be from ${minimum} through ${maximum}.`,
      );
      return null;
    }
    return value;
  }

  function parseCapo(entry, errors) {
    const match = entry.text.match(/^capo\s*:\s*(\S+)$/);
    if (!match || !/^\d+$/.test(match[1])) {
      addError(
        errors,
        'capo_format',
        entry.line,
        null,
        null,
        null,
        'capo',
        'Capo fret must be a whole number from 0 through 12.',
      );
      return null;
    }
    const capoFret = Number(match[1]);
    if (capoFret < 0 || capoFret > 12) {
      addError(
        errors,
        'capo_range',
        entry.line,
        null,
        null,
        null,
        'capo',
        'Capo fret must be from 0 through 12.',
      );
      return null;
    }
    return capoFret;
  }

  function parseSectionBars(options) {
    const { lines, section, gridSize, catalog, errors } = options;
    const bars = [];
    for (const entry of lines) {
      parseBarLine(entry, section, gridSize, catalog, bars, errors);
    }
    return bars;
  }

  function parseBarLine(entry, section, gridSize, catalog, bars, errors) {
    const text = entry.text;
    let cursor = 0;
    while (cursor < text.length) {
      cursor = skipSpaces(text, cursor);
      if (cursor >= text.length) break;

      if (text[cursor] !== '|') {
        const isComment = text[cursor] === '#';
        const looksLikeDirective = /^[a-z][a-z-]*\s*:/i.test(text.slice(cursor));
        const isDuplicateCountIn = /^count-in\s*:/.test(text.slice(cursor));
        const isDuplicateTempoRamp = /^tempo-ramp\s*:/.test(text.slice(cursor));
        const isDuplicateCapo = /^capo\s*:/.test(text.slice(cursor));
        addError(
          errors,
          isComment
            ? 'comments_not_supported'
            : (isDuplicateCountIn
              ? 'count_in_duplicate'
              : (isDuplicateTempoRamp
                ? 'tempo_ramp_duplicate'
                : (isDuplicateCapo
                  ? 'capo_duplicate'
                  : (looksLikeDirective ? 'unknown_directive' : 'bar_syntax')))),
          entry.line,
          section,
          bars.length + 1,
          null,
          isDuplicateCountIn
            ? 'count-in'
            : (isDuplicateTempoRamp
              ? 'tempo-ramp'
              : (isDuplicateCapo ? 'capo' : 'bar')),
          isComment
            ? 'Comments are not supported.'
            : (isDuplicateCountIn
              ? 'The count-in: directive can occur only once.'
              : (isDuplicateTempoRamp
                ? 'The tempo-ramp: directive can occur only once.'
                : (isDuplicateCapo
                  ? 'The capo: directive can occur only once.'
                  : 'Each section line must contain one or more | ... | bars.'))),
        );
        return;
      }

      const closeIndex = text.indexOf('|', cursor + 1);
      if (closeIndex === -1) {
        addError(
          errors,
          'bar_unclosed',
          entry.line,
          section,
          bars.length + 1,
          null,
          'bar',
          'Add the closing | for this bar.',
        );
        return;
      }

      const content = text.slice(cursor + 1, closeIndex).trim();
      const firstBarNumber = bars.length + 1;
      const parsedBar = section === 'chords'
        ? parseChordBar(content, entry.line, firstBarNumber, gridSize, catalog, errors)
        : parseStrumBar(content, entry.line, firstBarNumber, gridSize, errors);
      const sharedBoundaryIndex = closeIndex;
      cursor = skipSpaces(text, closeIndex + 1);

      let repeatCount = 1;
      let hasRepeat = false;
      if (cursor < text.length && text[cursor].toLowerCase() === 'x') {
        hasRepeat = true;
        const tokenEnd = findTokenEnd(text, cursor);
        const repeatToken = text.slice(cursor, tokenEnd);
        if (!/^x\d+$/.test(repeatToken)) {
          addError(
            errors,
            'repeat_format',
            entry.line,
            section,
            firstBarNumber,
            null,
            'repeat',
            'Use a repeat such as x2.',
          );
        } else {
          repeatCount = Number(repeatToken.slice(1));
          if (repeatCount < 2 || repeatCount > 999) {
            addError(
              errors,
              'repeat_range',
              entry.line,
              section,
              firstBarNumber,
              null,
              'repeat',
              'Repeat count must be from 2 through 999.',
            );
            repeatCount = 1;
          }
        }
        cursor = tokenEnd;
      }

      if (bars.length + repeatCount > MAX_EXPANDED_BARS) {
        addError(
          errors,
          'repeat_overflow',
          entry.line,
          section,
          firstBarNumber,
          null,
          'repeat',
          'The expanded section must not exceed 1,000 bars.',
        );
        return;
      }

      for (let repeatIndex = 0; repeatIndex < repeatCount; repeatIndex += 1) {
        bars.push(parsedBar);
      }

      cursor = skipSpaces(text, cursor);
      if (cursor >= text.length) return;
      if (text[cursor] === '|') continue;
      if (hasRepeat) {
        addError(
          errors,
          'bar_syntax',
          entry.line,
          section,
          bars.length + 1,
          null,
          'bar',
          'Add | before the bar that follows a repeat.',
        );
        return;
      }
      cursor = sharedBoundaryIndex;
    }
  }

  function parseChordBar(content, line, bar, gridSize, catalog, errors) {
    const tokens = splitTokens(content);
    const changes = [];
    if (tokens.length === 0) {
      addError(
        errors,
        'chord_bar_empty',
        line,
        'chords',
        bar,
        null,
        'chord',
        'Each chord bar must start with a chord.',
      );
      return Object.freeze({ changes: Object.freeze(changes), sourceLine: line });
    }

    let previousSlot = 0;
    tokens.forEach((token, tokenIndex) => {
      const atParts = token.split('@');
      let identifier = atParts[0];
      let slot = tokenIndex === 0 ? 1 : null;

      if (tokenIndex === 0 && atParts.length > 1) {
        addError(
          errors,
          'chord_start_explicit_slot',
          line,
          'chords',
          bar,
          1,
          'chord',
          'Write the starting chord without @1.',
        );
      } else if (tokenIndex > 0 && atParts.length === 1) {
        addError(
          errors,
          'chord_change_slot_missing',
          line,
          'chords',
          bar,
          null,
          'chord',
          `Add @N to the ${token} chord change.`,
        );
      } else if (tokenIndex > 0) {
        const slotText = atParts.length === 2 ? atParts[1] : '';
        if (!/^\d+$/.test(slotText)) {
          addError(
            errors,
            'chord_change_slot_format',
            line,
            'chords',
            bar,
            null,
            'slot',
            `Use a whole-number slot for ${identifier}.`,
          );
        } else {
          slot = Number(slotText);
          if (gridSize !== null && (slot < 2 || slot > gridSize)) {
            addError(
              errors,
              'chord_change_slot_range',
              line,
              'chords',
              bar,
              slot,
              'slot',
              `Chord-change slot must be from 2 through ${gridSize}.`,
            );
          } else if (slot <= previousSlot) {
            addError(
              errors,
              'chord_change_slot_order',
              line,
              'chords',
              bar,
              slot,
              'slot',
              'Chord-change slots must be unique and ascending.',
            );
          }
        }
      }

      if (atParts.length > 2 || identifier === '') {
        addError(
          errors,
          'chord_token_format',
          line,
          'chords',
          bar,
          slot,
          'chord',
          `Invalid chord token: ${token}.`,
        );
        identifier = identifier || token;
      }

      if (catalog && !catalog.getChord(identifier)) {
        addError(
          errors,
          'chord_unsupported',
          line,
          'chords',
          bar,
          slot,
          'chord',
          `Unsupported chord: ${identifier}.`,
        );
      }

      if (slot !== null) {
        changes.push(Object.freeze({ chord: identifier, slot }));
        previousSlot = slot;
      }
    });

    return Object.freeze({ changes: Object.freeze(changes), sourceLine: line });
  }

  function parseStrumBar(content, line, bar, gridSize, errors) {
    const rawTokens = splitTokens(content);
    const tokens = rawTokens.map((token, index) => parseStrumToken(
      token,
      line,
      bar,
      index + 1,
      errors,
    ));

    if (gridSize !== null && tokens.length !== gridSize) {
      addError(
        errors,
        'strum_slot_count',
        line,
        'strum',
        bar,
        null,
        'bar',
        `Expected ${gridSize} strum slots. Found ${tokens.length}.`,
      );
    }

    return Object.freeze({ tokens: Object.freeze(tokens), sourceLine: line });
  }

  function parseStrumToken(token, line, bar, slot, errors) {
    if (token === '-') {
      return makeStrum(null, null, 'normal', false);
    }

    const match = token.match(STRUM_TOKEN_PATTERN);
    if (!match) {
      addError(
        errors,
        'strum_token_invalid',
        line,
        'strum',
        bar,
        slot,
        'strum',
        `Invalid strum token: ${token}. Use D or U. Add optional modifiers in this order: string count, articulation, accent.`,
      );
      return makeStrum(null, null, 'normal', false);
    }

    const articulationMarker = match[3].toUpperCase();
    const articulation = articulationMarker === 'P'
      ? 'palm-mute'
      : (articulationMarker === 'X' ? 'dead' : 'normal');
    return makeStrum(
      match[1].toUpperCase(),
      match[2] === '' ? null : Number(match[2]),
      articulation,
      match[4] === '!',
    );
  }

  function makeStrum(direction, stringCount, articulation, accented) {
    return Object.freeze({ direction, stringCount, articulation, accented });
  }

  function parseStrumTokenValue(token) {
    const errors = [];
    const strum = parseStrumToken(String(token), null, null, null, errors);
    return Object.freeze({
      ok: errors.length === 0,
      strum: errors.length === 0 ? strum : null,
      errors: Object.freeze(errors),
    });
  }

  function replaceBpmDirective(source, replacementValue) {
    return replaceDirectiveValue(source, 'bpm', replacementValue);
  }

  function replaceCountInDirective(source, replacementValue) {
    return replaceDirectiveValue(source, 'count-in', replacementValue);
  }

  function replaceTempoRampDirective(source, replacementValue) {
    return replaceDirectiveValue(source, 'tempo-ramp', replacementValue);
  }

  function replaceCapoDirective(source, replacementValue) {
    return replaceDirectiveValue(source, 'capo', replacementValue);
  }

  function replaceDirectiveValue(source, directiveName, replacementValue) {
    const sourceText = String(source);
    const newline = sourceText.includes('\r\n') ? '\r\n' : '\n';
    const lines = sourceText.split(/\r?\n/);
    const escapedName = directiveName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const directivePattern = new RegExp(`^\\s*${escapedName}\\s*:`);
    const valuePattern = new RegExp(`^(\\s*${escapedName}\\s*:\\s*)(.*?)(\\s*)$`);
    const matchingIndexes = [];
    lines.forEach((line, index) => {
      if (directivePattern.test(line)) matchingIndexes.push(index);
    });
    if (matchingIndexes.length !== 1) return null;

    const lineIndex = matchingIndexes[0];
    const match = lines[lineIndex].match(valuePattern);
    if (!match) return null;
    lines[lineIndex] = `${match[1]}${String(replacementValue)}${match[3]}`;
    return lines.join(newline);
  }

  function musicalContentKey(song) {
    return JSON.stringify({
      gridSize: song.gridSize,
      capoFret: song.capoFret,
      chordBars: song.chordBars,
      strumBars: song.strumBars,
    });
  }

  function formatValidationError(error) {
    const locations = [];
    if (error.section) locations.push(capitalize(error.section));
    if (error.bar !== null) locations.push(`bar ${error.bar}`);
    if (error.slot !== null) locations.push(`slot ${error.slot}`);
    const linePrefix = error.line === null ? 'Source' : `Line ${error.line}`;
    const locationText = locations.length > 0 ? ` — ${locations.join(', ')}` : '';
    return `${linePrefix}${locationText}: ${error.message}`;
  }

  function addError(errors, code, line, section, bar, slot, field, message) {
    errors.push(Object.freeze({ code, line, section, bar, slot, field, message }));
  }

  function makeResult(song, errors) {
    const orderedErrors = [...errors].sort((left, right) => (
      (left.line ?? Number.MAX_SAFE_INTEGER) - (right.line ?? Number.MAX_SAFE_INTEGER)
    ));
    return Object.freeze({
      ok: orderedErrors.length === 0,
      song,
      errors: Object.freeze(orderedErrors),
    });
  }

  function directiveCode(text) {
    return text && /^[a-z][a-z-]*\s*:/i.test(text) ? 'unknown_directive' : 'document_order';
  }

  function splitTokens(content) {
    return content === '' ? [] : content.split(/\s+/);
  }

  function skipSpaces(text, startIndex) {
    let index = startIndex;
    while (index < text.length && /\s/.test(text[index])) index += 1;
    return index;
  }

  function findTokenEnd(text, startIndex) {
    let index = startIndex;
    while (index < text.length && !/\s|\|/.test(text[index])) index += 1;
    return index;
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  return Object.freeze({
    formatValidationError,
    musicalContentKey,
    parseSongSource,
    parseStrumTokenValue,
    replaceBpmDirective,
    replaceCapoDirective,
    replaceCountInDirective,
    replaceTempoRampDirective,
  });
}));
