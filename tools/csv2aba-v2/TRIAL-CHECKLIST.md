# Version 2 Trial Checklist

## Purpose

Use this checklist for each controlled trial. Keep the legacy converter available during the trial.

Do not record teacher names, account details, or other payment data in this file.

## Before the trial

- [ ] Open the former address at `https://volo1st.com/tools/csv2aba/`.
- [ ] Confirm that it opens the current converter at `https://volo1st.com/tools/csv2aba-v2/`.
- [ ] Confirm that the current converter opens in the expected language.
- [ ] Keep `https://volo1st.com/tools/csv2aba-legacy/` available as the fallback.
- [ ] Change between English and Simplified Chinese.
- [ ] Confirm that the CSV contains the expected teachers and amounts.

## Compare the results

- [ ] Convert the CSV in the language that the operator normally uses.
- [ ] Confirm that the current converter shows no validation errors.
- [ ] Compare the payment count with the source report.
- [ ] Compare the total amount with the source report.
- [ ] Review the payment entries against the source report.
- [ ] Stop if payment data differs from the source report.
- [ ] Use the legacy converter for comparison if you cannot explain a difference.
- [ ] Change the language after conversion.
- [ ] Confirm that the CSV input, payment summary, and ABA output do not change.

## Test CBA

- [ ] Upload the current converter's ABA file to CBA.
- [ ] Confirm that CBA accepts the file.
- [ ] Confirm the payment count and total in CBA.
- [ ] Do not approve the payment if a value is incorrect.
- [ ] Use the normal review and approval process for the payment.

## Record the result

- [ ] Record the trial date in `plan.md`.
- [ ] Record whether the converter result matched the source report.
- [ ] Record whether CBA accepted the file.
- [ ] Record a problem without confidential payment data.
