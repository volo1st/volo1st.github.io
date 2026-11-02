(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) {
    const i18n = root.SiteI18n;
    const controller = api.initialize(root.document, root.navigator && root.navigator.clipboard, {
      translate: (key, values) => i18n.translate(`guide.copy.${key}`, values),
      name: source => i18n.translate(source.getAttribute('data-guide-snippet')),
      localize: source => root.StyleGuideLanguage.localizeSnapshot(source, i18n),
    });
    root.document.addEventListener('DOMContentLoaded', controller.refresh);
    root.addEventListener('site-language-change', controller.refresh);
  }
}(typeof globalThis === 'undefined' ? this : globalThis, function () {
  'use strict';

  const messages = {
    prefixError: 'Use a prefix that starts with a lowercase letter. Use letters, digits, and hyphens.',
    outside: 'Update these destinations or references: {targets}.',
    copied: 'HTML copied. Update text, links, and heading levels before use.',
    earlier: 'The previous language was copied. Copy again for the current language.',
    fallback: 'Automatic copying is unavailable. The HTML is selected. Copy it manually.',
  };
  const fallback = (key, values = {}) => messages[key].replace(/\{(\w+)\}/g, (_, name) => values[name]);

  function prepare(source, prefix, options = {}) {
    if (!/^[a-z][a-z0-9-]*$/.test(prefix)) {
      throw new Error((options.translate || fallback)('prefixError'));
    }
    const clone = source.cloneNode(true);
    if (options.localize) options.localize(clone);
    const elements = [clone, ...clone.querySelectorAll('*')];
    const ids = new Map(elements.filter(element => element.id).map(element => [element.id, `${prefix}-${element.id}`]));
    const outside = new Set();
    const domain = source.closest('[data-domain]');
    if (domain) clone.setAttribute('data-domain', domain.getAttribute('data-domain'));
    for (const element of elements) {
      for (const attribute of ['data-snippet', 'data-i18n', 'data-i18n-aria-label',
        'data-guide-snippet', 'data-guide-value', 'data-guide-language']) {
        element.removeAttribute(attribute);
      }
      for (const name of [...element.classList]) {
        if (name.startsWith('guide-')) element.classList.remove(name);
      }
      if (element.classList.length === 0) element.removeAttribute('class');
      if (element.id) element.id = ids.get(element.id);
      for (const attribute of ['for', 'aria-labelledby', 'aria-describedby', 'aria-controls', 'headers']) {
        if (!element.hasAttribute(attribute)) continue;
        element.setAttribute(attribute, element.getAttribute(attribute).split(/\s+/).map(id => {
          if (!ids.has(id)) outside.add(id);
          return ids.get(id) || id;
        }).join(' '));
      }
      const href = element.getAttribute('href');
      if (href && href.startsWith('#')) {
        const id = href.slice(1);
        if (!ids.has(id)) outside.add(id);
        element.setAttribute('href', `#${ids.get(id) || id}`);
      }
      if (element.getAttribute('type') === 'radio' && element.hasAttribute('name')) {
        element.setAttribute('name', `${prefix}-${element.getAttribute('name')}`);
      }
    }
    return { html: clone.outerHTML, outside: [...outside] };
  }

  function initialize(document, clipboard, options = {}) {
    const translate = options.translate || fallback;
    let busy = false;
    const panel = document.querySelector('[data-component-copy]');
    if (!panel) return;
    const select = panel.querySelector('[data-component-choice]');
    const prefix = panel.querySelector('[data-component-prefix]');
    const output = panel.querySelector('[data-component-code]');
    const button = panel.querySelector('[data-component-button]');
    const status = panel.querySelector('[data-component-status]');
    // Snapshot authored examples before the user edits native demo controls.
    const sources = [...document.querySelectorAll('[data-snippet]')].map(source => {
      const snapshot = source.cloneNode(true);
      const domain = source.closest('[data-domain]');
      if (domain) snapshot.setAttribute('data-domain', domain.getAttribute('data-domain'));
      return snapshot;
    });
    if (!sources.length) return;
    const choices = [];
    sources.forEach((source, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = source.getAttribute('data-snippet');
      select.append(option);
      choices.push(option);
    });
    function update() {
      try {
        const result = prepare(sources[Number(select.value)], prefix.value, options);
        output.value = result.html;
        button.disabled = busy;
        status.textContent = result.outside.length
          ? translate('outside', { targets: result.outside.join(', ') }) : '';
      } catch (error) {
        output.value = '';
        button.disabled = true;
        status.textContent = error.message;
      }
    }
    select.disabled = false;
    prefix.disabled = false;
    select.value = '0';
    select.addEventListener('change', update);
    prefix.addEventListener('input', update);
    button.addEventListener('click', async () => {
      busy = true;
      const copied = output.value;
      button.disabled = true;
      select.disabled = true;
      prefix.disabled = true;
      try {
        if (!clipboard || !clipboard.writeText) throw new Error('Clipboard unavailable');
        await clipboard.writeText(copied);
        status.textContent = translate(copied === output.value ? 'copied' : 'earlier');
      } catch (error) {
        output.focus();
        output.select();
        status.textContent = translate('fallback');
      } finally {
        busy = false;
        button.disabled = false;
        select.disabled = false;
        prefix.disabled = false;
      }
    });
    function refresh() {
      choices.forEach((choice, index) => {
        if (options.name) choice.textContent = options.name(sources[index]);
      });
      update();
    }
    refresh();
    return { refresh };
  }
  return { prepare, initialize };
}));
