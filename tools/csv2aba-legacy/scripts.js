// """
// csv to aba converter
//
// Copyright (c) 2025 Volo1st
//
// Spec ref: https://www.cemtexaba.com/aba-format/cemtex-aba-file-format-details/
//
// """

// No direct equivalent for Python's csv, sys, datetime, pathlib, enum in a standard browser environment.
// We will use standard JavaScript features and browser APIs (like FileReader for input, Blob/URL for output).

// Constants
const SPACE = ' ';
const ZERO = '0';
const LINE_LENGTH = 120;
const CSV_COLUMNS = new Set(['BSB', 'Reference', 'Name', 'Account', 'Amount']);

// Equivalent of Python's StrEnum
const RecordTypes = {
    DESCRIPTIVE: '0',
    DETAIL: '1',
    FIELD_TOTAL: '7',
};

/**
 * Descriptive Record (Type 0)
 * This is the header record that appears at the start of the file.
 *
 * Char Pos  Field Size  Field Description                                                                             Specification
 * 1         1           Record Type 0                                                                                 Must be ‘0’
 * 2-18      17          Blank                                                                                         Must be space filled
 * 19-20     2           Reel Sequence Number                                                                          Must be numeric starting at 01. Right justified, zero filled
 * 21-23     3           Name of User’s Financial Institution                                                          Must be approved Financial Institution abbreviation. Bank of Queensland’s abbreviation is BQL, Westpac’s abbreviation is “WBC”. Consult your Bank for correct abbreviation.
 * 24-30     7           Blank                                                                                         Must be space filled
 * 31-56     26          Name of User supplying file                                                                   Must be User Preferred Specification as advised by User’s FI. Left justified, blank filled. All coded character set valid. Must not be all blanks.
 * 57-62     6           ID of User supplying file                                                                     Must be User Identification Number which is allocated by APCA. Must be numeric, right justified, zero filled.
 * 63-74     12          Description of entries on file e.g. “PAYROLL”                                                 All coded character set valid. Must not be all blanks. Left justified, blank filled.
 * 75-80     6           Date to be processed (i,e. the date transactions are released to all Financial Institutions)  Must be numeric in the formal of DDMMYY. Must be a valid date. Zero filled.
 * 81-120    40          Blank                                                                                         Must be space filled
 *
 *
 * Note: all unused fields must be blank filled
 *
 * An example type 0 descriptive record for a user name “MY NAME” for the bank BQL is shown below. Note trailing spaces may not be apparent.
 *
 * 0                 01BQL       MY NAME                   1111111004231633  230410
 */
function generate_descriptive_record() {
    // Equivalent of datetime.date.today().strftime('%d%m%y')
    const today = new Date();
    const day = String(today.getDate()).padStart(2, ZERO);
    const month = String(today.getMonth() + 1).padStart(2, ZERO); // Month is 0-indexed
    const year = String(today.getFullYear()).slice(-2);
    const processDate = `${day}${month}${year}`;

    const origin = [
        RecordTypes.DESCRIPTIVE,            // record type
        SPACE.repeat(17),                   // blank
        "01",                               // Reel Sequence Number
        "CBA",                              // Name of User’s Financial Institution
        SPACE.repeat(7),                    // blank
        "Meya".padEnd(26, SPACE),           // Name of User supplying file (ljust)
        "00".padStart(6, ZERO),             // ID of User supplying file FIXME needs to find out this (rjust)
        "PAYROLL".padEnd(12, SPACE),        // Description of entries on file e.g. “PAYROLL” (ljust)
        processDate,                        // Date to be processed DDMMYY
        SPACE.repeat(40),                   // blank
    ];

    const descriptive_record = origin.join('');
    // Equivalent of assert len(descriptive_record) == LINE_LENGTH
    if (descriptive_record.length !== LINE_LENGTH) {
        throw new Error(`Assertion failed: Descriptive record length is ${descriptive_record.length}, expected ${LINE_LENGTH}`);
    }

    return descriptive_record;
}


