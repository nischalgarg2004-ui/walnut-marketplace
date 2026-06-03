const fs = require('fs');
const path = require('path');

const inputPath = path.join('C:', 'Users', 'nisch', '.gemini', 'antigravity', 'scratch', 'raw_figma.json');
const rawData = fs.readFileSync(inputPath, 'utf8');
const data = JSON.parse(rawData);

const rootNode = data.nodes['5:1148'].document;
const desktop = rootNode.children.find(c => c.id === '5:962');
const body = desktop.children.find(c => c.id === '5:964');
const articleList = body.children.find(c => c.id === '5:1004');

console.log('=== Article List Details ===');
console.log(`Name: ${articleList.name} | Type: ${articleList.type}`);

function printChildren(node, depth = 0) {
  const indent = '  '.repeat(depth);
  console.log(`${indent}- [${node.type}] ID: ${node.id} | Name: "${node.name}"`);
  if (node.fills && node.fills.length > 0) {
    console.log(`${indent}  Fills:`, JSON.stringify(node.fills));
  }
  if (node.type === 'TEXT') {
    console.log(`${indent}  Text: "${node.characters.replace(/\n/g, '\\n')}"`);
    if (node.style) {
      console.log(`${indent}  Style: ${node.style.fontFamily} | ${node.style.fontSize}px`);
    }
  }
  if (node.children) {
    node.children.forEach(c => printChildren(c, depth + 1));
  }
}

printChildren(articleList);
