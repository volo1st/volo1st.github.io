'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const v2 = require('../tools/csv2aba-v2/core.js');

const FIXED_DATE = new Date(2026, 8, 12);
const VALID_CSV = [
  'BSB,Account,Name,Amount,Reference',
  '062-010,10894862,Example Teacher,$63.00,teacher fee',
  '062-443,13741935,Second Teacher,$25.00,teacher fee',
].join('\n');

function loadV1WithFixedDate() {
  const scriptPath = path.join(__dirname, '../tools/csv2aba/scripts.js');
  const browserMarker = '// --- Browser specific code';
  const source = fs.readFileSync(scriptPath, 'utf8').split(browserMarker)[0];
  const NativeDate = Date;

  class FixedDate extends NativeDate {
    constructor(...argumentsList) {
      super(...(argumentsList.length === 0 ? [FIXED_DATE.getTime()] : argumentsList));
    }
  }

  const context = { Date: FixedDate };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context;
}

test('v2 makes the same ABA output as v1 for representative valid input', () => {
  const v1 = loadV1WithFixedDate();
  const v1Output = v1.processCsvToAba(v1.parseCsv(VALID_CSV));
  const v2Output = v2.convert(VALID_CSV, { processDate: '120926' });

  assert.equal(v2Output, v1Output);
});

test('each generated ABA record has 120 characters', () => {
  const output = v2.convert(VALID_CSV, { processDate: '120926' });
  const records = output.split('\n').slice(0, -1);

  assert.equal(records.length, 4);
  for (const record of records) {
    assert.equal(record.length, 120);
  }
});

test('v2 keeps the current total and record count', () => {
  const output = v2.convert(VALID_CSV, { processDate: '120926' });
  const records = output.split('\n');
  const totalRecord = records[3];

  assert.equal(totalRecord.slice(20, 30), '0000008800');
  assert.equal(totalRecord.slice(30, 40), '0000008800');
  assert.equal(totalRecord.slice(74, 80), '000002');
});

test('v2 reports missing columns instead of returning undefined', () => {
  assert.throws(
    () => v2.convert('BSB,Account\n062-010,10894862', { processDate: '120926' }),
    /Missing required CSV columns/,
  );
});

test('the CSV reader supports a quoted comma', () => {
  const csv = [
    'BSB,Account,Name,Amount,Reference',
    '062-010,10894862,"Smith, Jane",$63.00,teacher fee',
  ].join('\n');
  const rows = v2.parseCsv(csv);

  assert.equal(rows[0].Name, 'Smith, Jane');
  assert.equal(rows[0].Amount, '$63.00');
});

test('the CSV reader supports escaped quotation marks', () => {
  const csv = [
    'BSB,Account,Name,Amount,Reference',
    '062-010,10894862,"Teacher ""A""",$63.00,teacher fee',
  ].join('\n');

  assert.equal(v2.parseCsv(csv)[0].Name, 'Teacher "A"');
});

test('the CSV reader supports quoted new lines', () => {
  const csv = [
    'BSB,Account,Name,Amount,Reference',
    '062-010,10894862,"Example',
    'Teacher",$63.00,teacher fee',
  ].join('\r\n');
  const row = v2.parseCsv(csv)[0];

  assert.equal(row.Name, 'Example\nTeacher');
  assert.equal(row.sourceRow, 2);
});

test('conversion rejects a quoted new line in an ABA field', () => {
  const csv = [
    'BSB,Account,Name,Amount,Reference',
    '062-010,10894862,"Example',
    'Teacher",$63.00,teacher fee',
  ].join('\n');

  assert.throws(() => v2.convert(csv), /CSV line 2 field Name contains a line break/);
});

test('the CSV reader supports a BOM and CRLF line ends', () => {
  const csv = [
    '\uFEFFBSB,Account,Name,Amount,Reference',
    '062-010,10894862,Example Teacher,$63.00,teacher fee',
  ].join('\r\n');
  const row = v2.parseCsv(csv)[0];

  assert.equal(row.BSB, '062-010');
  assert.equal(row.sourceRow, 2);
});

test('the CSV reader ignores fully blank lines and keeps source rows', () => {
  const csv = [
    'BSB,Account,Name,Amount,Reference',
    '',
    '062-010,10894862,Example Teacher,$63.00,teacher fee',
    '   ',
  ].join('\n');
  const rows = v2.parseCsv(csv);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].sourceRow, 3);
});

