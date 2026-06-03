const fs = require('fs');
const path = require('path');

const logPath = path.join('C:', 'Users', 'nisch', '.gemini', 'antigravity', 'brain', 'c65fe9ca-187c-4a1c-96c5-06ba41cffdb9', '.system_generated', 'logs', 'transcript.jsonl');
console.log(`Checking log path: ${logPath}`);

if (fs.existsSync(logPath)) {
  const lineReader = require('readline').createInterface({
    input: fs.createReadStream(logPath)
  });

  let lineCount = 0;
  lineReader.on('line', (line) => {
    lineCount++;
    if (line.includes('s3-alpha-sig.figma.com/video') || line.includes('.mp4') || line.includes('/video/')) {
      console.log(`Line ${lineCount} Match:`);
      // print around the match
      const index = line.indexOf('http');
      if (index !== -1) {
        console.log(line.substring(index - 50, index + 300));
      } else {
        console.log(line.substring(0, 500));
      }
    }
  });

  lineReader.on('close', () => {
    console.log(`Scan finished. Total lines scanned: ${lineCount}`);
  });
} else {
  console.log('Log file does not exist.');
}
