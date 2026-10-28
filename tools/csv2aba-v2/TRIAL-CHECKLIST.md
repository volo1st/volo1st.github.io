# Converter payment review checklist

## Purpose

Use this checklist during each normal payment run. Version 1 is retired.

Validation was accepted on 29 October 2026 after the owner reported several successful version 2 runs over the past two months. See `plan.md`, Section 34. The unchecked items below are a reusable review list. They do not indicate a pending trial.

Do not record teacher names, account details, or other payment data in this file.

## Validate the normal payment run

- [ ] Confirm that the source CSV contains the expected payments.
- [ ] Convert the CSV with the current converter.
- [ ] Confirm that the converter shows no validation errors.
- [ ] Compare the payment entries, count, and total with the source report.
- [ ] Upload the generated ABA file to CBA.
- [ ] Confirm that CBA accepts the file.
- [ ] Compare the payment entries, count, and total shown by CBA with the source report.
- [ ] If a value differs, stop the payment process.
- [ ] Continue with the normal review and approval procedure only when all values match.

## Record the result

Keep routine payment records outside this public repository. If a software problem needs investigation, record only non-confidential evidence.

- [ ] Record the payment-run date in the private payment record.
- [ ] Record whether the converter and CBA results matched the source report.
- [ ] Record whether CBA accepted the upload.
- [ ] Record a problem without confidential payment data.
