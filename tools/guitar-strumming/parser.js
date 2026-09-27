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

    if (!lines[2] || lines[2].text !== 'chords:') {
      const entry = lines[2] || lines.at(-1);
      addError(
        errors,
        directiveCode(entry && entry.text),
        entry ? entry.line : sourceLines.length,
        null,
        null,
        null,
        'document',
        'Expected chords: after the BPM directive.',
      );
      return makeResult(null, errors);
    }

    const strumLabelIndex = lines.findIndex((entry, index) => (
      index > 2 && entry.text === 'strum:'
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

    const duplicateChordLabel = lines.find((entry, index) => index > 2 && entry.text === 'chords:');
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

    const chordLines = lines.slice(3, strumLabelIndex);
    const strumLines = lines.slice(strumLabelIndex + 1);
    if (chordLines.length === 0) {
      addError(
        errors,
        'chords_section_empty',
        lines[2].line,
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

    if (errors.length > 0 || gridSize === null || bpm === null) {
      return makeResult(null, errors);
    }

    const song = Object.freeze({
      bpm,
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
        addError(
          errors,
          isComment ? 'comments_not_supported' : (looksLikeDirective ? 'unknown_directive' : 'bar_syntax'),
          entry.line,
          section,
          bars.length + 1,
          null,
          'bar',
          isComment
            ? 'Comments are not supported.'
            : 'Each section line must contain one or more | ... | bars.',
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
    const tokens = rawTokens.map((token, index) => {
      const normalized = token.toUpperCase();
      if (!['D', 'U', '-'].includes(normalized)) {
        addError(
          errors,
          'strum_token_invalid',
          line,
          'strum',
          bar,
          index + 1,
          'strum',
          `Invalid strum token: ${token}.`,
        );
      }
      return normalized;
    });

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

  function replaceBpmDirective(source, replacementValue) {
    const sourceText = String(source);
    const newline = sourceText.includes('\r\n') ? '\r\n' : '\n';
    const lines = sourceText.split(/\r?\n/);
    const matchingIndexes = [];
    lines.forEach((line, index) => {
      if (/^\s*bpm\s*:/.test(line)) matchingIndexes.push(index);
    });
    if (matchingIndexes.length !== 1) return null;

    const lineIndex = matchingIndexes[0];
    const match = lines[lineIndex].match(/^(\s*bpm\s*:\s*)(\S*)(\s*)$/);
    if (!match) return null;
    lines[lineIndex] = `${match[1]}${String(replacementValue)}${match[3]}`;
    return lines.join(newline);
  }

  function musicalContentKey(song) {
    return JSON.stringify({
      gridSize: song.gridSize,
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
    replaceBpmDirective,
  });
}));
