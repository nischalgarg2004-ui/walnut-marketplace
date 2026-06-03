const fs = require('fs');
const path = require('path');

const inputPath = path.join('C:', 'Users', 'nisch', '.gemini', 'antigravity', 'scratch', 'raw_figma.json');
const rawData = fs.readFileSync(inputPath, 'utf8');
const data = JSON.parse(rawData);

console.log('=== Searching Components by Name ===');
if (data.components) {
  for (const [id, comp] of Object.entries(data.components)) {
    console.log(`Component ID: ${id} | Name: ${comp.name}`);
    if (comp.name.toLowerCase().includes('logo')) {
      console.log('  MATCH:', JSON.stringify(comp, null, 2));
    }
  }
} else {
  console.log('No components object found in root.');
}

console.log('\n=== Searching Component Sets by Name ===');
if (data.componentSets) {
  for (const [id, compSet] of Object.entries(data.componentSets)) {
    console.log(`ComponentSet ID: ${id} | Name: ${compSet.name}`);
  }
}
