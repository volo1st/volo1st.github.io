# Tempo Ramp Control

## Purpose

Give the user a simple way to configure practice tempo increases.

Keep the plain-text source as the single source of truth.

## Controls

Add a Tempo ramp selector with Off and Increase options.

Show Step, Loops per step, and Target fields when Increase is selected.

When the ramp is off, the BPM controls edit the fixed playback tempo.

When the ramp is enabled, the BPM controls edit the starting tempo.

## Enable Rule

Treat the current fixed BPM as the target.

Calculate the starting BPM as 50 percent of the target. Round it to the nearest 5 BPM. Use 30 BPM as the minimum.

Use a 5 BPM step and a 3-loop interval.

For a fixed tempo of 135 BPM, write:

```text
bpm: 70
tempo-ramp: +5/3/135
```

Do not enable the ramp at a fixed tempo of 30 BPM.

## Disable Rule

Copy the ramp target to `bpm:`.

Write `tempo-ramp: off`.

For the example above, write:

```text
bpm: 135
tempo-ramp: off
```

## Source Updates

Apply an enable or disable operation as one source change.

Do not modify the source if either directive cannot be replaced safely.

Do not keep a hidden copy of a target or previous tempo.

Read the controls from the parsed source after every valid source change.

Reject an invalid field value. Restore the control value from the source.

Stop playback and reset the ramp after a successful control change.

## Checks

Automated checks must cover:

- the 135 BPM example;
- nearest-5 rounding;
- the 30 BPM minimum;
- rejection at a 30 BPM target;
- safe replacement of both directives;
- source preservation after an invalid control value;
- control labels and help references; and
- narrow-screen layout rules.

Manually verify:

- enable and disable behavior;
- field edits;
- fixed-tempo playback after disable;
- playback reset after an edit;
- keyboard use;
- narrow-screen layout; and
- 200 percent zoom.

## Completion Status

Status: Complete.

Automated evidence: The repository check passed on 2026-09-28. It covered default calculation, rounding, the minimum starting tempo, safe directive replacement, document labels, help references, and narrow-screen layout rules.

Manual evidence: The user confirmed enable and disable behavior, field editing, invalid-value source preservation, fixed-tempo playback, keyboard use, and the responsive layout on 2026-09-28.
