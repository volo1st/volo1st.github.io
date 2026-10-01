# Current Converter Validation Checklist

## Purpose

Use this checklist during one normal payment run. Keep the legacy converter available for comparison.

Do not record teacher names, account details, or other payment data in this file.

## Validate the normal payment run

- [ ] Confirm that the source CSV contains the expected payments.
- [ ] Convert the CSV with the current converter.
- [ ] Confirm that the converter shows no validation errors.
- [ ] Compare the payment entries, count, and total with the source report.
- [ ] Upload the generated ABA file to CBA.
- [ ] Confirm that CBA accepts the file.
- [ ] Compare the payment entries, count, and total shown by CBA with the source report.
- [ ] Stop if a value differs. Use the legacy converter for comparison.
- [ ] Continue with the normal review and approval procedure only when all values match.

## Record the result

- [ ] Record the payment-run date in `plan.md`.
- [ ] Record whether the converter and CBA results matched the source report.
- [ ] Record whether CBA accepted the upload.
- [ ] Record a problem without confidential payment data.
