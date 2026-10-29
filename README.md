# volo1st's website

This repository contains volo1st's public website and static browser tools. GitHub Pages hosts the website.

The home page is volo1st's public introduction. It links to the [Code](code/), [Sound](sound/), and [Music](music/) sections. The tools directory is available at [`/tools/`](tools/).

See [`plan.md`](plan.md) for current actions, product direction, and delivery phases.

The [UI style guide](style-guide/) demonstrates the shared design and isolated page examples. The [HTML and CSS audit](docs/ui-audit.md) records the original differences and migration boundaries. Open `style-guide/index.html` directly in a browser. The guide needs no build step, app engine, or server. It stores no input and reads no selected file. Its action buttons show visual states only. Maintained pages and examples load `assets/ui.css`. Use its classes for common typography, layout, controls, notices, tables, and summaries. Keep specialized displays and page composition in local stylesheets. The guide is public if deployed; `noindex` is not access control.

Each maintained page has a `data-page` root on its body. Scope local selectors with `:where([data-page="page-name"])`. Use the same root in its specimen. Keep shared selectors in `site-shell.css` and `ui.css` global. Use `ui-small` for supporting text size and `ui-muted` for quieter text color. Combine the classes when both are needed. Use `ui-fineprint` for smaller notes. Add `ui-muted ui-muted--soft` for quiet notes on page, panel, or subtle reading surfaces.

Use sentence case for generic labels, headings, and descriptive tool names. Preserve proper names and acronyms. Keep English fallback text, catalogs, metadata, and app manifest names consistent. Current tools use a parent link and the full English tool name. The guide's [page-header section](style-guide/#headers) shows the accepted layout and links to the working tools. Use `.ui-tool-header` for shared header spacing and alignment. The header uses static HTML and works without JavaScript.

Put every breadcrumb in `.ui-context-row`, including pages without language controls. The row centers its contents and reserves `--ui-context-min-height`: 1.75rem for wide screens with a fine pointer and hover, or 2.75rem otherwise. Both language variants use the same token. Keep this as a minimum so wrapping and zoom can expand the row. Do not add empty language controls or page-specific height fixes.

The Sound section links to Studio, [Room acoustics](sound/room-acoustics/), and [Live sound](sound/live-sound/). Room acoustics and Live sound have English placeholder pages. Both pages state that examples are coming soon. They do not list prices or confirm service availability.

## Studio rates

The [studio index](studio/) shows the studio name, rates link, and studio social links. The [studio rates page](studio/rates/) lists the 2026 rates in English and Simplified Chinese. The Sound section links to the studio index. It uses the existing site language preference and stores no enquiry data. Enquiries use external studio social profiles.

Update rates and both language catalogs in `studio/rates/i18n.js`. Keep the English fallback text in `studio/rates/index.html` in sync. Refresh content hashes in the HTML after asset changes. Run the repository check before release.

Keep service headings as `h2` elements with the shared `ui-heading` style. Put the heading and rate on the first grid row. Descriptions and notes use the full width below it. Use `ui-small` for descriptions and `ui-fineprint ui-muted ui-muted--soft` for notes. Leave 1.5rem below the heading row and 1rem between descriptions and notes. Use the short package labels `Songs & albums` and `By quote`; keep the full description below. Exceptionally narrow layouts stack the rate. Use plain note markers and associate rates with their notes through `aria-describedby`. Bind translated rate text to its span so a language change preserves the marker. Keep the static studio specimen current.

## Tools

- [CSV to ABA converter](tools/csv2aba-v2/) is the current converter. The former address redirects to it. The owner confirmed successful use in the established Commonwealth Bank of Australia (CBA) workflow on 29 October 2026.
- The retired converter address at `tools/csv2aba-legacy/` also redirects to the current converter. Git history retains the former interface.
- [Guitar strum machine](tools/guitar-strumming/) makes a looping guitar backing track from plain-text input. The tools directory links to this tool.
- [Pitch shifter](tools/pitch-shifter/) shifts a local mono or stereo song without changing its duration. One transport compares the original and shifted audio. The tool exports a 16-bit pulse-code modulation (PCM) Waveform Audio File Format (WAV) file or a 320 kbit/s MP3 file.

The home page uses English. The tools directory, version 2 converter, Guitar strum machine, and Pitch shifter support English and Simplified Chinese. The site stores the selected tool language in browser local storage. A language change does not change guitar arrangement text, playback state, share-link data, or selected audio.

The maintained pages use `assets/site-shell.css` for shared identity, breadcrumb, language control, and design tokens. The home page uses `assets/home.css` for its namecard layout. The public section indexes use `assets/section-index.css` for their content lists. The shared shell maps a semantic `data-domain` value to each tool accent. The original pixel-art `V` block is the browser icon. The unchanged legacy conversion script remains a compatibility-test fixture.

The home page is static. It uses HTML and local CSS without JavaScript.

The home page uses local SVG paths from Simple Icons version 16 for its social links. The paths use the CC0 1.0 Simple Icons collection. Each mark renders in the page text color. The page does not request an icon font, script, or image from a third party.

Maintained HTML pages reference interface assets with a short SHA-256 content hash. Update the hash when a CSS or JavaScript file changes. The repository check rejects a stale hash.

