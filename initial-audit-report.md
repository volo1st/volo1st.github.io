# Initial Audit Report

## 1. Document data

| Item | Value |
| --- | --- |
| Repository | `volo1st.github.io` |
| Audit date | 12 September 2026 |
| Audit method | Source review and local tests |
| Action plan | [`initial-audit-action-plan.md`](initial-audit-action-plan.md) |

## 2. Purpose and scope

This report records the condition of the repository on the audit date.

The audit examined the source structure, function, data accuracy, security, privacy, accessibility, screen-size support, tests, deployment, and project documents.

The audit did not send a file to a bank. It did not test the public website.

## 3. Summary

The repository is small and easy to understand. It contains two browser tools. One tool converts CSV data to an ABA bank file. The other tool sorts Chinese and English text.

The text sorter is a useful small tool. It has some data-loss and dependency risks.

Do not use the ABA converter for real payments at this time. It can make an invalid payment file. It uses fixed bank data. It does not correctly check CSV data, amounts, or ABA fields. Correct these problems and test the result with the applicable bank.

## 4. Risk levels

| Level | Meaning |
| --- | --- |
| Critical | The problem can make incorrect payment data. |
| High | The problem can make an invalid file or stop the tool. |
| Medium | The problem can reduce reliability, access, or maintenance quality. |
| Low | The problem has a small effect on quality or speed. |

## 5. Findings

### 5.1 Critical: The converter uses fixed bank data

The converter always uses `CBA`, `Meya`, and user ID `000000`. It also uses the recipient BSB and account as the trace BSB and account. Trace data usually identifies the source account. The source bank must confirm this rule.

See `generate_descriptive_record()` and `generate_detail_record()` in [`tools/csv2aba/scripts.js`](tools/csv2aba/scripts.js).

**Effect:** A bank can reject the file. The file can contain incorrect source data.

**Required action:** Get the current rules from the source bank. Let the user supply valid source data. Check the data before conversion.

### 5.2 Critical: The converter accepts invalid amounts

The converter uses `parseFloat()` and binary floating-point calculations. It does not make sure that an amount is valid, positive, or in the permitted range.

Local tests gave these results:

| Input | ABA field | Result |
| --- | --- | --- |
| `abc` | `0000000NaN` | Invalid text is in a numeric field. |
| `-1.00` | `000000-100` | A minus sign is in an unsigned field. |
| `1.005` | `0000000100` | The calculation changes the value to 100 cents. |

See `generate_detail_record()` in [`tools/csv2aba/scripts.js`](tools/csv2aba/scripts.js).

**Effect:** A payment value can be incorrect or invalid.

**Required action:** Convert decimal text directly to integer cents. Reject invalid values. Show the row and field for each error.

### 5.3 High: The CSV reader does not support quoted data

The reader divides data at each comma and new line. It does not correctly read quoted commas, quoted new lines, or escaped quotation marks. For example, `"Smith, Jane"` moves the remaining values into the wrong columns.

See `parseCsv()` in [`tools/csv2aba/scripts.js`](tools/csv2aba/scripts.js).

**Effect:** Valid CSV data can make incorrect payment data.

**Required action:** Use a tested CSV reader. Test quoted data, byte order marks (BOM), blank lines, and LF and CRLF line ends.

### 5.4 High: The converter does not check all ABA fields

The converter does not correctly check the BSB, account, required names, reference, permitted characters, field lengths, amount limits, total limits, or record limits.

The converter silently ignores an incomplete row. A long field causes a general record-length error. The error does not identify the row or field.

**Effect:** The tool can omit a payment or make an invalid file.

**Required action:** Check each field before record construction. Reject bad data with a clear row and field message.

### 5.5 High: The interface does not safely manage errors

The Convert button handler does not catch conversion errors. It creates an undeclared `abaContent` variable. It can enable Download after a failure. The missing-column code refers to `statusMessage` outside its valid scope.

See `csv2aba()` and the event handlers in [`tools/csv2aba/scripts.js`](tools/csv2aba/scripts.js).

**Effect:** The user can download empty, old, or invalid data.

**Required action:** Keep Download disabled until conversion is successful. Clear old output after a change or an error. Show one clear error report.

