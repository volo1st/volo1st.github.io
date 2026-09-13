# Useful Browser Tools

This repository contains small tools that run in a browser. GitHub Pages hosts the website.

## Tools

- [CSV to ABA Converter version 1](tools/csv2aba/) is the current fallback.
- [CSV to ABA Converter version 2](tools/csv2aba-v2/) is ready for an operator trial.
- [Chinese-English String Sorter](tools/song_order/) sorts text into a numbered list.

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
