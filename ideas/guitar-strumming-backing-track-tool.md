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

Keep transient playback state outside the source. This state includes Play or Pause state, the current playback position, the current ramp tempo, the completed-loop count, audio-context state, validation messages, and status messages.

## 3.1 Header

Syntax:

```text
4/4#<grid-size>
bpm: <number>
count-in: <bars>
tempo-ramp: <value>
capo: <fret>
swing: <value>
```

The header must be the first non-blank line.

The `bpm:` directive must be the next non-blank line.

The `count-in:` directive must be the next non-blank line after `bpm:`.

The `tempo-ramp:` directive must be the next non-blank line after `count-in:`.

The `capo:` directive must be the next non-blank line after `tempo-ramp:`.

The `swing:` directive must be the next non-blank line after `capo:`.

Example meanings:

- `4/4#8` = 4/4 time with 8 slot positions per bar
- `4/4#16` = 4/4 time with 16 slot positions per bar
- `4/4#24` = 4/4 time with 24 slot positions per bar

The MVP supports only 4/4 time.

The MVP supports grid sizes of 8, 16, and 24.

`grid-size` defines the timing grid for the full song.

Each bar uses the same grid size.

`bpm:` defines the global playback tempo in quarter-note beats per minute.

`count-in:` defines whether playback starts with 0, 1, or 2 count-in bars.

`tempo-ramp:` defines whether the tempo increases at loop boundaries.

`capo:` defines how many semitones the capo raises each played string.

`swing:` defines the timing ratio for each pair of eighth notes.

One 4/4 bar lasts four beats.

When swing is off, the duration of one slot is the bar duration divided by `grid-size`.

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

Use this token grammar:

```text
<direction>[<string-count>][<articulation>][!]
```

Use `D` for a downstroke.

Use `U` for an upstroke.

Use `-` for no strum.

Use an optional string count of `2`, `3`, or `4`.

Use optional `P` for palm mute or `X` for a dead strum.

Use optional `!` for an accent.

Write modifiers in this order: string count, articulation, accent.

Treat a complete strum token as case-insensitive.

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
count-in: 1
tempo-ramp: off
capo: 0
swing: off

chords:
| C D@8 | D | G Em@8 | Em |

