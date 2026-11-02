(function () {
  'use strict';

  const icons = {
    'guitar-strum-machine': { bounds: [62, 40, 448, 469], scalePercent: 86, centerX: 256, centerY: 260 },
    metronome: { bounds: [103, 110, 409, 399], scalePercent: 114, centerX: 256, centerY: 248 },
    tuner: { bounds: [70, 130, 441, 372], scalePercent: 106, centerX: 256, centerY: 256 },
    'pitch-key': { bounds: [37, 141, 469, 360], scalePercent: 98, centerX: 248, centerY: 256 },
  };

  function defaults() {
    return Object.fromEntries(Object.entries(icons).map(([name, icon]) => [name, {
      scalePercent: icon.scalePercent, centerX: icon.centerX, centerY: icon.centerY,
    }]));
  }

  function transform(name, settings) {
    const [left, top, right, bottom] = icons[name].bounds;
    const scale = settings.scalePercent / 100;
    const x = settings.centerX - ((left + right + 1) / 2) * scale;
    const y = settings.centerY - ((top + bottom + 1) / 2) * scale;
    return {
      scale, xPercent: x / 512 * 100, yPercent: y / 512 * 100,
      clipped: left * scale + x < 0 || (right + 1) * scale + x > 512
        || top * scale + y < 0 || (bottom + 1) * scale + y > 512,
    };
  }

  function serialize(settings) {
    return JSON.stringify({ format: 'volo1st-icon-settings-v1', canvasSize: 512, icons: settings }, null, 2);
  }

  function normalize(field, value, previous) {
    const number = String(value).trim() === '' ? NaN : Number(value);
    if (!Number.isFinite(number)) return previous;
    const [min, max] = field === 'scalePercent' ? [50, 150] : [128, 384];
    return Math.min(max, Math.max(min, Math.round(number)));
  }

  function initialize(root, clipboard = globalThis.navigator?.clipboard) {
    const output = root.querySelector('[data-icon-settings]');
    if (!output) return;
    const copy = root.querySelector('[data-icon-copy]');
    const status = root.querySelector('[data-icon-copy-status]');
    const settings = defaults();

    function exportSettings() {
      output.value = serialize(settings);
      status.textContent = '';
    }

    for (const editor of root.querySelectorAll('[data-icon-editor]')) {
      const name = editor.dataset.iconEditor;
      const fields = [...editor.querySelectorAll('[data-setting]')];
      const warning = editor.querySelector('[data-icon-warning]');
      const summary = editor.querySelector('[data-icon-summary]');
      for (const image of editor.querySelectorAll('[data-preview-image]')) {
        image.src = image.dataset.originalSrc;
      }

      function render() {
        const current = settings[name];
        const preview = transform(name, current);
        for (const frame of editor.querySelectorAll('[data-preview-frame]')) {
          frame.style.setProperty('--icon-scale', String(preview.scale));
          frame.style.setProperty('--icon-x', `${preview.xPercent}%`);
          frame.style.setProperty('--icon-y', `${preview.yPercent}%`);
          frame.dataset.active = 'true';
        }
        for (const field of fields) {
          const key = field.dataset.setting;
          field.value = String(current[key]);
          const value = editor.querySelector(`[data-value="${key}"]`);
          value.textContent = field.value;
        }
        summary.textContent = `Scale: ${current.scalePercent}%. Center: ${current.centerX} / ${current.centerY} pixels.`;
        const message = preview.clipped
          ? 'Part of the symbol is outside the canvas. Reduce the scale or move it toward the center.' : '';
        if (warning.textContent !== message) warning.textContent = message;
        exportSettings();
      }

      for (const field of fields) {
        field.addEventListener('input', () => {
          const key = field.dataset.setting;
          settings[name][key] = normalize(key, field.value, settings[name][key]);
          render();
        });
      }
      editor.querySelector('[data-icon-reset]').addEventListener('click', () => {
        settings[name] = defaults()[name];
        render();
      });
      render();
      editor.querySelector('fieldset').disabled = false;
    }

    copy.disabled = false;
    copy.addEventListener('click', async () => {
      const snapshot = output.value;
      copy.disabled = true;
      try {
        if (!clipboard?.writeText) throw new Error('Clipboard unavailable');
        await clipboard.writeText(snapshot);
        status.textContent = output.value === snapshot
          ? 'Settings copied. Paste them into the chat.'
          : 'Earlier settings copied. Copy again for the current settings.';
      } catch {
        output.focus();
        output.select();
        status.textContent = 'Automatic copy is unavailable. The settings are selected. Use your browser’s Copy command.';
      } finally {
        copy.disabled = false;
      }
    });
    return { getSettings: () => JSON.parse(JSON.stringify(settings)) };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { defaults, transform, serialize, normalize, initialize };
  }
  if (typeof document !== 'undefined') initialize(document);
}());
