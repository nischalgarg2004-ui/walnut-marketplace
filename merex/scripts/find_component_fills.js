const fs = require('fs');
const path = require('path');

const inputPath = path.join('C:', 'Users', 'nisch', '.gemini', 'antigravity', 'scratch', 'raw_figma.json');
const rawData = fs.readFileSync(inputPath, 'utf8');
const data = JSON.parse(rawData);

// Search raw_figma.json keys or content for "5:1387"
console.log('=== Searching for component 5:1387 ===');
const regex = /"5:1387"[^{}]*({[^{}]+})/g;
let match;
while ((match = regex.exec(rawData)) !== null) {
  console.log('Match:', match[0]);
}

// Search for any key in components or nodes that matches
Object.keys(data.components || {}).forEach(k => {
  if (k.includes('1387')) {
    console.log(`Found component key: ${k} ->`, data.components[k]);
  }
});

// Search rawData for fills of the node with ID ending in "5:1387"
const idRegex = /"id":"[^"]*5:1387"[^{}]*"fills":(\[[^\]]+\])/g;
while ((match = idRegex.exec(rawData)) !== null) {
  console.log('Found fills for 5:1387:', match[1]);
}
