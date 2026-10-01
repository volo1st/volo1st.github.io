'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repositoryRoot = path.join(__dirname, '..');
const i18n = require('../assets/i18n.js');
require('../tools/guitar-strumming/i18n.js');

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

function findMarkdownFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...findMarkdownFiles(entryPath));
    } else if (entry.name.endsWith('.md')) {
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

test('all local Markdown links exist', () => {
  for (const markdownFile of findMarkdownFiles(repositoryRoot)) {
    const markdown = fs.readFileSync(markdownFile, 'utf8');
    const references = [...markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)]
      .map((match) => match[1].split('#', 1)[0]);

    for (const reference of references) {
      if (reference === '' || /^(?:[a-z]+:)?\/\//i.test(reference)) continue;
      const target = path.resolve(path.dirname(markdownFile), reference);
      assert.ok(
        fs.existsSync(target),
        `${path.relative(repositoryRoot, markdownFile)} has a missing reference: ${reference}`,
      );
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

test('the home page links to each available tool', () => {
  const html = fs.readFileSync(path.join(repositoryRoot, 'index.html'), 'utf8');
  const converterCard = html.match(
    /<article class="panel tool-card">([\s\S]*?home\.converterTitle[\s\S]*?)<\/article>/,
  )[1];

  assert.match(html, /href="\.\/tools\/csv2aba-v2\/"/);
  assert.match(html, /href="\.\/tools\/guitar-strumming\/"/);
  assert.doesNotMatch(html, /href="\.\/tools\/csv2aba\/"/);
  assert.doesNotMatch(html, /tools\/song_order/);
  assert.doesNotMatch(html, />Trial</);
  assert.equal([...converterCard.matchAll(/class="button-link"/g)].length, 1);
  assert.doesNotMatch(converterCard, /trial-link|badge/);
  assert.match(html, /href="\.\/assets\/site\.css\?v=[a-f0-9]{12}"/);
});

test('the former converter address redirects to version 2 and preserves the legacy fallback', () => {
  const redirectHtml = fs.readFileSync(
    path.join(repositoryRoot, 'tools', 'csv2aba', 'index.html'),
    'utf8',
  );
  const currentHtml = fs.readFileSync(
    path.join(repositoryRoot, 'tools', 'csv2aba-v2', 'index.html'),
    'utf8',
  );
  const legacyHashes = {
    'index.html': '1a0a210a6b7203ab017a7c0f445914207114301d32b60fd10898afed1ef3c24d',
    'scripts.js': '867cc50dfaca36e8d5e61d894e63ce1045901e04e698decc3daa0b48c903cc32',
    'styles.css': 'f63735c377e63f1819197fdb9fd6db34f96b73fd50b7e32888aafc27dfd50964',
  };

  assert.match(redirectHtml, /http-equiv="refresh" content="0; url=\.\.\/csv2aba-v2\/"/);
  assert.match(redirectHtml, /href="\.\.\/csv2aba-v2\/"/);
  assert.match(currentHtml, /href="\.\.\/csv2aba-legacy\/"/);
  assert.match(currentHtml, /data-i18n="v2\.safetyHeading"/);
  assert.doesNotMatch(currentHtml, /[Tt]rial|v2\.version/);

  for (const [filename, expectedHash] of Object.entries(legacyHashes)) {
    const content = fs.readFileSync(
      path.join(repositoryRoot, 'tools', 'csv2aba-legacy', filename),
    );
    const actualHash = crypto.createHash('sha256').update(content).digest('hex');
    assert.equal(actualHash, expectedHash, `${filename} does not match the approved legacy baseline`);
  }
});

test('versioned interface assets use their current content hash', () => {
  const pages = [
    {
      file: path.join(repositoryRoot, 'index.html'),
      references: [
        './assets/favicon.svg',
        './assets/site-shell.css',
        './assets/site.css',
        './assets/i18n.js',
      ],
    },
    {
      file: path.join(repositoryRoot, 'tools', 'csv2aba-v2', 'index.html'),
      references: [
        '../../assets/favicon.svg',
        '../../assets/site-shell.css',
        '../../assets/site.css',
        '../../assets/i18n.js',
        './styles.css',
      ],
    },
    {
      file: path.join(repositoryRoot, 'tools', 'guitar-strumming', 'index.html'),
      references: [
        '../../assets/favicon.svg',
        '../../assets/site-shell.css',
        './styles.css',
        '../../assets/i18n.js',
        './i18n.js',
        './domain/chord-catalog.js',
        './domain/harmony.js',
        './ui/presentation.js',
        './ui/notifications.js',
        './browser/screen-wake-lock.js',
        './domain/parser.js',
        './domain/core.js',
        './browser/audio-engine.js',
        './browser/share.js',
        './presets/data.js',
        './presets/catalog.js',
        './app.js',
      ],
    },
  ];

  for (const page of pages) {
    const html = fs.readFileSync(page.file, 'utf8');
    for (const reference of page.references) {
      const assetPath = path.resolve(path.dirname(page.file), reference);
      const contentHash = crypto
        .createHash('sha256')
        .update(fs.readFileSync(assetPath))
        .digest('hex')
        .slice(0, 12);
      assert.ok(
        html.includes(`${reference}?v=${contentHash}`),
        `${path.relative(repositoryRoot, page.file)} has a stale hash for ${reference}`,
      );
    }
  }
});

test('the guitar page provides a generic Open Graph preview without replacing arrangement URLs', () => {
  const html = fs.readFileSync(
    path.join(repositoryRoot, 'tools', 'guitar-strumming', 'index.html'),
    'utf8',
  );
  const imagePath = path.join(
    repositoryRoot,
    'assets',
    'share',
    'guitar-strum-machine.png',
  );
  const image = fs.readFileSync(imagePath);
  const imageHash = crypto.createHash('sha256').update(image).digest('hex').slice(0, 12);

  assert.match(html, /<meta property="og:type" content="website" \/>/);
  assert.match(html, /<meta property="og:title" content="Guitar Strum Machine" \/>/);
  assert.match(html, /<meta property="og:description" content="[^"]+" \/>/);
  assert.match(
    html,
    new RegExp(`https://volo1st\\.com/assets/share/guitar-strum-machine\\.png\\?v=${imageHash}`),
  );
  assert.match(html, /<meta property="og:image:type" content="image\/png" \/>/);
  assert.match(html, /<meta property="og:image:width" content="1200" \/>/);
  assert.match(html, /<meta property="og:image:height" content="630" \/>/);
  assert.match(html, /<meta property="og:image:alt" content="[^"]+" \/>/);
  assert.doesNotMatch(html, /<meta property="og:url"/);
  assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
});

test('maintained bilingual pages use the shared site shell', () => {
  const pages = [
    path.join(repositoryRoot, 'index.html'),
    path.join(repositoryRoot, 'tools', 'csv2aba-v2', 'index.html'),
    path.join(repositoryRoot, 'tools', 'guitar-strumming', 'index.html'),
  ];
  for (const htmlFile of pages) {
    const html = fs.readFileSync(htmlFile, 'utf8');
    assert.match(html, /<header class="site-header">/);
    assert.match(html, /<main class="site-main">/);
    assert.match(html, /<footer class="site-footer">/);
    assert.match(html, /class="page-title-row"/);
    assert.match(html, /class="page-title-group"/);
    assert.match(html, /class="site-mark"/);
    assert.match(html, /class="site-footer-home"/);
    assert.doesNotMatch(html, /common\.browserLocal|home\.subtitle/);
    assert.match(html, /assets\/site-shell\.css\?v=[a-f0-9]{12}/);
    assert.match(html, /assets\/favicon\.svg\?v=[a-f0-9]{12}/);
    assert.match(html, /data-language="en-AU"[^>]*>EN<\/button>/);
    assert.match(html, /data-language="zh-Hans"[^>]*>中文<\/button>/);
    assert.match(html, /data-i18n-aria-label="common\.useEnglish"/);
    assert.match(html, /data-i18n-aria-label="common\.useChinese"/);
  }
});

test('the shared shell uses warm neutral tokens and domain accent tokens', () => {
  const shellCss = fs.readFileSync(path.join(repositoryRoot, 'assets', 'site-shell.css'), 'utf8');
  const homeHtml = fs.readFileSync(path.join(repositoryRoot, 'index.html'), 'utf8');
  const guitarHtml = fs.readFileSync(
    path.join(repositoryRoot, 'tools', 'guitar-strumming', 'index.html'),
    'utf8',
  );
  const guitarCss = fs.readFileSync(
    path.join(repositoryRoot, 'tools', 'guitar-strumming', 'styles.css'),
    'utf8',
  );

  assert.match(shellCss, /--site-background:\s*#f4f1e8/);
  assert.match(shellCss, /--site-panel-background:\s*#fffdf7/);
  assert.match(shellCss, /--site-inset-surface:\s*#f2f0e9/);
  assert.match(shellCss, /--site-subtle-surface:\s*#f8f6ef/);
  assert.match(
    shellCss,
    /\.language-switcher button\s*\{[^}]*font-weight:\s*700/s,
  );
  assert.match(shellCss, /--tool-accent:\s*#075a9c/);
  assert.match(
    shellCss,
    /\[data-domain="guitar"\]\s*\{[^}]*--tool-accent:\s*#27644e/s,
  );
  assert.match(homeHtml, /class="panel tool-card" data-domain="guitar"/);
  assert.match(guitarHtml, /<html[^>]*data-domain="guitar"/);
  assert.doesNotMatch(guitarCss, /--tool-accent:/);
  assert.doesNotMatch(guitarCss, /--site-background:/);
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
