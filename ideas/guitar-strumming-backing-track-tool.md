# 1. Goal

Build a small browser-based tool that plays looping guitar strumming backing tracks from plain-text input.

The MVP must support:

- chord progressions
- exact chord-change timing
- down/up strumming patterns
- rests
- BPM control
- looping playback
- realistic guitar strumming

The tool is for fast practice-track creation, not full music production.

---

# 2. MVP UI

Provide:

- one plain text area
- BPM numeric field
- BPM slider
- Play/Pause button
- Restart button
- one validation error list directly below the text area

Do not add WYSIWYG editing, syntax highlighting, inline markers, or editor controls in the MVP.

Show one validation error per line.

Show errors in source order.

Each error must include the source line and the applicable section, bar, slot, or field when known.

Make validation status changes available to assistive software.

Do not change the source text or move keyboard focus when validation fails.

Disable Play and Restart while the input is invalid.

If audio initialization fails, stop playback and show a separate audio error.

Loop playback is always enabled in MVP.

The BPM field, slider, and `bpm:` directive must stay synchronized.

BPM must be a whole number from 30 through 300.

The most recently changed valid BPM control sets the new BPM.

The other two BPM controls must update immediately.

When the slider or numeric field changes, update only the number in the `bpm:` directive.

Reject a decimal or out-of-range BPM value.

Do not clamp or silently correct an invalid BPM value.

A valid BPM change takes effect at the start of the next bar.

A source change other than a valid BPM change stops playback and invalidates the old timeline.

An invalid edit stops playback and shows an error.

Playback remains unavailable until the full input is valid.

---

# 3. Text Format

The plain-text source is the single source of truth for persistent song and practice settings.

A user interface control can provide a simpler way to edit a setting.

Each such control must read its value from the source and write its change back to the applicable source directive.

Do not keep a second persistent value outside the source.

Keep transient playback state outside the source. This state includes Play or Pause state, the current playback position, audio-context state, validation messages, and status messages.

## 3.1 Header

Syntax:

```text
4/4#<grid-size>
bpm: <number>
```

The header must be the first non-blank line.

The `bpm:` directive must be the next non-blank line.

Example meanings:

- `4/4#8` = 4/4 time with 8 equal slots per bar
- `4/4#16` = 4/4 time with 16 equal slots per bar
- `4/4#24` = 4/4 time with 24 equal slots per bar

The MVP supports only 4/4 time.

The MVP supports grid sizes of 8, 16, and 24.

`grid-size` defines the timing grid for the full song.

Each bar uses the same grid size.

`bpm:` defines the global playback tempo in quarter-note beats per minute.

One 4/4 bar lasts four beats.

The duration of one slot is the bar duration divided by `grid-size`.

---

## 3.2 Chord Section

Syntax:

```text
chords:
| <chord> [<chord>@<slot> ...] |
```

Rules:

- Each `| ... |` is one bar.
- Each bar must start with a chord at slot 1.
- The first chord must not contain `@N`.
- The first chord starts at slot 1.
- `CHORD@N` changes to that chord at slot `N`.
- Each additional chord must contain `@N`.
- `N` must be from 2 through `grid-size`.
- Slot numbers are 1-based.
- Additional chord changes must use ascending slot numbers.
- A chord change happens before a strum at the same slot.
- Each bar must explicitly state its starting chord.

Example form:

```text
| Am Am7@5 Fmaj7@7 |
```

---

## 3.3 Strum Section

Syntax:

```text
strum:
| <slot> <slot> ... |
```

Supported MVP tokens:

- `D` = downstroke
- `U` = upstroke
- `-` = no strum

Each bar must contain exactly the number of tokens declared by `grid-size`.

For `4/4#8`, every strum bar must contain exactly 8 tokens.

Do not add implicit rests or implicit padding.

---

## 3.4 Single-Bar Repeat

A chord bar or strum bar can use:

```text
| ... | xN
```

`N` is the total number of occurrences, including the written bar.

`xN` applies only to the bar immediately before it.

`N` must be an integer from 2 through 999.

MVP does not support multi-bar repeat groups.

The expanded song must not exceed 1,000 bars in either section.

After repeat expansion, the chord section and strum section must contain the same number of bars.

---

# 4. Complete Format Example

