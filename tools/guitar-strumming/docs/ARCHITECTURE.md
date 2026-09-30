# Tool Architecture

## Purpose

Keep the Guitar Strum Machine source easy to find and change.

Preserve direct browser loading without a build step.

## Directory Structure

Use these directories:

- `domain/` contains music rules, parsing, and playback calculations.
- `presets/` contains preset data and preset catalog behavior.
- `browser/` contains browser application programming interface adapters.
- `ui/` contains presentation and notification behavior.
- `docs/` contains design decisions and feature specifications.

Keep `index.html`, `styles.css`, `i18n.js`, and `app.js` at the tool root.

`app.js` is the composition root. It connects the other modules to the page.

## Dependency Rules

Load browser scripts in dependency order.

Keep domain modules independent from browser and user interface modules.

Keep preset data declarative. Put preset validation and lookup behavior in the preset catalog.

Use the existing browser globals and CommonJS test exports. Do not add a build step for this structure.

## Change Scope

The directory reorganization does not change user-visible behavior.

Keep the public tool route at `/tools/guitar-strumming/`.

Review a later split of `app.js` as a separate work package.

## Completion Status

Status: The directory reorganization is implemented and verified.

- The public tool route is unchanged.
- The browser and test dependency paths use the new directories.
- The asset references use current content hashes.
- The full repository check passed on 2026-09-30.