test('the CSV reader rejects malformed quoted fields', () => {
  assert.throws(
    () => v2.parseCsv('BSB,Account,Name,Amount,Reference\n062-010,10894862,"Example,$63.00,fee'),
    /open quotation mark/,
  );
  assert.throws(
    () => v2.parseCsv('BSB,Account,Name,Amount,Reference\n062-010,10894862,"Example"x,$63.00,fee'),
    /text after a closing quotation mark/,
  );
});

test('the CSV reader rejects an incorrect field count', () => {
  assert.throws(
    () => v2.parseCsv('BSB,Account,Name,Amount,Reference\n062-010,10894862,Example,$63.00'),
    /CSV line 2 has 4 fields; expected 5/,
  );
});

test('the CSV reader rejects invalid headers', () => {
  assert.throws(
    () => v2.parseCsv('BSB,Account,Name,Amount,Name\n062-010,10894862,Example,$63.00,fee'),
    /duplicate headers: Name/,
  );
  assert.throws(
    () => v2.parseCsv('BSB,Account,Name,Amount,Reference,Note\n062-010,10894862,Example,$63.00,fee,x'),
    /unexpected columns: Note/,
  );
  assert.throws(
    () => v2.parseCsv('BSB,Account,Name,Amount,\n062-010,10894862,Example,$63.00,fee'),
    /header 5 is empty/,
  );
});

test('the CSV reader rejects empty input and header-only input', () => {
  assert.throws(() => v2.parseCsv('  \r\n'), /CSV input is empty/);
  assert.throws(
    () => v2.convert('BSB,Account,Name,Amount,Reference'),
    /CSV does not contain a payment row/,
  );
});

test('amount parsing accepts the supported formats', () => {
  const cases = [
    ['$63.00', 6300],
    ['63', 6300],
    ['63.5', 6350],
    ['0.01', 1],
    ['$01.05', 105],
    ['$1,234.56', 123456],
    ['$99,999,999.99', 9999999999],
  ];

  for (const [input, expected] of cases) {
    assert.equal(v2.parseAmountToCents(input), expected, input);
  }
});

test('amount parsing rejects invalid or ambiguous values', () => {
  const invalidValues = [
    '',
    'abc',
    '-1.00',
    '+1.00',
    '1.005',
    '1.',
    '.50',
    '$ 1.00',
    '1,23.00',
    '01,234.00',
    '1,2345.00',
    '1 234.00',
  ];

  for (const input of invalidValues) {
    assert.throws(
      () => v2.parseAmountToCents(input, { sourceRow: 7 }),
      /CSV line 7 field Amount/,
      input,
    );
  }
});

test('amount parsing rejects zero and an excessive value', () => {
  assert.throws(() => v2.parseAmountToCents('0'), /must be greater than zero/);
  assert.throws(
    () => v2.parseAmountToCents('$100,000,000.00'),
    /exceeds the ABA limit/,
  );
});

test('conversion supports a correctly quoted thousands separator', () => {
  const csv = [
    'BSB,Account,Name,Amount,Reference',
    '062-010,10894862,Example Teacher,"$1,234.56",teacher fee',
  ].join('\n');
  const output = v2.convert(csv, { processDate: '120926' });
  const detailRecord = output.split('\n')[1];

  assert.equal(detailRecord.slice(20, 30), '0000123456');
});

test('conversion rejects an empty amount with its source line', () => {
  const csv = [
    'BSB,Account,Name,Amount,Reference',
    '062-010,10894862,Example Teacher,,teacher fee',
  ].join('\n');

  assert.throws(() => v2.convert(csv), /CSV line 2 field Amount/);
});

test('conversion rejects an aggregate total overflow', () => {
  const csv = [
    'BSB,Account,Name,Amount,Reference',
    '062-010,10894862,First Teacher,"$50,000,000.00",teacher fee',
    '062-443,13741935,Second Teacher,"$50,000,000.00",teacher fee',
  ].join('\n');

  assert.throws(() => v2.convert(csv), /CSV line 3 makes the ABA payment total exceed/);
});

test('file totals reject amount and record-count overflow', () => {
  assert.throws(
    () => v2.generateFileTotalRecord({ length: 2 }, 10000000000),
    /ABA payment total exceeds/,
  );
  assert.throws(
    () => v2.generateFileTotalRecord({ length: 1000001 }, 1),
    /ABA detail record count exceeds 999999/,
  );
});

