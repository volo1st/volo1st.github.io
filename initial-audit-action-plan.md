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

- [x] Record the current use of version 1 for monthly teacher payments through CBA.
  - Evidence: The version 2 README states the supported process, its history, and its limits.
- [x] Keep version 1 at `/tools/csv2aba/` as the fallback.
- [x] Build version 2 at `/tools/csv2aba-v2/`.
  - Evidence: Version 2 has independent conversion and interface files. Characterization tests compare valid version 2 output with version 1.
- [x] Keep version 2 out of the main tools list until trial readiness is complete. Then add a clearly labelled trial link.
  - Evidence: Version 2 stayed unlisted during development. The home page now identifies v1 as current and v2 as a trial.

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
- [x] For known valid input, require version 2 to make the same payment data as version 1.
  - Evidence: Characterization and golden-fixture tests require exact v1-compatible output.
- [x] Permit version 2 to change only invalid or ambiguous behavior. It must show an error for that input.
  - Evidence: The version 2 README records this rule. Parser, amount, payment-field, and interface tests enforce it.

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

- [x] Check BSB structure, account content, and payment-field widths.
  - Evidence: Version 2 checks the structural rules in `validateDetailRow()`. Boundary tests cover each field.
- [ ] Confirm and check CBA institution-number rules and the complete permitted ABA character set.
- [ ] Check remitter and all source settings.
- [x] Check required values, control characters, amount limits, total limits, and record limits.
- [x] Reject an incomplete row. Ignore only a fully blank row.
- [x] Reject a long field. Do not silently cut data.
- [x] Show the row and field for each payment-data error.
  - Completion test: Tested invalid payment data cannot enter an ABA record.

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

- [x] Show clear information, warning, error, and success messages.
- [x] Show all applicable row and field errors.
  - Evidence: Version 2 validates all parsed payment rows before construction. The interface shows the errors in one accessible list.
- [x] Show the payment count and total before download.
  - Evidence: Version 2 uses the checked conversion result to show both values. The summary contains the Download button.
- [x] Tell users that conversion occurs in their browser.
- [x] Add a safe example CSV file. Use invented data only.

## Phase 3: Prove ABA converter quality

### Automated tests

- [x] Add a small JavaScript test system.
- [x] Test CSV input, amount conversion, field checks, record construction, totals, file names, and interface states.
  - Evidence: Automated tests cover all listed areas. Interface-state tests use a simulated document environment.
- [ ] Test each critical and high risk in the audit report.
- [ ] Test minimum and maximum values, unsupported characters, byte lengths, and overflow.
- [x] Add reviewed ABA sample files. Use invented data only.
  - Evidence: The golden fixture uses invented source and payment data. It stores exact ABA bytes as Base64. A separate test checks version 1 compatibility. The fixture is not bank-approval evidence.

### Browser and accessibility tests

- [x] Test upload, paste, conversion, error recovery, second conversion, and download with simulated browser controls.
- [ ] Test the complete workflow in a browser during the operator trial.
- [x] Test current main desktop and mobile browsers.
  - Evidence: On 14 September 2026, the user confirmed that the v2 layout looked correct in Chrome on a MacBook Air with M4 and in Safari on an iPhone 16 Pro.
- [ ] Test keyboard use, screen-reader use, HTML, and accessibility rules.

### Automated checks

- [x] Add one local command for syntax, tests, internal references, and whitespace.
  - Evidence: `scripts/check.sh` runs the repository checks without external dependencies or services.
- [x] Document the checks that must pass before deployment.
  - Evidence: `README.md` documents the local command, required software, and check scope.
- [ ] Add format, lint, full HTML, and automated accessibility checks when the project needs them.

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
- [x] Add shared text, space, focus styles, navigation, and responsive page widths to the home page and version 2.
  - Evidence: Both pages load `assets/site.css`. Version 1 stays unchanged during the trial. The sorter will adopt shared styles in its own package.
- [ ] Check headings, page language, color contrast, zoom, and keyboard focus.

### ABA converter

- [x] Replace the layout table with a responsive layout.
  - Evidence: Version 2 uses a mobile-first vertical workflow. It does not use a table for page layout.
- [x] Add a label and help text to each input and output. Give each button a clear name.
- [x] Add live status semantics for assistive software.
- [x] Use text and structure with color for each status.
- [x] Remove the comma between textarea attributes.
- [x] Confirm the page in browsers on a narrow screen and at 200 percent zoom.
  - Evidence: On 14 September 2026, the user confirmed the layout in Safari on an iPhone 16 Pro and confirmed that the page works at 200 percent zoom.
- [x] Add a caption and correct headers to the example table.

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

- [x] Change the home page title so that it identifies all tools.
- [x] Confirm the redesigned home page and its tool links in a browser.
  - Evidence: On 14 September 2026, the user confirmed that the home page looked correct and that all links worked.
- [ ] Add short page descriptions and links to the tools home page.
- [ ] Use the same tool names and letter case on all pages.
- [ ] Decide if search engines can index the prototype tools.

### Deployment

- [ ] Document the GitHub Pages and custom-domain process.
- [x] Verify the deployed home page, version 1, and version 2 routes.
  - Evidence: On 14 September 2026, the user confirmed that GitHub Pages deployed the changes and that all three production routes and their links worked.
- [ ] Check production DNS, TLS, redirects, and the custom domain.
- [ ] Check production HTTP security headers. Record GitHub Pages limits.
- [ ] Define how often maintainers review dependencies and browser support.
- [ ] Confirm that the site has no unrecorded analytics or network requests.
- [x] Add a short test checklist for each release.
  - Evidence: `tools/csv2aba-v2/TRIAL-CHECKLIST.md` defines the operator and CBA trial steps.

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
| 14 September 2026 | Add a labelled version 2 trial link to the home page. | Repository owner | Version 2 completed its automated trial-readiness package. Version 1 remains the current fallback. |
| 14 September 2026 | Use a local check script. Do not add Git hooks or GitHub Actions at this time. | Repository owner | A one-person static website does not need the additional setup and maintenance at this time. |

## Completion record

| Item | Value |
| --- | --- |
| Completion date | |
| Final reviewer | |
| Release or deployment | |
| Bank validation reference | |
| Accepted risks | |
