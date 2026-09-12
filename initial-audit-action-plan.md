# Initial Audit Action Plan

## 1. Document data

| Item | Value |
| --- | --- |
| Created | 12 September 2026 |
| Source report | [`initial-audit-report.md`](initial-audit-report.md) |
| Purpose | Track all work from the initial audit |

## 2. Use of this plan

This file is the single source of truth for audit work.

- Keep an item clear until its completion test passes.
- Add the commit, test, or decision below the item.
- If you do not do an item, keep it clear. Record the owner, date, and reason in the decision log.
- Keep version 1 available while you develop and trial version 2.

## Phase 0: Record the baseline and control the rollout

### Current support

- [ ] Record the current use of version 1 for monthly teacher payments through CBA.
  - Completion test: The README states the supported process and its limits.
- [x] Keep version 1 at `/tools/csv2aba/` as the fallback.
- [x] Build version 2 at `/tools/csv2aba-v2/`.
  - Evidence: Version 2 has independent conversion and interface files. Characterization tests compare valid version 2 output with version 1.
- [x] Keep version 2 out of the main tools list during the first trial.

### Bank rules

- [ ] Get the current ABA rules from CBA when they are available.
  - Include source identity, trace data, transaction codes, balancing records, totals, character encoding, line ends, file names, and limits.
- [ ] Record each confirmed rule in the repository.
  - Completion test: Each output field has a bank rule or an approved product decision.
- [ ] Ask the person who submits the files to confirm the recorded process.
- [ ] Add one anonymized CBA-accepted CSV and ABA pair when it is available.
  - Completion test: The fixture contains invented or anonymized data and has no confidential values.

### Phase gate

- [x] Record the current source revision as the version 1 baseline.
  - Evidence: Commit `7446b26` records the source and the agreed rollout plan.
- [ ] For known valid input, require version 2 to make the same payment data as version 1.
- [ ] Permit version 2 to change only invalid or ambiguous behavior. It must show an error for that input.

## Phase 1: Make the ABA converter correct

### Source data

- [ ] Remove the fixed `CBA`, `Meya`, and `000000` values.
- [ ] Add settings for institution, user name, user ID, entry description, trace BSB, trace account, and remitter name.
- [ ] Check all settings before conversion.
- [ ] Use the confirmed source account for trace data. Do not use recipient data for trace data.
  - Completion test: A test shows different recipient and trace values in the correct fields.

### Amounts

- [x] Convert decimal text directly to integer cents. Do not use binary floating-point calculations.
- [x] Define the permitted currency symbol, separators, decimal places, and rounding rule.
  - Evidence: `tools/csv2aba-v2/README.md` records the accepted syntax. Version 2 rejects fractional cents instead of rounding them.
- [x] Reject an empty, non-numeric, zero, negative, fractional-cent, or excessive amount.
- [x] Check each amount, total amount, and record count for overflow.
  - Completion test: Tests cover `abc`, `-1.00`, `0`, `1.005`, separators, and all limit values.

### CSV data

- [x] Use a tested CSV reader.
  - Evidence: Version 2 uses a strict local state-machine reader. Automated tests cover its accepted syntax and failure behavior.
- [x] Support quoted commas, escaped quotation marks, LF and CRLF line ends, byte order mark (BOM) input, and blank lines.
- [x] Check for missing, duplicate, empty, and unexpected headers.
- [x] Keep the source row number for each record.
  - Completion test: `"Smith, Jane"` stays in one Name field. It does not move other values.

### ABA fields

- [ ] Check the BSB, account, name, reference, remitter, and all source settings.
- [ ] Check required values, permitted characters, field lengths, amount limits, total limits, and record limits.
- [ ] Reject an incomplete row. Ignore only a fully blank row when this is the approved rule.
- [ ] Reject a long field or show an approved truncation rule. Do not silently cut data.
- [ ] Show the row and field for each error.
  - Completion test: Invalid data cannot enter an ABA record.

### File construction

- [ ] Construct records only from checked and typed data.
- [ ] Keep the 120-character check for every record.
- [ ] Use the confirmed encoding, line ends, balancing rule, transaction code, and total rules.
- [ ] Prevent an unsupported character from changing the byte length.
  - Completion test: Approved test data produces an exact match with reviewed ABA sample files.

## Phase 2: Make the converter safe to use

### Error control

- [x] Remove the undeclared `abaContent` variable.
- [x] Keep document object model (DOM) variables in a valid scope.
- [x] Catch file-read and conversion errors.
- [x] Clear old output after an input change or an error.
- [x] Keep Download disabled until a new conversion is successful.
- [x] Prevent download of empty, old, `undefined`, or invalid data.
- [x] Make ABA output read-only.
  - Completion test: Each error leaves no downloadable file and gives one clear message.

### User information

- [ ] Show clear information, warning, error, and success messages.
- [ ] Show all applicable row and field errors.
- [ ] Show the payment count and total before download.
- [ ] Tell users that conversion occurs in their browser.
- [ ] Add a safe example CSV file. Use invented data only.

