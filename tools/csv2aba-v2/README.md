# CSV-to-ABA Version 2

## Status

This directory is the trial location for version 2.

Version 1 stays at `/tools/csv2aba/`. Do not change version 1 during version 2 development unless a critical fix is necessary.

Version 2 has independent conversion and interface files. Characterization tests compare its valid output with version 1.

## Compatibility rule

For known valid input, version 2 must make the same payment data as version 1.

Version 2 can change the result for invalid or ambiguous input. It must stop conversion and show a clear error for that input.

## Trial rule

Do not add version 2 to the main tools page during the first trial. Give the direct URL to the current operator.

Before a CBA upload, compare these items with version 1:

- payment count;
- total amount;
- ABA detail records; and
- file total record.

Keep version 1 available as the fallback.

## CSV rules

Version 2 uses a strict local CSV reader. Its record and quotation rules follow [RFC 4180](https://www.rfc-editor.org/rfc/rfc4180). The reader also supports a byte order mark (BOM) because spreadsheet exports can include one.

Header names are case-sensitive. The file must contain these five headers:

- `BSB`;
- `Account`;
- `Name`;
- `Amount`; and
- `Reference`.

The header order can change. Do not add other headers.

The reader supports quoted commas, escaped quotation marks, quoted new lines, BOM input, blank lines, and LF and CRLF line ends. It rejects malformed quotation marks and rows with the wrong field count. It also rejects text or spaces after a quoted field. Error messages identify the applicable source line.

## Amount rules

An amount must be positive. It can have zero, one, or two decimal places. It can include an adjacent dollar sign. It can include correctly grouped thousands separators.

These values are valid:

- `$63.00`;
- `63`;
- `63.5`; and
- `$1,234.56` when the CSV field has quotation marks.

The converter does not round fractional cents. It rejects signs, zero, fractional cents, bad separators, non-numeric text, and values above `$99,999,999.99`. The total of all payments has the same limit.

## Payment field rules

Each payment row must contain all five values. A fully blank CSV line is not a payment row. The converter rejects an incomplete payment row.

- BSB must have the format `NNN-NNN`.
- Account can contain digits, spaces, and hyphens.
- Account must not exceed nine characters.
- Account must contain a non-zero digit.
- Name must not exceed 32 characters.
- Reference must not exceed 18 characters.
- A payment field must not contain a line break or control character.

The converter rejects an overlong field. It does not truncate payment data. CBA institution-number rules and the complete ABA character set are not yet confirmed. Version 2 does not enforce those rules at this time.

## Tests

Run this command from the repository root:

```sh
node --test tests/csv2aba-v2.test.js
```
