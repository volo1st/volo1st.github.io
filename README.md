# volo1st's Website

This repository contains volo1st's public website and static browser tools. GitHub Pages hosts the website.

The home page is volo1st's public introduction. It links to the [Code](code/), [Sound](sound/), and [Music](music/) sections. The tools directory is available at [`/tools/`](tools/).

See [`plan.md`](plan.md) for current actions, product direction, and delivery phases.

## Tools

- [CSV to ABA Converter](tools/csv2aba-v2/) is the current converter. The former address redirects to it. One normal CBA payment run will complete its workflow validation.
- [Legacy CSV to ABA Converter](tools/csv2aba-legacy/) is the fallback. Its conversion logic remains unchanged.
- [Guitar Strum Machine](tools/guitar-strumming/) makes a looping guitar backing track from plain-text input. The tools directory links to this tool.
- [Pitch Shifter](tools/pitch-shifter/) shifts a local mono or stereo song without changing its duration. One transport compares the original and shifted audio. The tool exports a 16-bit pulse-code modulation (PCM) Waveform Audio File Format (WAV) file or a 320 kbit/s MP3 file.

The home page uses English. The tools directory, version 2 converter, Guitar Strum Machine, and Pitch Shifter support English and Simplified Chinese. The site stores the selected tool language in browser local storage. A language change does not change guitar arrangement text, playback state, share-link data, or selected audio.

The maintained pages use `assets/site-shell.css` for shared identity, breadcrumb, language control, and design tokens. The home page uses `assets/home.css` for its namecard layout. The public section indexes use `assets/section-index.css` for their content lists. The shared shell maps a semantic `data-domain` value to each tool accent. The original pixel-art `V` block is the browser icon. The legacy CSV-to-ABA conversion logic remains unchanged.

The home page draws a small Sagittarius constellation in the space between the introduction and contact links. The principal star positions use normalized J2000 International Celestial Reference System (ICRS) data from SIMBAD. Small circular particles form the stars and dotted connections. The connections are a simplified drawing, not an official constellation boundary. The local canvas effect stops when the page is hidden and hides when the available space is too small. Add `?constellation=off` to disable the effect for comparison.

The home page uses local SVG paths from Simple Icons version 16 for its social links. The paths use the CC0 1.0 Simple Icons collection. Each mark renders in the page text color. The page does not request an icon font, script, or image from a third party.

Maintained HTML pages reference interface assets with a short SHA-256 content hash. Update the hash when a CSS or JavaScript file changes. The repository check rejects a stale hash. Legacy assets remain unversioned because the legacy fallback is frozen except for a critical fix.

Pitch Shifter keeps audio on the user's device. It does not upload the file or send audio over the network. It supports files that the browser can decode, mono or stereo audio, sample rates from 8 kHz through 192 kHz, a maximum duration of 30 minutes, and up to 128 MiB of decoded 32-bit PCM. It exports 16-bit PCM WAV or 320 kbit/s MP3. An MP3 source defaults to MP3 output. Every other source defaults to WAV output. The encoder preserves the rendered level and clamps samples outside the output range. Processing statistics show the pre-encode peak and clipped-sample proportion. MP3 export can add a short codec delay. The tool does not preserve source metadata. On iOS and iPadOS, the tool uses the optional Audio Session API to recover silent built-in-speaker output. Other browsers use the normal playback path. The tool uses pinned local Signalsmith Stretch and LAME WebAssembly (Wasm) modules. See its [dependency record](tools/pitch-shifter/docs/DEPENDENCIES.md) for source commits, licences, artifact hashes, and reproduction steps.

Use HTTPS for Pitch Shifter performance tests on iOS and iPadOS. WebKit Enhanced Security can disable just-in-time compilation for JavaScript and Wasm on a plain HTTP local-area-network origin. This restriction can make local tests much slower than the deployed site. Record `window.isSecureContext` with each device measurement. See [WebKit issue 324968](https://bugs.webkit.org/show_bug.cgi?id=324968).

The guitar tool can put the complete source in a share URL. Anyone who receives the URL can read the source. A browser sends the URL query to the website host when it opens the link. A URL-shortener service also receives the URL. A generated share URL must not exceed 750 characters. Decoded source must not exceed 65,536 UTF-8 bytes.

The guitar page has a generic Open Graph preview. The preview does not include a fixed Open Graph URL, so an arrangement query remains in the shared link. Static metadata cannot show a different preview for each arrangement. Run `node scripts/generate-share-card.js` to regenerate the preview image.

The Guitar Strum Machine provides a local home-screen icon and web app manifest. The installed app starts at the normal Guitar Strum Machine address. Installation does not add offline support. The other files in `assets/app-icons/` record the approved visual direction for possible future music tools.

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
