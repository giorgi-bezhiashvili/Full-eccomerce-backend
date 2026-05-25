const fsPromises = require('fs').promises;

/**
 * Pure JavaScript utility to strip EXIF data from JPEG buffers
 * by removing APP1 (0xFFE1) segments where metadata is stored.
 */
function stripJpegExif(buffer) {
  if (typeof buffer !== 'object' || buffer[0] !== 0xFF || buffer[1] !== 0xD8) {
    return buffer;
  }

  let i = 2;
  const cleanChunks = [buffer.subarray(0, 2)];

  while (i < buffer.length) {
    if (buffer[i] === 0xFF) {
      const marker = buffer[i + 1];
      
      if (marker === 0xE1) {
        const length = buffer.readUInt16BE(i + 2);
        i += 2 + length;
        continue;
      }
      
      if (marker === 0xDA) {
        cleanChunks.push(buffer.subarray(i));
        break;
      }
    }
    
    cleanChunks.push(buffer.subarray(i, i + 1));
    i++;
  }

  return Buffer.concat(cleanChunks);
}

const scanFile = async (filePath) => {
  try {
    // 1. Dynamically load file-type to support ESM package inside CommonJS 👇
    const { fileTypeFromBuffer } = await import('file-type');

    // 2. Check file size
    const stats = await fsPromises.stat(filePath);
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (stats.size > maxSize) {
      await fsPromises.unlink(filePath);
      return { safe: false, reason: 'File exceeds size limit' };
    }

    // 3. Read file buffer
    const fileBuffer = await fsPromises.readFile(filePath);

    // 4. Check actual file type via magic bytes using the imported function
    const type = await fileTypeFromBuffer(fileBuffer);
    if (!type) {
      await fsPromises.unlink(filePath);
      return { safe: false, reason: 'Unknown file type - possible malware' };
    }

    // 5. Validate allowed MIME types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(type.mime)) {
      await fsPromises.unlink(filePath);
      return { safe: false, reason: `Suspicious file type: ${type.mime}` };
    }

    // 6. Sanitize JPEG Metadata
    if (type.mime === 'image/jpeg') {
      const sanitizedBuffer = stripJpegExif(fileBuffer);
      await fsPromises.writeFile(filePath, sanitizedBuffer);
    }

    return { safe: true };
  } catch (err) {
    console.error('File processing error details:', err.message);
    
    try {
      await fsPromises.unlink(filePath);
    } catch (_) {}
    
    return { safe: false, reason: `File processing failed: ${err.message}` };
  }
};

module.exports = { scanFile };