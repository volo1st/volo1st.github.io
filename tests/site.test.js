'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repositoryRoot = path.join(__dirname, '..');

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