```text
4/4#8
bpm: 138

chords:
| C D@8 | D | G Em@8 | Em |

strum:
| D - D - D - D U |
| - U - U D - D U |
| D - D - D - D U |
| - U - U D - D U |
```

Interpretation:

- The song uses 4/4 time.
- Each bar has 8 equal timing slots.
- Playback tempo is 138 BPM.
- Bar 1 starts on C and changes to D at slot 8.
- Bar 2 starts on D.
- Bar 3 starts on G and changes to Em at slot 8.
- Bar 4 starts on Em.
- The chord change at slot 8 occurs before the strum at slot 8.

---

# 5. Chord Support

The MVP must use a local, data-driven chord voicing catalog.

Each catalog entry must define:

- one canonical chord identifier
- zero or more aliases
- one or more explicit six-string voicings

Use standard six-string tuning: `E2 A2 D3 G3 B3 E4`.

Store each voicing from the low E string to the high E string.

Each string value must be a non-negative fret number or `x`.

`0` means an open string.

`x` means that the strum does not play the string.

An excluded `x` string is not a percussive muted or dead strum.

The MVP must select one default voicing for each supported chord.

The catalog must contain common open-chord and barre-chord voicings.

The initial catalog must contain all chord examples in this section.

Section 5.1 defines the complete initial catalog.

The MVP must support common guitar chord symbols, including:

- major and minor chords
- sharps and flats
- 7, maj7, m7
- sus2, sus4
- add9
- power chords
- slash chords

Examples:

```text
C
Cm
F#m
Bb
C7
Cmaj7
Am7
Dsus4
Cadd9
G5
C/E
D/F#
```

The parser must treat each chord symbol as an opaque identifier.

The parser must not contain a fixed list of chord names.

A separate catalog lookup must resolve an identifier or alias to its canonical chord and default voicing.

The audio engine must receive resolved string pitches. It must not interpret chord names.

The audio layer must not guess or silently substitute a chord voicing.

If a chord is not in the catalog, reject the input with the bar number and chord identifier.

## 5.1 Initial Chord Catalog

Support these major and minor chord identifiers:

```text
A Am Bb Bm C Cm D Dm Em F F#m G
```

Support these seventh chord identifiers:

```text
Am7 C7 Cmaj7 D7 G7
```

Support these suspended, added-note, and power-chord identifiers:

```text
Cadd9 Dsus4 G5
```

Support these slash-chord identifiers:

```text
Am/G C/E D/F# G/B
```

The initial catalog contains 24 chord identifiers.

The MVP does not support diminished chords.

Add a chord in a later catalog revision only after adding its explicit voicing and tests.

---

# 6. Parsing Rules

The parser must:

- ignore extra spaces
- ignore blank lines
- require the header, `bpm:`, `chords:`, and `strum:` in that order
- require each directive and section label exactly once
- treat directive and section-label text as case-sensitive
- treat `D` and `U` case-insensitively
- treat chord identifiers as case-sensitive
- reject comments
- reject unknown directives
- reject invalid strum tokens
- reject a BPM value that is not a whole number from 30 through 300
- reject invalid slot numbers
- reject duplicate or descending chord-change slots
- reject strum bars with the wrong number of slots
- reject a repeat count outside the permitted range
- reject a section that expands beyond 1,000 bars
- reject mismatched bar counts after repeat expansion

Do not use whitespace position to determine timing.

Timing comes only from:

- grid size
- token order
- `@N`

---

# 7. Internal Model

Convert parsed text into a normalized timeline before playback.

Each timeline event should contain at least:

- bar index
- slot index
- active chord
- strum type

The parser and playback engine must be separate components.

The audio engine must not parse source text directly.

---

# 8. Playback

Use the browser audio clock for scheduling.

Do not use UI timers as the main timing source.

Use one fixed audio-clock origin for a playback run.

Calculate each event time from the origin and its absolute musical position.

Calculate each loop start as the origin plus the loop number multiplied by the loop duration.

Do not calculate a loop start from the actual callback time of the previous loop.

Playback must:

- schedule events ahead of playback time
- loop without timing drift
- apply chord changes before strums at the same slot
- continue correctly if the UI thread stalls briefly

After the audio context is available, schedule the first event no later than 100 milliseconds after Play.

Continue without a missed event after a UI-thread stall of 100 milliseconds.

After a longer stall, skip elapsed events and recover at the correct musical position.

