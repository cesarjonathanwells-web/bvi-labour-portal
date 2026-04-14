/*
 * Minimal QR Code generator (byte mode, ECC level M).
 *
 * Pure JS, no deps. Returns an inline SVG string for a given text payload.
 * Supports QR versions 1..10 (up to 122 bytes at ECC M) which is plenty
 * for verification URLs like:
 *   https://labour.gov.vg/verify?permit=WP-2026-0001
 *
 * Algorithm adapted from Project Nayuki's QR Code generator (MIT License,
 * https://www.nayuki.io/page/qr-code-generator-library) -- heavily reduced
 * to byte mode + ECC M only to keep the footprint small.
 */

/* -------- Reed-Solomon over GF(256) with primitive poly 0x11D -------- */
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(function initGf() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function rsGeneratorPoly(degree) {
  let poly = new Uint8Array(degree + 1);
  poly[degree] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(degree + 1);
    for (let j = 0; j <= degree; j++) {
      next[j] = gfMul(poly[j], root);
      if (j > 0) next[j] ^= poly[j - 1];
    }
    poly = next;
    root = gfMul(root, 2);
  }
  return poly;
}

function rsRemainder(data, degree) {
  const gen = rsGeneratorPoly(degree);
  const result = new Uint8Array(degree);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ result[0];
    result.copyWithin(0, 1);
    result[degree - 1] = 0;
    for (let j = 0; j < degree; j++) {
      result[j] ^= gfMul(gen[j + 1], factor);
    }
  }
  return result;
}

/* -------- QR parameter tables for ECC level M, versions 1..10 -------- */
// [totalCodewords, ecCodewordsPerBlock, numBlocksGroup1, dataCodewordsGroup1, numBlocksGroup2, dataCodewordsGroup2]
const ECC_M = {
  1:  [26,  10, 1, 16, 0, 0],
  2:  [44,  16, 1, 28, 0, 0],
  3:  [70,  26, 1, 44, 0, 0],
  4:  [100, 18, 2, 32, 0, 0],
  5:  [134, 24, 2, 43, 0, 0],
  6:  [172, 16, 4, 27, 0, 0],
  7:  [196, 18, 4, 31, 0, 0],
  8:  [242, 22, 2, 38, 2, 39],
  9:  [292, 22, 3, 36, 2, 37],
  10: [346, 26, 4, 43, 1, 44],
};

// Byte-mode capacity (data codewords minus 3-byte header overhead approx)
function pickVersion(byteLen) {
  for (let v = 1; v <= 10; v++) {
    const [total, ec, g1n, g1d, g2n, g2d] = ECC_M[v];
    const dataCodewords = g1n * g1d + g2n * g2d;
    // header = 4 (mode) + 8 or 16 (char count) bits = 2 bytes (v<=9) or 3 bytes (v>=10), plus terminator
    const headerBytes = v >= 10 ? 3 : 2;
    if (byteLen + headerBytes <= dataCodewords) return v;
  }
  throw new Error('Payload too long for supported QR versions (max ~100 chars)');
}

/* -------- Bit buffer -------- */
function BitBuffer() {
  this.bits = [];
}
BitBuffer.prototype.append = function (val, len) {
  for (let i = len - 1; i >= 0; i--) this.bits.push((val >>> i) & 1);
};

/* -------- Encode byte-mode data segment -------- */
function encodeData(text, version) {
  const bytes = [];
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c < 0x80) {
      bytes.push(c);
    } else if (c < 0x800) {
      bytes.push(0xc0 | (c >> 6));
      bytes.push(0x80 | (c & 0x3f));
    } else {
      bytes.push(0xe0 | (c >> 12));
      bytes.push(0x80 | ((c >> 6) & 0x3f));
      bytes.push(0x80 | (c & 0x3f));
    }
  }

  const bb = new BitBuffer();
  bb.append(0b0100, 4); // byte mode
  const charCountBits = version >= 10 ? 16 : 8;
  bb.append(bytes.length, charCountBits);
  for (const b of bytes) bb.append(b, 8);

  const [, ec, g1n, g1d, g2n, g2d] = ECC_M[version];
  const dataCodewords = g1n * g1d + g2n * g2d;
  const dataBits = dataCodewords * 8;

  // terminator (up to 4 zeros)
  const term = Math.min(4, dataBits - bb.bits.length);
  for (let i = 0; i < term; i++) bb.bits.push(0);
  // pad to byte boundary
  while (bb.bits.length % 8 !== 0) bb.bits.push(0);
  // pad bytes
  const padBytes = [0xec, 0x11];
  let pi = 0;
  while (bb.bits.length < dataBits) {
    bb.append(padBytes[pi % 2], 8);
    pi++;
  }

  // convert to codeword bytes
  const data = new Uint8Array(dataCodewords);
  for (let i = 0; i < dataCodewords; i++) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bb.bits[i * 8 + j];
    data[i] = byte;
  }
  return data;
}

