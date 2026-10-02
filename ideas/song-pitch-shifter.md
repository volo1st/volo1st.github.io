# Song Pitch Shifter Specification

## 1. Status

This document defines the approved product direction and the technical questions that require a prototype.

It does not approve implementation. Complete the algorithm comparison before implementation starts.

## 2. Product definition

Load one local song, shift its pitch without changing its duration, preview the result, and download the result.

The tool must do this work on the user's device. It must not upload the audio.

## 3. Supported clients

Support current versions of these browsers:

- Chrome on Android, macOS, and Windows.
- Safari on iOS and macOS.

The tool must support narrow screens and desktop screens. The tool must also support keyboard use and 200 percent zoom.

## 4. Version 1 scope

Version 1 must:

- accept one local audio file;
- decode a format when the current browser supports that format;
- shift the audio from minus 12 through plus 12 semitones;
- use one-semitone steps;
- keep the original duration and tempo;
- play and pause the original or shifted audio;
- let the user seek within the audio;
- reset the shift to zero;
- export the complete shifted audio as a Waveform Audio File Format (WAV) file; and
- keep all audio processing local to the browser.

Version 1 must not:

- use a microphone;
- accept a streaming service, remote address, or shared link;
- change playback speed;
- provide an A-B loop;
- adjust pitch in cents;
- preserve embedded artwork or source metadata;
- claim that a detected key is certain; or
- use an external network service.

## 5. Main workflow

1. The user selects a local audio file.
2. The tool decodes the file into pulse-code modulation (PCM) audio.
3. The tool shows the file name and duration.
4. The user selects a semitone shift.
5. The tool processes the complete file.
6. The tool lets the user compare the original and shifted audio.
7. The user downloads the shifted audio as a WAV file.

Do not enable the shifted preview or download before processing succeeds.

Invalidate the previous shifted result after the user changes the source file or semitone value.

## 6. Pitch control

The semitone control is the primary control.

- Use a range from `-12` through `+12`.
- Use an integer step of one semitone.
- Show zero as the original pitch.
- Provide a direct reset action.
- Announce the selected value to assistive software.

Use this ratio for a shift of `n` semitones:

```text
ratio = 2^(n / 12)
```

Do not use simple resampling as a fallback. Simple resampling changes the pitch and duration together.

## 7. Preview and output

The shifted preview and the downloaded file must use the same processed PCM result.

Version 1 must export a 16-bit PCM WAV file. Preserve mono or stereo channel layout. Add the shift to the output file name. For example:

```text
example-shifted-minus-2.wav
example-shifted-plus-3.wav
```

Do not overwrite or modify the selected source file.

If processing can cause clipping, measure the rendered peak before export. Do not silently change the gain. Define the clipping response during the technical prototype.

## 8. Processing architecture

Use these independent components:

```text
Local file
    |
    v
Browser decoder -> PCM audio
    |                 |
    |                 +-> key analyser -> suggested key and confidence
    v
Pitch shifter -> shifted PCM
                       |
                       +-> preview player
                       +-> WAV encoder
                       +-> MP3 encoder
```

Run expensive offline processing in a Web Worker. Do not require an AudioWorklet because the tool does not process live input.

Keep the pitch shifter, key analyser, and output encoders behind separate interfaces. A later feature must not require a rewrite of the file loader or player.

## 9. WebAssembly and dependency policy

WebAssembly (Wasm) is permitted when it gives a material quality or performance benefit.

The deployed website must remain usable without a project build step. A required Wasm module and its loader must be local static assets.

For each external component:

- pin the exact upstream version and commit;
- store the applicable license and notice;
- record the upstream source address;
- record a cryptographic hash for each deployed artifact;
- document how to reproduce the artifact;
- do not load the component from a content delivery network; and
- fail clearly when the component cannot load.

Do not add a dependency only to avoid a small, testable local function.

## 10. Pitch-shifter prototype

Compare these candidates before selection:

