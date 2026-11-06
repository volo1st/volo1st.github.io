# Exercises and presets

## Catalog

Keep data in `presets/data.js`. Keep validation, materialization, identity matching, and URL handling in `presets/catalog.js`. Load data before the catalog. The catalog validates, copies, and freezes its input before exposing it. Missing or malformed data must fail clearly; do not expose a partial catalog.

A shared arrangement contains its versioned identifier, title, grid, notation, original key, chord bars, strum bars, and rights metadata. An exercise profile references an arrangement and supplies its versioned slug, teaching title, level, goal, tags, and default practice settings.

Standalone presets can also provide a complete source string. Use shared arrangements when profiles reuse one transcription.

The materializer combines an arrangement and profile into complete arrangement text with stable directive order, spacing, and line-feed endings. Do not store a separate full transcription in every profile. After loading, the editor text governs playback and sharing. Controls must not modify catalog objects.

Use unique lowercase URL-safe slugs with a positive version suffix such as `-v1`. Published arrangement content and profile defaults use new versions when changed. Historical pre-release replacements are recorded in Git; they are not instructions to migrate current sources.

## Selection and identity

The interface calls presets Exercises. Use the catalog's teaching title, level, and goal. The default comes from `defaultPresetSlug`; do not maintain another catalog list in documentation.

Ask before replacing source edited during the current session. Cancellation preserves the source and selection. Loading a preset copies its complete source and validates it. Never start playback automatically.

Exercise identity ignores `bpm:`, `count-in:`, and `tempo-ramp:`. Changes to these settings keep the exercise selected. All other parsed musical data belongs to identity, including key, capo, swing, chords, and strums. Invalid or unmatched text selects Custom arrangement. Reject ambiguous catalog identities rather than selecting an arbitrary exercise.

Sharing uses exact text equality. A source that exactly matches a catalog preset uses `?preset=<slug>`. Any text change, including a practice setting, requires a complete source link. Stable exercise selection does not imply an exact preset share link. See [sharing](SHARING.md).

Reject duplicate or unknown preset parameters and a link containing both `preset` and `song`. Keep the default source cleared after transport errors. Remove source and preset parameters from the current address after edits.

## Rights and musical review

Original technical exercises use common progressions and generic rhythms. The current Get Lucky and Viva La Vida exercises are short user transcriptions for teaching. They contain chord and rhythm data, with no lyrics, melody notation, recordings, artwork, or approval claim. Keep the unofficial-transcription notice at the bottom of the page.

Complete a new rights review before adding identifiable commercial-song material. An exact rhythm can remain identifiable. Remove or revise an entry if a rights holder objects.

The corrected Get Lucky exercise uses Am7, C, Em7, and D shapes at capo 2 and 116 BPM. Its sounding chords are Bm7, D, F#m7, and E. The original and playing keys are F# minor. Preserve the regression test for this correction.
