# Song Pitch Shifter Specification

## 1. Status

This document defines the completed version 1 product and engineering decisions.

The prototype, version 1 implementation, and MP3 export extension are complete.

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
3. The user selects a semitone shift.
4. The user compares the original and shifted audio with one playback control.
5. The user can change the output format in Advanced settings.
6. The tool creates the complete output file.
7. The Export action becomes the format-specific download.

Do not enable playback before decoding succeeds. Do not enable download before processing succeeds.

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

Use one playback control. On a secure origin, use one AudioWorklet path at all semitone values, including zero. This prevents an engine handoff when the pitch crosses zero. On an insecure origin, permit native original playback at zero and keep shifted playback unavailable. Let the user play, pause, seek, and change the semitone value while audio plays. Keep the playback position when the pitch value changes.

Before export, use the live AudioWorklet path for playback on a secure origin. After export, use the generated output for playback. This lets the user hear the exact downloadable result.

Do not provide the eight-second rendered preview. If live playback cannot start, report the failure and keep complete-file processing available. After processing, let the unified control play the generated output.

The complete-result player and the download must use the same generated file object.

Version 1 must export a 16-bit PCM WAV file. Preserve mono or stereo channel layout. Add the shift to the output file name. For example:

```text
example-shifted-minus-2.wav
example-shifted-plus-3.wav
```

Do not overwrite or modify the selected source file.

Measure the rendered sample peak before encoding. Preserve the rendered level. Clamp only samples that are outside the output range. Do not add a limiter, compressor, or complete-file gain adjustment.

Show the pre-encode peak and clipped-sample proportion in the processing statistics. Show the normal completion status when no more than 1 percent of channel samples are clipped. Show a clipping notice when the proportion is greater than 1 percent.

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

Run expensive offline processing in a Web Worker. Do not require AudioWorklet for export or original playback.

Use the official Signalsmith AudioWorklet wrapper for live file preview. Keep it separate from the offline export worker. Release its copied audio buffers before a complete-file export.

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

## 10. Pitch-shifter selection

The prototype compared these candidates:

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

Owner listening tests selected Signalsmith Stretch. The tests found that:

- Signalsmith Stretch had better detail and transient quality than SoundTouchJS.
- The official cheaper preset sounded equivalent to the default preset in the tested music.
- A manual 80/40 millisecond configuration was the fastest acceptable boundary, but it had audible distortion.
- Faster manual configurations sounded unacceptable across a detailed MP3 mix, an average MP3 backing track, and a compact-disc-quality WAV source.

Use the official Signalsmith Stretch default preset for version 1. Use the SIMD build when the browser supports it. Fall back to the equivalent scalar build when SIMD module setup fails.

Do not use a plain HTTP local-area-network address for performance tests on iOS or iPadOS. WebKit Enhanced Security can disable just-in-time compilation for JavaScript and Wasm on this type of origin. This behavior made the local iPhone prototype measurements much slower than production. It did not change the listening-test results.

Run device performance tests through HTTPS. Record the secure-context state, device, operating system, browser, file duration, sample rate, channel count, pitch shift, engine, total time, and pitch-processing time.

The owner tested the same 246-second, 48 kHz stereo file through the deployed HTTPS site. An iPhone 16 Pro completed the file in approximately 2 seconds. A Mac Studio with an M1 Max completed the file in 1.83 seconds. These measurements are evidence from one file on two devices. They are not performance guarantees.

Automated signal tests do not prove musical quality. Keep the listening-test evidence with this selection.

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

MP3 export is a complete output adapter. It does not change the pitch-shifting algorithm.

The tool must encode the shifted PCM audio. It cannot preserve the compressed frames from an MP3 source.

Use the pinned local `wasm-media-encoders` 0.7.0 wrapper and LAME encoder. Encode MP3 at 320 kbit/s. Do not make a runtime request for the encoder.

Keep WAV available. Default an MP3 source to MP3 output. Default every other source to WAV output. Changing the output format must invalidate an old result.

