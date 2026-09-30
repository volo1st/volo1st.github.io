#!/usr/bin/env node

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const width = 1200;
const height = 630;
const pixels = Buffer.alloc(width * height * 3);

const glyphs = {
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
};

function rgb(hex) {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function fillRect(x, y, rectangleWidth, rectangleHeight, color) {
  const left = Math.round(x);
  const top = Math.round(y);
  const right = Math.round(x + rectangleWidth);
  const bottom = Math.round(y + rectangleHeight);
  const [red, green, blue] = rgb(color);
  for (let row = Math.max(0, top); row < Math.min(height, bottom); row += 1) {
    for (let column = Math.max(0, left); column < Math.min(width, right); column += 1) {
      const offset = (row * width + column) * 3;
      pixels[offset] = red;
      pixels[offset + 1] = green;
      pixels[offset + 2] = blue;
    }
  }
}

function fillPolygon(points, color) {
  const minimumX = Math.floor(Math.min(...points.map(([x]) => x)));
  const maximumX = Math.ceil(Math.max(...points.map(([x]) => x)));
  const minimumY = Math.floor(Math.min(...points.map(([, y]) => y)));
  const maximumY = Math.ceil(Math.max(...points.map(([, y]) => y)));
  const [red, green, blue] = rgb(color);

  for (let y = minimumY; y < maximumY; y += 1) {
    for (let x = minimumX; x < maximumX; x += 1) {
      let inside = false;
      for (let current = 0, previous = points.length - 1; current < points.length; previous = current, current += 1) {
        const [currentX, currentY] = points[current];
        const [previousX, previousY] = points[previous];
        const crosses = currentY > y !== previousY > y;
        if (crosses && x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX) {
          inside = !inside;
        }
      }
      if (inside && x >= 0 && x < width && y >= 0 && y < height) {
        const offset = (y * width + x) * 3;
        pixels[offset] = red;
        pixels[offset + 1] = green;
        pixels[offset + 2] = blue;
      }
    }
  }
}

function drawText(text, x, y, scale, color) {
  let cursor = x;
  for (const character of text.toUpperCase()) {
    const glyph = glyphs[character];
    if (!glyph) {
      throw new Error(`Missing glyph: ${character}`);
    }
    for (let row = 0; row < glyph.length; row += 1) {
      for (let column = 0; column < glyph[row].length; column += 1) {
        if (glyph[row][column] === '1') {
          fillRect(cursor + column * scale, y + row * scale, scale, scale, color);
        }
      }
    }
    cursor += scale * 6;
  }
}

function drawLogo(x, y, scale) {
  const transform = (points) => points.map(([pointX, pointY]) => [x + pointX * scale, y + pointY * scale]);
  fillPolygon(transform([[4, 1], [26, 1], [26, 3], [29, 3], [29, 26], [26, 26], [26, 29], [4, 29], [4, 26], [1, 26], [1, 4], [4, 4]]), '#17212b');
  fillPolygon(transform([[4, 4], [26, 4], [26, 7], [7, 7], [7, 26], [4, 26]]), '#3f86a6');
  fillRect(x + 7 * scale, y + 7 * scale, 19 * scale, 19 * scale, '#28624f');
  fillPolygon(transform([[23, 7], [26, 7], [26, 26], [7, 26], [7, 23], [23, 23]]), '#1d4639');
  fillPolygon(transform([[9, 9], [14, 9], [14, 18], [16, 18], [16, 22], [18, 22], [18, 18], [20, 18], [20, 9], [25, 9], [25, 20], [23, 20], [23, 24], [20, 24], [20, 27], [12, 27], [12, 24], [9, 24], [9, 20], [7, 20], [7, 9]]), '#f5f1df');
  fillRect(x + 12 * scale, y + 24 * scale, 8 * scale, 3 * scale, '#d7cfb3');
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const name = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

fillRect(0, 0, width, height, '#f4f1e8');
fillRect(65, 58, 1080, 530, '#d2cdbd');
fillRect(55, 48, 1080, 530, '#fffdf7');
fillRect(55, 48, 14, 530, '#27644e');

fillRect(282, 65, 636, 493, '#244c3d');
fillRect(288, 71, 624, 481, '#fffdf7');

drawText('D', 130, 120, 10, '#3f86a6');
fillRect(115, 224, 130, 12, '#27644e');
fillRect(140, 252, 105, 12, '#3f86a6');
fillRect(165, 280, 80, 12, '#27644e');
drawText('U', 155, 332, 10, '#3f86a6');
fillRect(115, 436, 130, 12, '#27644e');
fillRect(140, 464, 105, 12, '#3f86a6');

drawText('U', 980, 120, 10, '#3f86a6');
fillRect(955, 224, 130, 12, '#27644e');
fillRect(955, 252, 105, 12, '#3f86a6');
fillRect(955, 280, 80, 12, '#27644e');
drawText('D', 1005, 332, 10, '#3f86a6');
fillRect(955, 436, 130, 12, '#27644e');
fillRect(955, 464, 105, 12, '#3f86a6');

drawLogo(320, 78, 3);
drawText('GUITAR STRUM', 440, 85, 6, '#173e30');
drawText('MACHINE', 477, 145, 6, '#173e30');
fillRect(320, 202, 560, 8, '#27644e');
drawText('PRACTISE CHORD CHANGES', 404, 230, 3, '#4a4a43');
drawText('AND STRUMMING PATTERNS.', 395, 263, 3, '#4a4a43');

const chordLabels = ['C', 'G', 'AM', 'F'];
for (let index = 0; index < chordLabels.length; index += 1) {
  const x = 320 + index * 142;
  fillRect(x, 320, 130, 82, '#244c3d');
  fillRect(x + 4, 324, 122, 74, '#edf5f1');
  const label = chordLabels[index];
  drawText(label, x + (130 - label.length * 36 + 6) / 2, 340, 6, '#173e30');
}

drawText('D - D U - U D U', 348, 432, 5, '#27644e');
drawText('VOLO1ST.COM', 470, 502, 4, '#5c594e');

const header = Buffer.alloc(13);
header.writeUInt32BE(width, 0);
header.writeUInt32BE(height, 4);
header[8] = 8;
header[9] = 2;

const raw = Buffer.alloc((width * 3 + 1) * height);
for (let row = 0; row < height; row += 1) {
  const rawOffset = row * (width * 3 + 1);
  raw[rawOffset] = 0;
  pixels.copy(raw, rawOffset + 1, row * width * 3, (row + 1) * width * 3);
}

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  pngChunk('IHDR', header),
  pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  pngChunk('IEND', Buffer.alloc(0)),
]);

const destination = path.join(__dirname, '..', 'assets', 'share', 'guitar-strum-machine.png');
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.writeFileSync(destination, png);
