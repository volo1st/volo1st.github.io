# Curated Preset Catalog

## Purpose

Provide short, human-readable links for approved exercises.

Keep each preset source in the same plain-text format as manually entered source.

Keep the textarea as the single source of truth after a preset loads.

## Catalog Design

Store declarative catalog input in `preset-data.js`.

Keep parsing, validation, materialisation, indexing, identity matching, and URL behavior in `preset-catalog.js`.

Load `preset-data.js` before `preset-catalog.js`.

Use this dependency direction:

```text
preset-data.js
       ↓
preset-catalog.js ← parser, chord catalog, core
       ↓
     app.js
```

`preset-data.js` must not parse songs, validate entries, create URLs, use browser state, or expose catalog query functions.

`preset-catalog.js` must copy, validate, and freeze the data before it exposes the catalog.

`app.js` must use only the catalog API. It must not access the raw preset data.

Keep all current catalog input in one data file. Do not add one browser script per song.

Do not use a database, WebAssembly, a network request, or a build step.

Each preset contains:

- a stable versioned slug;
- a title;
- a preset type;
- a teaching level;
- a teaching goal;
- grouping tags;
- a rights basis; and
- the complete source.

Require lowercase URL-safe slugs that end in a positive version number such as `-v1`.

Require unique slugs and unique source strings.

Before the owner declares `v1.0.0`, a preset slug and its source can change without a compatibility version.

After that declaration, do not change the source of a published slug. Add a new versioned slug when source changes.

## Initial Catalog

The initial catalog contains four original entries and three exercises from two short user transcriptions:

- an expressive strumming feature demo;
- an intermediate C, G, Am, and full-F-barre chord-change exercise;
- a beginner G, C, D, and Em chord-change exercise;
- a seventh-chord turnaround exercise;
- a Get Lucky palm-muted strumming exercise;
- a Viva La Vida melody-backing exercise; and
- a Viva La Vida syncopated strumming exercise.

The expressive feature demo is the former page example and the default preset.

Current pre-release preset sources include `capo: 0` and `swing: off`.

Show each teaching goal below the Preset dropdown.

Show the catalog-wide song exercise notice at the bottom of the page.

## Rights Review

Four initial entries are original technical exercises.

They use common chord progressions and generic strumming patterns.

They do not use a commercial song title, lyrics, melody, or song-specific arrangement.

The Get Lucky and Viva La Vida exercises use short user transcriptions for teaching.

They contain chord and rhythm data. They do not contain lyrics, melody notation, audio, artwork, or a claim of approval.

Label these exercises as unofficial user transcriptions in the bottom-page notice.

Accepted risk: An exact rhythm can be identifiable even when it uses common musical elements. Remove or revise an entry if a rights holder objects.

Complete a new rights review before adding identifiable commercial-song material.

## URL Behavior

Use this form:

```text
?preset=<versioned-slug>
```

Reject duplicate preset parameters.

Reject an unknown slug.

Reject a URL that contains both `preset` and `song` parameters.

Do not load the default preset after a transport error.

Remove the URL fragment from a created preset link.

Preserve unrelated query parameters.

If source exactly matches a preset, create the preset link.

If source does not exactly match a preset, create the shorter raw or gzip source link.

## Interface Behavior

Populate the Preset dropdown from the local catalog.

Ask for confirmation before preset loading replaces source that the user edited in the current session.

If the user cancels, preserve the current source and selection state.

If a preset loads, copy its exact source to the textarea and run normal validation.

If the source changes, remove `preset` and `song` from the current URL.

Do not start playback automatically.

## Failure Behavior

If preset transport fails, clear the default source and show the transport error.

If a catalog source fails parser or timeline validation, keep playback and sharing unavailable.

If the preset data script is missing or malformed, do not create a partial catalog. Keep playback and sharing unavailable and show the existing script-load failure.

Do not guess an unknown slug.

Do not silently replace edited source.

## Checks

Automated checks must verify:

- catalog metadata and rights basis;
- slug and source uniqueness;
- slug format;
- parser and timeline validity for every source;
- default-preset identity;
- exact source lookup;
- successful preset URL resolution;
- duplicate, unknown, and conflicting parameter rejection; and
- preset link creation;
- data-script loading order;
- raw-data and catalog-module separation; and
- failure for malformed raw preset data.

Manually test:

- all dropdown entries;
- confirmation acceptance and cancellation;
- an exact preset share link;
- a modified-source share link;
- an unknown preset URL;
- a conflicting preset and song URL;
- keyboard use and visible focus;
- narrow width and 200 percent zoom;
- desktop Chrome; and
- Safari on iPhone.

## Completion Status

Status: Data separation is implemented and verified.

- [x] Raw preset data is separate from catalog logic.
  Evidence: `preset-data.js` contains immutable declarative input. `preset-catalog.js` copies, validates, materialises, freezes, and indexes that input. The full repository check passed on 2026-09-30.
- [x] Preset browser behavior is unchanged after data separation.
  Evidence: The NAS preview loaded the separated data and catalog scripts, created the catalog, and started playback on 2026-09-30. Automated tests covered all preset sources, exercise identity after practice-setting changes, and short and complete share-link selection. Detailed multi-preset and manual link-parameter checks were not separately recorded.

- [x] Automated checks pass.
  Evidence: `./scripts/check.sh` passed on 2026-09-28. Every preset passed the normal parser and timeline checks.
- [x] Catalog controls and replacement confirmation work.
  Evidence: The user confirmed all dropdown entries, confirmation acceptance, confirmation cancellation, and source preservation on 2026-09-28.
- [x] Preset and modified-source links work.
  Evidence: The user confirmed preset links, raw or gzip fallback after edits, and exact source loading on 2026-09-28.
- [x] Invalid preset transport fails safely.
  Evidence: The user confirmed unknown and conflicting URL checks on 2026-09-28.
- [x] The two user song exercises work.
  Evidence: The user confirmed source loading, playback, labels, notices, and short links for Get Lucky and Viva La Vida on 2026-09-28.
- [x] Interface checks pass.
  Evidence: The user confirmed keyboard use, visible focus, narrow iPhone Safari layout, and desktop layout at 200 percent zoom on 2026-09-28.
- [x] The GitHub Pages deployment matches the completed package.
  Evidence: The deployed page and preset catalog matched commit `db04328` byte for byte on 2026-09-28.