/**
 * Detail Record (Type 1)
 * These records contain the individual transaction details. An optional terminating balancing record is required by some banks to net out the debits and credits totals.
 *
 * Char Pos  Field Size  Field Description                            Specification
 * 1         1           Record Type 1                                Must be ‘1’
 * 2-8       7           Bank/State/Branch Number                     Must be numeric with hyphen in character position 5. Character positions 2 and 3 must equal valid Financial Institution number. Character position 4 must equal a valid state number (0-9). For credits to Employee Benefits Card accounts, field must always contain BSB 032-898
 * 9-17      9           Account number to be credited/debited        Numeric, hyphens and blanks only are valid. Must not contain all blanks (unless a credit card transaction) or zeros. Leading zeros which are part of a valid account number must be shown, e.g. 00-1234. Where account number exceeds nine characters, edit out hyphens. Right justified, blank filled.
 *                                                                         For credits to Employee Benefits Card accounts, Account Number field must always be 999999
 * 18        1           Indicator                                    ”N” – for new or varied Bank/State/Branch number or name details, otherwise blank filled.
 *                                                                      Withholding Tax Indicators:
 *                                                                          “W” – dividend paid to a resident of a country where a double tax agreement is in force.
 *                                                                          “X” – dividend paid to a resident of any other country.
 *                                                                          “Y” – interest paid to all non-residents. The amount of withholding tax is to appear in character positions 113-120.
 *                                                                          Note: Where withholding tax has been deducted the appropriate Indicator as shown above is to be used and will override the normal indicator.
 * 19-20     2           Transaction Code                             Usually 53 (see Transaction Codes section)
 * 21-30     10          Amount                                       Only numeric valid. Must be greater than zero. Shown in cents without punctuations. Right justified, zero filled. Unsigned.
 * 31-62     32          Title of Account to be credited/debited      All coded character set valid. Must not be all blanks. Left justified, blank filled. Desirable Format for Transaction Account credits:
 *                                                                          - Surname (period) Blank
 *                                                                          - given name with blanks between each name
 * 63-80     18          Lodgement Reference                          All coded character set valid. Field must be left justified. No leading spaces, zeroes, hyphens or other characters can be included.
 *                                                                           For Employee Benefits Card payments, must contain only the 16 character Employee Benefits Card number; for example 5550033890123456.
 * 81-87     7           Trace Record (BSB Number in format XXX-XXX)  Bank (FI)/State/Branch and account number of User to enable retracing of the entry to its source if necessary. Only numeric and hyphens valid. Character positions 81 & 82 must equal a valid Financial Institution number. Character position 83 must equal a valid State number (0-9). Character position 84 must be a hyphen.
 * 88-96     9           Trace Account Number                         Right justified, blank filled
 * 97-112    16          Name of Remitter                             Name of originator of the entry. This may vary from Name of the User. All coded character set valid. Must not contain all blanks. Left justified, blank filled.
 * 113-120   8           Amount of Withholding Tax                    Numeric only valid. Show in cents without punctuation. Right justified, zero filled. Unsigned.
 *
 * Note: all unused fields must be blank filled
 *
 * An example type 1 detail record is shown below. Note the transaction code is 53 and that the account number is ficticious. Multiple type 1 detail records are combined to create a full batch.
 *
 * 1000-000157108231 530000001234S R SMITH                       TEST BATCH        062-000 12223123MY ACCOUNT      00001200
 */
