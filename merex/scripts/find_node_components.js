const fs = require('fs');
const path = require('path');

const inputPath = path.join('C:', 'Users', 'nisch', '.gemini', 'antigravity', 'scratch', 'raw_figma.json');
const rawData = fs.readFileSync(inputPath, 'utf8');
const data = JSON.parse(rawData);

const nodeData = data.nodes['5:1148'];
console.log('=== Searching Node Components ===');
if (nodeData && nodeData.components) {
  for (const [id, comp] of Object.entries(nodeData.components)) {
    console.log(`Component ID: ${id} | Name: ${comp.name}`);
    if (comp.name.toLowerCase().includes('logo') || id.includes('1387')) {
      console.log('  MATCH:', JSON.stringify(comp, null, 2));
    }
  }
} else {
  console.log('No components found in node data.');
}
