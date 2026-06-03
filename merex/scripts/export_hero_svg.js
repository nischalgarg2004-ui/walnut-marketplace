const https = require('https');
const fs = require('fs');
const path = require('path');

const token = 'figd_GaFT9D2Rt0kFk-8x5gnDE11jWSZvvB8NpyCpcfwU';
const fileKey = 'lwLwb7I3FUlDSMqaRnCNPK';
const nodeId = '5:965'; // Hero section frame

const options = {
  hostname: 'api.figma.com',
  path: `/v1/images/${fileKey}?ids=${nodeId}&format=svg`,
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
      const svgUrl = parsed.images[nodeId];
      if (svgUrl) {
        console.log(`SVG Export URL: ${svgUrl}`);
        // Fetch the SVG file contents
        https.get(svgUrl, (svgRes) => {
          let svgContent = '';
          svgRes.on('data', (chunk) => {
            svgContent += chunk;
          });
          svgRes.on('end', () => {
            const outputPath = path.join(__dirname, '..', 'scripts', 'hero_export.svg');
            fs.writeFileSync(outputPath, svgContent);
            console.log(`Saved SVG to ${outputPath}`);
            
            // Search SVG content for URLs or video mentions
            console.log('\n=== Scanning SVG Content ===');
            const lines = svgContent.split('\n');
            lines.forEach((line, index) => {
              if (line.includes('http') || line.includes('s3') || line.includes('video') || line.includes('mp4')) {
                console.log(`Line ${index + 1}: ${line.trim().substring(0, 300)}`);
              }
            });
          });
        });
      } else {
        console.log(`No SVG URL found for node ${nodeId}`);
      }
    } else {
      console.error(`Figma API status: ${res.statusCode}`);
    }
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.end();
