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

## Tests

Run this command from the repository root:

```sh
node --test tests/csv2aba-v2.test.js
```
