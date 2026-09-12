(function initializeCsvToAba(root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.CsvToAbaV2 = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createCsvToAba() {
  'use strict';

  const SPACE = ' ';
  const ZERO = '0';
  const LINE_LENGTH = 120;
  const REQUIRED_COLUMNS = ['BSB', 'Reference', 'Name', 'Account', 'Amount'];

  const DEFAULT_SETTINGS = Object.freeze({
    institution: 'CBA',
    userName: 'Meya',
    userId: '000000',
    entryDescription: 'PAYROLL',
    remitterName: 'Meya',
  });

  function formatProcessDate(date) {
    const day = String(date.getDate()).padStart(2, ZERO);
    const month = String(date.getMonth() + 1).padStart(2, ZERO);
    const year = String(date.getFullYear()).slice(-2);
    return `${day}${month}${year}`;
  }

  function assertRecordLength(record, name) {
    if (record.length !== LINE_LENGTH) {
      throw new Error(
        `Assertion failed: ${name} length is ${record.length}, expected ${LINE_LENGTH}`,
      );
    }
  }

  function generateDescriptiveRecord(options = {}) {
    const settings = { ...DEFAULT_SETTINGS, ...options.settings };
    const processDate = options.processDate || formatProcessDate(new Date());

    const record = [
      '0',
      SPACE.repeat(17),
      '01',
      settings.institution,
      SPACE.repeat(7),
      settings.userName.padEnd(26, SPACE),
      settings.userId.padStart(6, ZERO),
      settings.entryDescription.padEnd(12, SPACE),
      processDate,
      SPACE.repeat(40),
    ].join('');

    assertRecordLength(record, 'Descriptive record');
    return record;
  }

  function generateDetailRecord(row, options = {}) {
    const settings = { ...DEFAULT_SETTINGS, ...options.settings };

    for (const column of REQUIRED_COLUMNS) {
      if (row[column] === undefined || row[column] === null || row[column].trim() === '') {
        return [null, null];
      }
    }

    const amountText = row.Amount.replace('$', '').replace(',', '').trim();
    const amountInCents = Math.round(parseFloat(amountText) * 100);
    const bsb = row.BSB.trim();
    const account = row.Account.trim();
    const name = row.Name.trim();
    const reference = row.Reference.trim();

    const record = [
      '1',
      bsb,
      account.padStart(9, SPACE),
      SPACE,
      '53',
      String(amountInCents).padStart(10, ZERO),
      name.padEnd(32, SPACE),
      reference.padEnd(18, SPACE),
      bsb,
      account.padStart(9, SPACE),
      settings.remitterName.padEnd(16, SPACE),
      ZERO.repeat(8),
    ].join('');

    assertRecordLength(record, 'Detail record');
    return [record, amountInCents];
  }

  function generateFileTotalRecord(records, totalAmount) {
    const detailRecordCount = records.length - 1;
    const record = [
      '7',
      '999-999',
      SPACE.repeat(12),
      String(totalAmount).padStart(10, ZERO),
      String(totalAmount).padStart(10, ZERO),
      ZERO.repeat(10),
      SPACE.repeat(24),
      String(detailRecordCount).padStart(6, ZERO),
      SPACE.repeat(40),
    ].join('');

    assertRecordLength(record, 'Trailer record');
    return record;
  }

  function parseCsv(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) {
      return [];
    }

    const header = lines[0].split(',').map((value) => value.trim());
    const data = [];

    for (let index = 1; index < lines.length; index += 1) {
      const values = lines[index].split(',');
      if (values.length === 1 && values[0].trim() === '') {
        continue;
      }

      const row = {};
      for (let columnIndex = 0; columnIndex < header.length; columnIndex += 1) {
        const value = values[columnIndex];
        row[header[columnIndex]] = value ? value.trim() : '';
      }
      data.push(row);
    }

    return data;
  }

  function findMissingColumns(rows) {
    const header = rows.length > 0 ? Object.keys(rows[0]) : [];
    return REQUIRED_COLUMNS.filter((column) => !header.includes(column));
  }

  function processCsvToAba(rows, options = {}) {
    const records = [generateDescriptiveRecord(options)];
    let totalAmount = 0;

    for (const row of rows) {
      const [record, amountInCents] = generateDetailRecord(row, options);
      if (record !== null && amountInCents !== null) {
        records.push(record);
        totalAmount += amountInCents;
      }
    }

    records.push(generateFileTotalRecord(records, totalAmount));
    return `${records.join('\n')}\n`;
  }

  function convert(csvText, options = {}) {
    const rows = parseCsv(csvText);
    const missingColumns = findMissingColumns(rows);

    if (missingColumns.length > 0) {
      throw new Error(`Missing required CSV columns: ${missingColumns.join(', ')}`);
    }

    return processCsvToAba(rows, options);
  }

  return Object.freeze({
    DEFAULT_SETTINGS,
    LINE_LENGTH,
    REQUIRED_COLUMNS,
    convert,
    findMissingColumns,
    formatProcessDate,
    generateDescriptiveRecord,
    generateDetailRecord,
    generateFileTotalRecord,
    parseCsv,
    processCsvToAba,
  });
}));