Do not play missed strums together as a late burst.

Pause must silence active notes and preserve the current playback position.

Play must resume from the preserved playback position.

Restart must return playback to bar 1, slot 1.

If playback is active, Restart must continue playback from the start.

If playback is paused, Restart must leave playback paused at the start.

A source edit must stop playback and silence active notes.

At a natural loop boundary, active notes can complete their normal decay.

Restart must cancel old notes before playback starts again.

Visual UI updates may be approximate. Audio timing has priority.

The application must not accumulate scheduling drift.

Device audio-output latency is outside application control and is not part of the drift measurement.

---

# 9. Guitar Audio

The MVP must sound like guitar strumming, not simultaneous MIDI-style block chords.

Use the native Web Audio API with a local plucked-string synthesis model.

Do not use recorded samples, network requests, or an external audio library.

Generate the sound of each guitar string separately.

Requirements:

- downstrokes and upstrokes must sound different
- string attacks must be spread over a short time
- downstrokes must move from low strings toward high strings
- upstrokes must move from high strings toward low strings
- chord voicings must be playable guitar voicings
- sustained strings must decay naturally

The first version does not need studio-quality realism.

Correct rhythm and chord timing have higher priority.

The accepted MVP risk is lower realism than a recorded guitar sample library.

Reassess recorded samples only if the synthesized sound is not sufficient for teaching use.

## 9.1 Initial Browser Support

The initial release target is:

- the current Safari release on iPhone
- the current Chrome release on desktop

Keep the parser, normalized timeline, and scheduling calculations independent of the browser audio implementation.

Keep Web Audio and audio-context lifecycle behavior behind the audio-engine boundary.

Use feature detection before audio initialization.

If the required Web Audio functions are unavailable, keep the editor usable, disable playback, and show an audio error.

Record the browser and device versions used for release tests.

Do not claim verified support for an untested browser or device.

---

# 10. MVP Non-Goals

Do not implement:

- graphical sequencer
- drag-and-drop editing
- tablature
- staff notation
- drums
- bass
- MIDI
- recording
- audio import
- arbitrary loop regions
- tempo changes inside the song
- triplet-specific shorthand
- multi-bar repeat groups
- user accounts
- cloud storage
- effects
- mixing controls
- diminished chords

Mixed straight and triplet timing can still be represented by using a common grid such as `4/4#24`.

---

# 11. Phase 2

Likely additions:

- accents
- muted/dead strums
- palm mute
- capo
- key
- guitar type
- humanization
- swing
- triplet/tuplet shorthand
- multi-bar repeat groups
- section labels
- tempo changes by section
- practice tempo ramp
- count-in
- WAV export
- shareable URL

Phase 2 features must reuse the same normalized timeline model.

## 11.1 Persistent Configuration

The plain-text source remains the single source of truth for each Phase 2 song or practice setting.

Define the text representation before adding a user interface control for a persistent setting.

A user interface control is a view and editor of its source directive.

## 11.2 Count-In

Status: Decided.

Add the count-in as the first Phase 2 feature.

Use this directive after `bpm:` and before `chords:`:

```text
count-in: <bars>
```

`bars` must be `0`, `1`, or `2`.

`0` disables the count-in.

Require the directive exactly once after the feature is implemented.

Reject a missing, duplicate, malformed, or out-of-range directive.

Do not assume, clamp, or silently correct a count-in value.

Add a Count-in dropdown with these options:

- Off
- 1 bar
- 2 bars

The dropdown must read its value from the `count-in:` directive.

When the user changes the dropdown, update only the value in the `count-in:` directive.

If the directive cannot be updated safely, keep the source unchanged and show a validation message.

Use four clicks in each count-in bar.

Accent beat 1. Use a lower click for beats 2 through 4.

Use the current BPM for the click timing.

Play the count-in before playback starts at bar 1 after initial load, a musical source change, or Restart.

Do not play the count-in when playback resumes from Pause.

Do not play the count-in at a normal loop boundary.

Keep count-in events outside the repeating song timeline.

## 11.3 Strum Range, Articulation, and Accent

Status: Decided.

Use this token grammar:

```text
<direction>[<string-count>][<articulation>][!]
```

`direction` must be `D` or `U`.

Treat the complete token as case-insensitive.

An omitted `string-count` means all playable strings in the active chord voicing.

