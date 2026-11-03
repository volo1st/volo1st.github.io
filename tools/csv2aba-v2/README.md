# CSV to ABA converter

This converter supports the established Commonwealth Bank of Australia (CBA) payment workflow with fixed settings. `/tools/csv2aba/` redirects here.

The owner confirmed several successful runs on 29 October 2026. This evidence applies only to that workflow. It does not establish general bank approval.

## Normal workflow validation

Use the current converter for the normal payment process.

Before a CBA upload, compare these items with the source payment report:

- payment count;
- total amount; and
- payment entries.

If a result is unexpected, stop the payment process. Resolve the difference before approval.

Use [the payment review checklist](PAYMENT-CHECKLIST.md) for each run.

After a successful conversion, the converter shows the payment count and total amount. Review this summary before download. The summary and download become unavailable after an input change or an error.

CSV and payment data stay in the browser. The converter source does not send this data to a server.

## Languages

The home page and the converter support English and Simplified Chinese.

The site uses the saved language when one is available. Otherwise, it uses Simplified Chinese for a Chinese browser preference. It uses English for other browser preferences.

Use the language control to change the language. A language change does not clear CSV input, validation errors, the payment summary, or generated ABA data.

The site stores only the selected language code in local browser storage. It does not store CSV or payment data.

The page uses one vertical workflow on large and small screens. Add payment data first. Then check and convert it. Review the payment summary and ABA data before download. After conversion, keyboard focus moves to the result or the error report.

## CSV rules

The converter uses a strict local CSV reader. Its record and quotation rules follow [RFC 4180](https://www.rfc-editor.org/rfc/rfc4180). The reader also supports a byte order mark (BOM) because spreadsheet exports can include one.

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

The converter rejects an overlong field. It does not truncate payment data. The converter does not independently enforce CBA institution-number rules or a complete ABA character set. This is an accepted limit for the supported workflow. Confirm the generated result in CBA before approval.

The converter checks all payment rows before it constructs an ABA file. It shows all applicable payment-field errors in one list. Each error identifies the source line and field. A structural CSV error can stop parsing before payment-field checks start.

## Tests

Run this command from the repository root:

```sh
node --test tests/csv2aba-v2.test.js
```

The test suite includes an exact golden ABA fixture. The fixture uses invented source and payment data. It also uses a fixed processing date. The ABA content is stored as Base64 to preserve fixed-width spaces and line ends. A fixed SHA-256 digest also checks the exact output for the supported workflow settings. Both expected results predate this cleanup. Do not regenerate them to accept a changed result. The fixture is not evidence of CBA approval.
