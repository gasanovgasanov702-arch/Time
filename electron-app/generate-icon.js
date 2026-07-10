const fs = require('fs');
const path = require('path');

// Simple PNG generator for icon (1x1 pixel, will be replaced by Electron default)
// This creates a minimal valid PNG file

function createMinimalPNG() {
    // PNG signature
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    
    // IHDR chunk (image header)
    const width = 256;
    const height = 256;
    const bitDepth = 8;
    const colorType = 2; // RGB
    const compression = 0;
    const filter = 0;
    const interlace = 0;
    
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData[8] = bitDepth;
    ihdrData[9] = colorType;
    ihdrData[10] = compression;
    ihdrData[11] = filter;
    ihdrData[12] = interlace;
    
    const ihdr = createChunk('IHDR', ihdrData);
    
    // IDAT chunk (image data) - simple gold color
    const rawData = [];
    for (let y = 0; y < height; y++) {
        rawData.push(0); // filter byte
        for (let x = 0; x < width; x++) {
            // Gold color: #b8924a
            rawData.push(184); // R
            rawData.push(146); // G
            rawData.push(74);  // B
        }
    }
    
    const zlib = require('zlib');
    const compressed = zlib.deflateSync(Buffer.from(rawData));
    const idat = createChunk('IDAT', compressed);
    
    // IEND chunk (image end)
    const iend = createChunk('IEND', Buffer.alloc(0));
    
    return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    
    const typeBuffer = Buffer.from(type);
    const crc = crc32(Buffer.concat([typeBuffer, data]));
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc, 0);
    
    return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buf) {
    let crc = 0xFFFFFFFF;
    const table = [];
    
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            if (c & 1) {
                c = 0xEDB88320 ^ (c >>> 1);
            } else {
                c = c >>> 1;
            }
        }
        table[i] = c;
    }
    
    for (let i = 0; i < buf.length; i++) {
        crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Create icon
const iconPath = path.join(__dirname, 'assets', 'icon.png');
const png = createMinimalPNG();
fs.writeFileSync(iconPath, png);

console.log('Icon created:', iconPath);
console.log('Size:', png.length, 'bytes');