function makePaymentRow(overrides = {}) {
  const row = {
    BSB: '062-010',
    Account: '10894862',
    Name: 'Example Teacher',
    Amount: '$63.00',
    Reference: 'teacher fee',
    ...overrides,
  };
  Object.defineProperty(row, 'sourceRow', { value: 4 });
  return row;
}

test('payment validation accepts each field at its width limit', () => {
  const row = makePaymentRow({
    Account: '12-345678',
    Name: 'N'.repeat(32),
    Reference: 'R'.repeat(18),
  });
  const [record] = v2.generateDetailRecord(row);

  assert.equal(record.length, 120);
  assert.equal(record.slice(8, 17), '12-345678');
  assert.equal(record.slice(30, 62), 'N'.repeat(32));
  assert.equal(record.slice(62, 80), 'R'.repeat(18));
});

test('payment validation requires each field', () => {
  for (const fieldName of v2.REQUIRED_COLUMNS) {
    assert.throws(
      () => v2.validateDetailRow(makePaymentRow({ [fieldName]: '   ' })),
      new RegExp(`CSV line 4 field ${fieldName} is required`),
      fieldName,
    );
  }
});

test('payment validation checks BSB structure', () => {
  const invalidValues = ['062010', '62-010', '062-01', 'ABC-DEF', '062 010'];

  for (const BSB of invalidValues) {
    assert.throws(
      () => v2.validateDetailRow(makePaymentRow({ BSB })),
      /CSV line 4 field BSB must have the format NNN-NNN/,
      BSB,
    );
  }
});

test('payment validation checks account content and width', () => {
  assert.throws(
    () => v2.validateDetailRow(makePaymentRow({ Account: '1234567890' })),
    /field Account must not exceed 9 characters/,
  );
  assert.throws(
    () => v2.validateDetailRow(makePaymentRow({ Account: '123A456' })),
    /field Account can contain only digits, spaces, and hyphens/,
  );
  assert.throws(
    () => v2.validateDetailRow(makePaymentRow({ Account: '000-000' })),
    /field Account must contain a non-zero digit/,
  );
});

test('payment validation rejects an overlong name or reference', () => {
  assert.throws(
    () => v2.validateDetailRow(makePaymentRow({ Name: 'N'.repeat(33) })),
    /CSV line 4 field Name must not exceed 32 characters/,
  );
  assert.throws(
    () => v2.validateDetailRow(makePaymentRow({ Reference: 'R'.repeat(19) })),
    /CSV line 4 field Reference must not exceed 18 characters/,
  );
});

test('payment validation rejects control characters', () => {
  assert.throws(
    () => v2.validateDetailRow(makePaymentRow({ Name: 'Example\tTeacher' })),
    /CSV line 4 field Name contains a control character/,
  );
  assert.throws(
    () => v2.validateDetailRow(makePaymentRow({ Reference: 'teacher\nfee' })),
    /CSV line 4 field Reference contains a line break/,
  );
  assert.throws(
    () => v2.validateDetailRow(makePaymentRow({ Name: 'Example Teacher\n' })),
    /CSV line 4 field Name contains a line break/,
  );
});

test('conversion rejects an incomplete row instead of omitting it', () => {
  const csv = [
    'BSB,Account,Name,Amount,Reference',
    '062-010,10894862,Example Teacher,$63.00,',
  ].join('\n');

  assert.throws(() => v2.convert(csv), /CSV line 2 field Reference is required/);
});

const MULTIPLE_ERROR_CSV = [
  'BSB,Account,Name,Amount,Reference',
  `062010,ABC123,${'N'.repeat(33)},abc,${'R'.repeat(19)}`,
  '062-443,000-000,,0,teacher fee',
].join('\n');

test('conversion collects errors from all payment rows and fields', () => {
  assert.throws(
    () => v2.convert(MULTIPLE_ERROR_CSV),
    (error) => {
      assert.equal(error.name, 'PaymentValidationError');
      assert.equal(error.message, 'Payment data has 8 errors.');
      assert.equal(error.errors.length, 8);
      assert.ok(error.errors.some((message) => /CSV line 2 field BSB/.test(message)));
      assert.ok(error.errors.some((message) => /CSV line 2 field Name/.test(message)));
      assert.ok(error.errors.some((message) => /CSV line 3 field Account/.test(message)));
      assert.ok(error.errors.some((message) => /CSV line 3 field Name/.test(message)));
      return true;
    },
  );
});

test('conversion returns an accurate payment summary', () => {
  const result = v2.convertWithSummary(VALID_CSV, { processDate: '120926' });

  assert.equal(result.paymentCount, 2);
  assert.equal(result.totalAmountCents, 8800);
  assert.equal(result.abaContent, v2.convert(VALID_CSV, { processDate: '120926' }));
});

