const fs = require('fs');
const path = require('path');

const inputPath = path.join('C:', 'Users', 'nisch', '.gemini', 'antigravity', 'scratch', 'raw_figma.json');
const rawData = fs.readFileSync(inputPath, 'utf8');
const data = JSON.parse(rawData);

// Search for any node with name containing "logo" or id matching the logo target
console.log('=== Scanning nodes in raw_figma.json for Logo ===');

function searchLogo(node) {
  if (node.name && node.name.toLowerCase().includes('logo')) {
    console.log(`Found named node: "${node.name}" (ID: ${node.id}, Type: ${node.type})`);
    if (node.fills) {
      console.log('Fills:', JSON.stringify(node.fills, null, 2));
    }
  }
  if (node.children) {
    node.children.forEach(searchLogo);
  }
}

Object.keys(data.nodes).forEach(nodeId => {
  searchLogo(data.nodes[nodeId].document);
});

// Also let's look at the navigation component itself
console.log('\n=== Inspecting Navigation Instance ===');
const rootNode = data.nodes['5:1148'].document;
const desktop = rootNode.children.find(c => c.id === '5:962');
const nav = desktop.children.find(c => c.id === '5:963');
console.log('Navigation properties:', JSON.stringify(nav, null, 2));
