const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('Launching browser with request interception...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  const assets = {
    videos: [],
    images: [],
    others: []
  };
  
  // Intercept network requests
  await page.setRequestInterception(true);
  
  page.on('request', (request) => {
    const url = request.url();
    const resourceType = request.resourceType();
    
    if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || resourceType === 'media') {
      console.log('Found Media Request:', url);
      assets.videos.push(url);
    } else if (resourceType === 'image' || url.includes('.png') || url.includes('.jpg') || url.includes('.jpeg') || url.includes('.svg') || url.includes('s3-alpha-sig')) {
      // Only keep unique URLs and avoid data: URLs
      if (!url.startsWith('data:') && !assets.images.includes(url)) {
        assets.images.push(url);
      }
    }
    
    request.continue();
  });

  console.log('Navigating to Figma design page...');
  await page.goto('https://www.figma.com/design/lwLwb7I3FUlDSMqaRnCNPK/Untitled?node-id=5-1148&t=Yfkpw0EoyORLvycI-1', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });
  
  console.log('Figma page loaded. Waiting 20 seconds for canvas/video rendering...');
  await new Promise(r => setTimeout(r, 20000));
  
  const outputPath = path.join(__dirname, 'extracted_assets.json');
  fs.writeFileSync(outputPath, JSON.stringify(assets, null, 2));
  console.log(`Saved ${assets.videos.length} videos and ${assets.images.length} images to ${outputPath}`);
  
  await browser.close();
})();
