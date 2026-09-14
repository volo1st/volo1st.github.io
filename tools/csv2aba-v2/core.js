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
      throw createError('record_length', {
        actual: record.length,
        expected: LINE_LENGTH,
        record: name,
      },
        `Assertion failed: ${name} length is ${record.length}, expected ${LINE_LENGTH}`,
      );
    }
  }

  function createError(code, parameters, message) {
    const error = new Error(message);
    error.code = code;
    error.parameters = Object.freeze({ ...parameters });
    return error;
  }

  function getRowName(row) {
    return row.sourceRow ? `CSV line ${row.sourceRow}` : 'CSV row';
  }

  function parseAmountToCents(value, row = {}) {
    const amount = String(value).trim();
    const match = /^\$?((?:\d+)|(?:[1-9]\d{0,2}(?:,\d{3})+))(?:\.(\d{1,2}))?$/.exec(amount);
    const rowName = getRowName(row);

    if (!match) {
      throw createError('amount_format', { row: row.sourceRow },
        `${rowName} field Amount must be a positive amount with no more than two decimal places.`,
      );
    }

    const dollars = match[1].replaceAll(',', '');
    const cents = (match[2] || '').padEnd(2, ZERO);
    const amountInCents = BigInt(dollars) * 100n + BigInt(cents || ZERO);

    if (amountInCents === 0n) {
      throw createError(
        'amount_zero',
        { row: row.sourceRow },
        `${rowName} field Amount must be greater than zero.`,
      );
    }
    if (amountInCents > BigInt(MAX_AMOUNT_CENTS)) {
      throw createError(
        'amount_limit',
        { row: row.sourceRow },
        `${rowName} field Amount exceeds the ABA limit of $99,999,999.99.`,
      );
    }

    return Number(amountInCents);
  }

  function validateRequiredField(row, fieldName) {
    const rowName = getRowName(row);
    if (row[fieldName] === undefined || row[fieldName] === null) {
      throw createError(
        'field_required',
        { field: fieldName, row: row.sourceRow },
        `${rowName} field ${fieldName} is required.`,
      );
    }

    const rawValue = String(row[fieldName]);
    if (rawValue.trim() === '') {
      throw createError(
        'field_required',
        { field: fieldName, row: row.sourceRow },
        `${rowName} field ${fieldName} is required.`,
      );
    }
    if (/[\r\n]/.test(rawValue)) {
      throw createError(
        'field_line_break',
        { field: fieldName, row: row.sourceRow },
        `${rowName} field ${fieldName} contains a line break.`,
      );
    }
    if (/[\u0000-\u001F\u007F]/.test(rawValue)) {
      throw createError(
        'field_control_character',
        { field: fieldName, row: row.sourceRow },
        `${rowName} field ${fieldName} contains a control character.`,
      );
    }

    return rawValue.trim();
  }

  function inspectDetailRow(row) {
    const values = {};
    const errors = [];
    for (const fieldName of REQUIRED_COLUMNS) {
      try {
        values[fieldName] = validateRequiredField(row, fieldName);
      } catch (error) {
        errors.push(error);
      }
    }

    const rowName = getRowName(row);
    if (values.BSB && !/^\d{3}-\d{3}$/.test(values.BSB)) {
      errors.push(createError(
        'bsb_format',
        { row: row.sourceRow },
        `${rowName} field BSB must have the format NNN-NNN.`,
      ));
    }
    if (values.Account && values.Account.length > 9) {
      errors.push(createError(
        'account_length',
        { row: row.sourceRow },
        `${rowName} field Account must not exceed 9 characters.`,
      ));
    }
    if (values.Account && !/^[0-9 -]+$/.test(values.Account)) {
      errors.push(createError(
        'account_characters',
        { row: row.sourceRow },
        `${rowName} field Account can contain only digits, spaces, and hyphens.`,
      ));
    } else if (values.Account && !/[1-9]/.test(values.Account)) {
      errors.push(createError(
        'account_non_zero',
        { row: row.sourceRow },
        `${rowName} field Account must contain a non-zero digit.`,
      ));
    }
    if (values.Name && values.Name.length > 32) {
      errors.push(createError(
        'name_length',
        { row: row.sourceRow },
        `${rowName} field Name must not exceed 32 characters.`,
      ));
    }
    if (values.Reference && values.Reference.length > 18) {
      errors.push(createError(
        'reference_length',
        { row: row.sourceRow },
        `${rowName} field Reference must not exceed 18 characters.`,
      ));
    }

    let amountInCents;
    if (values.Amount) {
      try {
        amountInCents = parseAmountToCents(values.Amount, row);
      } catch (error) {
        errors.push(error);
      }
    }

    return {
      errors,
      values: {
        ...values,
        amountInCents,
        sourceRow: row.sourceRow,
      },
    };
  }

  function validateDetailRow(row) {
    const result = inspectDetailRow(row);
    if (result.errors.length > 0) {
      throw result.errors[0];
    }
    return result.values;
  }

  function validateDetailRows(rows) {
    const errors = [];
    const values = [];

    for (const row of rows) {
      const result = inspectDetailRow(row);
      errors.push(...result.errors);
      values.push(result.values);
    }

    if (errors.length > 0) {
      const message = errors.length === 1
        ? errors[0].message
        : `Payment data has ${errors.length} errors.`;
      const error = createError('payment_errors', { count: errors.length }, message);
      error.name = 'PaymentValidationError';
      error.errors = Object.freeze(errors);
      throw error;
    }

    return values;
  }

  function buildDetailRecord(values, settings) {
    const record = [
      '1',
      values.BSB,
      values.Account.padStart(9, SPACE),
      SPACE,
      '53',
      String(values.amountInCents).padStart(10, ZERO),
      values.Name.padEnd(32, SPACE),
      values.Reference.padEnd(18, SPACE),
      values.BSB,
      values.Account.padStart(9, SPACE),
      settings.remitterName.padEnd(16, SPACE),
      ZERO.repeat(8),
    ].join('');

    assertRecordLength(record, 'Detail record');
    return {
      amountInCents: values.amountInCents,
      record,
    };
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
    const values = validateDetailRow(row);
    const result = buildDetailRecord(values, settings);
    return [result.record, result.amountInCents];
  }

  function generateFileTotalRecord(records, totalAmount) {
    const detailRecordCount = records.length - 1;
    if (detailRecordCount > MAX_DETAIL_RECORDS) {
      throw createError(
        'record_count_limit',
        { limit: MAX_DETAIL_RECORDS },
        `ABA detail record count exceeds ${MAX_DETAIL_RECORDS}.`,
      );
    }
    if (!Number.isSafeInteger(totalAmount) || totalAmount < 0 || totalAmount > MAX_AMOUNT_CENTS) {
      throw createError(
        'total_limit',
        {},
        'ABA payment total exceeds the limit of $99,999,999.99.',
      );
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
        throw createError(
          'csv_text_after_quote',
          { line: lineNumber },
          `CSV line ${lineNumber} has text after a closing quotation mark.`,
        );
      }

      if (character === '"') {
        if (field !== '') {
          throw createError(
            'csv_quote_in_unquoted_field',
            { line: lineNumber },
            `CSV line ${lineNumber} has a quotation mark inside an unquoted field.`,
          );
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
      throw createError(
        'csv_open_quote',
        { line: recordLineNumber },
        `CSV line ${recordLineNumber} has an open quotation mark.`,
      );
    }

    if (field !== '' || fields.length > 0 || afterQuote) {
      finishRecord();
    }

    return records;
  }

  function parseCsv(csvText) {
    const records = readCsvRecords(csvText);
    if (records.length === 0) {
      throw createError('csv_empty', {}, 'CSV input is empty.');
    }

    const headers = records[0].fields.map((value) => value.trim());
    const emptyHeaderIndex = headers.indexOf('');
    if (emptyHeaderIndex !== -1) {
      throw createError(
        'csv_empty_header',
        { column: emptyHeaderIndex + 1 },
        `CSV header ${emptyHeaderIndex + 1} is empty.`,
      );
    }

    const duplicateHeaders = headers.filter(
      (header, index) => headers.indexOf(header) !== index,
    );
    if (duplicateHeaders.length > 0) {
      const headers = [...new Set(duplicateHeaders)].join(', ');
      throw createError(
        'csv_duplicate_headers',
        { headers },
        `CSV has duplicate headers: ${headers}`,
      );
    }

    const missingColumns = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
    if (missingColumns.length > 0) {
      const columns = missingColumns.join(', ');
      throw createError(
        'csv_missing_columns',
        { columns },
        `Missing required CSV columns: ${columns}`,
      );
    }

    const unexpectedColumns = headers.filter((header) => !REQUIRED_COLUMNS.includes(header));
    if (unexpectedColumns.length > 0) {
      const columns = unexpectedColumns.join(', ');
      throw createError(
        'csv_unexpected_columns',
        { columns },
        `CSV has unexpected columns: ${columns}`,
      );
    }

    const data = [];
    for (const record of records.slice(1)) {
      if (record.fields.length !== headers.length) {
        throw createError('csv_field_count', {
          actual: record.fields.length,
          expected: headers.length,
          line: record.lineNumber,
        },
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

  function processCsvToAbaResult(rows, options = {}) {
    if (rows.length === 0) {
      throw createError('csv_no_payment_rows', {}, 'CSV does not contain a payment row.');
    }

    const validatedRows = validateDetailRows(rows);
    const settings = { ...DEFAULT_SETTINGS, ...options.settings };
    const records = [generateDescriptiveRecord(options)];
    let totalAmount = 0;

    for (const values of validatedRows) {
      const result = buildDetailRecord(values, settings);
      if (totalAmount > MAX_AMOUNT_CENTS - result.amountInCents) {
        throw createError('total_overflow_at_row', { row: values.sourceRow },
          `${getRowName(values)} makes the ABA payment total exceed $99,999,999.99.`,
        );
      }
      records.push(result.record);
      totalAmount += result.amountInCents;
    }

    records.push(generateFileTotalRecord(records, totalAmount));
    return Object.freeze({
      abaContent: `${records.join('\n')}\n`,
      paymentCount: records.length - 2,
      totalAmountCents: totalAmount,
    });
  }

  function processCsvToAba(rows, options = {}) {
    return processCsvToAbaResult(rows, options).abaContent;
  }

  function convertWithSummary(csvText, options = {}) {
    const rows = parseCsv(csvText);
    return processCsvToAbaResult(rows, options);
  }

  function convert(csvText, options = {}) {
    return convertWithSummary(csvText, options).abaContent;
  }

  function formatAmount(amountInCents) {
    if (!Number.isSafeInteger(amountInCents) || amountInCents < 0) {
      throw createError(
        'amount_display_invalid',
        {},
        'Amount display value must be a non-negative integer.',
      );
    }

    const dollars = String(Math.floor(amountInCents / 100)).replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ',',
    );
    const cents = String(amountInCents % 100).padStart(2, ZERO);
    return `$${dollars}.${cents}`;
  }

  function getDownloadFilename(sourceFilename, timestamp = Date.now()) {
    if (sourceFilename) {
      const filename = String(sourceFilename);
      return /\.csv$/i.test(filename)
        ? filename.replace(/\.csv$/i, '.aba')
        : `${filename}.aba`;
    }
    return `${timestamp}.aba`;
  }

  return Object.freeze({
    DEFAULT_SETTINGS,
    LINE_LENGTH,
    MAX_AMOUNT_CENTS,
    MAX_DETAIL_RECORDS,
    REQUIRED_COLUMNS,
    convert,
    convertWithSummary,
    findMissingColumns,
    formatProcessDate,
    formatAmount,
    generateDescriptiveRecord,
    generateDetailRecord,
    generateFileTotalRecord,
    getDownloadFilename,
    parseCsv,
    parseAmountToCents,
    processCsvToAba,
    processCsvToAbaResult,
    readCsvRecords,
    validateDetailRow,
    validateDetailRows,
  });
}));
