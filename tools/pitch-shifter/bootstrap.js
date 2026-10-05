'use strict';

import('./app.mjs?v=7e17198dd124').catch((error) => {
  const status = document.querySelector('#status');
  if (status) {
    status.dataset.tone = 'error';
    status.dataset.visible = 'true';
    status.textContent = globalThis.SiteI18n.translate('pitch.errorStart', {
      detail: error.message || error,
    });
  }
});