| Candidate | Reason to test | Main concern |
| --- | --- | --- |
| Signalsmith Stretch | It is an MIT-licensed polyphonic C++ library with an official Wasm browser release. | Confirm offline output access and Safari behavior. |
| SoundTouchJS | It is an MPL-2.0 JavaScript library with offline processing support. | Confirm sound quality, performance, and Safari behavior. |

Do not select Rubber Band by default. Its GPL or commercial license adds obligations that this project has not accepted.

The prototype must compare:

- vocals;
- drums and other transient material;
- bass;
- acoustic instruments;
- dense mixes;
- mono and stereo input; and
- shifts of minus 12, minus 5, minus 2, plus 2, plus 5, and plus 12 semitones.

Use generated or clearly licensed audio in permanent tests. Do not commit commercial songs or personal audio.

Check these properties:

- the output duration matches the input duration within a defined tolerance;
- the pitch ratio is correct;
- stereo channels remain aligned;
- the result does not contain unexpected silence, clicks, repeated blocks, or missing tails;
- processing does not block the interface;
- cancellation leaves no downloadable result; and
- Chrome and Safari produce an acceptable result.

Use owner listening tests to select the algorithm. Automated signal tests do not prove musical quality.

## 11. Key recognition extension

Key recognition is a later feature. It supports the pitch-shifting workflow and does not replace direct semitone control.

Analyse the original PCM audio. A focused detector can:

1. downmix a copy for analysis;
2. divide the audio into overlapping frames;
3. calculate a frequency spectrum;
4. convert spectral energy into 12 pitch classes;
5. combine pitch-class profiles across the song; and
6. compare the result with major and minor key profiles.

Show the best key estimate and a confidence indicator. Show `Key uncertain` when the result is weak or ambiguous.

Do not automatically change the semitone value after key recognition. A later target-key control can calculate and propose a shift. The user must confirm that shift.

Prefer a small local detector over the complete Essentia.js package. Reconsider this decision only if the focused detector cannot meet the accepted accuracy target.

## 12. MP3 export extension

MP3 export is a later output adapter. It does not change the pitch-shifting algorithm.

The tool must encode the shifted PCM audio. It cannot preserve the compressed frames from an MP3 source.

Do not rely only on the browser's WebCodecs MP3 encoder. Codec support can differ between supported browsers. Evaluate a pinned local encoder if MP3 export becomes an approved requirement.

Keep WAV available as the dependable output format. Report MP3 encoder failure without removing a valid WAV result.

Define the MP3 bitrate, metadata behavior, encoder license, and cross-browser acceptance tests before implementation.

## 13. Failure behavior

Reject a file with a clear error when the browser cannot decode it.

Reject unsupported channel layouts or files that exceed the agreed processing limit. Do not start partial processing that appears complete.

Show progress only when the processing component provides meaningful progress data. Otherwise, show an indeterminate working state.

Let the user cancel processing. Remove all output from the cancelled operation.

Keep the selected source file available after a processing error when it is safe to retry.

Do not enable download after a decode, processing, or encoding error.

## 14. Privacy

Do not upload audio, analysis results, file names, or processing settings.

Do not add analytics or other network requests.

Release object addresses and large audio buffers when the user replaces a file or leaves the page.

## 15. Open decisions

Resolve these items before implementation:

- Select the public app name.
- Select the pitch-shifting algorithm after the prototype.
- Define the maximum duration and memory limit.
- Define supported channel counts and sample-rate limits.
- Define the clipping response.
- Define the duration tolerance for automated tests.
- Decide whether version 1 includes key recognition or reserves it for version 2.
- Decide when MP3 export becomes required.

## 16. References

- [Web Audio API](https://www.w3.org/TR/webaudio/)
- [WebAssembly Web API](https://www.w3.org/TR/wasm-web-api-1/)
- [WebCodecs](https://www.w3.org/TR/webcodecs/)
- [Signalsmith Stretch](https://github.com/Signalsmith-Audio/signalsmith-stretch)
- [SoundTouchJS](https://github.com/cutterbl/SoundTouchJS)
- [Essentia.js key extraction](https://mtg.github.io/essentia.js/docs/api/EssentiaExtractor.html)