function generate_detail_record(row) {
    // FIXME
    // - double check if BSB and Acc are the same with trace BSB and acc
    // -
    // Equivalent of any(row[c] == '' for c in CSV_COLUMNS)
    for (const col of CSV_COLUMNS) {
        if (row[col] === undefined || row[col] === null || row[col].trim() === '') {
            // XXX note from the example csv we might have trailing blank rows
            return [null, null];
        }
    }

    // XXX note from the example, Little Rabbit is including the dollar sign, we need to get rid of it
    const amountStr = row['Amount'].replace('$', '').replace(',', '').trim();
    const amount_in_cents = Math.round(parseFloat(amountStr) * 100); // Use Math.round for precision

    const bsb = row['BSB'].trim();
    const account = row['Account'].trim();
    const name = row['Name'].trim();
    const reference = row['Reference'].trim();

    const detail_record = [
        RecordTypes.DETAIL,                     // 1  Record type for detail
        bsb,                                    // 7  BSB
        account.padStart(9, SPACE),             // 9  character Account Number (rjust)
        ' ',                                    // 1  Indicator
        '53',                                   // 2  transaction_code, 53 means "Pay"
        String(amount_in_cents).padStart(10, ZERO), // 10 Amount in cents, right-aligned, 10 digits (rjust)
        name.padEnd(32, SPACE),                 // 32 Title of account (ljust)
        reference.padEnd(18, SPACE),            // 18 lodgement Reference (ljust)
        bsb,                                    // 7  Trace Record (BSB Number in format XXX-XXX)
        account.padStart(9, SPACE),             // 9  Trace Account Number (rjust)
        "Meya".padEnd(16, SPACE),               // 16 Name of Remitter (ljust)
        ZERO.repeat(8),                         // 8  Amount of Withholding Tax, assume no tax
    ].join('');

    // Equivalent of assert len(detail_record) == LINE_LENGTH
    if (detail_record.length !== LINE_LENGTH) {
        throw new Error(`Assertion failed: Detail record length is ${detail_record.length}, expected ${LINE_LENGTH}`);
    }

    return [detail_record, amount_in_cents];
}


/**
 * File Total Record (Type 7)
 * This record appears at the end of the file and contains control totals. If the optional balancing record is included, then the credit and debit totals will be equal and the net total amount will be zero.
 *
 * Char Pos  Field Size  Field Description                    Specification
 * 1         1           Record Type 7                        Must be ‘7’
 * 2-8       7           BSB Format Filler                    Must be ‘999-999’
 * 9-20      12          Blank                                Must be space filled
 * 21-30     10          File (User) Net Total Amount         Numeric only valid. Must equal the difference between File Credit & File Debit Total Amounts. Show in cents without punctuation. Right justified, zero filled. Unsigned.
 * 31-40     10          File (User) Credit Total Amount      Numeric only valid. Must equal the accumulated total of credit Detail Record amounts. Show in cents without punctuation. Right justified, zero filled. Unsigned.
 * 41-50     10          File (User) Debit Total Amount       Numeric only valid. Must equal the accumulated total of debit Detail Record amounts. Show in cents without punctuation. Right justified, zero filled. Unsigned.
 * 51-74     24          Blank                                Must be space filled
 * 75-80     6           File (user) count of Records Type 1  Numeric only valid. Must equal accumulated number of Record Type 1 items on the file. Right justified, zero filled.
 * 81-120    40          Blank                                Must be space filled
 *
 * Note: all unused fields must be blank filled
 *
 * An example type 8 file total record is shown below. The net total and credit total amounts assume four of the above example type 1 records were included in the batch (record count = 4). Note the example below may not show all trailing spaces.
 *
 * 7999-999            000312924700031292470000000000                        000004
 */
function generate_file_total_record(aba_content, total_amount) {
    // The number of detail records is the total number of records minus the descriptive record (index 0)
    const detail_record_count = aba_content.length - 1;

    const trailer_record = [
        RecordTypes.FIELD_TOTAL,                    // Record type 7
        '999-999',                                  // BSB Format Filler
        SPACE.repeat(12),                           // BLANK
        String(total_amount).padStart(10, ZERO),    // File (User) Net Total Amount (rjust)
        String(total_amount).padStart(10, ZERO),    // File (User) Credit Total Amount (rjust)
        ZERO.repeat(10),                            // File (User) Debit Total Amount (rjust) - Assuming only credits based on the example
        SPACE.repeat(24),                           // BLANK
        String(detail_record_count).padStart(6, ZERO), // Number of transactions (detailed record) (rjust)
        SPACE.repeat(40),                           // BLANK
    ].join('');

    // Equivalent of assert len(trailer_record) == LINE_LENGTH
    if (trailer_record.length !== LINE_LENGTH) {
        throw new Error(`Assertion failed: Trailer record length is ${trailer_record.length}, expected ${LINE_LENGTH}`);
    }

    return trailer_record;
}

/**
 * Simple CSV parser function to mimic csv.DictReader.
 * Assumes the first row is the header.
 * @param {string} csvText - The content of the CSV file.
 * @returns {Array<Object>} An array of objects, where each object represents a row
 *                          and keys are column headers.
 */