strum:
| D - D4 - D3P - D2X U! |
| - U - U4 D - D3P U! |
| D - D4 - D3P - D2X U! |
| - U - U4 D - D3P U! |
```

Interpretation:

- The song uses 4/4 time.
- Each bar has 8 equal timing slots.
- Playback tempo is 138 BPM.
- Playback starts with one count-in bar.
- Bar 1 starts on C and changes to D at slot 8.
- Bar 2 starts on D.
- Bar 3 starts on G and changes to Em at slot 8.
- Bar 4 starts on Em.
- The chord change at slot 8 occurs before the strum at slot 8.
- The strum section uses string range, palm mute, dead strum, and accent modifiers.

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
- require the header, `bpm:`, `count-in:`, `tempo-ramp:`, `capo:`, `swing:`, `chords:`, and `strum:` in that order
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

### Pre-release compatibility

Decision on 2026-09-28: Treat the tool as pre-release until the owner explicitly declares it ready for `v1.0.0`.

Before that declaration, source grammar, preset source, preset slugs, and share-link behavior can change without backward compatibility.

Do not create a new preset or transport version only to preserve pre-release behavior.

After the `v1.0.0` declaration, use semantic versioning and define compatibility rules before a breaking change.

## 11.2 Count-In

Status: Implemented and verified on 2026-09-28.

Add the count-in as the first Phase 2 feature.

Use this directive after `bpm:` and before `tempo-ramp:`:

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

Status: Implemented and verified on 2026-09-28.

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

## 11.4 Shareable Source

Status: Complete. The WeChat version and URL-shortener metadata were not captured. Record them if future delivery behavior must be reproduced.

Keep the plain-text source as the shared content and the single source of truth.

Use a versioned `song` query parameter. Do not use a URL fragment.

Use one of these transport formats:

```text
?song=v1.raw.<base64url-payload>
?song=v1.gzip.<base64url-payload>
```

Encode the source as UTF-8.

For `raw`, encode the exact source bytes without compression.

For `gzip`, compress the exact source bytes with gzip.

Encode the resulting bytes as URL-safe Base64 without padding.

Use the native Compression Streams API. Do not add a compression dependency.

When gzip is available, create both forms and use the shorter complete URL.

If gzip is unavailable, use `raw` when the complete URL is within the tested limit.

The decoder must support both forms.

Do not normalize, reformat, or otherwise change the source before encoding it.

The query parameter is a transport representation. It is not a second source of truth.

Do not include Play or Pause state, playback position, or other transient state.

Add a Copy share link button.

Enable Copy share link only when the full source is valid and the encoded URL is within the tested limit.

When the user activates Copy share link:

1. Encode the current source.
2. Put the encoded source in the current URL.
3. Copy the complete URL.
4. Show a success or failure status.

If the source changes after link creation, remove the `song` parameter from the current URL.

Do not update the share parameter after each edit.

Add a Copy source button beside Copy share link.

Copy source must copy the exact textarea content, including invalid source.

Copy source must remain available when share-link creation is unavailable.

If clipboard access fails, preserve the source and provide a clear manual-copy fallback.

On page load, decode the `song` parameter before normal source validation.

Require exactly one `song` parameter.

Reject an unsupported version, unsupported codec, malformed Base64, invalid gzip data, or an oversized decoded source.

Do not silently load the default example when shared-source decoding fails.

If decoding succeeds but source validation fails, preserve the decoded source and show the normal validation errors.

Insert decoded content only as a text control value. Do not interpret it as HTML.

Limit decoded source to 65,536 UTF-8 bytes.

Limit a complete generated share URL to 750 characters.

WeChat stopped recognizing a 1,542-character test URL after character 808. The limit keeps a margin below this observed boundary.

Direct links with 176 and 693 characters opened correctly from WeChat on the target iPhone.

Test direct links of multiple sizes through the current WeChat release on the target iPhone.

Test at least one intended URL-shortening service.

Record the WeChat version, shortener, final URL lengths, and results.

Do not claim compatibility with an untested chat application or shortener.

The initial audience is primarily in Sydney. Mainland China network availability is not a release requirement.

The source can be visible to GitHub Pages, the chat service, and a URL-shortening service. This is an accepted privacy condition for this feature.

## 11.5 Curated Presets

Status: Complete.

Store curated presets in a local JavaScript catalog.

Do not use SQLite, WebAssembly, a server database, or a build step for the initial catalog.

Each catalog entry must contain:

- a stable versioned slug;
- a title;
- a teaching level;
- search or grouping tags; and
- the complete plain-text source.

The source string is the authoritative preset content.

Metadata must not duplicate a persistent song or practice setting.

Use a human-readable preset query parameter:

```text
?preset=<versioned-slug>
```

Example:

```text
?preset=beginner-c-g-am-f-v1
```

Require URL-safe lowercase slugs.

Require every slug and preset source to be unique.

Before `v1.0.0`, the pre-release compatibility decision in section 11.1 overrides preset source stability.

After `v1.0.0`, do not change the source associated with a published slug. If preset source changes, add a new versioned slug.

The `preset` parameter and `song` parameter are mutually exclusive.

Reject a URL that contains both parameters, duplicate parameters, or an unknown preset slug.

Do not silently load the default example when preset loading fails.

On page load, copy the exact preset source into the textarea before normal source validation.

Add a Preset dropdown that lists the local catalog.

When preset loading would replace edited source, require explicit confirmation before replacement.

After preset loading, the textarea remains the single source of truth.

The preset selection is a source template and transport reference. It is not a persistent song setting.

If the user edits loaded preset source, remove the `preset` parameter from the current URL.

If the current source exactly matches a catalog preset, Copy share link must use that preset's short URL.

Otherwise, Copy share link must use the shorter valid `raw` or `gzip` source URL.

Test every preset with the normal parser and timeline checks.

Test catalog slugs and sources for uniqueness.

Convert the initial example into the first preset when preset support is implemented.

Complete a rights review before publishing a preset based on an identifiable commercial song.

Start with original exercises, public-domain material, material that the publisher has permission to distribute, or a reviewed short user transcription.

Decision change on 2026-09-28: Permit a short user transcription when it contains only chord and rhythm teaching data. Label it as unofficial. Do not include lyrics, melody notation, audio, artwork, or a claim of approval. Record the accepted risk and remove or revise the entry if a rights holder objects.

Decision change on 2026-09-29: Section 11.14 permits a catalog preset to materialize its complete source from a shared arrangement and an exercise profile. The materialized source remains the authoritative preset content after loading.

## 11.6 Practice Tempo Ramp

Status: Implemented and verified on 2026-09-28.

Implement the text directive before adding a user interface control.

Require this directive exactly once after the feature is implemented:

```text
tempo-ramp: <value>
```

Place `tempo-ramp:` after `count-in:` and before `capo:`.

Decision on 2026-09-28: Replace the existing unpublished preset sources in place. Backward compatibility for source without this directive is not required.

Use `off` to disable the tempo ramp:

```text
tempo-ramp: off
```

Use this compact positional form to enable it:

```text
tempo-ramp: +<step-bpm>/<loops-per-step>/<target-bpm>
```

Example:

```text
tempo-ramp: +5/2/120
```

This example increases the tempo by 5 BPM after every 2 completed loops until the tempo reaches 120 BPM.

Require the `+` sign.

Reserve a `-` sign for a possible future decreasing ramp. Do not accept it initially.

Require all three values as whole numbers.

Permit optional spaces around each `/` separator.

The step must be from 1 through 20 BPM.

The loop interval must be from 1 through 99 completed loops.

The target must be greater than the starting `bpm:` value and no more than 300 BPM.

Report a separate field error for an invalid step, loop interval, or target.

Do not infer a missing value or silently correct an invalid value.

Treat `bpm:` as the starting tempo.

Apply each tempo increase at a loop boundary after the configured number of completed loops.

If a full step would pass the target, use the target tempo for the next loop.

After the target is reached, continue looping at the target tempo.

Do not play another count-in at a tempo-change boundary.

Pause must preserve the current tempo, completed-loop count, and musical position.

Resume must continue the same ramp state.

Restart must restore the starting `bpm:` value, reset the completed-loop count, return to bar 1, slot 1, and use the configured count-in.

If the ramp is active, an edit to `bpm:` or `tempo-ramp:` must stop playback and reset the ramp.

Store the starting tempo, step, loop interval, and target as separate parsed values.

Store the current tempo and completed-loop count only as transient playback state.

Calculate every tempo segment from an audio-clock boundary. Do not derive a new boundary from a delayed user-interface callback.

After a user-interface stall, recover at the correct loop, tempo, and musical position without a burst of late strums.

Decision change on 2026-09-28: A tempo-ramp mode control can edit both `bpm:` and `tempo-ramp:`. Enabling the ramp treats the current BPM as the target and calculates a lower starting BPM. Disabling the ramp restores the target as the fixed BPM.

A future interface summary can show the expanded meaning, such as `+5 BPM every 2 loops, target 120 BPM`.

Verification evidence: The automated parser and timing checks passed on 2026-09-28. The user confirmed that the quick ramp test worked in the browser. The test covered a count-in, two loop-boundary increases, a partial final step, Pause and Play, and Restart.

## 11.7 Tempo Ramp Control

Status: Implemented and verified on 2026-09-28.

Add a tempo-ramp mode control to the Practice section.

Use two modes: Off and Increase.

When the ramp is off, `bpm:` remains the fixed playback tempo.

When the user enables the ramp:

1. Treat the current `bpm:` value as the target BPM.
2. Calculate 50 percent of the target.
3. Round the result to the nearest 5 BPM.
4. Use 30 BPM if the rounded result is less than 30 BPM.
5. Set the step to 5 BPM.
6. Set the loop interval to 3 completed loops.

For example, enable this ramp for a fixed tempo of 135 BPM:

```text
bpm: 70
tempo-ramp: +5/3/135
```

Do not enable the ramp when the fixed BPM is 30. A valid increasing target is not available.

When the user disables the ramp, copy the target to `bpm:` and write `tempo-ramp: off`.

Show separate controls for the step, loop interval, and target while the ramp is enabled.

The BPM controls edit the fixed tempo while the ramp is off. They edit the starting tempo while the ramp is enabled.

Keep the textarea as the single source of truth.

Read every control value from the parsed source.

Apply an enable or disable operation as one source change.

If a control value or required directive is invalid, keep the source unchanged and restore the controls from the parsed source.

Any ramp-control change stops playback and resets the ramp to bar 1, slot 1.

Support keyboard use, narrow screens, and 200 percent zoom.

Verification evidence: The automated checks passed on 2026-09-28. The user confirmed enable and disable behavior, field editing, invalid-value source preservation, fixed-tempo playback, keyboard use, and the responsive layout.

## 11.8 Capo

Status: Implemented and verified on 2026-09-28.

Require this directive after `tempo-ramp:` and before `chords:`:

```text
capo: <fret>
```

Require `fret` to be a whole number from 0 through 12.

Use `0` for no capo.

Treat each chord identifier as a finger shape relative to the capo.

Raise every played string by one semitone for each capo fret.

Do not change a muted `x` string.

Do not rewrite chord identifiers when the capo changes.

Add a Capo dropdown with Off and fret 1 through fret 12.

The dropdown must read from and edit only the `capo:` directive.

A capo edit must stop playback and reset it to bar 1, slot 1.

Include the capo in normalized timeline data and musical-content identity.

Show the capo setting in the song summary.

Reject a missing, duplicate, misplaced, malformed, or out-of-range directive.

Replace current pre-release preset sources in place with `capo: 0`.

Old pre-release raw and gzip source links without `capo:` can become invalid.

Do not add transposition, automatic chord-name conversion, alternate tuning, or a capo-specific chord catalog in this package.

Verification evidence: The automated parser, timeline, pitch, preset, and interface checks passed on 2026-09-28. The user confirmed source and dropdown synchronization, audible pitch changes, unchanged chord names, playback reset, fixed and ramped tempo playback, keyboard use, and responsive layout.

## 11.9 Swing

Status: Implemented and verified on 2026-09-28.

Require this directive after `capo:` and before `chords:`:

```text
swing: <value>
```

Use `off` or a whole-number percent from 50 through 75.

Treat the percentage as the part of each quarter-note beat assigned to the first eighth note.

Assign the remaining percentage to the second eighth note.

Use 50 for straight eighth notes.

Use 67 for an approximate two-to-one triplet feel.

For 16-slot and 24-slot grids, divide each eighth-note part equally among its smaller slots.

Keep beat, bar, loop, and tempo-ramp boundary durations unchanged.

Keep the source text as the only swing control in this package.

Do not add per-bar swing, humanization, random timing, accent changes, or genre presets.

Replace current pre-release preset sources in place with `swing: off`.

Old pre-release raw and gzip source links without `swing:` can become invalid.

Do not add compatibility handling until the owner explicitly declares the `v1.0.0` release.

Automated evidence: The repository check passed on 2026-09-28. It covered parser failures, straight-time equivalence, all supported grids, fixed audio-clock timing through 1,000 loops, unchanged timing boundaries, playhead conversion, presets, and format help.

Manual evidence: The user confirmed that the swing playback sounded correct in the browser test.

## 11.10 Swing Control

Status: Implemented and verified on 2026-09-28.

Add a Swing dropdown to the Practice section.

Use Off, Light (55%), Medium (60%), Triplet (67%), and Heavy (75%) as the standard choices.

Do not add 50 percent as a standard choice. Off already provides straight timing.

When the source contains another valid numeric value, show `Custom (N%)` as the selected choice.

Do not rewrite a custom value during synchronization.

The dropdown must read from and edit only the `swing:` directive.

A successful change must stop playback and reset it to bar 1, slot 1.

If safe replacement fails, keep the source unchanged and restore the parsed selection.

Keep the textarea as the single source of truth.

Automated evidence: The repository check passed on 2026-09-28. It covered the standard options, labels, help reference, custom-value logic, source replacement, disabled-state code, responsive styles, and all existing tests.

Manual evidence: The user confirmed that the Swing control worked well in the browser test.

## 11.11 Mobile Practice Interface

Status: Implemented and verified on 2026-09-28.

Make the active practice controls the first content after the page title.

Use **Guitar Strum Machine** as the page title.

Remove the introductory description and the teaching-tool label.

Keep the Preset control, its teaching goal, Play, Restart, playback status, tempo, Count-in, Capo, Swing, and Speed up controls in one compact practice panel.

Show a short arrangement summary in this panel.

Merge the visual presentation of the tempo number and slider. Keep the number editable for exact tempo entry.

Use different colours for Play and Pause. Keep the visible button text and pressed state, so colour is not the only state indicator.

Rename the source editor to **Edit arrangement**. Keep it closed by default.

Keep the arrangement text as the single source of truth.

Open the arrangement editor when validation fails. Do not close it automatically after the user fixes an error.

Move normal instructions into one Help section. Keep Help closed by default.

Keep the Sound test closed by default.

Keep validation errors next to the arrangement text. Keep exceptional status messages visible in the practice panel.

Use native controls and details elements. Preserve keyboard operation, visible focus, narrow-screen support, and use at 200 percent zoom.

Prevent double-tap zoom on tappable controls. Keep pinch zoom available on the page.

Do not change the text format, parser, audio behavior, preset content, or share-link format in this package.

Accepted risk: A user must open Edit arrangement to copy or share custom source. This keeps the normal practice view compact.

Failure behavior: If the source or timeline is invalid, stop playback, disable unavailable controls, open Edit arrangement, and show each error next to the text.

Automated evidence: The repository check passed on 2026-09-28. It covered the compact practice layout, collapsed sections, state-dependent Play and Pause styling, responsive settings, accessible references, compact summary, and automatic editor opening for errors.

Manual evidence: The user confirmed that the redesigned interface worked well in the browser preview.

## 11.12 English and Simplified Chinese Interface

Status: Implemented and verified on 2026-09-29.

Add the shared English and Simplified Chinese language switcher to Guitar Strum Machine.

Place the compact `EN / 中文` control at the right side of the page-title row. Treat language as page-level state, not a practice setting.

Translate all normal controls, help text, status messages, share messages, preset teaching information, and validation messages.

Keep arrangement directives, chord identifiers, strum tokens, preset names derived from song titles, and share-link data language-neutral.

Use the saved website language when the page opens. Apply a language change without reloading the page.

Keep the arrangement text as the single source of truth. A language change must not change the text, playback position, selected preset, practice settings, or share URL.

Use stable translation keys. Use parser error codes for validation translations.

If a translation key is unavailable, show the existing English message. Do not hide an error or replace it with an untranslated key.

Keep the English and Simplified Chinese translation key sets identical.

Do not translate music syntax examples. Translate the instructions around each example.

Accepted risk: Preset song titles remain in their published form. This prevents a language change from changing the identity of a shared preset.

Failure behavior: If saved-language storage is unavailable, use the browser language or English. If language selection cannot be saved, apply the selected language for the current page session.

Automated evidence: The repository check passed on 2026-09-29. It covered matching translation keys, translated validation messages, content-hash references, title-row controls, and touch behaviour that preserves pinch zoom.

Manual evidence: The user confirmed the compact language control and translated interface on desktop and iPhone. The user also confirmed the corrected iOS selected colour and double-tap behaviour.

## 11.13 Number Chords, Keys, and Guitar Shapes

Status: Implemented and verified on 2026-09-29.

### Purpose

Let a teacher keep one harmonic progression while the student plays it in another sounding key or with another set of guitar shapes.

Keep the arrangement text as the single source of truth.

Keep the number progression independent of the sounding key and guitar capo. This follows the central number-chart principle that one progression can be used in different keys. The guitar capo is a performance setting for this tool. It is not part of the harmonic progression.

References:

- [The Nashville Number System introduction](https://nashvillenumbersystem.com/introduction/)
- [The Nashville Number System teaching paper](https://www.midside.com/publications/declercq_2019_jmtp.pdf)

### Terms

Use these terms consistently:

- **Original key** means the reference key of the song or authored exercise.
- **Playing key** means the current sounding key.
- **Shape key** means the key represented by the guitar shapes below the capo.
- **Number chord** means a mode-relative scale degree with an explicit chord quality.
- **Shape chord** means the chord identifier that selects a guitar fingering from the chord catalog.
- **Sounding chord** means the pitch result after the capo is applied to a shape chord.

The shape key is the playing key transposed down by the capo fret. Do not store the shape key as another directive.

### Source Form

Use this form for a number arrangement:

```text
4/4#8
bpm: 100
count-in: 1
tempo-ramp: off
original-key: Bb major
key: G major
notation: numbers
capo: 0
swing: off

