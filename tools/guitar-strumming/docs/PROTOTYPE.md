# Guitar Strumming Audio Prototype

## Purpose

This work package tests the highest-risk parts of the proposed teaching tool.

The prototype must show that the browser can:

- synthesize a recognizable plucked-string sound;
- play downstrokes and upstrokes in different string orders;
- schedule strums from the browser audio clock;
- apply a chord change before a strum at the same grid slot;
- loop from one fixed clock origin without accumulated drift; and
- recover from a long user-interface stall without a burst of late strums.

The prototype is not the complete tool.

## Scope

Use the future stable tool path at `/tools/guitar-strumming/`.

Do not link the prototype from the home page.

Use one fixed four-bar demonstration pattern.

Do not implement the text parser, editable song source, or full playback controls in this package.

## Scheduling Design

Use `AudioContext.currentTime` as the authoritative clock.

Use one fixed audio-clock origin for each playback run.

Calculate every event time from its loop number and its absolute slot position.

Use a user-interface timer only to wake the scheduling function.

Use these initial scheduling values:

- 50 milliseconds of start lead time;
- 200 milliseconds of schedule-ahead time; and
- a 25-millisecond scheduler wake interval.

The 200-millisecond schedule-ahead time must cover a 100-millisecond user-interface stall.

If an event time has passed before scheduling, skip the event.

Do not schedule missed events at the current time.

This rule prevents a burst of late strums.

## Audio Design

Use the native Web Audio API.

Generate a short plucked-string buffer for each required pitch.

Use a simple Karplus-Strong-style feedback model.

Cache a small number of generated variations for each pitch.

Play each included guitar string as a separate audio source.

Use low-to-high string order for a downstroke.

Use high-to-low string order for an upstroke.

Use a short fixed delay between string attacks.

Do not add random timing variation in this package.

## Browser Lifecycle

Create or resume the audio context only from a user action.

If the Audio Session API is available, set its type to `playback` from the user action.

The `playback` type lets intentional teaching audio remain audible when an iPhone is in silent mode.

Before setting `playback`, set the type to `ambient` and wait for the next task.

This cycle recovers from a WebKit state in which the audio context is running but the output remains silent.

If the page becomes hidden, stop playback and cancel scheduled sources.

When the page becomes visible again, require the user to press Play.

This behavior gives the prototype a clear state after iPhone Safari suspends the audio context.

Do not claim support for an installed home-screen web application in this package.

## Failure Behavior

If Web Audio is unavailable, disable every audio control and show an error.

If the audio context cannot start, stop playback and show an error.

If a scheduled event is late, skip it and increase the skipped-event count.

Do not continue a stale scheduling timer after Stop or page suspension.

## Test Plan

Add automated tests for:

- the 24-entry chord catalog;
- string order for each stroke direction;
- same-slot chord changes;
- event timestamps through 1,000 loops;
- a 100-millisecond simulated user-interface stall; and
- recovery from a longer stall without late scheduling.

Use manual tests for:

- audible pitch and decay;
- audible stroke direction;
- the same-slot chord change;
- Stop behavior;
- desktop Chrome; and
- Safari on iPhone.

## Accepted Risks

The synthesized sound can be less realistic than recorded samples.

Device output latency is outside the scheduler's control.

The first iPhone test can find browser-specific audio-lifecycle behavior that requires a later change.

## Verification Status

Status: Complete.

- [x] The automated catalog, timeline, direction, drift, and stall-recovery tests pass.
  Evidence: `./scripts/check.sh` passed on 2026-09-28.
- [x] The general repository checks pass.
  Evidence: JavaScript syntax, shell syntax, automated tests, local references, labels, and whitespace passed on 2026-09-28.
- [x] Complete the audible test in desktop Chrome.
  Evidence: On 2026-09-28, the user reported distinct downstrokes and upstrokes, a steady loop during a 1–2 minute test, and no burst of late strums after the simulated stall.
- [x] Complete the keyboard, narrow-screen, and 200 percent zoom tests in desktop Chrome.
  Evidence: On 2026-09-28, the user confirmed that all keyboard, narrow-screen, and 200 percent zoom checks looked correct.
- [x] Complete the initial audible test in Safari on iPhone.
  Evidence: On 2026-09-28, Safari on an iPhone 16 Pro initially reported a running context and a `playback` session but remained silent. Cycling the session through `ambient` before `playback` restored audible output while the phone remained in silent mode.
- [x] Complete the loop, stall-recovery, and page-suspension tests in Safari on iPhone.
  Evidence: On 2026-09-28, the user confirmed steady loop playback, clean stall recovery, playback stop after leaving Safari, and successful audio restart after returning.

The development environment did not contain Chrome or a browser automation package.

The user completed the required manual browser tests on the target clients.

## Engineering References

- [Web Audio API 1.1](https://www.w3.org/TR/webaudio/)
- [WebKit issue 291892: AudioContext after home-screen application suspension](https://bugs.webkit.org/show_bug.cgi?id=291892)
- [WebKit issue 323104: silent audio output with a running context](https://bugs.webkit.org/show_bug.cgi?id=323104)
