const https = require('https');

const token = 'figd_GaFT9D2Rt0kFk-8x5gnDE11jWSZvvB8NpyCpcfwU';
const fileKey = 'lwLwb7I3FUlDSMqaRnCNPK';

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
  res.on('end', async () => {
    if (res.statusCode === 200) {
      const parsed = JSON.parse(responseData);
      const imagesMap = parsed.meta.images;
      const hashes = Object.keys(imagesMap);
      console.log(`Found ${hashes.length} hashes in the image map.`);
      
      for (const [hash, url] of Object.entries(imagesMap)) {
        try {
          await new Promise((resolve) => {
            const headReq = https.request(url, { method: 'HEAD' }, (headRes) => {
              const contentType = headRes.headers['content-type'];
              console.log(`Hash: ${hash} | Content-Type: ${contentType} | Size: ${headRes.headers['content-length']}`);
              resolve();
            });
            headReq.on('error', (err) => {
              console.log(`Error checking hash ${hash}:`, err.message);
              resolve();
            });
            headReq.end();
          });
        } catch (e) {
          console.error(e);
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
