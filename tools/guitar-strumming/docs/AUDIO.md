# Playback and audio

## Clock and synthesis

Use `AudioContext.currentTime` for musical timing. Derive event times from fixed segment origins and absolute slot positions. UI timers only wake the scheduler. Current settings are 50 milliseconds of start lead, 200 milliseconds scheduled ahead, and a 25-millisecond scheduler interval.

If a callback is late, skip elapsed events. Do not replay them as a burst. Advance through elapsed ramp boundaries before scheduling new events. Chord changes precede strums at the same slot. Visual frames derive their position from the audio clock and never schedule audio.

The audio engine synthesizes plucked strings from catalog voicings. Standard tuning is E2, A2, D3, G3, B3, E4, from low to high. It caches pitch-buffer variations and applies per-string stroke delays. Palm mute and dead strums are teaching approximations, not recorded guitar samples.

## Playback changes

Pause silences active voices and preserves musical position, current ramp tempo, and completed loops. Start over resets to bar 1, slot 1, restores starting BPM, and requests the configured count-in. It preserves whether playback was active or paused.

Count-in uses four quarter-note clicks per bar, with a stronger first beat. Use it before initial playback and Start over, not after Pause or a normal loop boundary. Pause during count-in cancels remaining clicks; the next Play starts the song without another count-in. A BPM change during count-in stops playback and requires Play again.

Without a ramp, a BPM-only edit during playback takes effect at the next bar boundary. Preserve the decay of notes that started before that boundary. If the user changes BPM again, replace the pending transition.

A ramp increases tempo at exact loop boundaries. Clamp the final increase to its target. A change to the active ramp or its starting BPM stops playback and resets the ramp. Other source edits normally stop playback and reset position. An original-key-only metadata edit preserves playback.

Speed up controls edit the same source directives. Enabling a ramp uses the fixed BPM as its target, starts near half that tempo rounded to 5 BPM with a 30 BPM minimum, and uses +5 every three loops. It cannot enable at 30 BPM. Disabling copies the target to `bpm:` and writes `tempo-ramp: off`. Apply both directive changes together or preserve the source unchanged.

## Browser lifecycle and failures

Start or resume audio directly from a user action. If Web Audio is unavailable, keep editing usable and show the playback error. Failed initialization or invalid source must leave playback unavailable. Do not keep a previously valid timeline playing after invalid input.

When the page becomes hidden, pause and cancel scheduled voices. Returning requires Play. Request an optional screen wake lock during playback and release it on pause, errors, or page exit. A missing or rejected wake lock must not stop valid playback. It does not guarantee background playback.

Sound-test buttons pause song playback before their preview. Warning and error notifications must not alter musical state or timing. Routine progress stays out of toasts. Count-in feedback belongs in the Pause button.

## iPhone audio recovery

Recorded failure: Safari could report a running audio context while speaker output remained silent. Headphone output could still work. Cycling the audio session recovered speaker output. On 28 September 2026, the owner confirmed audible iPhone speaker output, steady looping, stall recovery, page-exit pause, and restart after returning. These are dated observations, not proof for every device or browser release.

Preserve this recovery sequence from the user action:

1. Create or resume the audio context.
2. If `navigator.audioSession.type` is available, set it to `ambient`.
3. Wait until the next task.
4. Set the type to `playback`.

The repository audio rules also require this sequence for media-element playback. Treat audio-session recovery as optional. An unavailable application programming interface must not remove normal playback support.

Related failure reports: [WebKit audio-context suspension](https://bugs.webkit.org/show_bug.cgi?id=291892) and [running context with silent output](https://bugs.webkit.org/show_bug.cgi?id=323104).

## Regression review

Run repository tests for timing, transitions, count-in, swing, presentation, and lifecycle behavior. After an audio change, manually check built-in speakers, headphones, pause/resume, background return, and silent-mode behavior on a representative iPhone or iPad. Also check desktop Chrome.

The owner accepted current-chord highlighting and bar following on 30 September 2026. Separate device checks for custom swing, ramp boundaries, keyboard scrolling, and 200 percent zoom were not recorded for that presentation pass. Keep these cases in later interface reviews. Do not mark them verified from source tests.
