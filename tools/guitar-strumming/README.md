# Guitar strum machine

Play looping guitar practice tracks from plain text at `/tools/guitar-strumming/`. Audio is synthesized in the browser. No audio file or account is needed.

## Use

Select an exercise. Press Play. Use Pause to keep your position or Start over to return to the beginning.

Practice options contains count-in and speed-up controls. Arrange and share contains key, capo, swing, source text, and copying controls. These controls edit the source text. Help contains format guidance and sound tests.

The chord timeline normally shows guitar shapes. Open Arrange and share to choose Shapes, Numbers, or Sounding for a number arrangement. Closing it restores Shapes. Missing shapes or invalid input open the editor and stop playback. The tool never substitutes another chord to recover.

The timeline follows the active bar. Manual scrolling suspends following until Play or Start over. Pause preserves the scroll position and active chord. Count-in and the ready state have no active-chord marker.

Language and the authoring chord-view choice can be saved in local browser storage. Arrangement edits and playback position are not saved. Copy source or a share link before leaving the page. A shared link contains your source; see [sharing and privacy](docs/SHARING.md).

## Maintenance references

- [Source format](docs/FORMAT.md): directives, chords, strums, and validation.
- [Architecture](docs/ARCHITECTURE.md): modules and dependencies.
- [Playback and audio](docs/AUDIO.md): timing, failure behavior, and iPhone recovery.
- [Exercises](docs/PRESETS.md): catalog data, identity, and rights review.
- [Sharing](docs/SHARING.md): encoding, limits, and copy recovery.

Run `./scripts/check.sh` from the repository root. The guitar tests cover parsing, harmony, scheduling, presentation, audio lifecycle, presets, and sharing. After an audio change, check desktop Chrome and iPhone Safari with speakers and headphones. See the audio notes for the regression checklist. Do not infer device support from source tests alone.