chords:
| 1 | 5 | 6:m | 4 |

strum:
| D - D U - U D U | x4
```

Require `original-key:`, `key:`, and `notation: numbers` together.

Put `original-key:`, `key:`, and `notation:` after `tempo-ramp:` and before `capo:`.

Require the original key and playing key to use the same mode. A major-to-minor or minor-to-major change is reharmonisation, not transposition.

For an original exercise, use its authored key as the original key.

If `notation:` is absent, treat chord tokens as shape identifiers. This rule preserves existing arrangements and share links.

Do not infer the notation from chord tokens. Do not mix number chords and shape chords in one arrangement.

### Key Grammar and Spelling

Use this key grammar:

```text
<letter><optional accidental> <mode>
```

Use a letter from `A` through `G`. Use optional `b` or `#`. Use `major` or `minor` as the mode.

Use ASCII `b` and `#` in formatted source. Accept pasted Unicode `♭` and `♯` characters.

Accept enharmonic aliases. Resolve an alias to a conventional beginner-friendly spelling for derived chord displays. Do not silently rewrite source during parsing.

Use these canonical major-key tonics:

```text
C Db D Eb E F F# G Ab A Bb B
```

Use these canonical minor-key tonics:

```text
C C# D Eb E F F# G G# A Bb B
```

