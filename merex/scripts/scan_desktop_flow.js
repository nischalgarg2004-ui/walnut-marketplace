const fs = require('fs');
const path = require('path');

const inputPath = path.join('C:', 'Users', 'nisch', '.gemini', 'antigravity', 'scratch', 'raw_figma.json');
const rawData = fs.readFileSync(inputPath, 'utf8');
const data = JSON.parse(rawData);

const rootNode = data.nodes['5:1148'].document;
const desktop = rootNode.children.find(c => c.id === '5:962');

console.log('=== Desktop Layout Flow (Top to Bottom) ===');
desktop.children.forEach((c, i) => {
  const bbox = c.absoluteBoundingBox || { x: 0, y: 0, width: 0, height: 0 };
  console.log(`[Section ${i + 1}] ID: ${c.id} | Name: "${c.name}" | Type: ${c.type} | y: ${bbox.y} | h: ${bbox.height}`);
});
