const fs = require('fs');
const path = require('path');

const inputPath = path.join('C:', 'Users', 'nisch', '.gemini', 'antigravity', 'scratch', 'raw_figma.json');
const rawData = fs.readFileSync(inputPath, 'utf8');

console.log('Searching for "1387"...');
const index = rawData.indexOf('1387');
if (index !== -1) {
  console.log('Found! Context:');
  console.log(rawData.substring(Math.max(0, index - 150), Math.min(rawData.length, index + 150)));
} else {
  console.log('Not found.');
}

console.log('\nSearching for "Logo"...');
const logoIndex = rawData.indexOf('"Logo"');
if (logoIndex !== -1) {
  console.log('Found! Context:');
  console.log(rawData.substring(Math.max(0, logoIndex - 150), Math.min(rawData.length, logoIndex + 150)));
} else {
  console.log('Not found.');
}
