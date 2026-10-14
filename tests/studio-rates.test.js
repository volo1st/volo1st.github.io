'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const directory = path.join(__dirname, '../studio/rates');
const html = fs.readFileSync(path.join(directory, 'index.html'), 'utf8');

function loadLanguage() {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(directory, '../../assets/i18n.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(directory, 'i18n.js'), 'utf8'), context);
  return context.SiteI18n;
}

test('studio catalogs cover the page and English fallback matches the catalog', () => {
  const api = loadLanguage();
  const keys = Object.keys(api.catalogs['en-AU']).filter((key) => key.startsWith('studio.'));
  assert.deepEqual(keys.sort(), Object.keys(api.catalogs['zh-Hans']).filter((key) => key.startsWith('studio.')).sort());
  for (const match of html.matchAll(/data-i18n(?:-title|-content|-aria-label)?="([^"]+)"/g)) {
    assert.ok(keys.includes(match[1]), `Missing translation: ${match[1]}`);
  }
  for (const match of html.matchAll(/data-i18n="([^"]+)"[^>]*>([^<]*)</g)) {
    assert.equal(match[2].replaceAll('&amp;', '&'), api.translate(match[1], {}, 'en-AU'));
  }
});

test('language buttons change page language, title, content and pressed state', () => {
  const api = loadLanguage();
  const heading = { dataset: { i18n: 'studio.heading' }, textContent: '' };
  const buttons = ['en-AU', 'zh-Hans'].map((language) => ({
    dataset: { language }, attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, handler) { this[name] = handler; },
  }));
  const document = {
    documentElement: { dataset: { i18nTitle: 'studio.title' } },
    querySelectorAll(selector) {
      if (selector === '[data-i18n]') return [heading];
      if (selector === '[data-language]') return buttons;
      return [];
    },
  };
  const storage = new Map();
  const window = {
    localStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    navigator: { languages: ['en-AU'] },
    CustomEvent: class {}, dispatchEvent() {},
  };
  api.initialize(document, window);
  buttons[1].click();
  assert.equal(document.documentElement.lang, 'zh-Hans');
  assert.equal(document.title, api.translate('studio.title', {}, 'zh-Hans'));
  assert.equal(heading.textContent, '2026 录音棚收费标准');
  assert.equal(buttons[1].attributes['aria-pressed'], 'true');
  assert.equal(storage.get('siteLanguage'), 'zh-Hans');
  buttons[0].click();
  assert.equal(heading.textContent, '2026 Studio Rates');
  assert.equal(buttons[1].attributes['aria-pressed'], 'false');
});

test('studio interface assets use current content hashes', () => {
  for (const match of html.matchAll(/(?:href|src)="([^"?]+)\?v=([a-f0-9]+)"/g)) {
    const hash = crypto.createHash('sha256').update(fs.readFileSync(path.resolve(directory, match[1]))).digest('hex').slice(0, 12);
    assert.equal(match[2], hash, match[1]);
  }
});

test('studio breadcrumb remains English and both languages use EP', () => {
  const breadcrumb = html.match(/<nav class="site-breadcrumb"[^>]*>[\s\S]*?<\/nav>/)[0];
  assert.doesNotMatch(breadcrumb, /data-i18n/);
  assert.match(breadcrumb, /lang="en-AU"/);
  const api = loadLanguage();
  assert.equal(api.translate('studio.packagesText', {}, 'en-AU'),
    'Tailored recording and mixing packages for singles, covers, EPs and albums.');
  assert.match(api.translate('studio.packagesText', {}, 'zh-Hans'), /EP/);
});

test('studio index and rates page express the studio hierarchy', () => {
  const index = fs.readFileSync(path.join(directory, '../index.html'), 'utf8');
  assert.match(index, /<h1 class="studio-name">Bits &amp; Beats Studio<\/h1>/);
  assert.match(index, /href="\.\/rates\/">Studio rates<\/a>/);
  assert.match(index, /instagram\.com\/bits\.n\.beats/);
  assert.match(index, /xiaohongshu\.com\/user\/profile\/5e7818aa0000000001006bf7/);
  assert.match(html, /<h1 data-i18n="studio.heading" class="rates-year">2026 Studio Rates<\/h1>/);
  assert.doesNotMatch(html, /class="studio-name"/);
  assert.match(html, /href="\.\.\/">studio<\/a>/);
  assert.match(html, /aria-current="page">rates<\/span>/);
  for (const match of index.matchAll(/(?:href|src)="([^"?]+)\?v=([a-f0-9]+)"/g)) {
    const hash = crypto.createHash('sha256').update(fs.readFileSync(path.resolve(directory, '..', match[1]))).digest('hex').slice(0, 12);
    assert.equal(match[2], hash, match[1]);
  }
});
