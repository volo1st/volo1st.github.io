'use strict';

import('./app.mjs?v=8cf14ea7d0d9').catch((error) => {
  const status = document.querySelector('#status');
  if (status) {
    status.dataset.tone = 'error';
    status.textContent = globalThis.SiteI18n.translate('pitch.errorStart', {
      detail: error.message || error,
    });
  }
});
