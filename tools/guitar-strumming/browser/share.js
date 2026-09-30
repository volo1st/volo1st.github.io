(function initializeShareApi(root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.GuitarStrummingShare = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function createShareApi(root) {
  'use strict';

  const MAX_SHARE_URL_LENGTH = 750;
  const MAX_DECODED_SOURCE_BYTES = 65536;
  const MAX_COMPRESSED_SOURCE_BYTES = MAX_DECODED_SOURCE_BYTES + 4096;

  class ShareError extends Error {
    constructor(code, message) {
      super(message);
      this.name = 'ShareError';
      this.code = code;
    }
  }

  async function createShareUrl(source, baseUrl, options = {}) {
    const sourceText = String(source);
    const sourceBytes = encodeSource(sourceText);
    const maxUrlLength = options.maxUrlLength ?? MAX_SHARE_URL_LENGTH;
    const rawUrl = makeUrl(baseUrl, 'raw', encodeBase64Url(sourceBytes));
    const candidates = [{ codec: 'raw', url: rawUrl }];

    const compressionAvailable = options.compressionAvailable
      ?? hasCompressionSupport();
    if (compressionAvailable) {
      const gzipBytes = await compressGzip(sourceBytes);
      candidates.push({
        codec: 'gzip',
        url: makeUrl(baseUrl, 'gzip', encodeBase64Url(gzipBytes)),
      });
    }

    candidates.sort((left, right) => left.url.length - right.url.length);
    const selected = candidates[0];
    if (selected.url.length > maxUrlLength) {
      throw new ShareError(
        'share_url_too_long',
        `The share link exceeds the ${maxUrlLength.toLocaleString('en-AU')}-character limit.`,
      );
    }
    return Object.freeze({
      codec: selected.codec,
      url: selected.url,
      urlLength: selected.url.length,
      sourceBytes: sourceBytes.length,
    });
  }

  async function decodeSongFromUrl(urlValue, options = {}) {
    let url;
    try {
      url = new root.URL(String(urlValue));
    } catch (error) {
      throw new ShareError('url_invalid', 'The share URL is invalid.');
    }

    const parameters = url.searchParams.getAll('song');
    if (parameters.length === 0) {
      return Object.freeze({ found: false, source: null, codec: null });
    }
    if (parameters.length !== 1) {
      throw new ShareError(
        'song_parameter_count',
        'The URL must contain exactly one song parameter.',
      );
    }

    const parts = parameters[0].split('.');
    if (parts.length !== 3) {
      throw new ShareError('share_format', 'The song parameter format is invalid.');
    }
    const [version, codec, payload] = parts;
    if (version !== 'v1') {
      throw new ShareError('share_version', `Share-link version ${version || '(empty)'} is not supported.`);
    }
    if (codec !== 'raw' && codec !== 'gzip') {
      throw new ShareError('share_codec', `Share-link codec ${codec || '(empty)'} is not supported.`);
    }

    const maximumEncodedBytes = codec === 'raw'
      ? MAX_DECODED_SOURCE_BYTES
      : MAX_COMPRESSED_SOURCE_BYTES;
    const encodedBytes = decodeBase64Url(payload, maximumEncodedBytes);
    let sourceBytes;
    if (codec === 'raw') {
      sourceBytes = encodedBytes;
    } else {
      const decompressionAvailable = options.decompressionAvailable
        ?? hasDecompressionSupport();
      if (!decompressionAvailable) {
        throw new ShareError(
          'gzip_unavailable',
          'This browser cannot open a gzip share link.',
        );
      }
      sourceBytes = await decompressGzip(encodedBytes);
    }
    if (sourceBytes.length > MAX_DECODED_SOURCE_BYTES) {
      throw sourceTooLargeError();
    }

    let source;
    try {
      source = new root.TextDecoder('utf-8', { fatal: true }).decode(sourceBytes);
    } catch (error) {
      throw new ShareError('source_utf8_invalid', 'The shared source is not valid UTF-8.');
    }
    return Object.freeze({ found: true, source, codec });
  }

  function encodeSource(source) {
    const bytes = new root.TextEncoder().encode(source);
    if (bytes.length > MAX_DECODED_SOURCE_BYTES) {
      throw sourceTooLargeError();
    }
    const roundTrip = new root.TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (roundTrip !== source) {
      throw new ShareError(
        'source_utf8_invalid',
        'The source contains text that cannot be encoded exactly as UTF-8.',
      );
    }
    return bytes;
  }

  function makeUrl(baseUrl, codec, payload) {
    let url;
    try {
      url = new root.URL(String(baseUrl));
    } catch (error) {
      throw new ShareError('url_invalid', 'The current page URL is invalid.');
    }
    url.hash = '';
    url.searchParams.delete('preset');
    url.searchParams.set('song', `v1.${codec}.${payload}`);
    return url.href;
  }

  function hasCompressionSupport() {
    return Boolean(
      root.CompressionStream
      && root.Blob
      && root.Blob.prototype
      && root.Blob.prototype.stream,
    );
  }

  function hasDecompressionSupport() {
    return Boolean(
      root.DecompressionStream
      && root.Blob
      && root.Blob.prototype
      && root.Blob.prototype.stream,
    );
  }

  async function compressGzip(bytes) {
    try {
      const stream = new root.Blob([bytes])
        .stream()
        .pipeThrough(new root.CompressionStream('gzip'));
      return await readByteStream(
        stream,
        MAX_COMPRESSED_SOURCE_BYTES,
        'The compressed source is too large.',
      );
    } catch (error) {
      if (error instanceof ShareError) throw error;
      throw new ShareError('gzip_encode_failed', 'The browser could not compress the source.');
    }
  }

  async function decompressGzip(bytes) {
    try {
      const stream = new root.Blob([bytes])
        .stream()
        .pipeThrough(new root.DecompressionStream('gzip'));
      return await readByteStream(
        stream,
        MAX_DECODED_SOURCE_BYTES,
        'The shared source exceeds the decoded-source limit.',
      );
    } catch (error) {
      if (error instanceof ShareError) throw error;
      throw new ShareError('gzip_invalid', 'The compressed shared source is invalid.');
    }
  }

  async function readByteStream(stream, limit, overflowMessage) {
    const reader = stream.getReader();
    const chunks = [];
    let totalLength = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = value instanceof Uint8Array ? value : new Uint8Array(value);
      totalLength += chunk.length;
      if (totalLength > limit) {
        try {
          await reader.cancel();
        } catch (error) {
          // The size error below is the useful failure.
        }
        throw new ShareError('source_too_large', overflowMessage);
      }
      chunks.push(chunk);
    }

    const bytes = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return bytes;
  }

  function encodeBase64Url(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    return root.btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  function decodeBase64Url(payload, maximumBytes) {
    if (!/^[A-Za-z0-9_-]*$/.test(payload) || payload.length % 4 === 1) {
      throw malformedBase64Error();
    }
    if (payload.length > Math.ceil(maximumBytes * 4 / 3) + 2) {
      throw sourceTooLargeError();
    }
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    let binary;
    try {
      binary = root.atob(padded);
    } catch (error) {
      throw malformedBase64Error();
    }
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    if (bytes.length > maximumBytes) {
      throw sourceTooLargeError();
    }
    if (encodeBase64Url(bytes) !== payload) {
      throw malformedBase64Error();
    }
    return bytes;
  }

  function sourceTooLargeError() {
    return new ShareError(
      'source_too_large',
      `The source exceeds the ${MAX_DECODED_SOURCE_BYTES.toLocaleString('en-AU')}-byte limit.`,
    );
  }

  function malformedBase64Error() {
    return new ShareError('base64_invalid', 'The share-link payload is not valid Base64URL data.');
  }

  return Object.freeze({
    MAX_DECODED_SOURCE_BYTES,
    MAX_SHARE_URL_LENGTH,
    ShareError,
    createShareUrl,
    decodeSongFromUrl,
    encodeBase64Url,
  });
}));