/* -------- Interleave data + EC into final codeword stream -------- */
function buildCodewords(data, version) {
  const [total, ecPerBlock, g1n, g1d, g2n, g2d] = ECC_M[version];
  const blocks = [];
  const ecBlocks = [];
  let offset = 0;
  for (let i = 0; i < g1n; i++) {
    const blk = data.slice(offset, offset + g1d);
    offset += g1d;
    blocks.push(blk);
    ecBlocks.push(rsRemainder(blk, ecPerBlock));
  }
  for (let i = 0; i < g2n; i++) {
    const blk = data.slice(offset, offset + g2d);
    offset += g2d;
    blocks.push(blk);
    ecBlocks.push(rsRemainder(blk, ecPerBlock));
  }

  const maxDataLen = Math.max(g1d, g2d);
  const result = [];
  for (let i = 0; i < maxDataLen; i++) {
    for (let b = 0; b < blocks.length; b++) {
      if (i < blocks[b].length) result.push(blocks[b][i]);
    }
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (let b = 0; b < ecBlocks.length; b++) {
      result.push(ecBlocks[b][i]);
    }
  }
  return result;
}

/* -------- Matrix building -------- */
function makeMatrix(version, codewords) {
  const size = version * 4 + 17;
  // -1 = unfilled, 0/1 = module, special values tracked via `reserved`
  const m = Array.from({ length: size }, () => new Int8Array(size).fill(-1));
  const reserved = Array.from({ length: size }, () => new Uint8Array(size));

  function setModule(x, y, v) {
    m[y][x] = v;
    reserved[y][x] = 1;
  }

  function drawFinder(x, y) {
    for (let dy = -1; dy <= 7; dy++) {
      for (let dx = -1; dx <= 7; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= size || yy >= size) continue;
        const inner = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6;
        if (!inner) {
          setModule(xx, yy, 0);
          continue;
        }
        const ring = dx === 0 || dx === 6 || dy === 0 || dy === 6;
        const center = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
        setModule(xx, yy, ring || center ? 1 : 0);
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setModule(i, 6, i % 2 === 0 ? 1 : 0);
    setModule(6, i, i % 2 === 0 ? 1 : 0);
  }

  // Alignment patterns (versions 2..10)
  const alignTable = {
    1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
    6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
  };
  const aligns = alignTable[version];
  for (let i = 0; i < aligns.length; i++) {
    for (let j = 0; j < aligns.length; j++) {
      const cx = aligns[i], cy = aligns[j];
      // Skip if it would overlap a finder
      if ((cx === 6 && cy === 6) ||
          (cx === 6 && cy === size - 7) ||
          (cx === size - 7 && cy === 6)) continue;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const edge = Math.max(Math.abs(dx), Math.abs(dy));
          setModule(cx + dx, cy + dy, edge === 1 ? 0 : 1);
        }
      }
    }
  }

  // Dark module
  setModule(8, size - 8, 1);

  // Reserve format info areas (filled later)
  for (let i = 0; i < 9; i++) {
    if (m[8][i] === -1) reserved[8][i] = 1;
    if (m[i][8] === -1) reserved[i][8] = 1;
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 1 - i] = 1;
    reserved[size - 1 - i][8] = 1;
  }

  // Place data bits (zig-zag)
  const bits = [];
  for (const cw of codewords) {
    for (let b = 7; b >= 0; b--) bits.push((cw >> b) & 1);
  }

  let bitIdx = 0;
  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // skip timing column
    for (let i = 0; i < size; i++) {
      const y = upward ? size - 1 - i : i;
      for (let c = 0; c < 2; c++) {
        const x = col - c;
        if (!reserved[y][x]) {
          m[y][x] = bitIdx < bits.length ? bits[bitIdx] : 0;
          bitIdx++;
        }
      }
    }
    upward = !upward;
  }

  return { m, size, reserved };
}

/* -------- Masking -------- */
const MASKS = [
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  (x, y) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

function applyMask(matrix, reserved, maskIdx) {
  const size = matrix.length;
  const mask = MASKS[maskIdx];
  const out = matrix.map((row) => row.slice());
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!reserved[y][x] && mask(x, y)) out[y][x] ^= 1;
    }
  }
  return out;
}

