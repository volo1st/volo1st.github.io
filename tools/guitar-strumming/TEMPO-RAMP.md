# Practice Tempo Ramp

## Purpose

Increase the practice tempo at exact loop boundaries.

Keep the configuration in the plain-text source.

Do not add an interface control in this package.

## Source Form

Require `tempo-ramp:` exactly once after `count-in:` and before `chords:`.

Use `off` to disable the ramp.

Use this form to enable it:

```text
tempo-ramp: +<step-bpm>/<loops-per-step>/<target-bpm>
```

Permit spaces around `/`.

Require a positive sign and three whole numbers.

Require:

- a step from 1 through 20 BPM;
- a loop interval from 1 through 99 completed loops; and
- a target greater than the starting BPM and no more than 300 BPM.

Report separate errors for the step, loop interval, and target.

Do not infer or correct a value.

## Compatibility Decision

Existing preset source was not publicly released before this package started.

Replace each preset source in place with an explicit `tempo-ramp: off` directive.

Source without `tempo-ramp:` becomes invalid.

This package intentionally does not preserve old raw or gzip source links.

## Timing Model

Treat `bpm:` as the starting tempo.

Count a loop only when its end boundary passes on the audio clock.

Apply an increase at the boundary after the configured number of completed loops.

Use the target when a full step would pass it.

Continue at the target after it is reached.

Calculate each tempo segment from the exact audio-clock boundary of the preceding segment.

Do not calculate a boundary from callback time.

If a callback is delayed across multiple boundaries, advance through each elapsed boundary before scheduling new events.

Do not schedule elapsed strums after a delay.

Do not play a new count-in at a tempo boundary.

## Playback State

Store current BPM and completed-loop count only in transient playback state.

Pause preserves current BPM, completed-loop count, and musical position.

Resume continues from the preserved state.

Restart restores the starting BPM, resets completed loops, returns to bar 1 and slot 1, and uses the configured count-in.

An edit to BPM or tempo-ramp configuration stops playback and resets the ramp when the ramp is enabled.

Any other source edit keeps the existing stop-and-reset behavior.

## Failure Behavior

Reject a missing, duplicate, misplaced, malformed, or unsupported directive.

Stop playback after an invalid edit.

Keep playback unavailable until the complete source is valid.

Do not keep an old ramp schedule after a source error.

## Checks

Automated checks must cover:

- `off` and enabled parsing;
- optional separator spaces;
- missing, duplicate, misplaced, and malformed directives;
- independent step, loop interval, and target errors;
- a target below or equal to starting BPM;
- a partial final step;
- exact loop-boundary transitions;
- 1,000 loops without accumulated timestamp drift;
- a stall that crosses multiple tempo boundaries;
- pause and resume state calculations;
- restart state reset; and
- every preset through the parser and timeline checks.

Manually verify:

- audible increases at configured loop boundaries;
- no count-in at a tempo boundary;
- pause and resume;
- restart;
- a partial final step; and
- stall recovery without a burst.

## Completion Status

Status: Complete.

Automated evidence: The repository check passed on 2026-09-28. It covered parsing, independent field errors, exact loop-boundary transitions, a partial final step, pause and resume calculations, 1,000 loops, delayed recovery, and all presets.

Manual evidence: The user confirmed that the quick browser test worked on 2026-09-28. The test used a count-in, two loop-boundary increases, a partial final step, Pause and Play, and Restart.
