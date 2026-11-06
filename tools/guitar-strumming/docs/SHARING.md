# Sharing and privacy

A source link contains the complete arrangement text. The browser sends its query to the website host when opened. Link recipients and any URL-shortening service can read it. Do not put private information in source that you share. The tool has no account or server-side song storage.

## Link formats

Use one `song` parameter:

```text
?song=v1.raw.<base64url-payload>
?song=v1.gzip.<base64url-payload>
```

Encode exact UTF-8 source with URL-safe Base64 and no padding. If native gzip compression is available, compare raw and compressed complete URLs and use the shorter one. `v1` is the transport version, not a declaration of the tool's release version.

Exact catalog source uses `?preset=<versioned-slug>` instead. Preserve unrelated query parameters and remove fragments from created links. Do not include playback state or position. See [preset identity](PRESETS.md).

## Limits

Generated links must not exceed 750 characters. The limit follows an observed WeChat truncation: a 1,542-character link stopped being recognized after character 808. It does not guarantee support in all sharing apps.

Decoded source is limited to 65,536 UTF-8 bytes. Enforce the limit while decompressing, not after allocating an unlimited result. Compressed input also has a separate bounded limit in `browser/share.js`.

Reject duplicate song parameters, unsupported versions or codecs, malformed Base64, bad gzip data, invalid UTF-8, and oversized data. Keep the default example cleared after a transport error. If decoding succeeds, preserve the exact text and run normal song validation. Never start audio automatically.

## Copy recovery

Enable Copy share link only for valid source with a prepared link within the limit. Copying updates browser history to that link. Editing source removes `song` and `preset` from the current address.

Copy source works for valid or invalid input and copies the exact editor text. If clipboard access fails, select the source for manual copying. For a share-link failure, show and select the complete link. A failed copy must not discard edits.
