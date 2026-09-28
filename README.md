# Vincent's Website

This repository contains Vincent's public website and static browser tools. GitHub Pages hosts the website.

The current home page is a tools directory. The long-term plan will make the home page a public personal introduction and portfolio.

See [`website-roadmap.md`](website-roadmap.md) for the product direction and delivery phases.

## Tools

- [CSV to ABA Converter version 1](tools/csv2aba/) is the current fallback.
- [CSV to ABA Converter version 2](tools/csv2aba-v2/) is ready for an operator trial.
- [Chinese-English String Sorter](tools/song_order/) sorts text into a numbered list.
- [Guitar Strumming Backing Track](tools/guitar-strumming/) makes a looping guitar backing track from plain-text input. The home page does not link to this tool yet.

The guitar tool can put the complete source in a share URL. Anyone who receives the URL can read the source. A browser sends the URL query to the website host when it opens the link. A URL-shortener service also receives the URL. A generated share URL must not exceed 750 characters. Decoded source must not exceed 65,536 UTF-8 bytes.

The guitar tool includes a local catalog of reviewed practice exercises. The catalog can include a short user transcription when it contains only chord and rhythm teaching data and has a clear unofficial notice. It does not include lyrics, melody notation, audio, or artwork. A preset does not make a network request. A preset URL uses a stable versioned slug. Published preset source does not change. A source revision uses a new slug.

The guitar source requires one `tempo-ramp:` directive. Use `off` to keep a fixed tempo. Use a value such as `+5/2/120` to increase the tempo by 5 beats per minute after every 2 completed loops until it reaches 120 beats per minute. The ramp supports only increasing tempo. It applies changes at loop boundaries.

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
