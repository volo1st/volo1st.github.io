'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/header-preview.js'), 'utf8');

function loadPreview(query) {
  function element(classes = []) {
    const names = new Set(classes);
    return {
      dataset: {}, attributes: {}, children: [], hidden: false,
      classList: {
        toggle(name, active) { if (active) names.add(name); else names.delete(name); },
        contains(name) { return names.has(name); },
      },
      append(child) {
        if (child.parent) child.parent.children.splice(child.parent.children.indexOf(child), 1);
        this.children.push(child);
        child.parent = this;
      },
      setAttribute(name, value) { this.attributes[name] = value; },
      addEventListener(name, listener) { this[name] = listener; },
    };
  }
  const heading = element(['ui-visually-hidden']);
  heading.textContent = 'Guitar strum machine';
  const input = { value: 'Invented practice input' };
  const main = element();
  main.append(heading);
  main.append(input);
  const header = element();
  header.dataset.headerTool = 'Guitar';
  const home = element();
  const current = element();
  const fullName = element();
  fullName.textContent = 'Guitar strum machine';
  const separator = element();
  separator.textContent = '/';
  const controls = element();
  controls.hidden = true;
  const buttons = ['a', 'b'].map((layout) => {
    const button = element();
    button.dataset.headerLayoutChoice = layout;
    return button;
  });
  controls.querySelectorAll = () => buttons;
  const selectors = new Map([
    ['[data-header-tool]', header], ['[data-header-preview]', controls],
    ['[data-header-title]', heading], ['[data-header-home]', home],
    ['[data-header-current]', current], ['[data-header-name]', fullName],
    ['[data-header-parent-separator]', separator],
  ]);
  header.querySelector = (selector) => selectors.get(selector);
  const document = {
    addEventListener(name, listener) { assert.equal(name, 'DOMContentLoaded'); this.ready = listener; },
    querySelector: (selector) => selectors.get(selector),
    createElement: () => element(),
  };
  const window = {
    location: Object.freeze({ href: `https://example.invalid/tools/guitar-strumming/${query}` }),
    get history() { throw new Error('Preview must not change history.'); },
    get localStorage() { throw new Error('Preview must not store a preference.'); },
  };
  vm.runInNewContext(source, { document, window, URL });
  document.ready();
  return { header, main, heading, input, home, current, fullName, separator, controls, buttons, window };
}

test('normal and invalid preview URLs keep the existing header and app unchanged', () => {
  for (const query of ['', '?header=unknown', '?header=', '?song=invented']) {
    const view = loadPreview(query);
    assert.equal(view.controls.hidden, true);
    assert.equal(view.heading.parent, view.main);
    assert.equal(view.home.hidden, false);
    assert.equal(view.current.hidden, false);
    assert.equal(view.separator.textContent, '/');
    assert.equal(view.header.children.length, 0);
    assert.equal(view.input.value, 'Invented practice input');
  }
});

test('A/B switching reuses the full heading and preserves input, focus targets, and URL data', () => {
  for (const initial of ['a', 'b']) {
    const view = loadPreview(`?header=${initial}&song=invented#position`);
    assert.equal(view.header.dataset.headerLayout, initial);
    assert.equal(view.controls.hidden, false);
    assert.equal(view.heading.parent, view.header);
    view.input.value = 'User edits remain in place';
    for (const mode of ['b', 'a', 'b']) {
      view.buttons[mode === 'a' ? 0 : 1].click();
      assert.equal(view.header.dataset.headerLayout, mode);
      assert.equal(view.home.hidden, mode === 'a');
      assert.equal(view.current.hidden, mode === 'b');
      assert.equal(view.fullName.classList.contains('ui-visually-hidden'), mode === 'a');
      assert.equal(view.heading.classList.contains('ui-visually-hidden'), mode === 'a');
      assert.equal(view.heading.classList.contains('ui-subheading'), mode === 'b');
      assert.equal(view.current.children[0].textContent, 'Guitar');
      assert.equal(view.current.children[0].attributes['aria-hidden'], 'true');
      assert.equal(view.header.children.filter((child) => child === view.heading).length, 1);
      assert.equal(view.heading.textContent, 'Guitar strum machine');
      assert.equal(view.main.children[0], view.input);
      assert.equal(view.input.value, 'User edits remain in place');
      for (const button of view.buttons) {
        assert.equal(button.attributes['aria-pressed'], String(button.dataset.headerLayoutChoice === mode));
        assert.notEqual(button.disabled, true);
      }
      assert.equal(view.window.location.href, `https://example.invalid/tools/guitar-strumming/?header=${initial}&song=invented#position`);
    }
  }
});
