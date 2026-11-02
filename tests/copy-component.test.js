'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const { prepare, initialize } = require('../style-guide/copy-component.js');

// Minimal DOM adapter for the attributes and controls used by the copier.
class Element {
  constructor(tag = 'div', attrs = {}, children = []) {
    this.tag = tag; this.attrs = { ...attrs }; this.children = children;
    this.value = ''; this.disabled = true; this.textContent = ''; this.listeners = {};
    children.forEach(child => { child.parent = this; });
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
  querySelectorAll() { return this.children.flatMap(child => [child, ...child.querySelectorAll('*')]); }
  closest() { return this.hasAttribute('data-domain') ? this : this.parent?.closest() || null; }
  cloneNode() { return new Element(this.tag, this.attrs, this.children.map(child => child.cloneNode(true))); }
  get outerHTML() {
    return `<${this.tag}${Object.entries(this.attrs).map(([key, value]) => ` ${key}="${value}"`).join('')}>${this.children.map(child => child.outerHTML).join('')}</${this.tag}>`;
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

function fixture(clipboard) {
  const source = field();
  const controls = Object.fromEntries(['choice', 'prefix', 'code', 'button', 'status'].map(name => [name, new Element()]));
  controls.prefix.value = 'example-1';
  const panel = { querySelector: selector => controls[selector.match(/data-component-(\w+)/)[1]] };
  const document = {
    querySelector: () => panel, querySelectorAll: () => [source],
    createElement: tag => new Element(tag),
  };
  initialize(document, clipboard);
  return { ...controls, source };
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
