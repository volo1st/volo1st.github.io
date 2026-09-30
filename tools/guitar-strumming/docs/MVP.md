# Guitar Strumming MVP Work Package

## Purpose

Convert the successful audio prototype into the text-driven teaching tool defined in the requirements.

Keep the tested synthesis, scheduling, chord catalog, and iPhone audio-session recovery.

Replace the fixed demonstration page with the MVP editor and playback controls.

## Scope

This package adds:

- the plain-text parser;
- catalog validation;
- the normalized timeline;
- the BPM field and slider;
- Play and Pause behavior;
- Restart behavior;
- validation feedback; and
- the complete initial source example.

This package does not add a graphical editor, recording, sharing, or a Phase 2 feature.

## Parser Design

Keep parsing separate from playback and audio synthesis.

Return structured validation errors instead of changing source text.

Each validation error contains:

- a stable code;
- a source line when known;
- a section when known;
- a bar when known;
- a slot when known; and
- a controlled-English message.

Parse chord identifiers as opaque tokens.

Use the separate catalog only to decide whether a parsed identifier has a voicing.

Expand each single-bar repeat before bar-count validation.

Reject an expansion beyond 1,000 bars.

## Editor State

Use one plain text area.

Place one validation error per line directly below the text area.

Do not move focus after validation.

Do not change source text after a text-area edit.

When the BPM field or slider changes, replace only the BPM value in the source.

If a source edit is invalid, stop playback and discard the previous timeline.

If a valid source edit changes musical content, stop playback and reset to the start.

## Playback State

Use these states:

- paused;
- starting; and
- playing.

Pause preserves the current musical position and silences active notes.

Play resumes from the preserved position.

Restart resets the musical position to bar 1, slot 1.

Restart preserves whether playback is active or paused.

## BPM Boundary Design

If playback is active, apply a valid BPM change at the next bar boundary.

Keep the current tempo segment valid until that boundary.

Create a new tempo segment with an audio-clock origin that maps the same bar boundary to the new tempo.

Schedule the new segment before the boundary when it enters the schedule-ahead window.

Cancel only strums that were scheduled at or after the boundary with the previous BPM.

Do not cancel the normal decay of a strum that started before the boundary.

If BPM changes again before the boundary, replace the pending tempo segment.

## Failure Behavior

Disable Play and Restart while the source is invalid.

If Web Audio is unavailable, keep editing and validation available but disable playback.

If audio initialization fails, stop playback and show an audio error.

If the page becomes hidden, pause playback and preserve the musical position.

After the page becomes visible, require a new Play action.

## Test Plan

Add automated tests for:

- valid parsing with blank lines and extra spaces;
- case-insensitive strum tokens;
- chord and strum repeats;
- invalid document order;
- unknown directives;
- invalid BPM and grid values;
- invalid chord-change slots;
- invalid strum tokens and slot counts;
- unsupported chords;
- expansion and bar-count limits;
- source line and musical error locations;
- BPM source replacement;
- pause and resume position calculations;
- restart behavior; and
- next-bar BPM timing.

Run the full repository check.

Repeat the manual desktop Chrome and iPhone Safari audio checks after implementation.

## Completion Status

Status: Complete.

- [x] The automated parser, catalog, timeline, pause-position, BPM-transition, drift, and recovery tests pass.
  Evidence: `./scripts/check.sh` passed on 2026-09-28.
- [x] The MVP workflow passes in desktop Chrome on a MacBook Air.
  Evidence: On 2026-09-28, the user confirmed Play, Pause, resume, Restart, next-bar BPM changes, source-change stop behavior, validation recovery, keyboard use, narrow width, and 200 percent zoom. The test used Chrome 152.0.7977.83 on macOS 27 on a 2025 M4 MacBook Air.
- [x] The MVP audio and lifecycle workflow passes in Safari on iPhone.
  Evidence: On 2026-09-28, the user confirmed Play, Pause, resume, next-bar BPM changes, validation recovery, page-exit pause behavior, audio restart, and portrait use. The test used Safari supplied with iOS 27 on an iPhone 16 Pro.
- [x] Record the operating-system and browser versions for both release-test devices.
