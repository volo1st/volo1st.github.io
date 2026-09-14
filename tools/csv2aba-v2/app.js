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
    let currentStatus = null;
    let currentError = null;

    function renderStatus() {
      statusMessage.textContent = currentStatus
        ? SiteI18n.translate(currentStatus.key, currentStatus.parameters)
        : '';
    }

    function setStatus(key, parameters = {}) {
      currentStatus = { key, parameters };
      renderStatus();
    }

    function renderError() {
      errorMessage.textContent = '';
      errorList.replaceChildren();
      if (!currentError) return;

      if (Array.isArray(currentError.errors)) {
        errorMessage.textContent = SiteI18n.translate(
          currentError.errors.length === 1 ? 'error.singleIntro' : 'error.multipleIntro',
          { count: currentError.errors.length },
        );
        for (const error of currentError.errors) {
          const item = document.createElement('li');
          item.textContent = SiteI18n.translateError(error);
          errorList.appendChild(item);
        }
      } else if (currentError.key) {
        errorMessage.textContent = SiteI18n.translate(currentError.key, currentError.parameters);
      } else {
        errorMessage.textContent = SiteI18n.translate('error.conversion', {
          detail: SiteI18n.translateError(currentError),
        });
      }
    }

    function clearResult() {
      abaOutput.value = '';
      downloadButton.disabled = true;
      currentStatus = null;
      currentError = null;
      renderStatus();
      renderError();
      errorPanel.hidden = true;
      paymentCount.textContent = '';
      paymentTotal.textContent = '';
      paymentSummary.hidden = true;
    }

    fileInput.addEventListener('change', (event) => {
      clearResult();
      const [file] = event.target.files;

      if (!file) {
        setStatus('status.noFile');
        return;
      }

      setStatus('status.reading', { filename: file.name });
      const reader = new FileReader();

      reader.addEventListener('load', (loadEvent) => {
        csvInput.value = loadEvent.target.result;
        setStatus('status.loaded', { filename: file.name });
      });

      reader.addEventListener('error', () => {
        clearResult();
        const detail = reader.error
          ? reader.error.message
          : SiteI18n.translate('error.noFileReason');
        currentError = { key: 'error.fileRead', parameters: { detail } };
        renderError();
        errorPanel.hidden = false;
        errorPanel.focus();
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
        setStatus('status.complete');
        paymentSummary.focus();
      } catch (error) {
        currentError = error;
        renderError();
        errorPanel.hidden = false;
        errorPanel.focus();
      }
    });

    downloadButton.addEventListener('click', () => {
      if (downloadButton.disabled || abaOutput.value === '') {
        return;
      }

      const sourceFilename = fileInput.files.length > 0 ? fileInput.files[0].name : '';
      const filename = CsvToAbaV2.getDownloadFilename(sourceFilename);
      downloadAbaFile(abaOutput.value, filename);
      setStatus('status.downloaded', { filename });
    });

    window.addEventListener('site-language-change', () => {
      renderStatus();
      renderError();
    });
  });
}());