For example, accept `A# major`, but show B-flat-major spelling in derived chord views. A future Format action can replace the alias after it shows a non-blocking notice.

### Number-Chord Grammar

Use this conceptual grammar:

```text
<root degree><optional quality><optional bass degree><optional slot>
```

Use these parts:

- Root degree: one optional `b` or `#`, followed by a number from 1 through 7.
- Quality: a colon followed by `m`, `7`, `maj7`, `m7`, `sus2`, `sus4`, `add9`, or `5`.
- Bass degree: `/`, followed by one optional `b` or `#` and a number from 1 through 7.
- Slot: the existing `@N` chord-change suffix.

Examples:

```text
1
2:m
5:7
1:maj7
6:m7
4:add9
5:sus4
1:5
b7
#4:m
1/3
5:7/7
5:7/7@8
```

A bare number chord is major. Always write minor quality explicitly.

The mode selects the pitch of each degree. The token selects the chord quality on that pitch.

For `key: A minor`, use the A natural-minor degrees:

```text
1=A 2=B 3=C 4=D 5=E 6=F 7=G
```

Thus `1:m 6 3 7` resolves to `Am F C G`. Use `#7` for a G-sharp root in A minor.

Describe this format as **mode-relative number notation**. It is inspired by Nashville number charts, but it is not a strict Nashville Number System format. Reserve `notation: nashville` for possible strict compatibility later.

