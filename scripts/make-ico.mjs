// One-time script: converts build/icon.png → build/icon.ico
// Uses only built-in Node APIs + a tiny inline ICO encoder (no npm deps needed).
// Run with: node scripts/make-ico.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pngPath = path.join(__dirname, '..', 'build', 'icon.png');
const icoPath = path.join(__dirname, '..', 'build', 'icon.ico');

// Read the PNG file
const pngData = fs.readFileSync(pngPath);

// An ICO file wraps one or more PNG images.
// Format: ICONDIR (6 bytes) + ICONDIRENTRY (16 bytes each) + image data
//
// We use the "PNG inside ICO" trick — Windows Vista+ supports embedded PNGs.
// electron-builder and Windows Explorer both handle this correctly.

const ICONDIR = Buffer.alloc(6);
ICONDIR.writeUInt16LE(0, 0);   // reserved, must be 0
ICONDIR.writeUInt16LE(1, 2);   // type: 1 = ICO
ICONDIR.writeUInt16LE(1, 4);   // number of images: 1

const ICONDIRENTRY = Buffer.alloc(16);
ICONDIRENTRY.writeUInt8(0, 0);              // width: 0 means 256
ICONDIRENTRY.writeUInt8(0, 1);              // height: 0 means 256
ICONDIRENTRY.writeUInt8(0, 2);              // color palette count: 0 (no palette)
ICONDIRENTRY.writeUInt8(0, 3);              // reserved
ICONDIRENTRY.writeUInt16LE(1, 4);           // color planes
ICONDIRENTRY.writeUInt16LE(32, 6);          // bits per pixel
ICONDIRENTRY.writeUInt32LE(pngData.length, 8);  // size of image data
ICONDIRENTRY.writeUInt32LE(6 + 16, 12);    // offset of image data (after header + entry)

const ico = Buffer.concat([ICONDIR, ICONDIRENTRY, pngData]);
fs.writeFileSync(icoPath, ico);

console.log(`✅ Created: ${icoPath} (${ico.length} bytes)`);
