'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const zlib = require('node:zlib');

const repositoryRoot = path.join(__dirname, '..');
const i18n = require('../assets/i18n.js');
require('../tools/guitar-strumming/i18n.js');
require('../tools/pitch-shifter/i18n.js');

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

function findInterfaceSourceFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'vendor') continue;
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...findInterfaceSourceFiles(entryPath));
    } else if (/\.(?:css|html|js|mjs)$/.test(entry.name)) {
      files.push(entryPath);
    }
  }
  return files;
}

function readSimpleRgbPng(file) {
  const image = fs.readFileSync(file);
  assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  let offset = 8;
  let width;
  let height;
  const compressed = [];
  while (offset < image.length) {
    const length = image.readUInt32BE(offset);
    const type = image.toString('ascii', offset + 4, offset + 8);
    const data = image.subarray(offset + 8, offset + 8 + length);
    offset += length + 12;
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      assert.equal(data[8], 8);
      assert.equal(data[9], 2);
      assert.equal(data[12], 0);
    } else if (type === 'IDAT') {
      compressed.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }
  const raw = zlib.inflateSync(Buffer.concat(compressed));
  const rowLength = width * 3;
  const colors = new Set();
  for (let row = 0; row < height; row += 1) {
    const rowOffset = row * (rowLength + 1);
    assert.equal(raw[rowOffset], 0, 'The app icon must use an unfiltered RGB scanline.');
    for (let pixelOffset = 1; pixelOffset <= rowLength; pixelOffset += 3) {
      const red = raw[rowOffset + pixelOffset];
      const green = raw[rowOffset + pixelOffset + 1];
      const blue = raw[rowOffset + pixelOffset + 2];
      colors.add(`${red},${green},${blue}`);
    }
  }
  return { width, height, colors };
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

test('the home page presents the approved public identity and contact links', () => {
  const html = fs.readFileSync(path.join(repositoryRoot, 'index.html'), 'utf8');

  assert.doesNotMatch(html, /href="\.\/tools\/"/);
  assert.doesNotMatch(html, /guitar-strumming|Guitar Strum Machine/);
  assert.doesNotMatch(html, /csv2aba/i);
  assert.match(html, /href="https:\/\/github\.com\/volo1st"/);
  assert.match(html, /href="https:\/\/www\.instagram\.com\/bits\.n\.beats\/"/);
  assert.match(html, /I <a href="\.\/code\/">code<\/a>, shape <a href="\.\/sound\/">sound<\/a>, and make <a href="\.\/music\/">noise<\/a>\./);
  assert.doesNotMatch(html, /instagram\.com\/volo1st/);
  assert.doesNotMatch(html, /data-i18n|language-switcher|assets\/i18n\.js/);
  assert.doesNotMatch(html, /<header\b|class="site-mark"|class="site-name"/);
  assert.doesNotMatch(html, /<footer\b/);
  assert.doesNotMatch(html, /What I do|Things I’ve made|area-index/);
  assert.match(html, /<meta property="og:title" content="volo1st">/);
  assert.match(html, /<h1 id="home-heading">Hi, I’m Vincent\.<\/h1>/);
  assert.equal([...html.matchAll(/Vincent/g)].length, 1);
  assert.match(html, /<link rel="canonical" href="https:\/\/volo1st\.com\/">/);
  assert.match(html, /href="\.\/assets\/home\.css\?v=[a-f0-9]{12}"/);
  assert.match(html, /src="\.\/assets\/home\.js\?v=[a-f0-9]{12}"/);
  assert.match(html, /<figure class="constellation"[^>]*Sagittarius constellation/);
  assert.match(html, /<canvas id="sagittarius" aria-hidden="true"><\/canvas>/);
  assert.doesNotMatch(html, /link-signal|data-signal/);
  assert.doesNotMatch(html, /<h2[^>]*>\s*(?:Find me|Bits &amp; Beats Studio)/);
  assert.equal([...html.matchAll(/class="social-link"/g)].length, 6);
  assert.equal([...html.matchAll(/class="social-icon"/g)].length, 6);
  assert.equal([...html.matchAll(/class="social-separator"/g)].length, 1);
  assert.match(html, /aria-label="Personal profiles"/);
  assert.match(html, /aria-label="Bits &amp; Beats Studio profiles"/);
  assert.match(html, /aria-label="Personal RedNote" title="Personal RedNote"/);
  assert.match(html, /aria-label="Bits &amp; Beats Studio on RedNote" title="Bits &amp; Beats Studio on RedNote"/);

  const externalLinks = [...html.matchAll(/<a\b[^>]*href="https:[^"]+"[^>]*>/g)]
    .map((match) => match[0]);
  assert.equal(externalLinks.length, 6);
  for (const link of externalLinks) {
    assert.match(link, /target="_blank"/);
    assert.match(link, /rel="noopener noreferrer"/);
  }
});

test('the public section indexes provide useful destinations', () => {
  const sections = [
    { directory: 'code', heading: 'Code' },
    { directory: 'sound', heading: 'Sound' },
    { directory: 'music', heading: 'Music' },
  ];

  for (const section of sections) {
    const html = fs.readFileSync(
      path.join(repositoryRoot, section.directory, 'index.html'),
      'utf8',
    );
    assert.doesNotMatch(html, /<h1\b/);
    assert.match(html, new RegExp(`<span aria-current="page">${section.heading}<\\/span>`));
    assert.match(html, /class="breadcrumb-summary">[^<]+<\/span>/);
    assert.match(html, /class="site-breadcrumb"/);
    assert.match(html, /<p class="section-status">More when there’s something worth showing\.<\/p>/);
    assert.doesNotMatch(html, /class="section-intro"/);
    assert.match(html, /href="\.\.\/">volo1st<\/a>/);
    assert.doesNotMatch(html, /Vincent/);
    assert.match(html, /assets\/section-index\.css\?v=[a-f0-9]{12}/);
    assert.doesNotMatch(html, /data-i18n|language-switcher|assets\/i18n\.js/);

    for (const match of html.matchAll(/<a\b[^>]*href="https:[^"]+"[^>]*>/g)) {
      assert.match(match[0], /target="_blank"/);
      assert.match(match[0], /rel="noopener noreferrer"/);
    }
  }

  const codeHtml = fs.readFileSync(path.join(repositoryRoot, 'code', 'index.html'), 'utf8');
  const soundHtml = fs.readFileSync(path.join(repositoryRoot, 'sound', 'index.html'), 'utf8');
  const musicHtml = fs.readFileSync(path.join(repositoryRoot, 'music', 'index.html'), 'utf8');
  assert.match(codeHtml, /href="\.\.\/tools\/"/);
  assert.match(soundHtml, /instagram\.com\/bits\.n\.beats/);
  assert.match(musicHtml, /href="\.\.\/tools\/guitar-strumming\/"/);
});

test('the tools directory links to each available tool', () => {
  const html = fs.readFileSync(path.join(repositoryRoot, 'tools', 'index.html'), 'utf8');
  const converterCard = html.match(
    /<article class="panel tool-card">([\s\S]*?tools\.converterTitle[\s\S]*?)<\/article>/,
  )[1];

  assert.match(html, /href="\.\/csv2aba-v2\/"/);
  assert.match(html, /href="\.\/guitar-strumming\/"/);
  assert.match(html, /href="\.\/pitch-shifter\/"/);
  assert.doesNotMatch(html, /href="\.\/csv2aba\/"/);
  assert.doesNotMatch(html, /song_order/);
  assert.doesNotMatch(html, />Trial</);
  assert.equal([...converterCard.matchAll(/class="button-link"/g)].length, 1);
  assert.doesNotMatch(converterCard, /trial-link|badge/);
  assert.match(html, /href="\.\.\/assets\/site\.css\?v=[a-f0-9]{12}"/);
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

test('converter examples use explicit invented identities', () => {
  const currentHtml = fs.readFileSync(
    path.join(repositoryRoot, 'tools', 'csv2aba-v2', 'index.html'),
    'utf8',
  );
  const fixture = fs.readFileSync(
    path.join(repositoryRoot, 'tests', 'fixtures', 'csv2aba-v2', 'basic.csv'),
    'utf8',
  );

  assert.match(currentHtml, /<td>000-000<\/td>\s*<td>000000001<\/td>/);
  assert.match(currentHtml, /data-i18n="v2\.exampleName">Example Teacher<\/td>/);
  assert.match(fixture, /^000-000,000000001,Example Teacher,/m);
  assert.match(fixture, /^000-001,000000002,Second Teacher,/m);
});

test('versioned interface assets use their current content hash', () => {
  const pages = [
    {
      file: path.join(repositoryRoot, 'index.html'),
      references: [
        './assets/favicon.svg',
        './assets/site-shell.css',
        './assets/home.css',
        './assets/home.js',
        './assets/social-icons.svg',
      ],
    },
    {
      file: path.join(repositoryRoot, 'tools', 'index.html'),
      references: [
        '../assets/favicon.svg',
        '../assets/site-shell.css',
        '../assets/site.css',
        '../assets/i18n.js',
      ],
    },
    ...['code', 'sound', 'music'].map((directory) => ({
      file: path.join(repositoryRoot, directory, 'index.html'),
      references: [
        '../assets/favicon.svg',
        '../assets/site-shell.css',
        '../assets/section-index.css',
      ],
    })),
    {
      file: path.join(repositoryRoot, 'tools', 'csv2aba-v2', 'index.html'),
      references: [
        '../../assets/favicon.svg',
        '../../assets/site-shell.css',
        '../../assets/site.css',
        '../../assets/i18n.js',
        './styles.css',
        './core.js',
        './app.js',
      ],
    },
    {
      file: path.join(repositoryRoot, 'tools', 'guitar-strumming', 'index.html'),
      references: [
        '../../assets/favicon.svg',
        '../../assets/app-icons/guitar-strum-machine-180.png',
        '../../assets/site-shell.css',
        './manifest.webmanifest',
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
    {
      file: path.join(repositoryRoot, 'tools', 'pitch-shifter', 'index.html'),
      references: [
        '../../assets/favicon.svg',
        '../../assets/app-icons/pitch-key-512.png',
        '../../assets/site-shell.css',
        './manifest.webmanifest',
        './styles.css',
        '../../assets/i18n.js',
        './i18n.js',
        './bootstrap.js',
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

test('the music app icon family uses one exact site palette', () => {
  const iconDirectory = path.join(repositoryRoot, 'assets', 'app-icons');
  const files = [
    ['guitar-strum-machine-180.png', 180],
    ['guitar-strum-machine-192.png', 192],
    ['guitar-strum-machine-512.png', 512],
    ['metronome-512.png', 512],
    ['tuner-512.png', 512],
    ['pitch-key-512.png', 512],
  ];
  const background = [244, 241, 232];
  const foreground = [23, 62, 48];

  for (const [filename, expectedSize] of files) {
    const icon = readSimpleRgbPng(path.join(iconDirectory, filename));
    assert.equal(icon.width, expectedSize);
    assert.equal(icon.height, expectedSize);
    assert.ok(icon.colors.has(background.join(',')));
    assert.ok(icon.colors.has(foreground.join(',')));
    for (const color of icon.colors) {
      const channels = color.split(',').map(Number);
      const amount = (background[0] - channels[0]) / (background[0] - foreground[0]);
      for (let channel = 1; channel < 3; channel += 1) {
        const expected = Math.round(
          background[channel] * (1 - amount) + foreground[channel] * amount,
        );
        assert.ok(
          Math.abs(channels[channel] - expected) <= 1,
          `${filename} contains a color outside the approved palette: ${color}`,
        );
      }
    }
  }
});

test('the guitar page provides local home-screen metadata', () => {
  const pagePath = path.join(repositoryRoot, 'tools', 'guitar-strumming', 'index.html');
  const manifestPath = path.join(repositoryRoot, 'tools', 'guitar-strumming', 'manifest.webmanifest');
  const html = fs.readFileSync(pagePath, 'utf8');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  assert.match(html, /<meta name="theme-color" content="#f4f1e8" \/>/);
  assert.match(html, /<link rel="apple-touch-icon" sizes="180x180" href="[^"]+" \/>/);
  assert.equal(manifest.name, 'Guitar Strum Machine');
  assert.equal(manifest.short_name, 'Strum Machine');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.background_color, '#f4f1e8');
  assert.equal(manifest.theme_color, '#f4f1e8');
  assert.deepEqual(manifest.icons.map((icon) => icon.sizes), ['192x192', '512x512']);

  for (const icon of manifest.icons) {
    const [reference, declaredHash] = icon.src.split('?v=');
    const iconPath = path.resolve(path.dirname(manifestPath), reference);
    const actualHash = crypto
      .createHash('sha256')
      .update(fs.readFileSync(iconPath))
      .digest('hex')
      .slice(0, 12);
    assert.equal(declaredHash, actualHash, `${reference} has a stale manifest hash`);
    assert.equal(icon.type, 'image/png');
    assert.equal(icon.purpose, 'any');
  }
});

test('the home constellation is local, optional, and non-interactive', () => {
  const script = fs.readFileSync(path.join(repositoryRoot, 'assets', 'home.js'), 'utf8');

  assert.match(script, /constellation'\) === 'off'/);
  assert.match(script, /document\.hidden/);
  assert.match(script, /ResizeObserver/);
  assert.match(script, /SIMBAD J2000 ICRS positions/);
  assert.doesNotMatch(script, /DeviceMotionEvent|devicemotion|requestPermission/);
  assert.doesNotMatch(script, /prefers-reduced-motion/);
  assert.doesNotMatch(script, /\bfetch\s*\(|XMLHttpRequest|WebSocket/);
  assert.doesNotMatch(script, /setInterval|setTimeout/);
});

test('site motion is not disabled by a reduced-motion preference', () => {
  const files = [
    ...findInterfaceSourceFiles(path.join(repositoryRoot, 'assets')),
    ...findInterfaceSourceFiles(path.join(repositoryRoot, 'tools')),
  ];

  for (const file of files) {
    assert.doesNotMatch(
      fs.readFileSync(file, 'utf8'),
      /prefers-reduced-motion/,
      path.relative(repositoryRoot, file),
    );
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
    path.join(repositoryRoot, 'tools', 'index.html'),
    path.join(repositoryRoot, 'tools', 'csv2aba-v2', 'index.html'),
    path.join(repositoryRoot, 'tools', 'guitar-strumming', 'index.html'),
    path.join(repositoryRoot, 'tools', 'pitch-shifter', 'index.html'),
  ];
  for (const htmlFile of pages) {
    const html = fs.readFileSync(htmlFile, 'utf8');
    assert.match(html, /<header class="site-header">/);
    assert.match(html, /<main class="site-main(?: [^"]*)?">/);
    assert.match(html, /class="site-context-row"/);
    assert.match(html, /class="site-breadcrumb"/);
    assert.match(html, /class="site-breadcrumb" aria-label="Breadcrumb"/);
    assert.doesNotMatch(html.match(/<nav class="site-breadcrumb"[\s\S]*?<\/nav>/)[0], /data-i18n/);
    assert.match(html, /href="(?:\.\.\/)+">volo1st<\/a>/);
    assert.doesNotMatch(html, /<footer\b/);
    assert.doesNotMatch(html, /class="(?:page-title|site-mark|site-footer)/);
    assert.doesNotMatch(html, /<h1\b/);
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
  const homeCss = fs.readFileSync(path.join(repositoryRoot, 'assets', 'home.css'), 'utf8');
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
  assert.match(shellCss, /--site-focus:\s*#9b5c00/);
  assert.match(
    shellCss,
    /\.language-switcher button\s*\{[^}]*font-weight:\s*600/s,
  );
  assert.match(
    shellCss,
    /\.language-switcher button\[aria-pressed="true"\]\s*\{[^}]*text-decoration:\s*underline/s,
  );
  assert.match(
    shellCss,
    /\.language-switcher button:focus-visible\s*\{[^}]*background:\s*var\(--site-text\)/s,
  );
  assert.match(shellCss, /--tool-accent:\s*#075a9c/);
  assert.match(
    shellCss,
    /\[data-domain="guitar"\],\s*\[data-domain="music"\]\s*\{[^}]*--tool-accent:\s*#27644e/s,
  );
  assert.match(homeHtml, /class="contact-directory social-directory"/);
  assert.match(homeCss, /--home-link:\s*#3f3a31/);
  assert.match(homeCss, /\.social-icon\s*\{[^}]*fill:\s*currentcolor/s);
  assert.match(homeCss, /\.social-separator\s*\{[^}]*width:\s*1px/s);
  assert.match(
    homeCss,
    /\.social-link:focus-visible\s*\{[^}]*outline:\s*0[^}]*background:\s*var\(--home-link\)/s,
  );
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
