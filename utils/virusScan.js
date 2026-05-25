const fs = require('fs');
const fsPromises = require('fs').promises;
const fileType = require('file-type');
const ExifTransformer = require('exif-be-gone');

const stripFileMetadata = async (filePath) => {
  const tempPath = `${filePath}.stripped`;
  
  return new Promise((resolve, reject) => {
    const input = fs.createReadStream(filePath);
    const output = fs.createWriteStream(tempPath);
    const transformer = new ExifTransformer();

    input.on('error', reject);
    output.on('error', reject);
    transformer.on('error', reject);

    output.on('finish', async () => {
      try {
        // Overwrite the original file with the clean version
        await fsPromises.rename(tempPath, filePath);
        resolve();
      } catch (err) {
        reject(err);
      }
    });

    input.pipe(transformer).pipe(output);
  });
};
  
const scanFile = async (filePath) => {
  try {
    // 1. Check file size first (fastest check, avoids processing massive files)
    const stats = await fsPromises.stat(filePath);
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (stats.size > maxSize) {
      await fsPromises.unlink(filePath);
      return { safe: false, reason: 'File exceeds size limit' };
    }

    // 2. Check actual file type via magic bytes
    const type = await fileType.fromFile(filePath);
    if (!type) {
      await fsPromises.unlink(filePath);
      return { safe: false, reason: 'Unknown file type - possible malware' };
    }

    // 3. Validate allowed MIME types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(type.mime)) {
      await fsPromises.unlink(filePath);
      return { safe: false, reason: `Suspicious file type: ${type.mime}` };
    }

    // 4. Clean the metadata safely
    await stripFileMetadata(filePath);

    return { safe: true };
  } catch (err) {
    console.error('File processing error:', err.message);
    
    // Attempt cleanup if something failed mid-process
    try {
      await fsPromises.unlink(filePath);
    } catch (_) {}
    
    return { safe: false, error: 'File processing failed' };
  }
};

module.exports = { scanFile , stripFileMetadata};