### 5.6 Medium: Bank-specific rules are not confirmed

The source refers to a third-party ABA description. The repository does not record the rules of the applicable bank. These rules can include trace data, transaction codes, balancing records, character encoding, line ends, and file names.

**Effect:** A file can have the correct length and still fail bank checks.

**Required action:** Record the current bank rules. Test a sample file with the bank.

### 5.7 Medium: The repository has no automated tests

The repository has no unit tests, browser tests, accessibility tests, or continuous integration (CI). CI is an automatic check that runs when the source changes.

**Effect:** A source change can cause a fault that is not found before deployment.

**Required action:** Add tests for the CSV reader, amounts, ABA records, totals, error states, and text sorter. Run the tests in CI.

### 5.8 Medium: The converter page is difficult to use on some devices

The page uses a wide table and fixed textarea sizes. It does not have viewport metadata. Controls do not have complete labels. Status messages are not live regions. Red and green are the main status signals. The ABA output can be changed before download. The textarea markup also contains an unwanted comma between attributes.

See [`tools/csv2aba/index.html`](tools/csv2aba/index.html) and [`tools/csv2aba/styles.css`](tools/csv2aba/styles.css).

**Effect:** The page can be difficult to use on a small screen, with a keyboard, or with assistive software.

**Required action:** Use a responsive layout. Add labels, status semantics, text indicators, and a read-only output field.

### 5.9 Medium: The text sorter can silently remove input

The sorter keeps a line only if it finds an English or Chinese character first. It removes some lines that start with a number, punctuation mark, or another script.

See `process()` in [`tools/song_order/index.html`](tools/song_order/index.html).

**Effect:** The output can lose user data without a warning.

**Required action:** Keep all nonblank lines. Define and test the sort order for each line type.

### 5.10 Medium: The sorter depends on a third-party server

The sorter loads `tiny-pinyin` from jsDelivr. The version is fixed, but the link has no Subresource Integrity (SRI) value. SRI lets the browser check the downloaded file. There is no local backup. A failure silently changes the result.

See [`tools/song_order/index.html`](tools/song_order/index.html).

**Effect:** A server or network failure can reduce function. The browser also sends a request to a third party.

**Required action:** Store the dependency in the repository, or add SRI and a clear failure message. Record the privacy effect.

### 5.11 Low: The sorter repeats pinyin calculations

The sort comparison calculates the same pinyin value many times.

**Effect:** Large inputs can take more time than necessary.

**Required action:** Calculate one sort key for each line before the sort.

### 5.12 Low: Project documents and page data are incomplete

[`README.md`](README.md) is empty. It does not explain the tools, limits, privacy, tests, or deployment. The home page title says `CSV 2 ABA`, but the page contains two tools.

**Effect:** A user or maintainer does not have sufficient operating information.

**Required action:** Complete the README. Correct page titles and add consistent navigation.

## 6. Positive results

- The repository has a simple structure.
- The tools do not use a custom server.
- The converter processes payment data in the browser. Its source does not transmit that data.
- The source uses textarea values or `textContent` for user results. The audit found no clear cross-site scripting path.
- The audit found no secret data in tracked files.
- The ABA builders check for a 120-character record length.
- The download code releases its temporary object URL.
- The repository has few dependencies.
- The Git worktree was clean before this report was added.

## 7. Checks completed

- Reviewed all tracked application files.
- Checked JavaScript syntax with Node.js.
- Tested the converter with normal and invalid data.
- Tested quoted commas, long fields, and line ends.
- Checked Git whitespace.

Normal test records had 120 characters. This result does not prove that their content is valid.

## 8. Audit limits

- The audit did not send an ABA file to a bank.
- The audit did not confirm the current rules of a target bank.
- The audit did not test the public website, DNS, TLS, or HTTP headers.
- The audit did not test assistive software or multiple browsers.
- Source changes after 12 September 2026 are outside this report.

## 9. Conclusion

The repository is a good base for small browser tools. Correct the text sorter faults before wide use. Do not use the ABA converter for real payments until all critical and high risks are closed, automated tests pass, and the applicable bank accepts a test file.
