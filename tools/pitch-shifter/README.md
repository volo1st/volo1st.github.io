# Pitch shifter

Shift one local audio file by whole semitones while keeping its tempo and duration. Open `/tools/pitch-shifter/` through HTTPS for live shifted playback.

## Use

1. Select a file or drop it on the page.
2. Set a shift from -12 through +12 semitones. Reset returns to zero.
3. Use Play, Pause, and Seek to compare the sound. A pitch change preserves position.
4. In Advanced, choose WAV or MP3 output.
5. Press Export. Download becomes available after processing succeeds.

MP3 sources default to MP3 output; other sources default to WAV. Changing the file, pitch, or output format invalidates the previous result. After export, playback uses the same file object as the download. The source file is never modified.

Audio processing, file names, and settings stay in the browser. There is no microphone input, remote-link loader, key detection, or audio upload. Export does not preserve embedded artwork or source metadata. Large shifts and exposed vocals can produce audible artifacts.

## Decoded-file limits

The browser must support the input format. These limits apply after decoding:

| Item | Limit |
| --- | --- |
| Channels | Mono or stereo |
| Sample rate | 8–192 kHz |
| Duration | At most 30 minutes |
| Total channel samples | At most 33,554,432 across all channels |

The sample limit equals 128 MiB of 32-bit pulse-code modulation (PCM) data. All limits apply together. Long stereo files can exceed the sample limit before reaching 30 minutes.

## Output and clipping

Waveform Audio File Format (WAV) uses 16-bit PCM and preserves mono or stereo layout. MP3 uses the pinned local LAME encoder at 320 kbit/s. MP3 can contain a short codec delay; the encoder does not write gapless metadata. See [the dependency record](docs/DEPENDENCIES.md) for source, licenses, and reproduction steps.

Pitch processing preserves the input frame count. Encoded MP3 playback duration can include codec padding. Output names include the shift, such as `example-shifted-minus-2.wav`.

Keep the rendered level. Clamp only samples outside the encoder's output range. Do not apply a limiter, compressor, or whole-file gain adjustment. Statistics report the pre-encode peak and clipped-sample percentage. The completion notice reports clipping above 1 percent of channel samples.

## Playback and failures

Before export, a secure origin uses one AudioWorklet for all pitch values, including zero. This avoids an engine handoff at zero. If live playback is unavailable, report it and keep export available. Native original playback remains available at zero. After export, the common player can play the generated result.

Playback remains unavailable until decoding succeeds. Decode, processing, or encoding failures must leave no downloadable result. Keep the selected input for a safe retry after processing errors. Missing dependencies must fail clearly; do not substitute resampling or another pitch algorithm.

Run expensive export work in a Web Worker. Release copied live-preview buffers before export. Keep the interface responsive and disable conflicting actions while exporting. Use the existing working indicator; there is no user cancel control. Release object URLs, workers, and large buffers when replacing a file or leaving the page.

Apply the repository's audio-session recovery to Web Audio and media-element playback. See [the shared failure evidence and sequence](../guitar-strumming/docs/AUDIO.md). A missing or failed audio-session interface must not remove normal playback support.

## Source layout

| Source | Responsibility |
| --- | --- |
| `app.mjs`, `bootstrap.js`, `i18n.js` | File loading, controls, state, and translations |
| `live-preview.mjs`, `audio-session.mjs` | Live playback and speaker recovery |
| `worker-client.mjs`, `processing-worker.mjs` | Export worker lifecycle and output selection |
| `audio-processing.mjs` | Offline pitch processing |
| `wav.mjs`, `mp3.mjs` | Output encoding |
| `vendor/` | Pinned local dependencies, licenses, and build records |

Use Signalsmith Stretch's default preset. Try the faster WebAssembly build with single instruction, multiple data (SIMD) support, then the equivalent scalar build if setup fails. Keep one processing mode in the interface. The pitch ratio is `2^(semitones / 12)`; resampling alone also changes duration and is not a fallback.

## Verification

Run `./scripts/check.sh` from the repository root. The pitch tests check generated tones, duration, pitch ratio, stereo alignment, WAV clipping, MP3 encoding, interface state, and dependency hashes. Use generated or licensed audio in permanent tests. Do not commit commercial songs or private recordings.

Test iPhone and iPad performance through HTTPS. Plain HTTP on the local network produced misleading measurements during the initial iPhone tests. Record the secure-context state, device, operating system, browser, file properties, shift, engine, and timings. See [the recorded WebKit issue](https://bugs.webkit.org/show_bug.cgi?id=324968).

Signal tests do not establish musical quality. Owner listening tests selected the algorithm. On 5 October 2026, the owner confirmed iPhone MP3 output quality and performance. Keep the [listening evidence](docs/DEPENDENCIES.md#selection-evidence) with the dependency selection. After audio changes, check representative music, speakers and headphones, playback resume, background return, keyboard use, narrow screens, and 200 percent zoom.
