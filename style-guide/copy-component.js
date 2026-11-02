(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) api.initialize(root.document, root.navigator && root.navigator.clipboard);
}(typeof globalThis === 'undefined' ? this : globalThis, function () {
  'use strict';

  function prepare(source, prefix) {
    if (!/^[a-z][a-z0-9-]*$/.test(prefix)) {
      throw new Error('Use a prefix that starts with a lowercase letter. Use letters, digits, and hyphens.');
    }
    const clone = source.cloneNode(true);
    const elements = [clone, ...clone.querySelectorAll('*')];
    const ids = new Map(elements.filter(element => element.id).map(element => [element.id, `${prefix}-${element.id}`]));
    const outside = new Set();
    const domain = source.closest('[data-domain]');
    if (domain) clone.setAttribute('data-domain', domain.getAttribute('data-domain'));
    for (const element of elements) {
      element.removeAttribute('data-snippet');
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

  function initialize(document, clipboard) {
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
    sources.forEach((source, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = source.getAttribute('data-snippet');
      select.append(option);
    });
    function update() {
      try {
        const result = prepare(sources[Number(select.value)], prefix.value);
        output.value = result.html;
        button.disabled = false;
        status.textContent = result.outside.length
          ? `Update these destinations or references: ${result.outside.join(', ')}.` : '';
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
      button.disabled = true;
      select.disabled = true;
      prefix.disabled = true;
      try {
        if (!clipboard || !clipboard.writeText) throw new Error('Clipboard unavailable');
        await clipboard.writeText(output.value);
        status.textContent = 'HTML copied. Update text, links, and heading levels before use.';
      } catch (error) {
        output.focus();
        output.select();
        status.textContent = 'Automatic copying is unavailable. The HTML is selected. Copy it manually.';
      } finally {
        button.disabled = false;
        select.disabled = false;
        prefix.disabled = false;
      }
    });
    update();
  }
  return { prepare, initialize };
}));
