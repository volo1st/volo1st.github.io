# Swing

## Purpose

Let the user practise an eighth-note swing feel.

Keep the source text as the single source of truth.

RSL Acoustic Guitar free-choice guidance first lists swung 4/4 at Grade 2.

Source: <https://www.rslawards.com/wp-content/uploads/2023/04/Free-Choice-Piece-Extension.pdf>

## Source Form

Require `swing:` exactly once after `capo:` and before `chords:`.

Use one of these forms:

```text
swing: off
swing: <percent>
```

Use a whole-number percent from 50 through 75.

Use 50 for straight eighth notes.

Use 67 for an approximate two-to-one triplet feel.

## Timing Meaning

Treat the value as the percentage of each quarter-note beat assigned to the first eighth note.

Assign the remaining percentage to the second eighth note.

Apply the timing to all events. Do not change strum tokens or chord-change slots.

Keep the quarter-note count-in straight.

For a 16-slot or 24-slot grid, divide each eighth-note part equally among its smaller slots.

Keep each beat, bar, loop, and tempo-ramp boundary at its original duration.

Derive every event time from the fixed audio-clock origin. Do not add timing to the previous event.

## Scope

Provide the source directive and validation feedback.

Do not add a separate swing control in this package.

Do not add different swing values for individual bars or beats.

Do not add humanization, random timing, accent changes, or genre presets.

## Pre-release Compatibility

The owner has not declared the tool ready for `v1.0.0`.

Add `swing: off` to each current preset source in place.

Source without `swing:` becomes invalid.

Old pre-release raw and gzip links can stop working.

Apply semantic-version compatibility only after the owner explicitly declares the `v1.0.0` release.

## Failure Behavior

Reject a missing, duplicate, misplaced, malformed, or out-of-range directive.

Stop playback after an invalid source edit.

Keep playback unavailable until the source is valid.

## Checks

Automated checks must cover:

- `off`, 50, 67, and 75;
- missing, duplicate, misplaced, malformed, and out-of-range values;
- straight-time equivalence at 50 percent;
- exact swung event positions for all grid sizes;
- unchanged beat, bar, loop, and tempo-ramp boundary durations;
- playhead position conversion during swing playback;
- timing drift through 1,000 loops;
- swing data in the normalized timeline and musical-content key;
- every preset through normal parser and timeline checks; and
- format help text.

Manually verify:

- a clear difference between straight, light, and triplet swing;
- steady loops;
- pause and resume position;
- fixed and ramped tempo playback;
- iPhone Safari;
- desktop Chrome;
- keyboard use;
- narrow-screen layout; and
- 200 percent zoom.

## Completion Status

Status: Implemented. Manual verification is pending.

Automated evidence: The repository check passed on 2026-09-28. It covered parser failures, straight-time equivalence, all supported grids, fixed audio-clock timing through 1,000 loops, unchanged timing boundaries, playhead conversion, presets, and format help.

Manual evidence: Pending verification on iPhone Safari and desktop Chrome.
