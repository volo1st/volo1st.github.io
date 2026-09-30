# Vincent's Website

This repository contains Vincent's public website and static browser tools. GitHub Pages hosts the website.

The current home page is a tools directory. The long-term plan will make the home page a public personal introduction and portfolio.

See [`website-roadmap.md`](website-roadmap.md) for the product direction and delivery phases.

## Tools

- [CSV to ABA Converter version 1](tools/csv2aba/) is the current fallback.
- [CSV to ABA Converter version 2](tools/csv2aba-v2/) is ready for an operator trial.
- [Guitar Strum Machine](tools/guitar-strumming/) makes a looping guitar backing track from plain-text input. The home page links to this tool.

The home page, version 2 converter, and Guitar Strum Machine support English and Simplified Chinese. The site stores the selected language code in browser local storage. A language change does not change guitar arrangement text, playback state, or share-link data.

The maintained pages use `assets/site-shell.css` for the shared header, footer, language control, and design tokens. Each tool uses the same semantic shell classes. The shared shell maps a semantic `data-domain` value to each domain accent. A home-page tool card uses the accent of its destination. The original pixel-art `V` block is the shared site icon. CSV-to-ABA version 1 remains unchanged.

HTML references browser assets with a short SHA-256 content hash. Update the hash when a CSS or JavaScript file changes. The repository check rejects a stale hash.

The guitar tool can put the complete source in a share URL. Anyone who receives the URL can read the source. A browser sends the URL query to the website host when it opens the link. A URL-shortener service also receives the URL. A generated share URL must not exceed 750 characters. Decoded source must not exceed 65,536 UTF-8 bytes.

The guitar page has a generic Open Graph preview. The preview does not include a fixed Open Graph URL, so an arrangement query remains in the shared link. Static metadata cannot show a different preview for each arrangement. Run `node scripts/generate-share-card.js` to regenerate the preview image.

The guitar tool includes a local catalog of reviewed practice exercises. The catalog can include a short user transcription when it contains only chord and rhythm teaching data and has a clear unofficial notice. It does not include lyrics, melody notation, audio, or artwork. A preset does not make a network request. A preset URL uses a stable versioned slug. Published preset source does not change. A source revision uses a new slug.

The catalog can use one versioned arrangement for multiple exercise profiles. Each profile has its own teaching goal, playing key, and practice defaults. The catalog materializes a complete plain-text source when the preset loads. The text remains the runtime source of truth. The Viva La Vida arrangement provides separate C-major melody-backing and G-major strumming profiles without duplicating its chord and strum transcription.

The guitar source requires one `tempo-ramp:` directive. Use `off` to keep a fixed tempo. Use a value such as `+5/2/120` to increase the tempo by 5 beats per minute after every 2 completed loops until it reaches 120 beats per minute. The ramp supports only increasing tempo. It applies changes at loop boundaries.

The main practice view shows the exercise, transport controls, chord shapes, tempo, and playback status. The chord timeline uses scrollable bar cards with proportional chord-change positions. It does not show source operators such as `@8`. Practice options, arrangement controls, sharing controls, and help are closed by default. The Practice options section contains the count-in and tempo-ramp controls. When the user enables the ramp, the tool treats the fixed BPM as the target. It starts at half of that tempo, rounded to the nearest 5 BPM, and uses a default increase of 5 BPM after every 3 loops. When the user disables the ramp, the target becomes the fixed BPM again.

The guitar source requires one `capo:` directive with a value from 0 through 12. In a shape arrangement, chord identifiers describe finger shapes relative to the capo. The Capo dropdown edits the directive. A capo raises the sounding pitch without changing the chord identifiers.

A number arrangement also requires `original-key:`, `key:`, and `notation: numbers` between `tempo-ramp:` and `capo:`. Number chords use mode-relative degrees, such as `1`, `6:m`, `5:7`, and `1/3`. The `key:` directive sets the sounding key. The capo selects guitar shapes without changing the sounding key. The main practice view always shows chord shapes. The Arrange and share section can show the shapes, numbers, or sounding chords. It rejects a guitar configuration when the local chord catalog does not contain a required shape.

The guitar source requires one `swing:` directive. Use `off` for straight timing. Use a whole number from 50 through 75 to set the first eighth note's share of each beat. A value of 67 gives an approximate two-to-one triplet feel. Swing changes event timing but does not change the duration of a beat, bar, or loop. The Swing dropdown edits the directive. Edit the source to use a custom numeric value.

## Local use

Open `index.html` in a browser. The website does not need a build step.

## Local checks

Install Bash, Git, and Node.js. Then run this command from the repository root:

```sh
./scripts/check.sh
```

Run this command before each commit or deployment. It completes these checks:

- JavaScript syntax;
- shell syntax;
- automated tests;
- internal links and assets;
- duplicate HTML IDs;
- label and ARIA references; and
- staged and unstaged whitespace.

The script does not install software or send repository data to a service.
