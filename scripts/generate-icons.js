import fs from 'fs';
import zlib from 'zlib';

function createPng(width, height, r, g, b) {
  // A minimal valid uncompressed PNG file generator
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type (truecolor RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const body = Buffer.concat([typeBuf, data]);
    const crc = crc32(body);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // IDAT chunk
  // Raw scanlines: each scanline has 1 filter byte (0) + width * 3 bytes (RGB)
  const scanlineLength = 1 + width * 3;
  const rawData = Buffer.alloc(height * scanlineLength);
  for (let y = 0; y < height; y++) {
    const offset = y * scanlineLength;
    rawData[offset] = 0; // filter None
    for (let x = 0; x < width; x++) {
      const pixelOffset = offset + 1 + x * 3;
      // Slight gradient
      const factor = 1 - (y / height) * 0.3;
      rawData[pixelOffset] = Math.round(r * factor);
      rawData[pixelOffset + 1] = Math.round(g * factor);
      rawData[pixelOffset + 2] = Math.round(b * factor);
    }
  }
  const compressed = zlib.deflateSync(rawData);
  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 implementation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public', { recursive: true });
}

// Generate Balbec Amber/Terracotta colored icons:
fs.writeFileSync('./public/pwa-192x192.png', createPng(192, 192, 217, 119, 6));
fs.writeFileSync('./public/pwa-512x512.png', createPng(512, 512, 217, 119, 6));
fs.writeFileSync('./public/pwa-maskable-512x512.png', createPng(512, 512, 194, 65, 12));
fs.writeFileSync('./public/apple-touch-icon.png', createPng(180, 180, 217, 119, 6));
console.log('PWA icons created successfully.');
