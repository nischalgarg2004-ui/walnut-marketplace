const fs = require('fs');
const path = require('path');

const inputPath = path.join('C:', 'Users', 'nisch', '.gemini', 'antigravity', 'scratch', 'raw_figma.json');
const rawData = fs.readFileSync(inputPath, 'utf8');
const data = JSON.parse(rawData);

const rootNode = data.nodes['5:1148'].document;
const desktop = rootNode.children.find(c => c.id === '5:962');
const marquee = desktop.children.find(c => c.id === '5:1019');

console.log('=== Text Marquee Details ===');
console.log(JSON.stringify(marquee, null, 2));
