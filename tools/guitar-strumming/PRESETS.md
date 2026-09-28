# Curated Preset Catalog

## Purpose

Provide short, human-readable links for approved exercises.

Keep each preset source in the same plain-text format as manually entered source.

Keep the textarea as the single source of truth after a preset loads.

## Catalog Design

Store the catalog in `preset-catalog.js`.

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

Do not change the source of a published slug. Add a new versioned slug when source changes.

## Initial Catalog

The initial catalog contains four original entries and two short user transcriptions:

- an expressive strumming feature demo;
- an intermediate C, G, Am, and full-F-barre chord-change exercise;
- a beginner G, C, D, and Em chord-change exercise;
- a seventh-chord turnaround exercise;
- a Get Lucky palm-muted strumming exercise; and
- a Viva La Vida syncopated strumming exercise.

The expressive feature demo is the former page example and the default preset.

Show each teaching goal below the Preset dropdown.

Show the catalog-wide song exercise notice at the bottom of the page.

## Rights Review

Four initial entries are original technical exercises.

They use common chord progressions and generic strumming patterns.

They do not use a commercial song title, lyrics, melody, or song-specific arrangement.

The Get Lucky and Viva La Vida entries are short user transcriptions for teaching.

They contain chord and rhythm data. They do not contain lyrics, melody notation, audio, artwork, or a claim of approval.

Label both entries as unofficial user transcriptions in the bottom-page notice.

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
- preset link creation.

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

Status: Implementation and representative-client verification are complete.

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