### Chord Resolution

Resolve each number chord in this order:

1. Parse the degree, quality, bass degree, and slot.
2. Resolve the sounding chord in the playing key.
3. Transpose the sounding chord down by the capo interval.
4. Resolve the resulting shape identifier in the chord catalog.
5. Give the resolved shape voicing and capo fret to the audio engine.

For this source:

```text
original-key: Bb major
key: Bb major
notation: numbers
capo: 3
```

resolve these chords:

| Number | Sounding chord | Shape chord |
| --- | --- | --- |
| `1/3` | `Bb/D` | `G/B` |
| `4:add9` | `Ebadd9` | `Cadd9` |
| `5:7` | `F7` | `D7` |
| `6:m` | `Gm` | `Em` |

Do not silently substitute a chord quality, bass note, shape, or voicing.

### Key and Capo Behaviour

The original key is reference metadata. It does not affect chord resolution, playback, or capo options.

Changing the playing key keeps the original key, number progression, and capo unchanged. It changes the sounding chords and derived shapes.

Changing the capo in a number arrangement keeps the original key, playing key, and number progression unchanged. It changes the derived shape key and shape chords. It does not change the sounding chords.

Keep the current capo behaviour for a legacy shape arrangement. In a shape arrangement, changing the capo keeps the named shapes and changes the sounding pitch.

