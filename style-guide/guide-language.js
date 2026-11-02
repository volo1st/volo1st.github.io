(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) {
    root.StyleGuideLanguage = api;
    root.document.addEventListener('DOMContentLoaded', () => {
      const update = api.initialize(root.document, root.SiteI18n);
      root.addEventListener('site-language-change', update);
    });
  }
}(typeof globalThis === 'undefined' ? this : globalThis, function () {
  'use strict';

  function elements(root) {
    return [root, ...root.querySelectorAll('*')];
  }

  function applyLanguageSample(element, language) {
    const sample = element.getAttribute('data-guide-language');
    if (!sample) return;
    const selected = sample === language;
    element.disabled = selected;
    element.setAttribute('aria-pressed', String(selected));
    if (selected) element.setAttribute('disabled', '');
    else element.removeAttribute('disabled');
  }

  // Localize a detached authored example, including its root element.
  function localizeSnapshot(root, i18n) {
    root.setAttribute('lang', i18n.getLanguage());
    for (const element of elements(root)) {
      const text = element.getAttribute('data-i18n');
      if (text) element.textContent = i18n.translate(text);
      const label = element.getAttribute('data-i18n-aria-label');
      if (label) element.setAttribute('aria-label', i18n.translate(label));
      const value = element.getAttribute('data-guide-value');
      if (value) {
        const translated = i18n.translate(value);
        element.value = translated;
        if (element.tagName === 'TEXTAREA') element.textContent = translated;
        else element.setAttribute('value', translated);
      }
      applyLanguageSample(element, i18n.getLanguage());
    }
  }

  function initialize(document, i18n) {
    const edited = new WeakSet();
    const values = [...document.querySelectorAll('[data-guide-value]')];
    // Preserve edits and browser-restored values, including an intentionally empty field.
    const previous = new Map(values.map(element => [element, element.defaultValue]));
    for (const element of values) {
      element.addEventListener('input', () => edited.add(element));
      element.addEventListener('change', () => edited.add(element));
    }
    function update() {
      for (const element of values) {
        if (edited.has(element) || element.value !== previous.get(element)) continue;
        const value = i18n.translate(element.getAttribute('data-guide-value'));
        element.value = value;
        previous.set(element, value);
      }
      for (const element of document.querySelectorAll('[data-guide-language]')) {
        applyLanguageSample(element, i18n.getLanguage());
      }
    }
    update();
    return update;
  }
  return { initialize, localizeSnapshot };
}));
