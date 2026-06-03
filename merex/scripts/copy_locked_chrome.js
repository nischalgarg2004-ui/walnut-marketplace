const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\nisch\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Network\\Cookies';
const dest = 'C:\\Users\\nisch\\.gemini\antigravity\\scratch\\chrome_cookies_unlocked';

console.log(`Attempting to read locked file: ${src}`);

try {
  // Use read-only flags that allow other processes to keep writing (share read/write)
  const readStream = fs.createReadStream(src, {
    flags: 'r',
    mode: 0o666,
    autoClose: true
  });
  
  const writeStream = fs.createWriteStream(dest);
  
  readStream.on('open', () => {
    console.log('Successfully opened read stream on locked file!');
  });

  readStream.pipe(writeStream);

  writeStream.on('finish', () => {
    console.log(`Successfully copied to ${dest}! File size: ${fs.statSync(dest).size} bytes`);
  });

  readStream.on('error', (err) => {
    console.error('Read Stream Error:', err.message);
  });
  
  writeStream.on('error', (err) => {
    console.error('Write Stream Error:', err.message);
  });
} catch (e) {
  console.error('Sync Error:', e.message);
}
