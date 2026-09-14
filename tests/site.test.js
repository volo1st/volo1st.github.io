'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repositoryRoot = path.join(__dirname, '..');
const i18n = require('../assets/i18n.js');

function findHtmlFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...findHtmlFiles(entryPath));
    } else if (entry.name.endsWith('.html')) {
      files.push(entryPath);
    }
  }
  return files;
}

function resolveLocalReference(htmlFile, reference) {
  const cleanReference = reference.split(/[?#]/, 1)[0];
  if (
    cleanReference === ''
    || cleanReference.startsWith('#')
    || /^(?:[a-z]+:)?\/\//i.test(cleanReference)
    || cleanReference.startsWith('data:')
  ) {
    return null;
  }

  const resolved = path.resolve(path.dirname(htmlFile), cleanReference);
  return cleanReference.endsWith('/') ? path.join(resolved, 'index.html') : resolved;
}

test('all local HTML links and source files exist', () => {
  for (const htmlFile of findHtmlFiles(repositoryRoot)) {
    const html = fs.readFileSync(htmlFile, 'utf8');
    const references = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)]
      .map((match) => match[1]);

    for (const reference of references) {
      const target = resolveLocalReference(htmlFile, reference);
      if (target) {
        assert.ok(
          fs.existsSync(target),
          `${path.relative(repositoryRoot, htmlFile)} has a missing reference: ${reference}`,
        );
      }
    }
  }
});

test('HTML IDs are unique and label references resolve', () => {
  for (const htmlFile of findHtmlFiles(repositoryRoot)) {
    const html = fs.readFileSync(htmlFile, 'utf8');
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    assert.deepEqual(duplicateIds, [], path.relative(repositoryRoot, htmlFile));

    const idReferences = [
      ...html.matchAll(/\b(?:for|aria-labelledby|aria-describedby)="([^"]+)"/g),
    ].flatMap((match) => match[1].split(/\s+/));
    for (const idReference of idReferences) {
      assert.ok(
        ids.includes(idReference),
        `${path.relative(repositoryRoot, htmlFile)} refers to missing ID: ${idReference}`,
      );
    }
  }
});

test('the home page links to the current converter and the v2 trial', () => {
  const html = fs.readFileSync(path.join(repositoryRoot, 'index.html'), 'utf8');

  assert.match(html, /href="\.\/tools\/csv2aba\/"/);
  assert.match(html, /href="\.\/tools\/csv2aba-v2\/"/);
  assert.match(html, />Trial</);
  assert.match(html, /href="\.\/assets\/site\.css"/);
});

test('English and Simplified Chinese translation keys match', () => {
  assert.deepEqual(
    Object.keys(i18n.catalogs['zh-Hans']).sort(),
    Object.keys(i18n.catalogs['en-AU']).sort(),
  );
});

test('all HTML translation keys exist in both catalogs', () => {
  const attributePattern = /data-i18n(?:-content|-placeholder|-aria-label)?="([^"]+)"/g;
  for (const htmlFile of findHtmlFiles(repositoryRoot)) {
    const html = fs.readFileSync(htmlFile, 'utf8');
    for (const match of html.matchAll(attributePattern)) {
      for (const language of ['en-AU', 'zh-Hans']) {
        assert.ok(
          Object.hasOwn(i18n.catalogs[language], match[1]),
          `${path.relative(repositoryRoot, htmlFile)} uses missing ${language} key: ${match[1]}`,
        );
      }
    }
  }
});

test('all coded converter errors have translations', () => {
  const core = fs.readFileSync(
    path.join(repositoryRoot, 'tools/csv2aba-v2/core.js'),
    'utf8',
  );
  const errorCodes = [...core.matchAll(/createError\(\s*'([^']+)'/g)]
    .map((match) => match[1]);

  assert.ok(errorCodes.length > 0);
  for (const code of errorCodes) {
    for (const language of ['en-AU', 'zh-Hans']) {
      assert.ok(
        Object.hasOwn(i18n.catalogs[language], `error.${code}`),
        `Missing ${language} translation for error code: ${code}`,
      );
    }
  }
});

test('language selection and coded validation error translation work', () => {
  assert.equal(i18n.normalizeLanguage('zh-CN'), 'zh-Hans');
  assert.equal(i18n.normalizeLanguage('en-US'), 'en-AU');
  let error;
  assert.throws(() => {
    try {
      v2ForErrorTest();
    } catch (caughtError) {
      error = caughtError;
      throw caughtError;
    }
  });

  function v2ForErrorTest() {
    const converter = require('../tools/csv2aba-v2/core.js');
    return converter.parseAmountToCents('bad', { sourceRow: 7 });
  }

  assert.equal(error.code, 'amount_format');
  assert.match(i18n.translateError(error, 'en-AU'), /^CSV line 7/);
  assert.match(i18n.translateError(error, 'zh-Hans'), /^CSV 第 7 行/);
});