test('amount display uses dollars, cents, and thousands separators', () => {
  assert.equal(v2.formatAmount(0), '$0.00');
  assert.equal(v2.formatAmount(1), '$0.01');
  assert.equal(v2.formatAmount(8800), '$88.00');
  assert.equal(v2.formatAmount(123456), '$1,234.56');
});

test('amount display rejects an invalid value', () => {
  for (const value of [-1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(
      () => v2.formatAmount(value),
      /Amount display value must be a non-negative integer/,
    );
  }
});

function loadAppForTest() {
  function makeElement(properties = {}) {
    return {
      children: [],
      disabled: false,
      files: [],
      hidden: false,
      listeners: {},
      focused: false,
      textContent: '',
      value: '',
      addEventListener(type, listener) {
        this.listeners[type] = listener;
      },
      appendChild(child) {
        this.children.push(child);
      },
      focus() {
        this.focused = true;
      },
      replaceChildren(...children) {
        this.children = children;
      },
      ...properties,
    };
  }

  const elements = {
    aba: makeElement(),
    convert: makeElement(),
    csv: makeElement(),
    csvFileInput: makeElement(),
    downloadAba: makeElement({ disabled: true }),
    errorList: makeElement(),
    errorMessage: makeElement(),
    errorPanel: makeElement({ hidden: true }),
    paymentCount: makeElement(),
    paymentSummary: makeElement({ hidden: true }),
    paymentTotal: makeElement(),
    statusMessage: makeElement(),
  };
  let readyListener;
  const document = {
    body: {
      appendChild() {},
      removeChild() {},
    },
    addEventListener(type, listener) {
      if (type === 'DOMContentLoaded') readyListener = listener;
    },
    createElement: () => makeElement({ click() {} }),
    getElementById: (id) => elements[id],
  };
  const source = fs.readFileSync(
    path.join(__dirname, '../tools/csv2aba-v2/app.js'),
    'utf8',
  );

  vm.runInNewContext(source, {
    Blob,
    CsvToAbaV2: v2,
    Date,
    URL: {
      createObjectURL: () => 'blob:test',
      revokeObjectURL() {},
    },
    document,
  });
  readyListener();
  return elements;
}

test('the interface shows a summary only after successful conversion', () => {
  const elements = loadAppForTest();
  elements.csv.value = VALID_CSV;

  elements.convert.listeners.click();

  assert.equal(elements.paymentSummary.hidden, false);
  assert.equal(elements.paymentCount.textContent, '2');
  assert.equal(elements.paymentTotal.textContent, '$88.00');
  assert.equal(elements.downloadAba.disabled, false);
  assert.match(elements.statusMessage.textContent, /Review the summary/);
  assert.equal(elements.errorMessage.textContent, '');
  assert.equal(elements.errorPanel.hidden, true);
  assert.equal(elements.paymentSummary.focused, true);
});

test('the interface clears the summary and download after a change or error', () => {
  const elements = loadAppForTest();
  elements.csv.value = VALID_CSV;
  elements.convert.listeners.click();

  elements.csv.listeners.input();
  assert.equal(elements.paymentSummary.hidden, true);
  assert.equal(elements.downloadAba.disabled, true);
  assert.equal(elements.aba.value, '');

  elements.csv.value = 'invalid';
  elements.convert.listeners.click();
  assert.equal(elements.paymentSummary.hidden, true);
  assert.equal(elements.downloadAba.disabled, true);
  assert.match(elements.errorMessage.textContent, /^Conversion error:/);
  assert.equal(elements.errorPanel.hidden, false);
  assert.equal(elements.errorPanel.focused, true);
});

test('the interface shows all payment errors in a list', () => {
  const elements = loadAppForTest();
  elements.csv.value = MULTIPLE_ERROR_CSV;

  elements.convert.listeners.click();

  assert.equal(elements.paymentSummary.hidden, true);
  assert.equal(elements.downloadAba.disabled, true);
  assert.equal(elements.errorPanel.hidden, false);
  assert.equal(elements.errorMessage.textContent, 'Conversion stopped. Fix these 8 errors:');
  assert.equal(elements.errorList.children.length, 8);
  assert.match(elements.errorList.children[0].textContent, /^CSV line 2/);
  assert.match(elements.errorList.children[7].textContent, /^CSV line 3/);
  assert.equal(elements.errorPanel.focused, true);
});
