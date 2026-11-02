#!/usr/bin/env node

'use strict';
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const background = [244, 241, 232];
const foreground = [23, 62, 48];
function read(file) {
  const png = fs.readFileSync(file);
  if (!png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    throw Error('Expected a PNG source');
  }
  let width, height, offset = 8; const chunks = [];
  while (offset < png.length) {
    const length = png.readUInt32BE(offset), type = png.toString('ascii', offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 2 || data[12] !== 0) throw Error('Expected non-interlaced RGB8 PNG');
    }
    if (type === 'IDAT') chunks.push(data);
    offset += length + 12;
  }
  const raw = zlib.inflateSync(Buffer.concat(chunks));
  if (raw.length !== (width * 3 + 1) * height) throw Error('Unexpected PNG data length');
  const alpha = new Float64Array(width * height);
  for (let y = 0; y < height; y++) {
    const offset = y * (width * 3 + 1);
    if (raw[offset] !== 0) throw Error('Expected unfiltered scanlines');
    for (let x = 0; x < width; x++) {
      const start = offset + 1 + x * 3;
      const amount = (background[0] - raw[start]) / (background[0] - foreground[0]);
      for (let c = 0; c < 3; c++) {
        const expected = Math.round(background[c] * (1 - amount) + foreground[c] * amount);
        if (amount < 0 || amount > 1 || Math.abs(raw[start + c] - expected) > 1) {
          throw Error('Source contains a color outside the icon palette');
        }
      }
      alpha[y * width + x] = amount;
    }
  }
  return { width, height, alpha };
}
function bounds(icon) {
  let left = icon.width, top = icon.height, right = -1, bottom = -1, area = 0;
  for (let y = 0; y < icon.height; y++) for (let x = 0; x < icon.width; x++) {
    const a = icon.alpha[y * icon.width + x]; area += a;
    if (a > 0) { left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y); }
  }
  return { left, top, right, bottom, width: right - left + 1, height: bottom - top + 1, coverage: (100 * area / (icon.width * icon.height)).toFixed(1) + '%' };
}
function transform(source, size, scale, centerX, centerY) {
  const b = bounds(source);
  const sx = (b.left + b.right + 1) / 2, sy = (b.top + b.bottom + 1) / 2;
  const alpha = new Float64Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const x0 = (x - centerX) / scale + sx, x1 = (x + 1 - centerX) / scale + sx;
    const y0 = (y - centerY) / scale + sy, y1 = (y + 1 - centerY) / scale + sy;
    let sum = 0;
    for (let iy = Math.max(0, Math.floor(y0)); iy < Math.min(source.height, Math.ceil(y1)); iy++) {
      const wy = Math.max(0, Math.min(y1, iy + 1) - Math.max(y0, iy));
      for (let ix = Math.max(0, Math.floor(x0)); ix < Math.min(source.width, Math.ceil(x1)); ix++) {
        const wx = Math.max(0, Math.min(x1, ix + 1) - Math.max(x0, ix));
        sum += source.alpha[iy * source.width + ix] * wx * wy;
      }
    }
    // Area sampling changes scale and position without redrawing or distorting the symbol.
    const a = Math.max(0, Math.min(1, sum / ((x1 - x0) * (y1 - y0))));
    alpha[y * size + x] = Math.round(a * 221) / 221;
  }
  return { width: size, height: size, alpha };
}
function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
}
function write(file, icon) {
  function chunk(type, data) {
    const name = Buffer.from(type), result = Buffer.alloc(data.length + 12);
    result.writeUInt32BE(data.length); name.copy(result, 4); data.copy(result, 8);
    result.writeUInt32BE(crc32(Buffer.concat([name, data])), data.length + 8); return result;
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(icon.width); header.writeUInt32BE(icon.height, 4); header[8] = 8; header[9] = 2;
  const raw = Buffer.alloc((icon.width * 3 + 1) * icon.height);
  for (let y = 0; y < icon.height; y++) for (let x = 0; x < icon.width; x++) {
    const a = icon.alpha[y * icon.width + x], offset = y * (icon.width * 3 + 1) + 1 + x * 3;
    for (let c = 0; c < 3; c++) raw[offset + c] = Math.round(background[c] * (1 - a) + foreground[c] * a);
  }
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}

const root = path.join(__dirname, '..');
const directory = path.join(root, 'assets/app-icons');
// Scales are relative to each original source. Centers use the 512-pixel canvas.
const choices = [
  ['guitar-strum-machine', 0.86, 256, 260],
  ['metronome', 1.14, 256, 248],
  ['tuner', 1.06, 256, 256],
  ['pitch-key', 0.98, 248, 256],
];
for (const [name, scale, centerX, centerY] of choices) {
  const original = read(path.join(directory, name + '-512.png'));
  const box = bounds(original);
  for (const [method, candidate] of [
    ['equal-bounds', transform(original, 512, 384 / Math.max(box.width, box.height), 256, 256)],
    ['apparent', transform(original, 512, scale, centerX, centerY)],
  ]) {
    const outputDirectory = path.join(directory, 'comparison', method);
    fs.mkdirSync(outputDirectory, { recursive: true });
    const file = path.join(outputDirectory, name + '-512.png');
    const candidateBounds = bounds(candidate);
    if (candidateBounds.left <= 0 || candidateBounds.top <= 0
      || candidateBounds.right >= 511 || candidateBounds.bottom >= 511) {
      throw Error('Candidate reaches the canvas edge');
    }
    write(file, candidate);
    console.log(method, name, JSON.stringify(bounds(read(file))));
  }
}
