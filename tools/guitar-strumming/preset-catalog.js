(function initializePresetCatalog(root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.GuitarStrummingPresets = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function createPresetCatalog(root) {
  'use strict';

  const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*-v[1-9]\d*$/;
  const TAG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const DEFAULT_PRESET_SLUG = 'expressive-strumming-demo-v1';

  class PresetError extends Error {
    constructor(code, message) {
      super(message);
      this.name = 'PresetError';
      this.code = code;
    }
  }

  const presets = Object.freeze([
    makePreset({
      slug: 'expressive-strumming-demo-v1',
      title: 'Expressive strumming',
      presetType: 'Feature demo',
      teachingLevel: 'Intermediate',
      teachingGoal: 'Hear mid-bar chord changes, string ranges, palm mute, dead strum, and accents.',
      tags: ['c-family', 'expressive-strums', 'slash-chords'],
      rightsBasis: 'Original exercise',
      source: `4/4#8
bpm: 100
count-in: 1
tempo-ramp: off

chords:
| C G/B@8 | G/B | Am F@8 | F |

strum:
| D - D4 U! - U3P D2X U | x4`,
    }),
    makePreset({
      slug: 'intermediate-c-g-am-f-v1',
      title: 'C, G, Am, and F changes',
      presetType: 'Exercise',
      teachingLevel: 'Intermediate',
      teachingGoal: 'Practice steady changes between C, G, Am, and the full F barre chord.',
      tags: ['c-family', 'chord-changes', 'quarter-notes'],
      rightsBasis: 'Original exercise',
      source: `4/4#8
bpm: 80
count-in: 1
tempo-ramp: off

chords:
| C | G | Am | F |

strum:
| D - D - D - D - | x4`,
    }),
    makePreset({
      slug: 'beginner-g-c-d-em-v1',
      title: 'G, C, D, and Em changes',
      presetType: 'Exercise',
      teachingLevel: 'Beginner',
      teachingGoal: 'Practice four common open chords with an eighth-note strumming pattern.',
      tags: ['g-family', 'chord-changes', 'eighth-notes'],
      rightsBasis: 'Original exercise',
      source: `4/4#8
bpm: 88
count-in: 1
tempo-ramp: off

chords:
| G | C | D | Em |

strum:
| D - D U - U D U | x4`,
    }),
    makePreset({
      slug: 'seventh-chord-turnaround-v1',
      title: 'Seventh-chord turnaround',
      presetType: 'Exercise',
      teachingLevel: 'Intermediate',
      teachingGoal: 'Practice changes between major seventh, minor seventh, and dominant seventh chords.',
      tags: ['seventh-chords', 'c-family', 'g-family'],
      rightsBasis: 'Original exercise',
      source: `4/4#8
bpm: 92
count-in: 1
tempo-ramp: off

chords:
| Cmaj7 | Am7 | D7 | G7 |

strum:
| D - D U - U D U | x4`,
    }),
    makePreset({
      slug: 'get-lucky-palm-muted-strumming-v1',
      title: 'Get Lucky — palm-muted strumming',
      presetType: 'Song exercise',
      teachingLevel: 'Intermediate',
      teachingGoal: 'Practice a 16-slot groove with palm-muted partial strums and changing string ranges.',
      tags: ['song-exercise', 'palm-mute', 'sixteenth-notes', 'partial-strums'],
      rightsBasis: 'Short user transcription',
      rightsNotice: 'Unofficial user transcription for teaching. No lyrics, melody notation, audio, or artwork.',
      source: `4/4#16
bpm: 120
count-in: 1
tempo-ramp: off

chords:
| Am | C | G | D7 |

strum:
| D U2P D2P U2P D - D3P - D - D4 U4 - U4 D4 - | x4`,
    }),
    makePreset({
      slug: 'viva-la-vida-syncopated-strumming-v1',
      title: 'Viva La Vida — syncopated strumming',
      presetType: 'Song exercise',
      teachingLevel: 'Intermediate',
      teachingGoal: 'Practice syncopated eighth-note strumming and mid-bar chord changes.',
      tags: ['song-exercise', 'eighth-notes', 'syncopation', 'mid-bar-changes'],
      rightsBasis: 'Short user transcription',
      rightsNotice: 'Unofficial user transcription for teaching. No lyrics, melody notation, audio, or artwork.',
      source: `4/4#8
bpm: 135
count-in: 1
tempo-ramp: off

chords:
| C D@8 | D | G Em@8 | Em |

strum:
| D - D - D - D U |
| - U - U D - D U3p |
| D - D - D - D U |
| - U - U D - D U3p |`,
    }),
  ]);

  validatePresetEntries(presets);

  const presetsBySlug = new Map(presets.map((preset) => [preset.slug, preset]));
  const presetsBySource = new Map(presets.map((preset) => [preset.source, preset]));

  function makePreset(entry) {
    return Object.freeze({
      slug: entry.slug,
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
      if (!['Original exercise', 'Short user transcription'].includes(entry.rightsBasis)) {
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

  function listPresets() {
    return presets;
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
    createPresetUrl,
    findPresetBySource,
    getDefaultPreset,
    getPreset,
    listPresets,
    resolvePresetFromUrl,
    validatePresetEntries,
  });
}));
