# Arrangement source format

The arrangement text defines the song and its practice settings. Controls edit this text. Playback position, current ramp tempo, and messages are temporary state.

## Complete example

```text
4/4#8
bpm: 100
count-in: 1
tempo-ramp: off
capo: 0
swing: off

chords:
| C G@5 | Am | F | G |

strum:
| D - D U - U D U | x4
```

Blank lines and spaces around lines are ignored. Directive names, section labels, and chord identifiers are case-sensitive. Strum tokens are case-insensitive. Keep the header, directives, and sections in the order shown. Do not omit a required directive or repeat it.

## Header and settings

| Item | Accepted value |
| --- | --- |
| Header | `4/4#8`, `4/4#16`, or `4/4#24`; the number is slots per bar |
| `bpm:` | Whole-number quarter-note beats per minute (BPM), 30–300 |
| `count-in:` | `0`, `1`, or `2` bars |
| `tempo-ramp:` | `off` or `+step/loops/target` |
| `capo:` | Whole-number fret, 0–12 |
| `swing:` | `off` or a whole-number percent, 50–75 |

For a ramp, use a step of 1–20 BPM and an interval of 1–99 completed loops. The target must exceed the starting BPM and must not exceed 300. Spaces around `/` are accepted. For example, `+5/3/135` increases by 5 BPM after every three loops until 135 BPM.

Swing assigns the specified percentage of each beat to its first eighth note. The remainder goes to the second eighth note. `50` is straight timing; `67` approximates a two-to-one feel. Smaller slots divide each eighth-note part equally. Beat and bar durations stay unchanged. Count-in clicks remain straight.

## Chord bars

Each `| ... |` is one bar. Start each bar with a chord at slot 1. Do not put `@1` on that first chord. Later changes use `CHORD@N`, with ascending slot numbers from 2 through the grid size. A chord change occurs before a strum at the same slot.

Without number-notation directives, each chord selects a shape from [the chord catalog](../domain/chord-catalog.js). Identifiers such as `Am7`, `Dsus4`, and `G/B` are exact catalog names. The parser does not invent voicings. The capo raises every playable string by its fret count; muted strings stay muted.

## Number arrangements

Insert all three directives between `tempo-ramp:` and `capo:`:

```text
original-key: Bb major
key: G major
notation: numbers
```

The original key is reference metadata. The playing key determines the sounding chords. Both keys must use the same mode: `major` or natural `minor`. Use a tonic from A through G with an optional `b` or `#`. Pasted `♭` and `♯` are accepted. Derived views use conventional enharmonic spellings without changing the input text.

A number chord uses this grammar:

```text
[accidental]degree[:quality][/bass-degree][@slot]
```

Root and bass degrees are 1–7 with an optional `b` or `#`. A bare degree is major. Write minor quality explicitly. Supported qualities are `m`, `7`, `maj7`, `m7`, `sus2`, `sus4`, `add9`, and `5`.

Examples: `1`, `6:m`, `b7`, `1/3`, and `5:7/7@8`. Degrees follow the selected mode. In A minor, `1:m 6 3 7` sounds as `Am F C G`. This is mode-relative number notation, not strict Nashville notation. Do not mix numbers and shape identifiers.

Resolve the sounding chord in the playing key, then transpose it down by the capo fret to find its guitar shape. For B-flat major with capo 3, `1/3` sounds as `Bb/D` and uses `G/B` shapes.

Changing the playing key preserves the progression and capo. Changing the capo preserves the sounding key and changes the shapes. This differs from a shape arrangement, where a capo change raises the sound. Return to original key copies `original-key:` to `key:`.

Unsupported shapes produce an error with the bar, number token, sounding chord, and required shape. Guitar configurations show available alternatives and missing shapes. Do not change the key, capo, quality, or bass note automatically.

## Strum bars

Each strum bar must have exactly one token per grid slot. Use `-` for a rest. Other tokens use:

```text
<direction>[string-count][articulation][!]
```

| Part | Meaning |
| --- | --- |
| `D` or `U` | Downstroke or upstroke |
| Optional `2`, `3`, or `4` | Maximum number of playable strings |
| Optional `P` or `X` | Palm mute or dead strum |
| Optional final `!` | Accent |

Keep modifiers in this order. Examples: `D`, `U!`, `D3P`, and `U2X!`. Do not combine `P` and `X`. Unsupported tokens are errors; the parser does not pad a short bar or remove modifiers.

Remove muted strings before selecting a range. Downstrokes start at the lowest playable pitch; upstrokes start at the highest. If fewer strings are playable than requested, use all of them. Palm mute keeps pitch with a shorter decay. A dead strum uses short filtered noise. Accents change the attack level, not the event time.

## Repeats and errors

Append `xN` after a chord or strum bar. `N` is the total occurrence count, including the written bar, and must be 2–999. Repeats apply only to the preceding bar. Each expanded section is limited to 1,000 bars. Chord and strum sections must have the same expanded bar count.

Malformed or unsupported source stops playback. Errors identify the source line and musical location when available. Preserve the input so the user can fix it. Do not add missing directives, repair tokens, or silently replace unsupported chords.
