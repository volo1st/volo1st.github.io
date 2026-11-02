'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const { prepare, initialize } = require('../style-guide/copy-component.js');
const guideLanguage = require('../style-guide/guide-language.js');
const i18n = require('../assets/i18n.js');
require('../style-guide/i18n.js');

// Minimal DOM adapter for the attributes and controls used by the copier.
class Element {
  constructor(tag = 'div', attrs = {}, children = []) {
    this.tag = tag; this.attrs = { ...attrs }; this.children = children;
    this.value = attrs.value || ''; this.disabled = Object.hasOwn(attrs, 'disabled'); this._text = ''; this.listeners = {};
    children.forEach(child => { child.parent = this; });
  }
  get tagName() { return this.tag.toUpperCase(); }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  set textContent(value) { this._text = value; this.children = []; }
  get defaultValue() { return this.tag === 'textarea' ? this.textContent : this.attrs.value || ''; }
  get dataset() {
    return Object.fromEntries(Object.entries(this.attrs).filter(([key]) => key.startsWith('data-'))
      .map(([key, value]) => [key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), value]));
  }
  get id() { return this.attrs.id || ''; }
  set id(value) { this.attrs.id = value; }
  get classList() {
    const values = (this.attrs.class || '').split(/\s+/).filter(Boolean);
    values.remove = value => { this.attrs.class = values.filter(name => name !== value).join(' '); };
    return values;
  }
  hasAttribute(name) { return Object.hasOwn(this.attrs, name); }
  getAttribute(name) { return this.attrs[name] ?? null; }
  setAttribute(name, value) { this.attrs[name] = value; }
  removeAttribute(name) { delete this.attrs[name]; }
  querySelectorAll(selector = '*') {
    const all = this.children.flatMap(child => [child, ...child.querySelectorAll('*')]);
    return selector === '*' ? all : all.filter(child => child.hasAttribute(selector.slice(1, -1)));
  }
  closest() { return this.hasAttribute('data-domain') ? this : this.parent?.closest() || null; }
  cloneNode() {
    const clone = new Element(this.tag, this.attrs, this.children.map(child => child.cloneNode(true)));
    clone._text = this._text;
    return clone;
  }
  get outerHTML() {
    return `<${this.tag}${Object.entries(this.attrs).map(([key, value]) => ` ${key}="${value}"`).join('')}>${this._text}${this.children.map(child => child.outerHTML).join('')}</${this.tag}>`;
  }
  append(child) { this.children.push(child); }
  addEventListener(event, action) { this.listeners[event] = action; }
  focus() { this.focused = true; }
  select() { this.selected = true; }
}
const field = () => new Element('div', { 'data-snippet': 'Field', class: 'ui-field guide-sample' }, [
  new Element('label', { for: 'name' }),
  new Element('input', { id: 'name', 'aria-describedby': 'help' }),
  new Element('p', { id: 'help' }),
]);

test('copies labels and references together, removes guide decoration, and preserves the source', () => {
  const source = field();
  new Element('div', { 'data-domain': 'music' }, [source]);
  const before = source.outerHTML;
  const result = prepare(source, 'session-2');
  assert.match(result.html, /for="session-2-name"/);
  assert.match(result.html, /id="session-2-name"/);
  assert.match(result.html, /aria-describedby="session-2-help"/);
  assert.match(result.html, /id="session-2-help"/);
  assert.match(result.html, /data-domain="music"/);
  assert.match(result.html, /class="ui-field"/);
  assert.doesNotMatch(result.html, /guide-sample|data-snippet/);
  assert.deepEqual(result.outside, []);
  assert.equal(source.outerHTML, before);
  assert.notEqual(prepare(source, 'session-3').html, result.html);
});

test('prefixes radio groups and internal links, and reports external fragment references', () => {
  const source = new Element('div', {}, [
    new Element('input', { id: 'choice', type: 'radio', name: 'mode' }),
    new Element('a', { href: '#choice' }), new Element('a', { href: '#outside' }),
  ]);
  const result = prepare(source, 'a');
  assert.match(result.html, /name="a-mode"/);
  assert.match(result.html, /href="#a-choice"/);
  assert.deepEqual(result.outside, ['outside']);
  assert.throws(() => prepare(source, 'bad prefix'), /prefix/);
});

