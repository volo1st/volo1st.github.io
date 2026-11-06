# Source layout

The tool loads plain scripts at `/tools/guitar-strumming/`. Keep it usable without a build step.

| Source | Responsibility |
| --- | --- |
| `index.html`, `styles.css`, `i18n.js` | Controls, local layout, and English/Chinese text |
| `app.js` | Connect controls, source validation, playback state, and rendering |
| `domain/parser.js` | Source grammar, directive replacement, and structured errors |
| `domain/harmony.js` | Keys, number chords, and capo configurations |
| `domain/chord-catalog.js` | Reviewed guitar shapes and voicings |
| `domain/core.js` | Musical timeline and audio-clock calculations |
| `presets/data.js`, `presets/catalog.js` | Exercise templates and validated catalog |
| `browser/audio-engine.js` | Web Audio synthesis and audio-session recovery |
| `browser/share.js` | Source encoding, decoding, and link limits |
| `browser/screen-wake-lock.js` | Optional screen wake lock |
| `ui/presentation.js`, `ui/notifications.js` | Read-only chord timeline and warnings |

Keep domain modules independent of browser controls and audio objects. Browser scripts load in dependency order. Domain modules also expose CommonJS exports for the Node.js tests.

The arrangement text is the persistent musical state. Parsing produces the model used by playback. Presentation derives from that model; it must not parse the source again or change timing, source text, exercise identity, or share data.

Keep catalog input declarative. Only `presets/catalog.js` validates and queries it. `app.js` uses the validated catalog rather than raw data. See [exercise rules](PRESETS.md).

Read [the format](FORMAT.md) before changing the parser. Read [playback notes](AUDIO.md) before changing timing or audio lifecycle. Keep visual examples in the shared style guide.
