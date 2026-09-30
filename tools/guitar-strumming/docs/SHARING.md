# Shareable Source Work Package

## Purpose

Add share links that contain the exact plain-text source.

Keep the source text authoritative.

## Scope

This package adds:

- versioned raw and gzip URL formats;
- adaptive selection of the shorter complete URL;
- a Copy share link button;
- a Copy source button;
- safe shared-source loading; and
- a manual-copy fallback.

This package does not add a server, database, preset catalog, account, or application network request.

A browser sends a share URL query to the website host when it opens the link.

A URL-shortener service receives the complete share URL.

## URL Design

Use one `song` query parameter.

Use one of these formats:

```text
?song=v1.raw.<base64url-payload>
?song=v1.gzip.<base64url-payload>
```

Encode the exact source as UTF-8.

Use URL-safe Base64 without padding.

Use the native Compression Streams API for gzip.

When gzip is available, create both forms and use the shorter complete URL.

Do not include playback state or playback position.

Remove the URL fragment from a created share link.

## Limits

Limit a complete share URL to 750 characters.

WeChat stopped recognizing a 1,542-character test URL after character 808. The 750-character limit keeps a margin below this observed boundary. It does not guarantee support in every third-party service.

Limit decoded source to 65,536 UTF-8 bytes.

Enforce the decoded limit while reading decompressed data.

Do not allocate an unlimited decompressed result.

## Loading and Failure Behavior

Decode the `song` parameter before normal source validation.

Require exactly one `song` parameter.

Reject an unsupported version, unsupported codec, malformed Base64, invalid gzip data, invalid UTF-8, or oversized decoded source.

If transport decoding fails, clear the default example and show the transport error.

If decoding succeeds, preserve the exact decoded text.

If decoded text fails song validation, show the normal validation errors.

Do not start audio automatically.

If the source changes, remove the `song` parameter from the current URL.

## Copy Behavior

Enable Copy share link only when the source is valid and the prepared URL is within the limit.

When Copy share link runs, put the prepared URL in browser history and copy the complete URL.

Keep Copy source available for valid and invalid source.

Copy the exact textarea value.

If clipboard access fails for a share link, show and select the complete URL.

If clipboard access fails for source text, focus and select the source text.

## Test Plan

Add automated tests for:

- raw round trips;
- gzip round trips;
- exact Unicode and line-end preservation;
- adaptive raw and gzip selection;
- URL-safe Base64 without padding;
- duplicate parameters;
- unsupported versions and codecs;
- malformed Base64;
- invalid gzip and UTF-8 data;
- decoded-source overflow;
- complete-URL overflow; and
- environments without compression support.

Run the full repository check.

Manually test:

- Copy share link on HTTPS;
- manual link copy on the local HTTP server;
- Copy source with valid and invalid source;
- an opened link with valid source;
- an opened link with invalid song syntax;
- a damaged link;
- source edits after link creation;
- keyboard use and visible focus;
- narrow width and 200 percent zoom;
- desktop Chrome;
- Safari on iPhone;
- a WeChat message; and
- one URL-shortener service.

## Completion Status

Status: Complete. The optional delivery metadata gap is recorded below.

- [x] Automated checks pass.
  Evidence: `./scripts/check.sh` passed on 2026-09-28. The sharing test file contains 12 passing tests.
- [x] Desktop Chrome checks pass.
  Evidence: The user confirmed source round trips, manual-copy fallback, validation failure, and URL cleanup in desktop Chrome on 2026-09-28.
- [x] Safari on iPhone checks pass.
  Evidence: The user confirmed that a shared link loaded correctly on iPhone on 2026-09-28.
- [x] Direct WeChat link checks pass within the supported limit.
  Evidence: Links with 176 and 693 characters opened correctly from WeChat on 2026-09-28. WeChat stopped recognizing a 1,542-character link after character 808. The generated-link limit is 750 characters.
- [x] URL-shortener check passes.
  Evidence: A shortened link preserved and loaded the shared source on 2026-09-28.
  Accepted risk: WeChat showed a warning before it opened the shortened link. The third-party warning is outside the tool's control.
- [ ] Delivery metadata is recorded.
  Evidence gap: The WeChat version, shortener name, and shortened URL length were not captured. Record these values if future delivery behavior must be reproduced.
- [x] Deployed HTTPS clipboard check passes.
  Evidence: The deployed tool matched commit `d133d4b`. The user confirmed automatic link copy and exact source loading in Mac Chrome and iPhone Safari on 2026-09-28.
