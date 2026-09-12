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
  const MAX_AMOUNT_CENTS = 9999999999;
  const MAX_DETAIL_RECORDS = 999999;
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

  function getRowName(row) {
    return row.sourceRow ? `CSV line ${row.sourceRow}` : 'CSV row';
  }

  function parseAmountToCents(value, row = {}) {
    const amount = String(value).trim();
    const match = /^\$?((?:\d+)|(?:[1-9]\d{0,2}(?:,\d{3})+))(?:\.(\d{1,2}))?$/.exec(amount);
    const rowName = getRowName(row);

    if (!match) {
      throw new Error(
        `${rowName} field Amount must be a positive amount with no more than two decimal places.`,
      );
    }

    const dollars = match[1].replaceAll(',', '');
    const cents = (match[2] || '').padEnd(2, ZERO);
    const amountInCents = BigInt(dollars) * 100n + BigInt(cents || ZERO);

    if (amountInCents === 0n) {
      throw new Error(`${rowName} field Amount must be greater than zero.`);
    }
    if (amountInCents > BigInt(MAX_AMOUNT_CENTS)) {
      throw new Error(`${rowName} field Amount exceeds the ABA limit of $99,999,999.99.`);
    }

    return Number(amountInCents);
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
    const amountInCents = parseAmountToCents(row.Amount, row);

    for (const column of REQUIRED_COLUMNS) {
      if (row[column] === undefined || row[column] === null || row[column].trim() === '') {
        return [null, null];
      }
      if (/[\r\n]/.test(row[column])) {
        const source = row.sourceRow ? `CSV line ${row.sourceRow}` : 'CSV row';
        throw new Error(`${source} field ${column} contains a line break.`);
      }
    }

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
    if (detailRecordCount > MAX_DETAIL_RECORDS) {
      throw new Error(`ABA detail record count exceeds ${MAX_DETAIL_RECORDS}.`);
    }
    if (!Number.isSafeInteger(totalAmount) || totalAmount < 0 || totalAmount > MAX_AMOUNT_CENTS) {
      throw new Error('ABA payment total exceeds the limit of $99,999,999.99.');
    }
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

  function readCsvRecords(csvText) {
    const text = String(csvText).replace(/^\uFEFF/, '');
    const records = [];
    let fields = [];
    let field = '';
    let inQuotes = false;
    let afterQuote = false;
    let lineNumber = 1;
    let recordLineNumber = 1;

    function finishField() {
      fields.push(field);
      field = '';
      afterQuote = false;
    }

    function finishRecord() {
      finishField();
      const isBlank = fields.length === 1 && fields[0].trim() === '';
      if (!isBlank) {
        records.push({ fields, lineNumber: recordLineNumber });
      }
      fields = [];
      recordLineNumber = lineNumber + 1;
    }

    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];

      if (inQuotes) {
        if (character === '"') {
          if (text[index + 1] === '"') {
            field += '"';
            index += 1;
          } else {
            inQuotes = false;
            afterQuote = true;
          }
        } else if (character === '\r' || character === '\n') {
          if (character === '\r' && text[index + 1] === '\n') {
            index += 1;
          }
          field += '\n';
          lineNumber += 1;
        } else {
          field += character;
        }
        continue;
      }

      if (afterQuote) {
        if (character === ',') {
          finishField();
          continue;
        }
        if (character === '\r' || character === '\n') {
          if (character === '\r' && text[index + 1] === '\n') {
            index += 1;
          }
          finishRecord();
          lineNumber += 1;
          recordLineNumber = lineNumber;
          continue;
        }
        throw new Error(`CSV line ${lineNumber} has text after a closing quotation mark.`);
      }

      if (character === '"') {
        if (field !== '') {
          throw new Error(`CSV line ${lineNumber} has a quotation mark inside an unquoted field.`);
        }
        inQuotes = true;
      } else if (character === ',') {
        finishField();
      } else if (character === '\r' || character === '\n') {
        if (character === '\r' && text[index + 1] === '\n') {
          index += 1;
        }
        finishRecord();
        lineNumber += 1;
        recordLineNumber = lineNumber;
      } else {
        field += character;
      }
    }

    if (inQuotes) {
      throw new Error(`CSV line ${recordLineNumber} has an open quotation mark.`);
    }

    if (field !== '' || fields.length > 0 || afterQuote) {
      finishRecord();
    }

    return records;
  }

  function parseCsv(csvText) {
    const records = readCsvRecords(csvText);
    if (records.length === 0) {
      throw new Error('CSV input is empty.');
    }

    const headers = records[0].fields.map((value) => value.trim());
    const emptyHeaderIndex = headers.indexOf('');
    if (emptyHeaderIndex !== -1) {
      throw new Error(`CSV header ${emptyHeaderIndex + 1} is empty.`);
    }

    const duplicateHeaders = headers.filter(
      (header, index) => headers.indexOf(header) !== index,
    );
    if (duplicateHeaders.length > 0) {
      throw new Error(`CSV has duplicate headers: ${[...new Set(duplicateHeaders)].join(', ')}`);
    }

    const missingColumns = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
    if (missingColumns.length > 0) {
      throw new Error(`Missing required CSV columns: ${missingColumns.join(', ')}`);
    }

    const unexpectedColumns = headers.filter((header) => !REQUIRED_COLUMNS.includes(header));
    if (unexpectedColumns.length > 0) {
      throw new Error(`CSV has unexpected columns: ${unexpectedColumns.join(', ')}`);
    }

    const data = [];
    for (const record of records.slice(1)) {
      if (record.fields.length !== headers.length) {
        throw new Error(
          `CSV line ${record.lineNumber} has ${record.fields.length} fields; expected ${headers.length}.`,
        );
      }

      const row = {};
      for (let index = 0; index < headers.length; index += 1) {
        row[headers[index]] = record.fields[index];
      }
      Object.defineProperty(row, 'sourceRow', {
        value: record.lineNumber,
        enumerable: false,
      });
      data.push(row);
    }

    Object.defineProperty(data, 'headers', {
      value: headers,
      enumerable: false,
    });
    return data;
  }

  function findMissingColumns(rows) {
    const headers = rows.headers || (rows.length > 0 ? Object.keys(rows[0]) : []);
    return REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
  }

  function processCsvToAba(rows, options = {}) {
    if (rows.length === 0) {
      throw new Error('CSV does not contain a payment row.');
    }

    const records = [generateDescriptiveRecord(options)];
    let totalAmount = 0;

    for (const row of rows) {
      const [record, amountInCents] = generateDetailRecord(row, options);
      if (record !== null && amountInCents !== null) {
        if (totalAmount > MAX_AMOUNT_CENTS - amountInCents) {
          throw new Error(
            `${getRowName(row)} makes the ABA payment total exceed $99,999,999.99.`,
          );
        }
        records.push(record);
        totalAmount += amountInCents;
      }
    }

    records.push(generateFileTotalRecord(records, totalAmount));
    return `${records.join('\n')}\n`;
  }

  function convert(csvText, options = {}) {
    const rows = parseCsv(csvText);
    return processCsvToAba(rows, options);
  }

  return Object.freeze({
    DEFAULT_SETTINGS,
    LINE_LENGTH,
    MAX_AMOUNT_CENTS,
    MAX_DETAIL_RECORDS,
    REQUIRED_COLUMNS,
    convert,
    findMissingColumns,
    formatProcessDate,
    generateDescriptiveRecord,
    generateDetailRecord,
    generateFileTotalRecord,
    parseCsv,
    parseAmountToCents,
    processCsvToAba,
    readCsvRecords,
  });
}));