MP3 output can contain a short codec delay. It does not preserve source metadata. Record the encoder licences, source revisions, artifact hashes, and reproduction steps in the dependency record.

## 13. Failure behavior

Reject a file with a clear error when the browser cannot decode it.

Reject unsupported channel layouts or files that exceed the agreed processing limit. Do not start partial processing that appears complete.

Show progress only when the processing component provides meaningful progress data. Otherwise, show an indeterminate working state.

Do not add a progress bar or cancel control in version 1. Show an indeterminate one-to-three-dot working state on the Export action. Reconsider progress reporting only if representative HTTPS tests show a material wait.

If live shifted playback fails, keep original playback and complete-file processing available. Do not replace the live engine with a different pitch-shifting algorithm.

Keep the selected source file available after a processing error when it is safe to retry.

Do not enable download after a decode, processing, or encoding error.

## 14. Privacy

Do not upload audio, analysis results, file names, or processing settings.

Do not add analytics or other network requests.

Release object addresses and large audio buffers when the user replaces a file or leaves the page.

## 15. Version 1 decisions

- Use the public name `Pitch Shifter`.
- Use Signalsmith Stretch with its official default preset.
- Use a custom SIMD Wasm build and an equivalent scalar fallback.
- Accept mono or stereo audio only.
- Accept browser-decoded sample rates from 8 kHz through 192 kHz.
- Reject decoded audio with more than 33,554,432 total channel samples. This value is 128 MiB of 32-bit PCM.
- Reject audio longer than 30 minutes.
- Require output duration to match input duration within one sample frame.
- Preserve the rendered level and clamp only samples outside the output range. Report the pre-encode peak and clipped-sample proportion. Show a notice when more than 1 percent of channel samples are clipped.
- Keep key recognition for a later version.
- Provide WAV and 320 kbit/s MP3 export. Use pinned local LAME artifacts for MP3.
- Use one user-facing processing mode. Do not expose algorithm or performance settings.
- Use only play, pause, seek, and current semitone controls from the official real-time browser interface.
- Use one transport for original audio, live shifted audio, and the generated output.
- Let the pitch value select the playback source. Do not add a separate original-or-shifted selector.
- Keep pre-export playback in one AudioWorklet on a secure origin. Do not switch to a native audio element when the pitch crosses zero.
- Do not keep a separate rendered-preview workflow.
- Let the complete-file action change from Export to a format-specific download after processing succeeds.
- Invalidate the generated output after a source, pitch, or output-format change.
- Accept a file from the file picker or a page-wide file drop.
- Use native semantic controls with consistent custom styling.
- Show the selected filename on the file-picker button. Keep the file metadata separate, and let the same button replace the file.
- Put play or pause and the pitch controls on one compact row. On narrow screens, align play to the left, centre the pitch stepper, and align reset to the right. Show the semitone input as green text instead of a boxed field. Do not show a separate pitch label.
- Reserve the file-metadata line before file selection. Do not move the remaining controls when the metadata appears.
- Do not block the complete page while processing. Disable conflicting controls and show a working state on the action.
- Animate one to three dots on the Export action during processing. Keep the accessible label stable. Show three fixed dots when the user requests reduced motion.
- Put the output format in an Advanced section that is closed by default.
- Put processing measurements and the audio-engine explanation in separate sections that are closed by default.
- Do not mix live playback information with export timings. Before export, explain that processing statistics are not available.


## 16. References

- [Web Audio API](https://www.w3.org/TR/webaudio/)
- [WebAssembly Web API](https://www.w3.org/TR/wasm-web-api-1/)
- [WebKit issue 324968: Enhanced Security on plain HTTP origins](https://bugs.webkit.org/show_bug.cgi?id=324968)
- [WebCodecs](https://www.w3.org/TR/webcodecs/)
- [Signalsmith Stretch](https://github.com/Signalsmith-Audio/signalsmith-stretch)
- [SoundTouchJS](https://github.com/cutterbl/SoundTouchJS)
- [Essentia.js key extraction](https://mtg.github.io/essentia.js/docs/api/EssentiaExtractor.html)