Provide a **Return to original key** action. This action copies `original-key:` to `key:`. It does not change the number progression or capo.

### Guitar Configurations

For a number arrangement, calculate each capo option in the supported fret range.

For each option, show:

- capo fret;
- derived shape key;
- resolved shape progression; and
- missing catalog shapes, if applicable.

Do not automatically declare one option to be the best option.

Do not silently change the selected capo after a key or progression edit.

Keep an unsupported option visible and identify its missing shapes. Let the teacher or student select a supported option.

Do not add difficulty-based recommendations until the chord catalog has reviewed difficulty metadata.

### Practice Interface

Keep this summary visible in the practice panel when the original and playing keys differ:

```text
Original B♭ → Play in G · G shapes · No capo
```

Use this form when the keys are the same:

```text
Key B♭ · G shapes · Capo 3
```

Add a read-only chord guide with these views:

- **Shapes** shows the chords that the student plays.
- **Numbers** shows the exact number progression.
- **Sounding** shows the chords that the listener hears.

Use Shapes as the first-use default. Remember the selected view on the device. Changing the view must not change the source, playback, selected preset, or share URL.

Keep long progressions in a labelled, horizontally scrollable region. Do not add editing or playback highlighting to the chord guide in the first implementation.

Put key controls in a compact **Key and shapes** disclosure. Keep it closed during normal practice. Include these controls:

- **Original key** edits `original-key:`.
- **Play in** edits `key:`.
- **Play with** edits `capo:` and shows the derived shape key.
- **Return to original key** copies the original key to the playing key.

Label a guitar option in this form:

```text
G shapes · Capo 3
```

Do not use a standalone Capo label in number mode. The combined label makes it clear that the control selects a guitar configuration without changing the sounding key.

Keep the chord guide and key controls as derived views and editors of the text source. Do not add a WYSIWYG arrangement editor.

### Validation and Failure Behaviour

Report a line-specific error when a required number-arrangement directive is missing, duplicated, malformed, or out of order.

Report an error when the original key and playing key use different modes.

Report an error when a number chord is malformed, out of range, or mixed with a shape identifier.

When a resolved shape is not in the chord catalog, identify:

- source bar;
- number token;
- sounding chord; and
- required shape chord.

Use a message in this form:

> Bar 2: `3:7` resolves to sounding chord D7 and shape B7. The B7 shape is not supported.

If one or more required shapes are unavailable, stop playback and disable unavailable controls. Open **Key and shapes** and show the available guitar configurations.

Do not change the key, capo, number progression, or source text to recover from an error.

### Compatibility

Keep every existing shape arrangement, preset source, and share link valid without modification.

Keep the current parser and audio result for a source that has no `notation:` directive.

Do not insert `original-key:`, `key:`, or `notation:` when Format processes a legacy shape arrangement.

Keep number syntax language-neutral. Translate interface labels, help text, status messages, and validation messages into English and Simplified Chinese.

### Initial Scope

Include:

- mandatory original and playing keys for number arrangements;
- major and natural-minor keys;
- mode-relative degrees 1 through 7;
- one optional root accidental;
- explicit supported chord qualities;
- one optional numbered bass degree;
- existing bar, repeat, slot, strum, swing, capo, tempo, and sharing behaviour;
- explicit guitar-configuration selection;
- Shapes, Numbers, and Sounding views; and
- conventional enharmonic display spelling.

