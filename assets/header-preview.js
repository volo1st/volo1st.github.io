(function initializeHeaderPreview() {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const initialLayout = new URL(window.location.href).searchParams.get('header');
    if (initialLayout !== 'a' && initialLayout !== 'b') return;

    const header = document.querySelector('[data-header-tool]');
    const controls = document.querySelector('[data-header-preview]');
    const heading = document.querySelector('[data-header-title]');
    if (!header || !controls || !heading) return;

    const home = header.querySelector('[data-header-home]');
    const current = header.querySelector('[data-header-current]');
    const parentSeparator = header.querySelector('[data-header-parent-separator]');
    if (!home || !current || !parentSeparator) return;

    header.append(heading);

    const buttons = controls.querySelectorAll('[data-header-layout-choice]');
    function applyLayout(layout) {
      const compact = layout === 'a';
      header.dataset.headerLayout = layout;
      home.hidden = compact;
      current.hidden = !compact;
      parentSeparator.textContent = compact ? '←' : '/';
      heading.classList.toggle('ui-visually-hidden', compact);
      heading.classList.toggle('ui-subheading', !compact);
      for (const button of buttons) {
        button.setAttribute('aria-pressed', String(button.dataset.headerLayoutChoice === layout));
      }
    }

    for (const button of buttons) {
      button.addEventListener('click', () => applyLayout(button.dataset.headerLayoutChoice));
    }
    applyLayout(initialLayout);
    controls.hidden = false;
  });
}());