function fixture(clipboard, options = {}) {
  const source = field();
  source.children[0].setAttribute('data-i18n', 'guide.project-name');
  source.setAttribute('data-guide-snippet', 'guide.field-project-name');
  const controls = Object.fromEntries(['choice', 'prefix', 'code', 'button', 'status'].map(name => [name, new Element()]));
  controls.prefix.value = 'example-1';
  const panel = { querySelector: selector => controls[selector.match(/data-component-(\w+)/)[1]] };
  const document = {
    querySelector: () => panel, querySelectorAll: () => [source],
    createElement: tag => new Element(tag),
  };
  const controller = initialize(document, clipboard, options);
  return { ...controls, source, controller };
}

test('captures the authored sample and clears stale code for invalid prefixes', () => {
  const ui = fixture();
  ui.source.children[1].id = 'edited';
  ui.prefix.value = 'second'; ui.prefix.listeners.input();
  assert.match(ui.code.value, /id="second-name"/);
  assert.doesNotMatch(ui.code.value, /edited/);
  ui.prefix.value = ''; ui.prefix.listeners.input();
  assert.equal(ui.code.value, ''); assert.equal(ui.button.disabled, true);
  ui.prefix.value = 'valid'; ui.prefix.listeners.input();
  assert.equal(ui.button.disabled, false);
});

test('copy waits for success, prevents selection races, and re-enables controls', async () => {
  let resolve, copied;
  const ui = fixture({ writeText: value => { copied = value; return new Promise(done => { resolve = done; }); } });
  const pending = ui.button.listeners.click();
  assert.equal(copied, ui.code.value);
  assert.equal(ui.choice.disabled, true); assert.equal(ui.prefix.disabled, true);
  resolve(); await pending;
  assert.match(ui.status.textContent, /^HTML copied/);
  assert.equal(ui.choice.disabled, false); assert.equal(ui.button.disabled, false);
});

test('missing or rejected clipboard selects the current code without losing it', async () => {
  for (const clipboard of [undefined, { writeText: async () => { throw new Error('Denied'); } }]) {
    const ui = fixture(clipboard), before = ui.code.value;
    await ui.button.listeners.click();
    assert.equal(ui.code.value, before);
    assert.equal(ui.code.focused, true); assert.equal(ui.code.selected, true);
    assert.match(ui.status.textContent, /Copy it manually/);
    assert.equal(ui.button.disabled, false);
  }
});


const translationOptions = {
  translate: (key, values) => i18n.translate(`guide.copy.${key}`, values),
  name: source => i18n.translate(source.getAttribute('data-guide-snippet')),
  localize: source => guideLanguage.localizeSnapshot(source, i18n),
};

test('language changes translate copy choices and authored HTML while retaining the prefix and choice', () => {
  i18n.setLanguage('en-AU');
  const ui = fixture(undefined, translationOptions);
  ui.prefix.value = 'session-3'; ui.prefix.listeners.input();
  assert.match(ui.code.value, /Project name/);
  ui.source.children[0].textContent = 'An edited label';
  i18n.setLanguage('zh-Hans'); ui.controller.refresh();
  assert.equal(ui.choice.value, '0'); assert.equal(ui.prefix.value, 'session-3');
  assert.equal(ui.choice.children[0].textContent, '输入控件：项目名称');
  assert.match(ui.code.value, /项目名称/);
  assert.match(ui.code.value, /lang="zh-Hans"/);
  assert.match(ui.code.value, /for="session-3-name"/);
  assert.doesNotMatch(ui.code.value, /data-i18n|data-guide|data-snippet|Project name|An edited label/);
  i18n.setLanguage('en-AU'); ui.controller.refresh();
  assert.match(ui.code.value, /Project name/);
  assert.doesNotMatch(ui.code.value, /项目名称/);
  ui.prefix.value = 'bad prefix';
  i18n.setLanguage('zh-Hans'); ui.controller.refresh();
  assert.match(ui.status.textContent, /前缀/); assert.equal(ui.code.value, '');
});

test('language changes during copying report the old view and retain the new code', async () => {
  i18n.setLanguage('en-AU');
  let finish, copied;
  const ui = fixture({ writeText(value) { copied = value; return new Promise(resolve => { finish = resolve; }); } }, translationOptions);
  const pending = ui.button.listeners.click();
  i18n.setLanguage('zh-Hans'); ui.controller.refresh();
  assert.match(copied, /Project name/); assert.match(ui.code.value, /项目名称/);
  assert.equal(ui.button.disabled, true);
  finish(); await pending;
  assert.equal(ui.status.textContent, i18n.translate('guide.copy.earlier'));
  const denied = fixture(undefined, translationOptions);
  await denied.button.listeners.click();
  assert.equal(denied.status.textContent, i18n.translate('guide.copy.fallback'));
  assert.match(denied.code.value, /项目名称/); assert.equal(denied.code.selected, true);
});