Pitch shifter keeps audio on the user's device. It does not upload the file or send audio over the network. It supports files that the browser can decode, mono or stereo audio, sample rates from 8 kHz through 192 kHz, a maximum duration of 30 minutes, and up to 128 MiB of decoded 32-bit PCM. It exports 16-bit PCM WAV or 320 kbit/s MP3. An MP3 source defaults to MP3 output. Every other source defaults to WAV output. The encoder preserves the rendered level and clamps samples outside the output range. Processing statistics show the pre-encode peak and clipped-sample proportion. MP3 export can add a short codec delay. The tool does not preserve source metadata. On iOS and iPadOS, the tool uses the optional Audio Session API to recover silent built-in-speaker output. Other browsers use the normal playback path. The tool uses pinned local Signalsmith Stretch and LAME WebAssembly (Wasm) modules. See its [dependency record](tools/pitch-shifter/docs/DEPENDENCIES.md) for source commits, licences, artifact hashes, and reproduction steps.

Use HTTPS for Pitch shifter performance tests on iOS and iPadOS. WebKit Enhanced Security can disable just-in-time compilation for JavaScript and Wasm on a plain HTTP local-area-network origin. This restriction can make local tests much slower than the deployed site. Record `window.isSecureContext` with each device measurement. See [WebKit issue 324968](https://bugs.webkit.org/show_bug.cgi?id=324968).

The guitar tool can put the complete source in a share URL. Anyone who receives the URL can read the source. A browser sends the URL query to the website host when it opens the link. A URL-shortener service also receives the URL. A generated share URL must not exceed 750 characters. Decoded source must not exceed 65,536 UTF-8 bytes.

The guitar page has a generic Open Graph preview. The preview does not include a fixed Open Graph URL, so an arrangement query remains in the shared link. Static metadata cannot show a different preview for each arrangement. Run `node scripts/generate-share-card.js` to regenerate the preview image.

The Guitar strum machine and Pitch shifter provide local home-screen icons and web app manifests. Each installed app starts at its normal tool address. Installation does not add offline support. The metronome and tuner icons in `assets/app-icons/` are concepts. See the [app icon comparison](style-guide/#app-icons) for equal-size samples and the [icon audit](assets/app-icons/README.md) for measured dimensions, margins, and colors.

The guitar tool includes a local catalog of reviewed practice exercises. The catalog can include a short user transcription when it contains only chord and rhythm teaching data and has a clear unofficial notice. It does not include lyrics, melody notation, audio, or artwork. A preset does not make a network request. A preset URL uses a stable versioned slug. Before the owner declares version 1.0.0, preset sources can change in place. After that release, published preset source does not change. A source revision then uses a new slug.

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

For text, link, placeholder-page, and simple style changes, use this script and review the diff. Do not install browser-test tooling for these changes. If a browser is available, use a short manual review. Record an unavailable browser review without blocking the change. See `AGENTS.md` for the test rules for functional and financial-file changes.

## Deployment and recovery

The repository is `volo1st/volo1st.github.io`. The site address is `https://volo1st.com/`. The tracked `CNAME` file contains `volo1st.com`.

Before deployment, run `./scripts/check.sh` and review the complete diff. Commit the approved changes. The owner confirmed the publishing source on 13 October 2026: GitHub Settings → Pages uses “Deploy from a branch”, branch `master`, and folder `/(root)`. Push the reviewed commits with `git push origin master`. This updates the live site. Other branches do not publish through this source setting. See [GitHub's publishing-source instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

After deployment, confirm that the Pages workflow succeeded. Open the home page, the changed pages, and the tools directory through the public address. For an interface change, check keyboard use, visible focus, a narrow screen, and 200 percent zoom. For a tool change, run its representative workflow with invented data.

To recover from a faulty change, preserve any local work first. Use `git log --oneline` to identify the faulty commit and the last working revision. Review the faulty commit with `git show COMMIT`. For an ordinary commit, use `git revert COMMIT` to create a reversal that preserves history. Replace `COMMIT` with the reviewed commit identifier. Review related changes before reverting more than one commit. A merge commit needs a separate review. Run the repository check, review the reversal, and deploy it through the confirmed publishing source. Then repeat the public-page checks.

Git history preserves committed source and local assets. It does not preserve GitHub account access, Pages settings, domain registration, or Domain Name System (DNS) provider settings. Keep account recovery details outside this public repository.

Domain recovery needs access to GitHub and the DNS provider. Restore the custom domain in Settings → Pages and the DNS records at the provider. The owner confirmed on 13 October 2026 that Squarespace manages DNS for `volo1st.com`. Set the GitHub Pages custom domain to `volo1st.com`. Use the current GitHub instructions below to restore the required DNS records in Squarespace. Provider-specific record values and account recovery details are not stored here. Follow [GitHub's custom-domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site). The `CNAME` file alone is not a complete record of the hosting and DNS settings.

## License status

No repository-wide license has been selected. Third-party components retain their own license files and notices. See the [Pitch shifter dependency record](tools/pitch-shifter/docs/DEPENDENCIES.md) for its bundled components.
