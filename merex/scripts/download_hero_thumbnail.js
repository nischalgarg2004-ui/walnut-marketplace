const fs = require('fs');
const path = require('path');
const https = require('https');

const token = 'figd_GaFT9D2Rt0kFk-8x5gnDE11jWSZvvB8NpyCpcfwU';
const fileKey = 'lwLwb7I3FUlDSMqaRnCNPK';
const hash = '7cee3a9ec90426ca3d73999b759343b196e43b2c';

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
      const url = parsed.meta.images[hash];
      if (url) {
        const outputPath = path.join(__dirname, '..', 'public', 'landing', 'hero-thumbnail.png');
        console.log(`Downloading thumbnail from ${url} to ${outputPath}...`);
        const file = fs.createWriteStream(outputPath);
        https.get(url, (resStream) => {
          resStream.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`Successfully downloaded hero-thumbnail.png`);
          });
        }).on('error', (err) => {
          console.error(`Error downloading thumbnail:`, err);
          file.close();
        });
      } else {
        console.log(`No URL found for hash ${hash}`);
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