Defer:

- Roman-numeral input;
- strict Nashville import or export;
- automatic best-capo recommendations;
- mixed number and shape tokens;
- diminished and augmented chords;
- modes other than major and natural minor;
- key changes inside a song;
- capo changes inside a song;
- automatic conversion of existing arrangements; and
- automatic generation of unsupported guitar voicings.

### Acceptance Tests

Add automated tests for these cases:

1. B-flat major with capo 3 resolves to G-family shapes.
2. Original B-flat major played in G major with no capo sounds in G major.
3. A-minor degrees use the natural-minor scale.
4. Chord quality remains explicit in major and minor keys.
5. Slash chords preserve the sounding and shape bass notes.
6. Changing the playing key preserves the original key and numbers.
7. Changing the capo preserves the playing key and sounding chords.
8. Returning to the original key changes only the playing key and derived chords.
9. Equivalent number and shape arrangements produce equivalent audio events.
10. Enharmonic aliases resolve to the canonical display spelling.
11. An unavailable shape identifies the token, sounding chord, and required shape.
12. Existing arrangements, presets, and shared URLs behave as before.
13. The three chord-guide views do not change the text source or playback state.
14. English and Simplified Chinese translation key sets remain identical.

Verify the interface on the current iPhone Safari and desktop Chrome targets. Test keyboard use, visible focus, narrow screens, horizontal chord-guide scrolling, and 200 percent zoom.

Automated evidence: The repository check passed on 2026-09-29. It covered key parsing, natural-minor degrees, explicit qualities, slash chords, playing-key changes, capo changes, return to the original key, audio-event equivalence, unavailable shapes, read-only chord-guide views, translations, local assets, and legacy regressions.

Manual evidence: The user confirmed that the number-notation workflow works well on 2026-09-29.

## 11.14 Shared Arrangements and Exercise Profiles

Status: Implemented and verified on 2026-09-29.

### Purpose

Let two or more exercises use the same musical arrangement without duplicating its chord and strum transcription.

Keep the student interface simple. Show one preset for each distinct teaching task.

Keep the complete plain-text source as the single source of truth after a preset loads.

Do not add a database, build step, framework, or network request.

### Catalog Model

Use three conceptual layers:

1. A shared arrangement contains stable musical content.
2. An exercise profile contains the teaching purpose and default performance settings.
3. A materialized source is the complete text copied into the arrangement editor.

The first implementation must use local JavaScript objects.

#### Shared Arrangement

A shared arrangement must contain:

- a stable versioned arrangement identifier;
- the source title or exercise title;
- the grid header;
- the original key for a number arrangement;
- the notation type;
- the chord section;
- the strum section; and
- shared rights metadata and notice, when required.

The original key belongs to the shared arrangement. It must not vary between exercise profiles that reference the same arrangement.

Treat a versioned arrangement as immutable after publication. If its musical content changes, create a new arrangement version.

Do not store a complete source string in each exercise profile.

#### Exercise Profile

An exercise profile must contain:

- a stable versioned preset slug;
- a reference to one shared arrangement;
- a student-facing preset title;
- a teaching goal;
- a teaching level;
- search or grouping tags;
- the playing key for a number arrangement;
- the default capo fret;
- the default beats per minute;
- the default count-in;
- the default tempo ramp; and
- the default swing value.

The playing key belongs to the exercise profile. It describes the sounding key for that teaching task.

The capo, tempo, count-in, tempo ramp, and swing values are profile defaults. They become normal source directives after materialization.

Treat a versioned exercise profile as immutable after publication. If its teaching identity or materialized source changes, create a new preset slug.

#### Materialized Source

Create one deterministic materializer that combines an arrangement and an exercise profile.

The materializer must produce the existing complete source format in this order:

```text
4/4#8
bpm: <profile value>
count-in: <profile value>
tempo-ramp: <profile value>
original-key: <arrangement value>
key: <profile value>
notation: numbers
capo: <profile value>
swing: <profile value>

chords:
<arrangement chord bars>

strum:
<arrangement strum bars>
```

Use line-feed characters and stable spacing. Do not depend on object-property order.

After preset selection, copy the materialized source into the textarea before normal validation.

After this copy, the text is the only runtime source of truth. Controls must edit the text. They must not edit the arrangement or profile object.

The arrangement and profile are catalog templates. They are not a second live state.

Share links must keep the current behavior:

- Use the short preset URL when the text exactly matches a materialized profile source.
- Use the complete raw or gzip source URL when the text does not exactly match a catalog source.

Copy source must copy the complete materialized text.

### Viva La Vida Exercises

Create one shared arrangement for the reviewed short transcription.

