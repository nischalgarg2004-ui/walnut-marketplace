const https = require('https');
const fs = require('fs');
const path = require('path');

const token = 'figd_GaFT9D2Rt0kFk-8x5gnDE11jWSZvvB8NpyCpcfwU';
const fileKey = 'lwLwb7I3FUlDSMqaRnCNPK';
const logoNodeId = '5:1387';

const options = {
  hostname: 'api.figma.com',
  path: `/v1/files/${fileKey}/nodes?ids=${logoNodeId}`,
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
      const outputPath = path.join('C:', 'Users', 'nisch', '.gemini', 'antigravity', 'scratch', 'logo_node.json');
      fs.writeFileSync(outputPath, responseData);
      console.log(`Successfully saved logo node JSON to ${outputPath}`);
      
      const parsed = JSON.parse(responseData);
      const node = parsed.nodes[logoNodeId].document;
      console.log('Logo Node Details:');
      console.log(JSON.stringify(node, null, 2));
    } else {
      console.error(`Status Code: ${res.statusCode}`);
      console.error(responseData);
    }
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.end();
