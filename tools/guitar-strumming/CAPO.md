# Capo

## Purpose

Let the user practise familiar chord shapes in a higher sounding key.

Keep the chord catalog unchanged.

## Source Form

Require `capo:` exactly once after `tempo-ramp:` and before `swing:`.

Use a whole number from 0 through 12.

Use `capo: 0` for no capo.

## Pitch Meaning

Treat each chord identifier as a finger shape relative to the capo.

Add the capo fret to every played string pitch.

Keep an `x` string muted.

Do not rewrite chord identifiers.

For example, a G shape with `capo: 2` sounds two semitones higher than a G shape without a capo.

## Interface

Add a Capo dropdown to the Practice section.

Use Off and fret 1 through fret 12 as its options.

The dropdown reads from and edits only the `capo:` directive.

A successful change stops playback and resets it to bar 1, slot 1.

An unsafe replacement keeps the source unchanged and reports an error.

## Pre-release Compatibility

The owner has not declared the tool ready for `v1.0.0`.

Add `capo: 0` to each current preset source in place.

Source without `capo:` becomes invalid.

Old pre-release raw and gzip links can stop working.

Apply semantic-version compatibility only after the owner explicitly declares the `v1.0.0` release.

## Failure Behavior

Reject a missing, duplicate, misplaced, malformed, or out-of-range directive.

Stop playback after an invalid source edit.

Keep playback unavailable until the source is valid.

## Checks

Automated checks must cover:

- values 0 and 12;
- missing, duplicate, misplaced, malformed, and out-of-range values;
- dropdown replacement with LF and CRLF line ends;
- exact semitone changes for all six string positions;
- preservation of muted strings;
- capo data in the normalized timeline and musical-content key;
- every preset through normal parser and timeline checks;
- labels and help references; and
- narrow-screen and 200 percent zoom rules.

Manually verify:

- source and dropdown synchronization;
- audible pitch changes;
- unchanged chord names;
- playback reset after a change;
- fixed and ramped tempo playback;
- keyboard use;
- narrow-screen layout; and
- 200 percent zoom.

## Completion Status

Status: Complete.

Automated evidence: The repository check passed on 2026-09-28. It covered parsing, safe replacement, exact pitch changes, muted strings, normalized timeline data, musical-content identity, all presets, labels, and responsive layout rules.

Manual evidence: The user confirmed source and dropdown synchronization, audible pitch changes, unchanged chord names, playback reset, fixed and ramped tempo playback, keyboard use, and responsive layout on 2026-09-28.
