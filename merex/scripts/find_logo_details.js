const fs = require('fs');
const path = require('path');

const inputPath = path.join('C:', 'Users', 'nisch', '.gemini', 'antigravity', 'scratch', 'raw_figma.json');
const rawData = fs.readFileSync(inputPath, 'utf8');
const data = JSON.parse(rawData);

const rootNode = data.nodes['5:1148'].document;
const desktop = rootNode.children.find(c => c.id === '5:962');
const nav = desktop.children.find(c => c.id === '5:963');

console.log('Navigation children list:');
nav.children.forEach(c => {
  console.log(`- ID: ${c.id} | Name: ${c.name} | Type: ${c.type}`);
  if (c.id.includes('1387') || c.name.toLowerCase().includes('logo')) {
    console.log(JSON.stringify(c, null, 2));
  }
});
