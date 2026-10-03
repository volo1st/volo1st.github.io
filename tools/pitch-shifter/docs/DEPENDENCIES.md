# Pitch Shifter dependencies

Pitch Shifter uses three local Signalsmith Stretch modules. The page does not request code from a third party.

## Pinned source

| Component | Source | Commit | Licence |
| --- | --- | --- | --- |
| Signalsmith Stretch | <https://github.com/Signalsmith-Audio/signalsmith-stretch> | `a670068d9aeb64913331d5cc29337b19a457a7df` | MIT |
| Signalsmith Linear | Signalsmith Stretch Git submodule | `de55e6a50ffcf6f8f43f649692d94691c7025151` | MIT |
| Emscripten | <https://github.com/emscripten-core/emsdk> | Version 6.0.10 | See the Emscripten source distribution |

The local `LICENSE.txt` and `LICENSE-signalsmith-linear.txt` files contain the two library licences.

## Deployed artifacts

| File | SHA-256 |
| --- | --- |
| `SignalsmithStretchScalar.mjs` | `7349f115b3d694b769094debea2df4996f93ab027fe4627fefc841bb9f0a33e1` |
| `SignalsmithStretchSimd.mjs` | `d8556ea43ff1e82b113994f64129fdb8ccaf86cc64d17dc1b6c11ee107e1ac93` |
| `SignalsmithStretchRealtime.mjs` | `97530b11d5bc01015af4cde40d6aa55ff10c40aa1294ca4c8c5762027d517a46` |

All three files contain their Wasm binary. The scalar file supports browsers without Wasm single instruction, multiple data (SIMD). The SIMD file adds the Emscripten `-msimd128` option. The JavaScript worker selects the SIMD file first and uses the scalar file only when SIMD module setup fails.

The real-time file is the unchanged `web/release/SignalsmithStretch.mjs` artifact from the pinned Signalsmith Stretch commit. It supplies the official AudioWorklet interface for live preview. The offline worker does not use this file.

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

## Selection evidence

Owner listening tests used vocals, bass, drums, full mixes, and sources of different quality. Signalsmith Stretch preserved detail and transients better than SoundTouchJS. The official cheaper preset did not have a material audible difference from the default preset in these tests.

Manual settings faster than an 80/40 millisecond block and interval boundary sounded unacceptable. The 80/40 setting also had audible distortion. The production tool uses the official cheaper preset to keep a quality margin.
