# Guitar Strumming Count-In Work Package

## Purpose

Add an optional one-bar or two-bar count-in before playback starts at bar 1.

Keep the source text authoritative for the count-in setting.

## Scope

This package adds:

- the required `count-in:` directive;
- a Count-in dropdown that edits the directive;
- four audio-clock clicks per count-in bar;
- an accented click on beat 1;
- count-in behavior for initial Play and Restart; and
- parser, timing, and interface tests.

This package does not add a metronome during the song, a spoken count, or a tempo ramp.

## Source and Control Design

Place `count-in:` after `bpm:` and before `chords:`.

Accept only `0`, `1`, or `2`.

Use `0` for Off.

The dropdown reads its value from the parsed source.

When the dropdown changes, replace only the directive value.

If the directive cannot be replaced safely, keep the source unchanged and show an error.

## Timing and Audio Design

Use four quarter-note clicks for each count-in bar.

Derive every click time from one audio-clock start time and its absolute beat index.

Use a higher and stronger click on beat 1.

Use a lower click on beats 2 through 4.

Move the song audio-clock origin to the exact end of the count-in.

Schedule count-in clicks as audio events. Do not use user-interface timers for click timing.

Keep count-in events outside the repeating song timeline.

## Playback Behavior

Use the count-in before initial playback from bar 1.

Use the count-in after a musical source change resets playback to bar 1.

Use the count-in after Restart.

Do not use the count-in after Pause.

If Pause occurs during the count-in, cancel the remaining clicks and keep the playhead at bar 1, slot 1.

Play after that Pause starts the song without another count-in.

Do not use the count-in at a normal loop boundary.

If BPM changes during the count-in, cancel playback and require Play again. The next count-in uses the new BPM.

## Failure Behavior

Reject a missing, duplicate, malformed, or out-of-range directive.

Do not assume, clamp, or silently correct a value.

If source validation fails, stop playback and cancel scheduled clicks.

If audio initialization fails, do not schedule a click or song event.

## Test Plan

Add automated tests for:

- valid values `0`, `1`, and `2`;
- missing, duplicate, malformed, and out-of-range directives;
- source line and field information for errors;
- directive replacement with LF and CRLF line ends;
- click count, accent positions, duration, and timestamps;
- exact song-origin timing after one-bar and two-bar count-ins; and
- the default page source.

Run the full repository check.

Manually test:

- Off, 1 bar, and 2 bars;
- initial Play;
- Pause and resume during the song;
- Pause during the count-in;
- Restart while playing;
- Restart while paused;
- a BPM change during the count-in;
- no repeated count-in at a loop boundary;
- keyboard use and visible focus;
- narrow width and 200 percent zoom; and
- audio in desktop Chrome and Safari on iPhone.

## Completion Status

Status: Complete.

- [x] Automated checks pass.
  Evidence: `./scripts/check.sh` passed on 2026-09-28.
- [x] Desktop Chrome checks pass.
  Evidence: The user confirmed that the count-in behavior worked correctly in desktop Chrome on 2026-09-28.
- [x] Safari on iPhone checks pass.
  Evidence: The user confirmed that the count-in behavior worked correctly in Safari on iPhone on 2026-09-28.
