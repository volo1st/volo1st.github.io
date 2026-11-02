# App icon family

These icons use the shared music-app visual language.

- Use `#f4f1e8` for the background.
- Use `#173e30` for the mark.
- Use one abstract line or bar symbol.
- Keep the symbol clear at 32 pixels.

The Guitar strum machine and Pitch shifter use these icons for home-screen installation. The metronome and tuner icons are concepts. They do not indicate that those tools are available.

| File | Intended tool |
| --- | --- |
| `guitar-strum-machine-512.png` | Guitar strum machine |
| `metronome-512.png` | Metronome concept |
| `tuner-512.png` | Tuner concept |
| `pitch-key-512.png` | Pitch shifter; original song pitch and key concept |

The 180-pixel and 192-pixel guitar files are platform variants of the 512-pixel guitar icon.

## Consistency audit

Measured on 30 October 2026. All four source images have a 512 × 512 pixel canvas. They are opaque Portable Network Graphics (PNG) files with red, green, and blue (RGB) color channels. Every color is the approved background, mark, or an antialias blend between them. Canvas size and colors match. Inner size and visual weight vary.

| Icon | Symbol width × height, pixels | Margins: left / top / right / bottom, pixels | Foreground coverage |
| --- | --- | --- | --- |
| Guitar strum machine | 387 × 430 | 62 / 40 / 63 / 42 | 16.8% |
| Metronome | 307 × 290 | 103 / 110 / 102 / 112 | 20.5% |
| Tuner | 372 × 243 | 70 / 130 / 70 / 139 | 9.6% |
| Pitch shifter | 433 × 220 | 37 / 141 / 42 / 151 | 12.6% |

Symbol bounds include every pixel that differs from the exact background, including antialias pixels. Width and height include both edge pixels. Foreground coverage is the sum of each pixel's foreground blend fraction divided by the canvas area. It measures the amount of green. It does not measure perceived size.

The metronome occupies a smaller box but has the most green. The tuner has the least green. The guitar is tall. The pitch/key mark is wide. Equal canvas size does not produce equal symbol size or visual weight.

The guitar variants use the same colors. The 180-pixel image has a 136 × 151 pixel symbol and margins of 22 / 14 / 22 / 15 pixels. The 192-pixel image has a 145 × 161 pixel symbol and margins of 23 / 15 / 24 / 16 pixels. Both retain 16.8% foreground coverage. The proportions match the 512-pixel source within raster rounding.

See the [app icon comparison](../../style-guide/index.html#app-icons) at 128, 64, and 32 CSS pixels. Preserve aspect ratios. Review apparent size at 32 pixels before changing artwork. A shared inner-size rule has not been approved. The audit does not change the source images.


## Local size comparison

The [style guide comparison](../../style-guide/index.html#app-icons) now shows two candidate sets side by side. Each pair has 128-, 64-, and 32-pixel samples. The original icons and measurements remain in a disclosure below the comparison.

- `comparison/equal-bounds/` fits each symbol inside a centered 384 × 384 pixel square. The longest edge is 384 pixels. Preserve the aspect ratio. Do not stretch a symbol to fill both dimensions.
- `comparison/apparent/` uses individual uniform scales and small position adjustments. This is a proposed optical balance, not a measured guarantee of equal perceived size.

Both sets use the same 512 × 512 pixel canvas and exact palette as the originals. Direct area resampling preserves the existing symbols. No generated artwork is used. Edge antialiasing changes with scale. The installed-app icons and manifests still use the original files.

The apparent-size settings are relative to the original symbols. Positions refer to the center of each symbol's bounds on the 512-pixel canvas.

| Icon | Scale | Center, x / y | Resulting bounds, pixels | Foreground coverage |
| --- | --- | --- | --- | --- |
| Guitar strum machine | 86% | 256 / 260 | 334 × 370 | 12.4% |
| Metronome | 94% | 256 / 248 | 290 × 274 | 18.1% |
| Tuner | 112% | 256 / 256 | 418 × 274 | 12.1% |
| Pitch shifter | 98% | 248 / 256 | 426 × 216 | 12.1% |

These settings reduce the tall guitar and the dense metronome. They give the light tuner more space. They keep the wide pitch/key mark near its original size and move it slightly left. Visual review remains necessary. Equal foreground coverage is not the goal.

To regenerate both sets from the original files, run this command from the repository root:

```sh
node scripts/generate-icon-comparison.js
```

The script uses only Node.js standard modules. It accepts the current unfiltered, opaque RGB PNG source format. It rejects an unsupported format, a color outside the palette, or a candidate that reaches the canvas edge. It writes only the comparison directories. After regeneration, refresh the image hashes in the guide and run `./scripts/check.sh`.

This comparison is local for owner review. Do not deploy it or replace the installed-app icons before a set is selected.
