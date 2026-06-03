const fs = require('fs');
const path = require('path');
const https = require('https');

const token = 'figd_GaFT9D2Rt0kFk-8x5gnDE11jWSZvvB8NpyCpcfwU';
const fileKey = 'lwLwb7I3FUlDSMqaRnCNPK';

const inputPath = path.join('C:', 'Users', 'nisch', '.gemini', 'antigravity', 'scratch', 'raw_figma.json');
const rawData = fs.readFileSync(inputPath, 'utf8');
const data = JSON.parse(rawData);

// List of target node IDs we want to extract images for
const targetNodes = {
  'logo': 'I5:963;5:1387',
  'polaroid': '5:998',
  'paper_scrap': '5:999',
  'vinyl_record': '5:1000',
  'vhs_tape': '5:1001',
  'cassette': '5:1002',
  'floppy_disk': '5:1003',
  'telegram': '5:1015',
  'postcard': '5:1017'
};

const hashes = {};

// Helper function to recursively find node in document
function findNode(node, id) {
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  return null;
}

// Find nodes and extract their imageRef hashes
const rootNode = data.nodes['5:1148'].document;
for (const [key, nodeId] of Object.entries(targetNodes)) {
  const node = findNode(rootNode, nodeId);
  if (node && node.fills) {
    const fill = node.fills.find(f => f.type === 'IMAGE');
    if (fill && fill.imageRef) {
      hashes[key] = fill.imageRef;
      console.log(`Node ${key} (${nodeId}) has imageRef: ${fill.imageRef}`);
    }
  } else {
    // If it's inside an instance, it might have I5:963;5:1387 format
    // Let's try to look up in the flat JSON structure or components
    console.log(`Could not find fills for ${key} (${nodeId}) in document tree`);
  }
}

// If logo or others weren't found in tree, let's search by ID in raw data
const idRegex = /"id":"([^"]+)"[^{}]*fills":\[{[^{}]*type":"IMAGE"[^{}]*imageRef":"([^"]+)"/g;
let match;
while ((match = idRegex.exec(rawData)) !== null) {
  const id = match[1];
  const ref = match[2];
  for (const [key, nodeId] of Object.entries(targetNodes)) {
    if (id === nodeId || id.endsWith(nodeId)) {
      hashes[key] = ref;
      console.log(`Found via regex: ${key} (${id}) -> ${ref}`);
    }
  }
}

// Query the Figma images endpoint to get URLs for these hashes
const options = {
  hostname: 'api.figma.com',
  path: `/v1/files/${fileKey}/images`,
  method: 'GET',
  headers: {
    'X-Figma-Token': token
  }
};

const req = https.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  res.on('end', () => {
    if (res.statusCode === 200) {
      const parsed = JSON.parse(responseData);
      const imagesMap = parsed.meta.images;
      
      console.log('\n=== Downloading Images ===');
      for (const [key, hash] of Object.entries(hashes)) {
        const url = imagesMap[hash];
        if (url) {
          const fileExtension = '.png'; // Default to png
          const outputName = `${key}${fileExtension}`;
          const outputPath = path.join(__dirname, '..', 'public', 'landing', outputName);
          
          console.log(`Downloading ${key} from ${url} to ${outputPath}...`);
          const file = fs.createWriteStream(outputPath);
          https.get(url, (resStream) => {
            resStream.pipe(file);
            file.on('finish', () => {
              file.close();
              console.log(`Finished downloading ${outputName}`);
            });
          }).on('error', (err) => {
            console.error(`Error downloading ${key}:`, err);
            file.close();
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          });
        } else {
          console.log(`No URL found for hash ${hash} (${key})`);
        }
      }
    } else {
      console.error(`Figma API returned status: ${res.statusCode}`);
    }
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.end();
