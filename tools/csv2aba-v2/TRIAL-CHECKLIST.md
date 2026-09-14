# Version 2 Trial Checklist

## Purpose

Use this checklist for each version 2 trial. Keep version 1 available during the trial.

Do not record teacher names, account details, or other payment data in this file.

## Before the trial

- [ ] Open version 1 at `https://volo1st.com/tools/csv2aba/`.
- [ ] Open version 2 at `https://volo1st.com/tools/csv2aba-v2/`.
- [ ] Confirm that version 2 opens in the expected language.
- [ ] Change between English and Simplified Chinese.
- [ ] Use the same current CSV file in both versions.
- [ ] Confirm that the CSV contains the expected teachers and amounts.

## Compare the results

- [ ] Convert the CSV in the language that the operator normally uses.
- [ ] Confirm that version 2 shows no validation errors.
- [ ] Compare the payment count with the source report.
- [ ] Compare the total amount with the source report.
- [ ] Compare the version 1 and version 2 ABA files.
- [ ] Stop if payment data differs for a valid input.
- [ ] Use version 1 as the fallback if you cannot explain a difference.
- [ ] Change the language after conversion.
- [ ] Confirm that the CSV input, payment summary, and ABA output do not change.

## Test CBA

- [ ] Upload the version 2 ABA file to CBA.
- [ ] Confirm that CBA accepts the file.
- [ ] Confirm the payment count and total in CBA.
- [ ] Do not approve the payment if a value is incorrect.
- [ ] Use the normal review and approval process for the payment.

## Record the result

- [ ] Record the trial date in `initial-audit-action-plan.md`.
- [ ] Record whether version 1 and version 2 matched.
- [ ] Record whether CBA accepted version 2.
- [ ] Record a problem without confidential payment data.
