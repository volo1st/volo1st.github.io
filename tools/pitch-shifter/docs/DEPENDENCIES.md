# Pitch Shifter dependencies

Pitch Shifter uses three local Signalsmith Stretch modules and one local LAME MP3 encoder. The page does not request code from a third party. It requests the MP3 Wasm file from the same site only when the user selects MP3 output.

## Pinned source

| Component | Source | Commit | Licence |
| --- | --- | --- | --- |
| Signalsmith Stretch | <https://github.com/Signalsmith-Audio/signalsmith-stretch> | `a670068d9aeb64913331d5cc29337b19a457a7df` | MIT |
| Signalsmith Linear | Signalsmith Stretch Git submodule | `de55e6a50ffcf6f8f43f649692d94691c7025151` | MIT |
| Signalsmith build tool | <https://github.com/emscripten-core/emsdk> | Emscripten 6.0.10 | See the Emscripten source distribution |
| wasm-media-encoders | <https://github.com/arseneyr/wasm-media-encoders> | Package 0.7.0; commit `4a45333baadbab312d1cc0911151dfad23157c51` | MIT |
| LAME | <https://github.com/arseneyr/lame> | `98db548e8e851defbba3184125ce10725355c332` | GNU Library General Public License 2.0 |
| MP3 build tool | <https://github.com/emscripten-core/emsdk> | Emscripten 2.0.8 | See the Emscripten source distribution |

The Signalsmith directory contains its two MIT licences. The `wasm-media-encoders` directory contains the wrapper MIT licence and the complete LAME licence. It also contains the exact LAME source archive, C bridge, and Makefile used by the upstream build.

## Deployed artifacts

| File | SHA-256 |
| --- | --- |
| `SignalsmithStretchScalar.mjs` | `7349f115b3d694b769094debea2df4996f93ab027fe4627fefc841bb9f0a33e1` |
| `SignalsmithStretchSimd.mjs` | `d8556ea43ff1e82b113994f64129fdb8ccaf86cc64d17dc1b6c11ee107e1ac93` |
| `SignalsmithStretchRealtime.mjs` | `97530b11d5bc01015af4cde40d6aa55ff10c40aa1294ca4c8c5762027d517a46` |

All three files contain their Wasm binary. The scalar file supports browsers without Wasm single instruction, multiple data (SIMD). The SIMD file adds the Emscripten `-msimd128` option. The JavaScript worker selects the SIMD file first and uses the scalar file only when SIMD module setup fails.

The real-time file is the unchanged `web/release/SignalsmithStretch.mjs` artifact from the pinned Signalsmith Stretch commit. It supplies the official AudioWorklet interface for live preview. The offline worker does not use this file.

### MP3 encoder

| File | SHA-256 |
| --- | --- |
| `WasmMediaEncoder.min.js` | `dd4e17abf5377dfecc726d6ec5e7b72dab01cf3522974278e5347f4e68480fb3` |
| `mp3.wasm` | `85e81719250b9a667b1258143f689dda70e3e57a7e7c29ab0b4cef65c8f6eb9a` |
| `LICENSE.txt` | `7f766c19bc26ca14d9dad1bf102211f12b0a5c139f66e1132a9867fcfa04bdf0` |
| `LICENSE-LAME.txt` | `bfe4a52dc4645385f356a8e83cc54216a293e3b6f1cb4f79f5fc0277abf937fd` |
| `source/lame-98db548e8e851defbba3184125ce10725355c332.tar.gz` | `ed3a6fa3ff2a9780552fa14c1228d3cd006f2e396128a62212617e387e2af996` |
| `source/lame_enc.c` | `a962f71f7f568d6bf54fd2663b05655b624fbd94585e98daf70575373e35bf3a` |
| `source/Makefile` | `d5583bebc1ebaf4322b4d315646f9202823044911a72cc25347e12f1accc8c5d` |

The JavaScript and Wasm artifacts are unchanged files from the `wasm-media-encoders` 0.7.0 npm package. The npm archive SHA-512 integrity value is `sha512-Sp4wUasgxOK/IFfNhpon6LQQgYGwtpxyV4isjGIe1rvhnJL3w2KYr4f+CdqDNtGPDcgCDRY+uBanVfSx6Si0WQ==`.

The application calls `createEncoder` with the pinned local Wasm file. It does not call the convenience function that uses unpkg. The encoder uses LAME at a constant 320 kbit/s. It accepts mono or stereo PCM. It resamples to 32 kHz, 44.1 kHz, or 48 kHz when necessary.

The encoder does not write a Xing or LAME header. The downloaded file can contain one short MP3 frame of encoder delay and padding. A test with the 246-second reference track produced a file that was 0.024 seconds longer than the decoded input.

## Reproduction

1. Install Emscripten 6.0.10.
2. Check out the Signalsmith Stretch commit in the table.
3. Initialize its Signalsmith Linear submodule at the commit in the table.
4. Copy `web/release/SignalsmithStretch.mjs` to `SignalsmithStretchRealtime.mjs`.
5. Run `build.sh` with the Emscripten C++ compiler, the Signalsmith Stretch checkout, and an output directory.
6. Compare the three SHA-256 hashes with the table.

Example:

```sh
./build.sh /path/to/emsdk/upstream/emscripten/em++ /path/to/signalsmith-stretch /tmp/signalsmith-output
```

The script uses these common compiler options:

```text
-O3 -ffast-math -fno-exceptions -fno-rtti
```

The SIMD build also uses `-msimd128`.

### MP3 reproduction

1. Install Emscripten 2.0.8 and Node.js 20.
2. Check out `wasm-media-encoders` and LAME at the commits in the table.
3. Put the LAME checkout at `src/wasm/lame/lame-src`.
4. Run `make prod` in the `wasm-media-encoders` checkout.
5. Compare `dist/umd/WasmMediaEncoder.min.js` and `wasm/mp3.wasm` with the artifact hashes in this file.

The local source directory supplies the LAME source and the build files that control the LAME Wasm compilation. The complete wrapper source is available at the pinned `wasm-media-encoders` commit.

## Selection evidence

Owner listening tests used vocals, bass, drums, full mixes, and sources of different quality. Signalsmith Stretch preserved detail and transients better than SoundTouchJS. The official cheaper preset did not have a material audible difference from the default preset in these tests.

Manual settings faster than an 80/40 millisecond block and interval boundary sounded unacceptable. The 80/40 setting also had audible distortion. The production tool uses the official default preset. The reference high-quality MP3 processed in 2.6 seconds in the accepted owner test.

The 0.7.0 MP3 encoder encoded the 246-second, 48 kHz stereo reference track at 320 kbit/s in 5.27 seconds on the development host. This is 46.8 times real time. FFmpeg 6.1.1 decoded the result without an error.