function penalty(m) {
  const size = m.length;
  let p = 0;
  // Rule 1: runs of >=5
  for (let y = 0; y < size; y++) {
    let run = 1;
    for (let x = 1; x < size; x++) {
      if (m[y][x] === m[y][x - 1]) { run++; }
      else { if (run >= 5) p += 3 + (run - 5); run = 1; }
    }
    if (run >= 5) p += 3 + (run - 5);
  }
  for (let x = 0; x < size; x++) {
    let run = 1;
    for (let y = 1; y < size; y++) {
      if (m[y][x] === m[y - 1][x]) { run++; }
      else { if (run >= 5) p += 3 + (run - 5); run = 1; }
    }
    if (run >= 5) p += 3 + (run - 5);
  }
  // Rule 2: 2x2 blocks
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const v = m[y][x];
      if (v === m[y][x + 1] && v === m[y + 1][x] && v === m[y + 1][x + 1]) p += 3;
    }
  }
  // Rule 3: finder-like 1:1:3:1:1 patterns
  const pat = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const patR = pat.slice().reverse();
  const matches = (row, i, p2) => {
    for (let k = 0; k < p2.length; k++) if (row[i + k] !== p2[k]) return false;
    return true;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x <= size - pat.length; x++) {
      if (matches(m[y], x, pat) || matches(m[y], x, patR)) p += 40;
    }
  }
  for (let x = 0; x < size; x++) {
    const col = m.map((r) => r[x]);
    for (let y = 0; y <= size - pat.length; y++) {
      if (matches(col, y, pat) || matches(col, y, patR)) p += 40;
    }
  }
  // Rule 4: dark ratio
  let dark = 0;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (m[y][x]) dark++;
  const pct = (dark * 100) / (size * size);
  p += Math.floor(Math.abs(pct - 50) / 5) * 10;
  return p;
}

function encodeFormatBits(ecLevelBits, maskIdx) {
  // Standard BCH(15,5) format info
  const data = (ecLevelBits << 3) | maskIdx;
  let rem = data;
  for (let i = 0; i < 10; i++) {
    rem = (rem << 1) ^ (((rem >> 9) & 1) * 0x537);
  }
  const bits = ((data << 10) | rem) ^ 0x5412;
  return bits & 0x7fff;
}

function placeFormatBits(m, fmt) {
  const size = m.length;
  // top-left: (8,0..5), (8,7), (8,8), (7,8), (5..0,8)
  const bit = (i) => (fmt >> i) & 1;
  for (let i = 0; i <= 5; i++) m[8][i] = bit(i);
  m[8][7] = bit(6);
  m[8][8] = bit(7);
  m[7][8] = bit(8);
  for (let i = 9; i <= 14; i++) m[14 - i][8] = bit(i);
  // bottom-left + top-right
  for (let i = 0; i < 7; i++) m[size - 1 - i][8] = bit(i);
  for (let i = 7; i < 15; i++) m[8][size - 15 + i] = bit(i);
  m[size - 8][8] = 1; // always-dark module
}

function placeVersionInfo(m, version) {
  if (version < 7) return;
  // BCH(18,6) encoding for version info
  let rem = version;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ (((rem >> 11) & 1) * 0x1f25);
  const bits = (version << 12) | rem;
  const size = m.length;
  for (let i = 0; i < 18; i++) {
    const b = (bits >> i) & 1;
    const a = size - 11 + (i % 3);
    const c = Math.floor(i / 3);
    m[c][a] = b;
    m[a][c] = b;
  }
}

/* -------- SVG render -------- */
function matrixToSvg(m, size, px) {
  const scale = px / size;
  let rects = '';
  for (let y = 0; y < size; y++) {
    let run = 0;
    for (let x = 0; x <= size; x++) {
      if (x < size && m[y][x]) {
        run++;
      } else if (run > 0) {
        const rx = (x - run) * scale;
        const ry = y * scale;
        rects += `<rect x="${rx.toFixed(2)}" y="${ry.toFixed(2)}" width="${(run * scale).toFixed(2)}" height="${scale.toFixed(2)}" fill="#003366"/>`;
        run = 0;
      }
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}" shape-rendering="crispEdges">` +
    `<rect width="${px}" height="${px}" fill="#ffffff"/>` +
    rects +
    `</svg>`
  );
}

/**
 * Generate an inline SVG string encoding the given text as a QR code.
 * @param {string} text - payload (URL, etc.)
 * @param {number} pixelSize - output SVG width/height in px (default 128)
 * @returns {string} SVG markup
 */
export function generateQrSvg(text, pixelSize = 128) {
  const bytes = [];
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) { bytes.push(0xc0 | (c >> 6)); bytes.push(0x80 | (c & 0x3f)); }
    else { bytes.push(0xe0 | (c >> 12)); bytes.push(0x80 | ((c >> 6) & 0x3f)); bytes.push(0x80 | (c & 0x3f)); }
  }
  const version = pickVersion(bytes.length);
  const data = encodeData(text, version);
  const codewords = buildCodewords(data, version);

  // Build matrix once (unmasked data placement), then try all 8 masks and pick best.
  const built = makeMatrix(version, codewords);
  const { reserved } = built;

  let best = null;
  for (let mask = 0; mask < 8; mask++) {
    const masked = applyMask(built.m, reserved, mask);
    // place format info (ECC level M = 0b00)
    const fmt = encodeFormatBits(0b00, mask);
    placeFormatBits(masked, fmt);
    placeVersionInfo(masked, version);
    const score = penalty(masked);
    if (!best || score < best.score) best = { score, m: masked, mask };
  }
  return matrixToSvg(best.m, built.size, pixelSize);
}