Initially support string counts of `2`, `3`, and `4`.

For a downstroke, select the specified number of lowest-pitched playable strings.

For an upstroke, select the specified number of highest-pitched playable strings.

Apply the string count after the chord voicing excludes each `x` string.

If the voicing contains fewer playable strings than the requested count, use all playable strings.

An omitted `articulation` means a normal ringing strum.

Use `P` for palm mute.

A palm-muted strum remains pitched. It has less brightness and a shorter sustain than a normal strum.

Use `X` for a dead or scratch strum.

A dead strum is primarily percussive and has little clear pitch.

`P` and `X` are mutually exclusive.

Use `!` for an accent.

An accent increases the attack and audible emphasis. It does not change event timing.

Require modifiers in the documented order.

Examples:

```text
D      full normal downstroke
U!     full accented upstroke
D4     normal downstroke on the four lowest playable strings
U4     normal upstroke on the four highest playable strings
D3P    palm-muted downstroke on the three lowest playable strings
D2P!   accented palm-muted downstroke on the two lowest playable strings
U3X    dead upstroke on the three highest playable strings
U4X!   accented dead upstroke on the four highest playable strings
```

Do not add a separate interface control for a per-slot strum token.

Store direction, selected string count, articulation, and accent as separate normalized event properties.

Do not make the audio engine parse source tokens.

Keep palm mute separate from dead strum and from stopping a ringing chord after its attack.

---

# 12. MVP Acceptance Criteria

The MVP is complete when a user can:

1. Paste valid text.
2. Set or edit BPM.
3. Press Play.
4. Hear the full progression loop.
5. Hear chord changes at exact grid slots.
6. Hear downstrokes and upstrokes as distinct guitar strums.
7. Edit the text and restart playback with the new result.

The critical timing test is a chord change such as:

```text
D@8
```

when slot 8 also contains a strum.

That strum must use D.

Automated timing tests must:

- use a controlled audio clock
- test grid sizes 8, 16, and 24
- test BPM values 30 and 300
- verify calculated event positions through 1,000 loops
- verify event order and musical position after a simulated UI-thread stall
- verify that a 100-millisecond UI-thread stall does not cause a missed event
- verify that recovery from a longer stall skips elapsed events without a late burst

Calculated event timestamps must remain within one microsecond of their expected positions.

Manual audio tests must verify stroke direction, natural decay, and a chord change at the same slot as a strum.

---

# 13. MVP Implementation Decisions

## 13.1 Timing Model

Status: Decided.

- The MVP supports only 4/4 time.
- The valid grid sizes are 8, 16, and 24.
- BPM means quarter-note beats per minute.
- One bar lasts four beats.
- Slot duration is `(60 / BPM) * (4 / grid-size)` seconds.

## 13.2 Edit and Failure Behavior

Status: Decided.

- A valid BPM change takes effect at the start of the next bar.
- A source change other than a valid BPM change stops playback.
- A source change invalidates the old timeline.
- An invalid edit stops playback and shows an error.
- Playback remains unavailable until the full input is valid.

## 13.3 Single-Bar Repeats

Status: Decided.

- `xN` is valid in the chord and strum sections.
- `N` is the total number of occurrences, including the written bar.
- `N` must be an integer from 2 through 999.
- An expanded section must not exceed 1,000 bars.
- The chord and strum sections must have equal expanded bar counts.

## 13.4 BPM Controls

Status: Decided.

- BPM must be a whole number from 30 through 300.
- The most recently changed valid control sets the new BPM.
- The other two BPM controls update immediately.
- The slider or numeric field changes only the number in the `bpm:` directive.
- The tool rejects decimals and out-of-range values.
- The tool does not clamp or silently correct an invalid value.

## 13.5 Guitar Audio

Status: Decided.

- Use the native Web Audio API.
- Use a local plucked-string synthesis model.
- Generate each guitar string separately.
- Do not use recorded samples.
- Do not make a network request for audio.
- Do not add an external audio library.
- Accept lower realism than a recorded guitar sample library for the MVP.
- Reassess samples only if the synthesized sound is not sufficient for teaching use.

## 13.6 Chord Model and Voicings

Status: Decided.