test('sample defaults and demo language states follow the view without replacing edited values', () => {
  const untouched = new Element('input', { value: 'Room study', 'data-guide-value': 'guide.room-study' });
  const edited = new Element('input', { value: 'Room study', 'data-guide-value': 'guide.room-study' });
  const restored = new Element('input', { value: 'Room study', 'data-guide-value': 'guide.room-study' });
  restored.value = 'Restored draft';
  const english = new Element('button', { 'data-guide-language': 'en-AU' });
  const chinese = new Element('button', { 'data-guide-language': 'zh-Hans' });
  const doc = new Element('body', {}, [untouched, edited, restored, english, chinese]);
  i18n.setLanguage('en-AU');
  const update = guideLanguage.initialize(doc, i18n);
  edited.value = ''; edited.listeners.input();
  i18n.setLanguage('zh-Hans'); update();
  assert.equal(untouched.value, '房间声学研究'); assert.equal(edited.value, '');
  assert.equal(restored.value, 'Restored draft');
  assert.equal(chinese.disabled, true); assert.equal(english.disabled, false);
  assert.equal(chinese.getAttribute('aria-pressed'), 'true');
  i18n.setLanguage('en-AU'); update();
  assert.equal(untouched.value, 'Room study'); assert.equal(edited.value, '');
  assert.equal(english.disabled, true); assert.equal(chinese.disabled, false);
});

test('shared language toggle restores preference and preserves controls inside translated labels', () => {
  const text = new Element('span', { 'data-i18n': 'guide.include-a-count-in' });
  const checkbox = new Element('input', { type: 'checkbox', checked: '' });
  checkbox.checked = false;
  const label = new Element('label', {}, [checkbox, text]);
  const field = new Element('input', { value: 'Room study', 'data-guide-value': 'guide.room-study' });
  const en = new Element('button', { 'data-language': 'en-AU', 'data-disable-current': 'true' });
  const zh = new Element('button', { 'data-language': 'zh-Hans', 'data-disable-current': 'true' });
  const doc = new Element('body', {}, [label, field, en, zh]);
  doc.documentElement = new Element('html');
  let saved = 'zh-Hans', update = () => {};
  const window = {
    localStorage: { getItem: () => saved, setItem: (_, value) => { saved = value; } },
    navigator: { languages: ['en-AU'] },
    CustomEvent: class { constructor(name, options) { this.type = name; this.detail = options.detail; } },
    dispatchEvent() { update(); },
  };
  i18n.initialize(doc, window);
  update = guideLanguage.initialize(doc, i18n);
  assert.equal(doc.documentElement.lang, 'zh-Hans');
  assert.equal(field.value, '房间声学研究'); assert.equal(text.textContent, '加入预备拍');
  assert.equal(label.children[0], checkbox); assert.equal(checkbox.checked, false);
  en.listeners.click();
  assert.equal(saved, 'en-AU'); assert.equal(field.value, 'Room study');
  assert.equal(text.textContent, 'Include a count-in'); assert.equal(en.disabled, true);
  zh.listeners.click();
  assert.equal(saved, 'zh-Hans'); assert.equal(zh.disabled, true); assert.equal(en.disabled, false);
});

test('localized exports translate default values and accessible names without translation dependencies', () => {
  const input = new Element('input', { id: 'result', value: 'Example result', 'data-guide-value': 'guide.example-result',
    'aria-label': 'Project name', 'data-i18n-aria-label': 'guide.project-name' });
  const textarea = new Element('textarea', { 'data-guide-value': 'guide.source-is-unavailable' });
  textarea.textContent = 'Source is unavailable.';
  const source = new Element('div', {}, [input, textarea]);
  i18n.setLanguage('zh-Hans');
  const output = prepare(source, 'result-1', translationOptions).html;
  assert.match(output, /value="示例结果"/); assert.match(output, /aria-label="项目名称"/);
  assert.match(output, />源文本不可用。<\/textarea>/);
  assert.doesNotMatch(output, /data-guide|data-i18n|Example result|Source is unavailable/);
  assert.equal(input.value, 'Example result');
});
