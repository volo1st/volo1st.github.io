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