Use this musical identity:

```text
arrangement: viva-la-vida-v1
original-key: Ab major
notation: numbers
grid: 4/4#8
```

Use this chord section:

```text
| 4 5@8 | 5 | 1 6:m@8 | 6:m |
```

Keep the current four strum bars unchanged.

Create these two visible exercise profiles:

| Preset | Level | Playing key | Capo | Sounding chords | Teaching purpose |
| --- | --- | --- | ---: | --- | --- |
| Viva La Vida — melody backing in C | Beginner | C major | 0 | F G C Am | Provide a C-major backing track for melody practice. |
| Viva La Vida — syncopated strumming in G | Intermediate | G major | 0 | C D G Em | Practise syncopated eighth-note strumming and mid-bar chord changes. |

Use separate, explicit versioned slugs:

```text
viva-la-vida-melody-backing-c-v1
viva-la-vida-syncopated-strumming-g-v1
```

Use 135 beats per minute, a one-bar count-in, no tempo ramp, no capo, and straight timing as the initial defaults for both profiles.

Do not put melody notes in the catalog or source. The melody profile supplies only its backing track.

Keep the existing unofficial-transcription notice. Do not add lyrics, melody notation, audio, artwork, or a claim of rights-holder approval.

### Interface Behaviour

Show both exercise profiles as separate entries in the existing Preset dropdown.

Do not add a second Song or Exercise dropdown.

Selecting either profile must require only one preset action. The student must not have to open Key and shapes before playback.

After loading, the student can still change Play in, Play with, tempo, count-in, tempo ramp, swing, or source text.

A change to a loaded source must not modify the catalog arrangement or profile.

Keep the current confirmation before a preset replaces edited text.

Add English and Simplified Chinese translations for both profile titles and teaching goals. Keep the published song title unchanged.

### Compatibility and Migration

Keep the public preset-catalog interface compatible with the current application. Each returned preset entry must still expose a complete `source` value.

The `source` value for a composed profile is derived. Do not author a second copy of that source.

Keep existing presets unchanged in the first implementation. They can continue to store complete source strings.

Use the shared-arrangement model first for the two Viva La Vida profiles. Migrate another preset only when it needs more than one exercise profile or another clear benefit.

This staged migration is an accepted temporary mixed catalog model. Keep the materialization logic isolated so the application does not need separate loading paths.

The site is still before `v1.0.0`. Replace the current Viva La Vida pre-release preset and slug with the two explicit exercise profiles.

Do not support the removed pre-release Viva La Vida slug as an alias.

### Validation and Failure Behaviour

Validate the arrangement catalog before exposing any preset.

Reject:

- a duplicate arrangement identifier;
- a duplicate preset slug;
- an exercise profile that references a missing arrangement;
- an exercise profile with a missing required default;
- mismatched original-key and playing-key modes;
- duplicate materialized sources; and
- materialized source that fails the normal parser or timeline validation.

If materialization fails, report the catalog error. Do not return a partial source or silently load the default preset.

Do not silently copy a setting from another profile.

### Acceptance Tests

Add automated tests for these cases:

1. Both Viva La Vida profiles reference one arrangement definition.
2. Both materialized sources contain the same number chords and strum bars.
3. Both materialized sources use `original-key: Ab major` and `capo: 0`.
4. The melody-backing profile uses `key: C major` and resolves to F, G, C, and A minor.
5. The strumming profile uses `key: G major` and resolves to C, D, G, and E minor.
6. Both materialized sources pass the normal parser and timeline checks.
7. Each profile has a unique slug and materialized source.
8. The preset catalog still returns a complete `source` value for every entry.
9. A missing arrangement reference stops catalog creation with a stable error code.
10. Invalid materialized source stops catalog creation with a stable error code.
11. Existing non-Viva presets keep their source and URL behavior.
12. An exact materialized source uses its preset URL. Edited text uses a full source URL.
13. English and Simplified Chinese translation key sets remain identical.

Verify both profiles on iPhone Safari and desktop Chrome. Confirm the displayed key, chord views, playback chords, preset replacement confirmation, and share-link behavior.

Automated evidence: The repository check passed on 2026-09-29. It covered shared arrangement references, deterministic materialization, intended C-major and G-major sounding chords, parser and timeline validation, stable catalog failures, preset and source URL behavior, translations, asset hashes, and existing preset regressions.

Manual evidence: The user confirmed that both Viva La Vida exercise profiles work correctly on 2026-09-29.

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
- Keep alternate tunings outside the MVP. Implement capo support as a Phase 2 feature.

## 13.10 Document Grammar

Status: Decided.

- Require the header, `bpm:`, `count-in:`, `tempo-ramp:`, `capo:`, `swing:`, `chords:`, and `strum:` in that order.
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
