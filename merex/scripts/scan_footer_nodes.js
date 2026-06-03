const fs = require('fs');
const path = require('path');

const inputPath = path.join('C:', 'Users', 'nisch', '.gemini', 'antigravity', 'scratch', 'raw_figma.json');
const rawData = fs.readFileSync(inputPath, 'utf8');
const data = JSON.parse(rawData);

const rootNode = data.nodes['5:1148'].document;
const desktop = rootNode.children.find(c => c.id === '5:962');

console.log('=== Desktop Children (Top to Bottom) ===');
desktop.children.forEach(c => {
  console.log(`- ID: ${c.id} | Name: ${c.name} | Type: ${c.type}`);
  if (c.id === '5:1021' || c.name.toLowerCase().includes('footer') || c.name.toLowerCase().includes('subscribe') || c.name.toLowerCase().includes('wordmark')) {
    console.log(JSON.stringify(c, null, 2));
  }
});
