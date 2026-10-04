'use strict';

import('./app.mjs?v=a7d6cb1ff8b4').catch((error) => {
  const status = document.querySelector('#status');
  if (status) {
    status.dataset.tone = 'error';
    status.dataset.visible = 'true';
    status.textContent = globalThis.SiteI18n.translate('pitch.errorStart', {
      detail: error.message || error,
    });
  }
});
