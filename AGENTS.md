# Repository Instructions

## Scope

These instructions apply to all files in this repository.

## Project purpose

This repository contains static browser tools. GitHub Pages hosts the site.

- `index.html` is the tools home page.
- `tools/csv2aba/` contains the CSV-to-ABA converter.
- `tools/song_order/` contains the Chinese-English text sorter.

Keep the site usable without a build step unless the task requires a build system.

## Writing standard

Use ASD-STE100-style controlled English for user text and project documents.

- Use short, direct sentences.
- Give one main instruction in each sentence.
- Use active voice when possible.
- Use the same term for the same item.
- Define an abbreviation at its first use.
- Do not use an abbreviation if it is not necessary.
- Avoid idioms, slang, vague words, and unnecessary jargon.
- Put conditions before the action when this makes the instruction clearer.
- Use lists and tables only when they make the information easier to use.

Do not claim formal ASD-STE100 compliance unless a qualified review confirms it. Describe the text as “ASD-STE100-style” or “controlled English.”

## Safety rules for the ABA converter

Treat the CSV-to-ABA converter as financial-file software.

- Do not use real names, bank accounts, payment data, user IDs, or confidential bank documents in source, tests, examples, logs, or screenshots.
- Use invented data in all fixtures and examples.
- Do not make silent corrections to payment data.
- Reject invalid or ambiguous data with a row and field error.
- Do not silently truncate a fixed-width field.
- Use integer arithmetic for money. Do not use binary floating-point arithmetic.
- Do not enable download until validation and conversion are successful.
- Keep old output unavailable after an input change or an error.
- Keep the prototype warning until the release gate in `initial-audit-action-plan.md` is complete.
- Confirm bank-specific behavior with an authoritative source before implementation.
- Do not state that a generated file is bank-approved without recorded validation evidence.

Preserve the required ABA record width. Test byte length as well as character length when the permitted character set can affect encoding.

## Source rules

- Prefer plain HTML, CSS, and JavaScript.
- Keep JavaScript free of implicit global variables.
- Use event listeners instead of inline event handlers.
- Use semantic HTML controls and explicit labels.
- Make status changes available to assistive software.
- Support narrow screens and 200 percent zoom.
- Preserve user input unless a documented rule permits its removal.
- Report a missing third-party dependency. Do not silently change the result.
- Avoid a new external dependency when a small, tested local solution is sufficient.
- If an external script is necessary, pin its version and use Subresource Integrity when the host supports it.

## Tests and checks

Run checks that are relevant to each change.

The repository does not yet have a complete test system. At minimum, use these checks:

```sh
node --check tools/csv2aba/scripts.js
git diff --check
```

For ABA changes, also test:

- quoted CSV values;
- LF and CRLF line ends;
- byte order mark input;
- empty and incomplete rows;
- invalid, negative, zero, fractional-cent, and limit amounts;
- minimum and maximum field lengths;
- unsupported characters;
- record and total overflow;
- exact record byte lengths;
- error recovery; and
- download state.

For interface changes, test keyboard use, visible focus, narrow screens, and 200 percent zoom.

Add permanent automated tests when a change introduces behavior that can regress.

## Documentation and work tracking

- Use `initial-audit-report.md` as the record of the initial repository condition.
- Use `initial-audit-action-plan.md` as the single source of truth for audit work.
- Update a checkbox only after its completion test passes.
- Add evidence below the applicable checkbox when this is useful.
- Record a rejected or changed action in the decision log.
- Update the README when a change affects setup, support, privacy, limits, tests, or deployment.

## Change discipline

- Make the smallest change that fully solves the task.
- Preserve unrelated user changes.
- Do not commit generated files or confidential data.
- Do not add a build system, framework, analytics service, or network request without a clear need.
- Explain a change in user-visible behavior.
- State the checks that you ran and the checks that you could not run.
