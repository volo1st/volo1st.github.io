(function initializeCatalog(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.GuitarChordCatalog = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function createCatalog() {
  'use strict';

  const entries = [
    createEntry('A', ['x', 0, 2, 2, 2, 0]),
    createEntry('Am', ['x', 0, 2, 2, 1, 0]),
    createEntry('Bb', ['x', 1, 3, 3, 3, 1]),
    createEntry('Bm', ['x', 2, 4, 4, 3, 2]),
    createEntry('C', ['x', 3, 2, 0, 1, 0]),
    createEntry('Cm', ['x', 3, 5, 5, 4, 3]),
    createEntry('D', ['x', 'x', 0, 2, 3, 2]),
    createEntry('Dm', ['x', 'x', 0, 2, 3, 1]),
    createEntry('Em', [0, 2, 2, 0, 0, 0]),
    createEntry('F', [1, 3, 3, 2, 1, 1]),
    createEntry('F#m', [2, 4, 4, 2, 2, 2]),
    createEntry('G', [3, 2, 0, 0, 0, 3]),
    createEntry('Am7', ['x', 0, 2, 0, 1, 0]),
    createEntry('C7', ['x', 3, 2, 3, 1, 0]),
    createEntry('Cmaj7', ['x', 3, 2, 0, 0, 0]),
    createEntry('D7', ['x', 'x', 0, 2, 1, 2]),
    createEntry('G7', [3, 2, 0, 0, 0, 1]),
    createEntry('Cadd9', ['x', 3, 2, 0, 3, 3]),
    createEntry('Dsus4', ['x', 'x', 0, 2, 3, 3]),
    createEntry('G5', [3, 5, 5, 'x', 'x', 'x']),
    createEntry('Am/G', [3, 'x', 2, 2, 1, 0]),
    createEntry('C/E', [0, 3, 2, 0, 1, 0]),
    createEntry('D/F#', [2, 'x', 0, 2, 3, 2]),
    createEntry('G/B', ['x', 2, 0, 0, 3, 3]),
  ];

  const byIdentifier = new Map();
  for (const entry of entries) {
    addIdentifier(entry.id, entry);
    for (const alias of entry.aliases) {
      addIdentifier(alias, entry);
    }
  }

  function createEntry(id, frets, aliases = []) {
    return Object.freeze({
      id,
      aliases: Object.freeze([...aliases]),
      defaultVoicingId: 'default',
      voicings: Object.freeze([
        Object.freeze({
          id: 'default',
          frets: Object.freeze([...frets]),
        }),
      ]),
    });
  }

  function addIdentifier(identifier, entry) {
    if (byIdentifier.has(identifier)) {
      throw new Error(`Duplicate chord identifier: ${identifier}`);
    }
    byIdentifier.set(identifier, entry);
  }

  function getChord(identifier) {
    return byIdentifier.get(identifier) || null;
  }

  function getDefaultVoicing(identifier) {
    const entry = getChord(identifier);
    if (!entry) return null;
    return entry.voicings.find((voicing) => voicing.id === entry.defaultVoicingId) || null;
  }

  function listCanonicalIdentifiers() {
    return entries.map((entry) => entry.id);
  }

  return Object.freeze({
    getChord,
    getDefaultVoicing,
    listCanonicalIdentifiers,
  });
}));
