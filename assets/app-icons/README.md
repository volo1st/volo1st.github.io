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
