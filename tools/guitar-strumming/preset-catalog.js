(function initializePresetCatalog(root, factory) {
  const presetData = typeof module === 'object' && module.exports
    ? require('./preset-data.js')
    : root && root.GuitarStrummingPresetData;
  const parser = typeof module === 'object' && module.exports
    ? require('./parser.js')
    : root && root.GuitarStrummingParser;
  const chordCatalog = typeof module === 'object' && module.exports
    ? require('./catalog.js')
    : root && root.GuitarChordCatalog;
  const core = typeof module === 'object' && module.exports
    ? require('./core.js')
    : root && root.GuitarStrummingCore;
  const api = factory(root, presetData, parser, chordCatalog, core);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.GuitarStrummingPresets = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function createPresetCatalog(
  root,
  presetData,
  parser,
  chordCatalog,
  core,
) {
  'use strict';

  const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*-v[1-9]\d*$/;
  const TAG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const DEFAULT_PRESET_SLUG = presetData && presetData.defaultPresetSlug;
  const APPROVED_RIGHTS_BASES = Object.freeze(['Original exercise', 'Short user transcription']);

  class PresetError extends Error {
    constructor(code, message) {
      super(message);
      this.name = 'PresetError';
      this.code = code;
    }
  }

  if (
    !presetData
    || !Array.isArray(presetData.sharedArrangements)
    || !Array.isArray(presetData.exerciseProfiles)
    || !Array.isArray(presetData.standalonePresets)
  ) {
    throw new PresetError(
      'preset_data_unavailable',
      'The preset data script is unavailable or malformed.',
    );
  }

  validateArrangementEntries(presetData.sharedArrangements);
  validateExerciseProfiles(presetData.exerciseProfiles, presetData.sharedArrangements);
  validatePresetEntries(presetData.standalonePresets);

  const sharedArrangements = Object.freeze(
    presetData.sharedArrangements.map(makeArrangement),
  );
  const exerciseProfiles = Object.freeze(
    presetData.exerciseProfiles.map(makeExerciseProfile),
  );
  const standalonePresets = Object.freeze(
    presetData.standalonePresets.map(makePreset),
  );

  const composedPresets = createExercisePresets(sharedArrangements, exerciseProfiles);
  const presets = Object.freeze([...standalonePresets, ...composedPresets]);

  validatePresetEntries(presets);
  validatePresetExerciseIdentities(presets);
  if (!presets.some((preset) => preset.slug === DEFAULT_PRESET_SLUG)) {
    throw new PresetError(
      'preset_default_unknown',
      'The default preset does not identify a catalog entry.',
    );
  }

  const presetsBySlug = new Map(presets.map((preset) => [preset.slug, preset]));
  const presetsBySource = new Map(presets.map((preset) => [preset.source, preset]));
  const presetsByExerciseIdentity = new Map(presets.map((preset) => [
    exerciseIdentityKeyFromSource(preset.source),
    preset,
  ]));

  function makeArrangement(entry) {
    return Object.freeze({
      id: entry.id,
      title: entry.title,
      gridHeader: entry.gridHeader,
      originalKey: entry.originalKey,
      notation: entry.notation,
      chordSource: entry.chordSource,
      strumSource: entry.strumSource,
      rightsBasis: entry.rightsBasis,
      rightsNotice: entry.rightsNotice || '',
    });
  }

  function makeExerciseProfile(entry) {
    return Object.freeze({
      slug: entry.slug,
      arrangementId: entry.arrangementId,
      title: entry.title,
      presetType: entry.presetType,
      teachingLevel: entry.teachingLevel,
      teachingGoal: entry.teachingGoal,
      tags: Object.freeze([...entry.tags]),
      playingKey: entry.playingKey,
      bpm: entry.bpm,
      countIn: entry.countIn,
      tempoRamp: entry.tempoRamp,
      capo: entry.capo,
      swing: entry.swing,
    });
  }

  function createExercisePresets(arrangements, profiles) {
    validateArrangementEntries(arrangements);
    validateExerciseProfiles(profiles, arrangements);
    const arrangementsById = new Map(arrangements.map((entry) => [entry.id, entry]));
    const entries = profiles.map((profile) => {
      const arrangement = arrangementsById.get(profile.arrangementId);
      const source = formatExerciseSource(arrangement, profile);
      validateMaterializedSource(profile.slug, source);
      return makePreset({
        ...profile,
        rightsBasis: arrangement.rightsBasis,
        rightsNotice: arrangement.rightsNotice,
        source,
      });
    });
    validatePresetEntries(entries);
    validatePresetExerciseIdentities(entries);
    return Object.freeze(entries);
  }

  function materializeExercise(arrangement, profile) {
    validateArrangementEntries([arrangement]);
    validateExerciseProfiles([profile], [arrangement]);
    const source = formatExerciseSource(arrangement, profile);
    validateMaterializedSource(profile.slug, source);
    return source;
  }

  function formatExerciseSource(arrangement, profile) {
    return `${arrangement.gridHeader}
bpm: ${profile.bpm}
count-in: ${profile.countIn}
tempo-ramp: ${profile.tempoRamp}
original-key: ${arrangement.originalKey}
key: ${profile.playingKey}
notation: ${arrangement.notation}
capo: ${profile.capo}
swing: ${profile.swing}

chords:
${arrangement.chordSource}

strum:
${arrangement.strumSource}`;
  }

  function validateArrangementEntries(entries) {
    if (!Array.isArray(entries)) {
      throw new PresetError('arrangement_catalog_invalid', 'The arrangement catalog must be an array.');
    }
    const identifiers = new Set();
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') {
        throw new PresetError('arrangement_entry_invalid', 'Each arrangement must be an object.');
      }
      if (!SLUG_PATTERN.test(entry.id || '')) {
        throw new PresetError(
          'arrangement_id_invalid',
          `Invalid arrangement identifier: ${entry.id || '(empty)'}.`,
        );
      }
      if (identifiers.has(entry.id)) {
        throw new PresetError(
          'arrangement_id_duplicate',
          `Duplicate arrangement identifier: ${entry.id}.`,
        );
      }
      identifiers.add(entry.id);
      if (typeof entry.title !== 'string' || entry.title.trim() === '') {
        throw new PresetError('arrangement_title_invalid', `Arrangement ${entry.id} has no title.`);
      }
      if (!/^4\/4#(?:8|16|24)$/.test(entry.gridHeader || '')) {
        throw new PresetError(
          'arrangement_grid_invalid',
          `Arrangement ${entry.id} has an invalid grid header.`,
        );
      }
      if (!parseKeyMode(entry.originalKey)) {
        throw new PresetError(
          'arrangement_original_key_invalid',
          `Arrangement ${entry.id} has an invalid original key.`,
        );
      }
      if (entry.notation !== 'numbers') {
        throw new PresetError(
          'arrangement_notation_invalid',
          `Arrangement ${entry.id} must use number notation.`,
        );
      }
      if (typeof entry.chordSource !== 'string' || entry.chordSource.trim() === '') {
        throw new PresetError(
          'arrangement_chords_invalid',
          `Arrangement ${entry.id} has no chord bars.`,
        );
      }
      if (typeof entry.strumSource !== 'string' || entry.strumSource.trim() === '') {
        throw new PresetError(
          'arrangement_strum_invalid',
          `Arrangement ${entry.id} has no strum bars.`,
        );
      }
      validateRights(entry, `Arrangement ${entry.id}`);
    }
    return true;
  }

  function validateExerciseProfiles(profiles, arrangements) {
    if (!Array.isArray(profiles)) {
      throw new PresetError('exercise_profile_catalog_invalid', 'Exercise profiles must be an array.');
    }
    if (!Array.isArray(arrangements)) {
      throw new PresetError('arrangement_catalog_invalid', 'The arrangement catalog must be an array.');
    }
    const arrangementsById = new Map(arrangements.map((entry) => [entry.id, entry]));
    const slugs = new Set();
    const requiredDefaults = ['bpm', 'countIn', 'tempoRamp', 'capo', 'swing'];
    for (const profile of profiles) {
      if (!profile || typeof profile !== 'object') {
        throw new PresetError('exercise_profile_invalid', 'Each exercise profile must be an object.');
      }
      if (!SLUG_PATTERN.test(profile.slug || '')) {
        throw new PresetError(
          'preset_slug_invalid',
          `Invalid preset slug: ${profile.slug || '(empty)'}.`,
        );
      }
      if (slugs.has(profile.slug)) {
        throw new PresetError('preset_slug_duplicate', `Duplicate preset slug: ${profile.slug}.`);
      }
      slugs.add(profile.slug);
      if (typeof profile.title !== 'string' || profile.title.trim() === '') {
        throw new PresetError('preset_title_invalid', `Preset ${profile.slug} has no title.`);
      }
      if (typeof profile.teachingLevel !== 'string' || profile.teachingLevel.trim() === '') {
        throw new PresetError('preset_level_invalid', `Preset ${profile.slug} has no teaching level.`);
      }
      if (!['Exercise', 'Feature demo', 'Song exercise'].includes(profile.presetType)) {
        throw new PresetError(
          'preset_type_invalid',
          `Preset ${profile.slug} has an invalid preset type.`,
        );
      }
      if (typeof profile.teachingGoal !== 'string' || profile.teachingGoal.trim() === '') {
        throw new PresetError('preset_goal_invalid', `Preset ${profile.slug} has no teaching goal.`);
      }
      if (
        !Array.isArray(profile.tags)
        || profile.tags.length === 0
        || new Set(profile.tags).size !== profile.tags.length
        || profile.tags.some((tag) => !TAG_PATTERN.test(tag))
      ) {
        throw new PresetError('preset_tags_invalid', `Preset ${profile.slug} has invalid tags.`);
      }
      const arrangement = arrangementsById.get(profile.arrangementId);
      if (!arrangement) {
        throw new PresetError(
          'arrangement_reference_missing',
          `Exercise profile ${profile.slug} refers to an unavailable arrangement.`,
        );
      }
      const missingDefault = requiredDefaults.find((field) => (
        !Object.hasOwn(profile, field)
        || profile[field] === null
        || profile[field] === undefined
        || profile[field] === ''
      ));
      if (missingDefault) {
        throw new PresetError(
          'exercise_profile_default_missing',
          `Exercise profile ${profile.slug} has no ${missingDefault} default.`,
        );
      }
      const originalMode = parseKeyMode(arrangement.originalKey);
      const playingMode = parseKeyMode(profile.playingKey);
      if (!playingMode) {
        throw new PresetError(
          'exercise_profile_key_invalid',
          `Exercise profile ${profile.slug} has an invalid playing key.`,
        );
      }
      if (originalMode !== playingMode) {
        throw new PresetError(
          'exercise_profile_key_mode_mismatch',
          `Exercise profile ${profile.slug} uses a different mode from its arrangement.`,
        );
      }
      if (
        !Number.isInteger(profile.bpm)
        || profile.bpm < 30
        || profile.bpm > 300
        || !Number.isInteger(profile.countIn)
        || profile.countIn < 0
        || profile.countIn > 2
        || typeof profile.tempoRamp !== 'string'
        || !Number.isInteger(profile.capo)
        || profile.capo < 0
        || profile.capo > 12
        || !(
          profile.swing === 'off'
          || (Number.isInteger(profile.swing) && profile.swing >= 50 && profile.swing <= 75)
        )
      ) {
        throw new PresetError(
          'exercise_profile_default_invalid',
          `Exercise profile ${profile.slug} has an invalid default.`,
        );
      }
    }
    return true;
  }

  function validateMaterializedSource(slug, source) {
    if (
      !parser
      || typeof parser.parseSongSource !== 'function'
      || !chordCatalog
      || !core
      || typeof core.normalizeSong !== 'function'
    ) {
      throw new PresetError(
        'preset_validation_unavailable',
        `Preset ${slug} cannot be validated because a required script is unavailable.`,
      );
    }
    const parsed = parser.parseSongSource(source, { catalog: chordCatalog });
    if (!parsed.ok) {
      const codes = parsed.errors.map((error) => error.code).join(', ');
      throw new PresetError(
        'preset_materialized_source_invalid',
        `Preset ${slug} produced invalid source: ${codes}.`,
      );
    }
    try {
      core.normalizeSong(parsed.song);
    } catch (error) {
      throw new PresetError(
        'preset_materialized_source_invalid',
        `Preset ${slug} produced an invalid timeline: ${error.message}`,
      );
    }
    return true;
  }

  function parseKeyMode(value) {
    const match = String(value || '').match(/^[A-G](?:b|#)?\s+(major|minor)$/);
    return match ? match[1] : null;
  }

  function makePreset(entry) {
    return Object.freeze({
      slug: entry.slug,
      arrangementId: entry.arrangementId || null,
      title: entry.title,
      presetType: entry.presetType,
      teachingLevel: entry.teachingLevel,
      teachingGoal: entry.teachingGoal,
      tags: Object.freeze([...entry.tags]),
      rightsBasis: entry.rightsBasis,
      rightsNotice: entry.rightsNotice || '',
      source: entry.source,
    });
  }

  function validatePresetEntries(entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new PresetError('preset_catalog_empty', 'The preset catalog must contain at least one preset.');
    }

    const slugs = new Set();
    const sources = new Set();
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') {
        throw new PresetError('preset_entry_invalid', 'Each preset must be an object.');
      }
      if (!SLUG_PATTERN.test(entry.slug || '')) {
        throw new PresetError('preset_slug_invalid', `Invalid preset slug: ${entry.slug || '(empty)'}.`);
      }
      if (slugs.has(entry.slug)) {
        throw new PresetError('preset_slug_duplicate', `Duplicate preset slug: ${entry.slug}.`);
      }
      slugs.add(entry.slug);

      if (typeof entry.source !== 'string' || entry.source.length === 0) {
        throw new PresetError('preset_source_invalid', `Preset ${entry.slug} has no source.`);
      }
      if (sources.has(entry.source)) {
        throw new PresetError('preset_source_duplicate', `Preset ${entry.slug} duplicates another source.`);
      }
      sources.add(entry.source);

      if (typeof entry.title !== 'string' || entry.title.trim() === '') {
        throw new PresetError('preset_title_invalid', `Preset ${entry.slug} has no title.`);
      }
      if (typeof entry.teachingLevel !== 'string' || entry.teachingLevel.trim() === '') {
        throw new PresetError('preset_level_invalid', `Preset ${entry.slug} has no teaching level.`);
      }
      if (!['Exercise', 'Feature demo', 'Song exercise'].includes(entry.presetType)) {
        throw new PresetError('preset_type_invalid', `Preset ${entry.slug} has an invalid preset type.`);
      }
      if (typeof entry.teachingGoal !== 'string' || entry.teachingGoal.trim() === '') {
        throw new PresetError('preset_goal_invalid', `Preset ${entry.slug} has no teaching goal.`);
      }
      if (!Array.isArray(entry.tags) || entry.tags.length === 0) {
        throw new PresetError('preset_tags_invalid', `Preset ${entry.slug} has no tags.`);
      }
      const uniqueTags = new Set(entry.tags);
      if (uniqueTags.size !== entry.tags.length || entry.tags.some((tag) => !TAG_PATTERN.test(tag))) {
        throw new PresetError('preset_tags_invalid', `Preset ${entry.slug} has invalid tags.`);
      }
      if (!APPROVED_RIGHTS_BASES.includes(entry.rightsBasis)) {
        throw new PresetError('preset_rights_invalid', `Preset ${entry.slug} has no approved rights basis.`);
      }
      if (
        entry.rightsBasis === 'Short user transcription'
        && (typeof entry.rightsNotice !== 'string' || entry.rightsNotice.trim() === '')
      ) {
        throw new PresetError('preset_rights_invalid', `Preset ${entry.slug} has no rights notice.`);
      }
    }
    return true;
  }

  function validatePresetExerciseIdentities(entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new PresetError(
        'preset_catalog_empty',
        'The preset catalog must contain at least one preset.',
      );
    }

    const identities = new Map();
    for (const entry of entries) {
      const identity = exerciseIdentityKeyFromSource(entry && entry.source);
      if (identity === null) {
        throw new PresetError(
          'preset_exercise_identity_invalid',
          `Preset ${(entry && entry.slug) || '(unknown)'} has invalid musical content.`,
        );
      }
      if (identities.has(identity)) {
        throw new PresetError(
          'preset_exercise_identity_duplicate',
          `Preset ${entry.slug} has the same exercise identity as ${identities.get(identity)}.`,
        );
      }
      identities.set(identity, entry.slug);
    }
    return true;
  }

  function exerciseIdentityKeyFromSource(source) {
    const result = parser.parseSongSource(String(source || ''), { catalog: chordCatalog });
    if (!result.ok) return null;
    return exerciseIdentityKeyFromSong(result.song);
  }

  function exerciseIdentityKeyFromSong(song) {
    if (!song || typeof song !== 'object') return null;
    return JSON.stringify({
      notation: song.notation,
      originalKey: song.originalKey ? song.originalKey.canonicalText : null,
      playingKey: song.playingKey ? song.playingKey.canonicalText : null,
      musicalContent: parser.musicalContentKey(song),
    });
  }

  function validateRights(entry, label) {
    if (!APPROVED_RIGHTS_BASES.includes(entry.rightsBasis)) {
      throw new PresetError('preset_rights_invalid', `${label} has no approved rights basis.`);
    }
    if (
      entry.rightsBasis === 'Short user transcription'
      && (typeof entry.rightsNotice !== 'string' || entry.rightsNotice.trim() === '')
    ) {
      throw new PresetError('preset_rights_invalid', `${label} has no rights notice.`);
    }
  }

  function listPresets() {
    return presets;
  }

  function listSharedArrangements() {
    return sharedArrangements;
  }

  function listExerciseProfiles() {
    return exerciseProfiles;
  }

  function getPreset(slug) {
    return presetsBySlug.get(slug) || null;
  }

  function getDefaultPreset() {
    return getPreset(DEFAULT_PRESET_SLUG);
  }

  function findPresetBySource(source) {
    return presetsBySource.get(String(source)) || null;
  }

  function findPresetByExerciseIdentity(source) {
    const identity = exerciseIdentityKeyFromSource(source);
    return identity === null ? null : presetsByExerciseIdentity.get(identity) || null;
  }

  function findPresetByExerciseSong(song) {
    const identity = exerciseIdentityKeyFromSong(song);
    return identity === null ? null : presetsByExerciseIdentity.get(identity) || null;
  }

  function resolvePresetFromUrl(urlValue) {
    const url = parseUrl(urlValue);
    const presetParameters = url.searchParams.getAll('preset');
    const songParameters = url.searchParams.getAll('song');

    if (presetParameters.length > 0 && songParameters.length > 0) {
      throw new PresetError(
        'source_parameter_conflict',
        'The URL cannot contain both preset and song parameters.',
      );
    }
    if (presetParameters.length === 0) {
      return Object.freeze({ found: false, preset: null });
    }
    if (presetParameters.length !== 1) {
      throw new PresetError(
        'preset_parameter_count',
        'The URL must contain exactly one preset parameter.',
      );
    }

    const preset = getPreset(presetParameters[0]);
    if (!preset) {
      throw new PresetError(
        'preset_unknown',
        `Preset ${presetParameters[0] || '(empty)'} is not available.`,
      );
    }
    return Object.freeze({ found: true, preset });
  }

  function createPresetUrl(slug, baseUrl) {
    const preset = getPreset(slug);
    if (!preset) {
      throw new PresetError('preset_unknown', `Preset ${slug || '(empty)'} is not available.`);
    }
    const url = parseUrl(baseUrl);
    url.hash = '';
    url.searchParams.delete('song');
    url.searchParams.set('preset', preset.slug);
    const href = url.href;
    return Object.freeze({
      codec: 'preset',
      slug: preset.slug,
      url: href,
      urlLength: href.length,
    });
  }

  function parseUrl(value) {
    try {
      return new root.URL(String(value));
    } catch (error) {
      throw new PresetError('url_invalid', 'The preset URL is invalid.');
    }
  }

  return Object.freeze({
    DEFAULT_PRESET_SLUG,
    PresetError,
    SLUG_PATTERN,
    createExercisePresets,
    createPresetUrl,
    exerciseIdentityKeyFromSong,
    exerciseIdentityKeyFromSource,
    findPresetByExerciseIdentity,
    findPresetByExerciseSong,
    findPresetBySource,
    getDefaultPreset,
    getPreset,
    listExerciseProfiles,
    listPresets,
    listSharedArrangements,
    materializeExercise,
    resolvePresetFromUrl,
    validateArrangementEntries,
    validateExerciseProfiles,
    validatePresetEntries,
    validatePresetExerciseIdentities,
  });
}));
