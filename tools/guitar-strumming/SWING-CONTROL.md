# Swing Control

## Purpose

Let the user select a common swing feel without editing the source directly.

Keep the source text as the single source of truth.

## Interface

Add a Swing dropdown to the Practice section.

Use these standard choices:

- Off;
- Light (55%);
- Medium (60%);
- Triplet (67%); and
- Heavy (75%).

Do not add 50 percent as a standard choice. Off already provides straight timing.

When the source contains another valid numeric value, show `Custom (N%)` as the selected choice.

Do not change a custom source value during synchronization.

The user can edit the source to set another custom value.

## Source Behavior

Read the control value from the parsed `swing:` directive.

When the user selects a standard choice, edit only the `swing:` directive.

Use `off` for Off.

Use the applicable whole number for each numeric choice.

A successful change stops playback and resets it to bar 1, slot 1.

Remove a preset or shared-source URL parameter after the source changes.

## Failure Behavior

If the source is invalid, disable the control and clear its selection.

If safe directive replacement fails, keep the source unchanged.

Restore the dropdown from the last parsed value after a failed operation.

Report the failure in the playback status.

## Checks

Automated checks must cover:

- the five standard options;
- the label and help reference;
- custom-value presentation logic;
- safe `swing:` replacement; and
- disabled-state handling.

Manually verify:

- source and dropdown synchronization;
- preservation of a custom value;
- playback reset after a change;
- keyboard use;
- narrow-screen layout; and
- 200 percent zoom.

## Completion Status

Status: Complete.

Automated evidence: The repository check passed on 2026-09-28. It covered the standard options, labels, help reference, custom-value logic, source replacement, disabled-state code, responsive styles, and all existing tests.

Manual evidence: The user confirmed on 2026-09-28 that the Swing control worked well in the browser test.
