'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { gzipSync } = require('node:zlib');

const share = require('../tools/guitar-strumming/share.js');

const baseUrl = 'https://example.test/tools/guitar-strumming/?keep=1#section';

function expectCode(code) {
  return (error) => {
    assert.equal(error.code, code);
    return true;
  };
}

function makeSongUrl(codec, bytes) {
  const payload = share.encodeBase64Url(Uint8Array.from(bytes));
  return `https://example.test/tool?song=v1.${codec}.${payload}`;
}

test('short source uses raw Base64URL and round-trips exactly', async () => {
  const source = 'D';
  const result = await share.createShareUrl(source, `${baseUrl.replace('#section', '')}&preset=old-v1#section`);
  assert.equal(result.codec, 'raw');
  assert.ok(result.url.length <= share.MAX_SHARE_URL_LENGTH);
  assert.doesNotMatch(new URL(result.url).searchParams.get('song'), /[+/=]/);
  assert.equal(new URL(result.url).searchParams.get('keep'), '1');
  assert.equal(new URL(result.url).searchParams.get('preset'), null);
  assert.equal(new URL(result.url).hash, '');

  const decoded = await share.decodeSongFromUrl(result.url);
  assert.deepEqual(decoded, { found: true, source, codec: 'raw' });
});

test('repetitive source uses gzip and preserves Unicode and line ends', async () => {
  const source = `标题\r\n${'| D - U - |\r\n'.repeat(200)}尾行  `;
  const result = await share.createShareUrl(source, baseUrl);
  assert.equal(result.codec, 'gzip');
  const decoded = await share.decodeSongFromUrl(result.url);
  assert.equal(decoded.source, source);
  assert.equal(decoded.codec, 'gzip');
});

test('raw remains available without compression support', async () => {
  const result = await share.createShareUrl('plain text', baseUrl, {
    compressionAvailable: false,
  });
  assert.equal(result.codec, 'raw');
  assert.equal((await share.decodeSongFromUrl(result.url)).source, 'plain text');
});

test('a URL without a song parameter reports no shared source', async () => {
  assert.deepEqual(
    await share.decodeSongFromUrl('https://example.test/tool?x=1'),
    { found: false, source: null, codec: null },
  );
});

test('duplicate parameters and unsupported formats are rejected', async () => {
  await assert.rejects(
    () => share.decodeSongFromUrl('https://example.test/?song=v1.raw.RA&song=v1.raw.VQ'),
    expectCode('song_parameter_count'),
  );
  await assert.rejects(
    () => share.decodeSongFromUrl('https://example.test/?song=v2.raw.RA'),
    expectCode('share_version'),
  );
  await assert.rejects(
    () => share.decodeSongFromUrl('https://example.test/?song=v1.zip.RA'),
    expectCode('share_codec'),
  );
  await assert.rejects(
    () => share.decodeSongFromUrl('https://example.test/?song=v1.raw'),
    expectCode('share_format'),
  );
});

test('malformed and non-canonical Base64URL are rejected', async () => {
  for (const payload of ['%', 'A', 'AB', 'RA==']) {
    await assert.rejects(
      () => share.decodeSongFromUrl(`https://example.test/?song=v1.raw.${payload}`),
      expectCode('base64_invalid'),
    );
  }
});

test('invalid gzip and invalid UTF-8 are rejected', async () => {
  await assert.rejects(
    () => share.decodeSongFromUrl(makeSongUrl('gzip', [1, 2, 3, 4])),
    expectCode('gzip_invalid'),
  );
  await assert.rejects(
    () => share.decodeSongFromUrl(makeSongUrl('raw', [0xff, 0xfe])),
    expectCode('source_utf8_invalid'),
  );
});

test('gzip links fail clearly without decompression support', async () => {
  const source = 'repeat '.repeat(100);
  const result = await share.createShareUrl(source, baseUrl);
  assert.equal(result.codec, 'gzip');
  await assert.rejects(
    () => share.decodeSongFromUrl(result.url, { decompressionAvailable: false }),
    expectCode('gzip_unavailable'),
  );
});

test('decoded and encoded size limits are enforced', async () => {
  const oversizedBytes = Buffer.alloc(share.MAX_DECODED_SOURCE_BYTES + 1, 97);
  const gzipBytes = gzipSync(oversizedBytes);
  await assert.rejects(
    () => share.decodeSongFromUrl(makeSongUrl('gzip', gzipBytes)),
    expectCode('source_too_large'),
  );
  await assert.rejects(
    () => share.decodeSongFromUrl(makeSongUrl('raw', oversizedBytes)),
    expectCode('source_too_large'),
  );
  await assert.rejects(
    () => share.createShareUrl('a'.repeat(share.MAX_DECODED_SOURCE_BYTES + 1), baseUrl),
    expectCode('source_too_large'),
  );
});

test('complete share URLs must fit the configured limit', async () => {
  assert.equal(share.MAX_SHARE_URL_LENGTH, 750);
  await assert.rejects(
    () => share.createShareUrl('source', baseUrl, {
      compressionAvailable: false,
      maxUrlLength: 20,
    }),
    expectCode('share_url_too_long'),
  );
});

test('source that cannot round-trip through UTF-8 is rejected', async () => {
  await assert.rejects(
    () => share.createShareUrl('\ud800', baseUrl),
    expectCode('source_utf8_invalid'),
  );
});

test('the page loads sharing before the application', () => {
  const htmlPath = path.join(__dirname, '..', 'tools', 'guitar-strumming', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(html.indexOf('src="./share.js?') < html.indexOf('src="./app.js?'));
  assert.match(html, /id="copy-share-link"/);
  assert.match(html, /id="copy-source"/);
});