## Phase 3: Prove ABA converter quality

### Automated tests

- [x] Add a small JavaScript test system.
- [ ] Test CSV input, amount conversion, field checks, record construction, totals, file names, and interface states.
- [ ] Test each critical and high risk in the audit report.
- [ ] Test minimum and maximum values, unsupported characters, byte lengths, and overflow.
- [ ] Add reviewed ABA sample files. Use invented data only.

### Browser and accessibility tests

- [ ] Test upload, paste, conversion, error recovery, second conversion, and download.
- [ ] Test current main desktop and mobile browsers.
- [ ] Test keyboard use, screen-reader use, HTML, and accessibility rules.

### Continuous integration

- [ ] Add format, lint, syntax, test, HTML, accessibility, and internal-link checks to continuous integration (CI).
- [ ] Document the checks that must pass before deployment.

### Trial and release gate

- [ ] Ask the current operator to compare version 1 and version 2 payment counts, totals, records, and CBA upload results.
- [ ] Run the comparison for multiple monthly payment cycles.
- [ ] Record the date, result, and limits. Do not store confidential payment data.
- [ ] Get an independent review of amount calculations and fixed-width records.
- [ ] Make version 2 the default only after the trial is successful.
- [ ] Keep version 1 for an agreed fallback period after version 2 becomes the default.

## Phase 4: Improve accessibility and screen-size support

### All pages

- [ ] Add viewport metadata.
- [ ] Add consistent text, space, focus styles, navigation, and responsive page widths.
- [ ] Check headings, page language, color contrast, zoom, and keyboard focus.

### ABA converter

- [ ] Replace the layout table with a responsive layout.
- [ ] Add a label and help text to each input, output, and button.
- [ ] Add live status semantics for assistive software.
- [ ] Use text or symbols with color for each status.
- [ ] Remove the comma between textarea attributes.
- [ ] Make the page usable on a narrow screen and at 200 percent zoom.
- [ ] Add a caption and correct headers to the example table.

### Text sorter

- [ ] Add a clear label for the input and output.
- [ ] Make output changes available to assistive software.
- [ ] Test the mobile layout, keyboard order, and focus.

## Phase 5: Correct the text sorter

### Sort rules

- [ ] Define the order for Chinese, English, numbers, punctuation, blank lines, and other scripts.
- [ ] Keep each nonblank input line. If the tool excludes a line, show the reason.
- [ ] Define how the tool handles duplicates, spaces, letter case, tone, mixed text, and Chinese characters with more than one pronunciation.
- [ ] Add tests for all defined rules.

### Source and dependency

- [ ] Calculate one pinyin sort key for each line before the sort.
- [ ] Replace the inline `onclick` code with a JavaScript event listener.
- [ ] Show clear messages for empty input and pinyin dependency failure.
- [ ] Store `tiny-pinyin` in the repository, or add Subresource Integrity (SRI) to the external file.
- [ ] Record third-party requests and their privacy effect.
- [ ] Add a local backup or tell the user when pinyin conversion is not available.
- [ ] Add a Content Security Policy that permits only required sources.

## Phase 6: Complete documents and deployment checks

### Documents

- [ ] Complete `README.md`.
  - Include purpose, tool links, support status, limits, privacy, CSV format, local use, tests, and deployment.
- [ ] Document ABA settings. Do not publish real account data.
- [ ] Document dependency updates and user-visible changes.
- [ ] Select a license, or state that the repository has no license.

### Page data

- [ ] Change the home page title so that it identifies all tools.
- [ ] Add short page descriptions and links to the tools home page.
- [ ] Use the same tool names and letter case on all pages.
- [ ] Decide if search engines can index the prototype tools.

### Deployment

- [ ] Document the GitHub Pages and custom-domain process.
- [ ] Check production DNS, TLS, redirects, and the custom domain.
- [ ] Check production HTTP security headers. Record GitHub Pages limits.
- [ ] Define how often maintainers review dependencies and browser support.
- [ ] Confirm that the site has no unrecorded analytics or network requests.
- [ ] Add a short test checklist for each release.

## Phase 7: Close the audit

- [ ] Run all invalid-input tests from the audit again.
- [ ] Run syntax, lint, unit, browser, accessibility, and link checks.
- [ ] Link each audit finding to a completed item or an accepted-risk decision.
- [ ] Review the repository and public website again.
- [ ] Record remaining limits and follow-up work.
- [ ] Record the reviewer, date, and deployment that closes the audit.

## Decision log

Use this table when the team changes or rejects an action.

| Date | Decision | Owner | Reason and evidence |
| --- | --- | --- | --- |
| | | | |

## Completion record

| Item | Value |
| --- | --- |
| Completion date | |
| Final reviewer | |
| Release or deployment | |
| Bank validation reference | |
| Accepted risks | |
