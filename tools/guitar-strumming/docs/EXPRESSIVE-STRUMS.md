# Expressive Strum Work Package

## Purpose

Add string range, palm mute, dead strum, and accent to strum tokens.

Keep the source text authoritative for every strum.

## Scope

This package adds:

- optional string counts of 2, 3, or 4;
- `P` for palm mute;
- `X` for dead strum;
- `!` for accent;
- normalized strum properties in timeline events;
- string-range selection after muted chord strings are removed; and
- distinct synthesized audio for each articulation; and
- a folded sound-test section for isolated comparisons on a G chord.

This package does not add a control that edits a song strum token. It does not add chord muting after an attack or new chord voicings.

The sound-test section is a runtime preview. It does not change the source text.

If song playback is active, a sound-test button pauses it before the preview.

## Token Design

Use this grammar:

```text
<direction>[<string-count>][<articulation>][!]
```

Accept `D` or `U` for direction.

Accept `2`, `3`, or `4` for an optional string count.

Accept `P` or `X` for an optional articulation.

Accept `!` as the final optional accent marker.

Treat the complete token as case-insensitive.

Keep `-` as the no-strum token.

Require modifiers in the documented order.

## Normalized Data

Store these properties for each strum slot:

- `direction`: `D`, `U`, or `null`;
- `stringCount`: `2`, `3`, `4`, or `null`;
- `articulation`: `normal`, `palm-mute`, or `dead`; and
- `accented`: `true` or `false`.

Do not make the audio engine parse a source token.

## String Selection

Remove each string that the active chord voicing marks as `x`.

For a downstroke, start with the lowest-pitched playable string.

For an upstroke, start with the highest-pitched playable string.

If a string count is present, use at most that many playable strings.

If the chord has fewer playable strings, use all playable strings.

## Audio Design

Keep normal strums unchanged.

Use a shorter gain envelope and a lower filter cutoff for palm mute.

Keep clear pitch in a palm-muted strum.

Use a short filtered noise burst for a dead strum.

Keep little clear pitch in a dead strum.

Increase attack level for an accent.

Do not change the event time for an accent.

Keep the existing audio-clock scheduling and per-string stroke delay.

The synthesized sounds are an accepted approximation for this teaching tool.

## Failure Behavior

Reject an unsupported direction, string count, articulation, accent marker, or modifier order.

Report the source line, strum bar, and slot.

Stop playback when source validation fails.

Do not silently remove or reorder a modifier.

## Test Plan

Add automated tests for:

- every valid modifier category;
- case-insensitive tokens;
- normalized token properties;
- invalid values and modifier order;
- exact error locations;
- low-string and high-string selection;
- muted chord strings;
- a requested count larger than the playable-string count;
- normalized timeline events; and
- the default page source.

Run the full repository check.

Manually test:

- full and partial downstrokes;
- full and partial upstrokes;
- normal and accented strums;
- palm-muted strums;
- dead strums;
- modifier combinations;
- validation messages; and
- the folded sound-test section and its one-shot buttons;
- sound-test behavior while the song is playing; and
- audio in desktop Chrome and Safari on iPhone.

## Completion Status

Status: Complete.

- [x] Automated checks pass.
  Evidence: `./scripts/check.sh` passed on 2026-09-28. The guitar test file contains 35 passing tests.
- [x] Desktop Chrome checks pass.
  Evidence: The user confirmed that range, articulation, accent, validation, and sound-test behavior worked correctly in desktop Chrome on 2026-09-28.
- [x] Safari on iPhone checks pass.
  Evidence: The user confirmed that range, articulation, accent, validation, and sound-test behavior worked correctly in Safari on iPhone on 2026-09-28.
