(function initializeApp() {
  'use strict';

  function downloadAbaFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function getDownloadName(fileInput) {
    if (fileInput.files.length > 0) {
      return fileInput.files[0].name.replace(/\.csv$/i, '.aba');
    }
    return `${Date.now()}.aba`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('csvFileInput');
    const csvInput = document.getElementById('csv');
    const abaOutput = document.getElementById('aba');
    const convertButton = document.getElementById('convert');
    const downloadButton = document.getElementById('downloadAba');
    const statusMessage = document.getElementById('statusMessage');
    const errorPanel = document.getElementById('errorPanel');
    const errorMessage = document.getElementById('errorMessage');
    const errorList = document.getElementById('errorList');
    const paymentSummary = document.getElementById('paymentSummary');
    const paymentCount = document.getElementById('paymentCount');
    const paymentTotal = document.getElementById('paymentTotal');

    function clearResult() {
      abaOutput.value = '';
      downloadButton.disabled = true;
      statusMessage.textContent = '';
      errorMessage.textContent = '';
      errorList.replaceChildren();
      errorPanel.hidden = true;
      paymentCount.textContent = '';
      paymentTotal.textContent = '';
      paymentSummary.hidden = true;
    }

    fileInput.addEventListener('change', (event) => {
      clearResult();
      const [file] = event.target.files;

      if (!file) {
        statusMessage.textContent = 'No file selected.';
        return;
      }

      statusMessage.textContent = `Reading "${file.name}".`;
      const reader = new FileReader();

      reader.addEventListener('load', (loadEvent) => {
        csvInput.value = loadEvent.target.result;
        statusMessage.textContent = `Loaded "${file.name}".`;
      });

      reader.addEventListener('error', () => {
        clearResult();
        const detail = reader.error ? reader.error.message : 'The browser did not give a reason.';
        errorMessage.textContent = `File read error: ${detail}`;
        errorPanel.hidden = false;
      });

      reader.readAsText(file);
    });

    csvInput.addEventListener('input', clearResult);

    convertButton.addEventListener('click', () => {
      clearResult();

      try {
        const result = CsvToAbaV2.convertWithSummary(csvInput.value);
        abaOutput.value = result.abaContent;
        paymentCount.textContent = String(result.paymentCount);
        paymentTotal.textContent = CsvToAbaV2.formatAmount(result.totalAmountCents);
        paymentSummary.hidden = false;
        downloadButton.disabled = false;
        statusMessage.textContent = 'Conversion is complete. Review the summary before download.';
      } catch (error) {
        if (Array.isArray(error.errors)) {
          errorMessage.textContent = error.errors.length === 1
            ? 'Conversion stopped. Fix this error:'
            : `Conversion stopped. Fix these ${error.errors.length} errors:`;
          for (const message of error.errors) {
            const item = document.createElement('li');
            item.textContent = message;
            errorList.appendChild(item);
          }
        } else {
          errorMessage.textContent = `Conversion error: ${error.message}`;
        }
        errorPanel.hidden = false;
      }
    });

    downloadButton.addEventListener('click', () => {
      if (downloadButton.disabled || abaOutput.value === '') {
        return;
      }

      const filename = getDownloadName(fileInput);
      downloadAbaFile(abaOutput.value, filename);
      statusMessage.textContent = `Downloaded "${filename}".`;
    });
  });
}());