function parseCsv(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) {
        return [];
    }

    const header = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        // Skip empty lines
        if (values.length === 1 && values[0].trim() === '') {
            continue;
        }
        const rowObject = {};
        for (let j = 0; j < header.length; j++) {
            rowObject[header[j]] = values[j] ? values[j].trim() : '';
        }
        data.push(rowObject);
    }
    return data;
}

/**
 * Main function logic adapted for browser environment.
 * Takes parsed CSV data and generates ABA content.
 * @param {Array<Object>} csvData - Parsed CSV data (array of row objects).
 * @returns {string} The complete ABA file content as a string.
 */
function processCsvToAba(csvData) {
    const aba_content = [];
    aba_content.push(generate_descriptive_record());

    let total_amount = 0;

    for (const row of csvData) {
        const [detail_record, amount_in_cents] = generate_detail_record(row);
        if (detail_record !== null && amount_in_cents !== null) {
            aba_content.push(detail_record);
            total_amount += amount_in_cents;
        }
    }

    aba_content.push(generate_file_total_record(aba_content, total_amount));

    // Join lines with newline and add a final newline at the end
    return aba_content.join('\n') + '\n';
}

// --- Browser specific code to handle file input and output ---

// Function to trigger file download
function downloadAbaFile(abaContent, filename) {
    const blob = new Blob([abaContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a); // Append to body is necessary for Firefox
    a.click();

    document.body.removeChild(a); // Clean up the element
    URL.revokeObjectURL(url); // Free up memory
}


function csv2aba(text) {
	const csvData = parseCsv(text);

	// Check if required columns exist in the header
	const header = csvData.length > 0 ? Object.keys(csvData[0]) : [];
	const missingColumns = Array.from(CSV_COLUMNS).filter(col => !header.includes(col));

	if (missingColumns.length > 0) {
	     const errorMessage = `Error: Missing required CSV columns: ${missingColumns.join(', ')}`;
	     console.error(errorMessage);
	     if (statusMessage) statusMessage.textContent = errorMessage;
	     return;
	}

	const abaContent = processCsvToAba(csvData);
	return abaContent;
}

function generateDownload() {
        const abaOutput = document.getElementById('aba');
        const fileInput = document.getElementById('csvFileInput');

	let abaFilename = '';

	if (fileInput.files.length > 0) {
	    const originalFilename = fileInput.files[0].name;
	    abaFilename = originalFilename.replace(/\.csv$/i, '.aba');
	} else {
	    abaFilename = `${Date.now()}.aba`;
	}

	const abaContent = abaOutput.value;

	downloadAbaFile(abaContent, abaFilename);

	if (statusMessage) statusMessage.textContent = `ABA file "${abaFilename}" generated successfully!`;

}

// Event listener for the file input element
// Assumes there is an HTML input element with id="csvFileInput"
// and a status element with id="statusMessage"
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('csvFileInput');
    const statusMessage = document.getElementById('statusMessage');
    const errorMessage = document.getElementById('errorMessage');

    const csvInput = document.getElementById('csv');
    const abaOutput = document.getElementById('aba');

    const downloadButton = document.getElementById('downloadAba');

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];

        if (!file) {
            if (statusMessage) statusMessage.textContent = "No file selected.";
            return;
        }

        if (statusMessage) statusMessage.textContent = `Processing "${file.name}"...`;

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const csvText = e.target.result;

		csvInput.value = csvText;
		abaOutput.value = "";

            } catch (error) {
                console.error("Error processing file:", error);
                if (statusMessage) statusMessage.textContent = `Error: ${error.message}`;
            }
        };

        reader.onerror = (e) => {
            console.error("Error reading file:", reader.error);
            if (statusMessage) statusMessage.textContent = `Error reading file: ${reader.error.message}`;
        };

        reader.readAsText(file);
    });

    const convertButton = document.getElementById('convert');
    convertButton.addEventListener('click', (event) => {
        const csvText = csvInput.value;
	abaContent = csv2aba(csvText);
        abaOutput.value = abaContent;
	downloadButton.disabled = false;
    });

    downloadButton.addEventListener('click', generateDownload);
});
