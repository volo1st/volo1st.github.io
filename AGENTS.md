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
- Keep version 1 at `tools/csv2aba/` unchanged unless a critical fix is necessary.
- Develop the safer converter at `tools/csv2aba-v2/`.
- For known valid input, version 2 must make the same payment data as version 1.
- Version 2 must reject invalid or ambiguous input with a clear error.
- Confirm bank-specific behavior with an authoritative source before implementation.
- Do not state that a generated file is bank-approved without recorded validation evidence.

Version 1 has operational evidence. CBA has accepted files from the current monthly payment process for nearly one year. This evidence applies only to that process. It does not prove that all input or settings are valid.

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

## Work packages

Complete one work package at a time. Do not start another package until the current package is complete or blocked.

For each package, use this sequence:

1. Inspect the applicable source and current state.
2. State the purpose, requirements, and failure behavior.
3. Check the design against current engineering practice for this purpose.
4. Prefer authoritative primary sources when external facts are necessary.
5. Record important decisions, tradeoffs, and accepted risks before implementation.
6. Make the repository changes.
7. Run applicable static checks and safe tests.
8. Review the complete diff.
9. Get approval before a destructive or system-level change.
10. Apply an approved system change from the correct environment.
11. Verify the result and representative clients.
12. Record completion evidence in the project source of truth.
13. Commit the complete package.

Prefer a clear and safe failure state to an incomplete function that appears to work.

Do not apply a general practice until you check the actual use and failure behavior.

Stop the package when a required approval, fact, or test is not available. Record the blocker. Do not bypass the blocker by starting an unrelated package.

Do not stop for optional evidence when the package does not depend on it. Record the missing evidence and its future use.