- Use a local, data-driven chord voicing catalog.
- Keep the supported chord list out of the parser.
- Treat a parsed chord symbol as an opaque identifier.
- Give each catalog entry a canonical identifier, aliases, and one or more explicit six-string voicings.
- Select one default voicing for each supported chord in the MVP.
- Include common open-chord and barre-chord voicings.
- Include every chord example in the requirements.
- Do not guess or silently substitute a voicing.
- Reject an unsupported chord with its bar number and identifier.
- Give the audio engine resolved string pitches instead of chord names.
- Permit normal catalog additions without changes to the parser, scheduler, or audio engine.
- Use the 24 chord identifiers in section 5.1 as the complete initial catalog.
- Keep diminished chords outside the MVP.

## 13.7 Playback Controls

Status: Decided.

- Pause silences active notes and preserves the current playback position.
- Play resumes from the preserved position.
- Restart returns to bar 1, slot 1.
- Restart continues playback when playback was active.
- Restart leaves playback paused when playback was paused.
- A source edit stops playback and silences active notes.
- Notes can complete their normal decay at a natural loop boundary.
- Restart cancels old notes before playback starts again.

## 13.8 Editor and Validation Feedback

Status: Decided.

- Use one plain text area.
- Do not add WYSIWYG editing, syntax highlighting, inline markers, or editor controls.
- Put a validation error list directly below the text area.
- Show one error per line in source order.
- Include the source line and applicable musical context when known.
- Make status changes available to assistive software.
- Do not change the source text or move keyboard focus after an error.
- Disable Play and Restart while the input is invalid.
- Show an audio error if audio initialization fails.

## 13.9 Guitar Tuning and String Values

Status: Decided.

- Use standard tuning: `E2 A2 D3 G3 B3 E4`.
- Store voicings from the low E string to the high E string.
- Use a non-negative fret number for a played string.
- Use `0` for an open string.
- Use `x` for a string that the strum does not play.
- Do not treat an excluded `x` string as a percussive muted or dead strum.
- Keep capo support and alternate tunings outside the MVP.

## 13.10 Document Grammar

Status: Decided.

- Require the header, `bpm:`, `chords:`, and `strum:` in that order.
- Require each directive and section label exactly once.
- Use exact lowercase directive and section-label text.
- Ignore blank lines and extra spaces.
- Do not support comments in the MVP.
- Require a bare chord identifier as the first chord in each bar.
- Place the first chord at slot 1.
- Require `@N` for each later chord change.
- Permit later chord-change slots from 2 through `grid-size`.
- Treat strum tokens as case-insensitive.
- Treat chord identifiers as case-sensitive.

## 13.11 Timing and Drift Tests

Status: Decided.

- Derive every event time from one fixed audio-clock origin.
- Derive each loop start from the origin, loop number, and loop duration.
- Do not derive timing from a previous callback time.
- Test every grid size at BPM 30 and BPM 300.
- Test calculated event positions through 1,000 loops.
- Keep calculated timestamps within one microsecond of expected positions.
- Simulate a UI-thread stall and verify event order and musical position.
- Use manual tests for audible stroke direction, decay, and same-slot chord changes.
- Do not treat device audio-output latency as accumulated application drift.

## 13.12 Start Latency and Stall Recovery

Status: Decided.

- Schedule the first event within 100 milliseconds after Play when the audio context is available.
- Do not include browser or hardware output latency in this measurement.
- Do not miss an event after a 100-millisecond UI-thread stall.
- After a longer stall, skip elapsed events and recover at the correct musical position.
- Do not play missed strums together as a late burst.
- Keep a BPM change aligned with the next bar boundary.

## 13.13 Initial Browser Support

Status: Decided.

- Target the current Safari release on iPhone.
- Target the current Chrome release on desktop.
- Keep parsing, the normalized timeline, and scheduling calculations browser-independent.
- Isolate Web Audio and audio-context lifecycle behavior in the audio engine.
- Use feature detection before audio initialization.
- Keep the editor available if audio is not supported.
- Disable playback and show an audio error if audio is not supported.
- Record tested browser and device versions.
- Do not claim verified support for an untested browser or device.

## 13.14 Initial Chord Catalog

Status: Decided.

- Use the 24 chord identifiers in section 5.1.
- Cover common teaching progressions in C major and G major.
- Include `C7`, `D7`, and `G7`.
- Include the slash chords used by the representative progressions.
- Do not include diminished chords in the MVP.
- Require an explicit voicing and tests before a later catalog addition.
