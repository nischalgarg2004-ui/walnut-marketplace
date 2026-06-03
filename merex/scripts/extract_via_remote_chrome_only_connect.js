const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

(async () => {
  console.log('Connecting to Chrome via DevTools protocol...');
  let browser;
  try {
    browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: null
    });
    console.log('Successfully connected to active Chrome window!');
  } catch (e) {
    console.error('Failed to connect to Chrome.');
    console.error('Error details:', e.message);
    process.exit(1);
  }

  const figmaUrl = 'https://www.figma.com/design/lwLwb7I3FUlDSMqaRnCNPK/Untitled?node-id=5-1148&t=Yfkpw0EoyORLvycI-1';
  
  // Find or create Figma page
  const pages = await browser.pages();
  let figmaPage = null;
  
  for (const page of pages) {
    const url = page.url();
    if (url.includes('figma.com/design/') || url.includes('figma.com/proto/')) {
      figmaPage = page;
      console.log(`Found active Figma tab: "${await page.title()}"`);
      break;
    }
  }

  if (!figmaPage) {
    console.log('Figma tab not found. Opening a new tab...');
    figmaPage = await browser.newPage();
    await figmaPage.goto(figmaUrl, { waitUntil: 'networkidle2' });
  }

  let videoUrlFound = null;

  // Intercept requests in the connected page
  await figmaPage.setRequestInterception(true);
  
  const requestHandler = (request) => {
    const url = request.url();
    const type = request.resourceType();
    if (url.includes('.mp4') || type === 'media' || url.includes('/video/') || url.includes('s3-alpha-sig.figma.com/video')) {
      console.log('INTERCEPTED MEDIA URL:', url);
      videoUrlFound = url;
    }
    request.continue();
  };

  figmaPage.on('request', requestHandler);

  console.log('\n=== ACTION REQUIRED ===');
  console.log('Please look at the Chrome window that just opened.');
  console.log('1. Make sure you are logged in to Figma.');
  console.log('2. Make sure the design file is fully loaded.');
  console.log('3. Open the presentation / prototype view to play the background video.');
  console.log('Waiting 30 seconds for video playback to start...');

  await new Promise(r => setTimeout(r, 30000));

  if (!videoUrlFound) {
    console.log('No video URL intercepted in design page. Navigating to prototype directly to force load...');
    const protoUrl = 'https://www.figma.com/proto/lwLwb7I3FUlDSMqaRnCNPK/Untitled?node-id=5-1148&scaling=min-zoom';
    await figmaPage.goto(protoUrl, { waitUntil: 'networkidle2' });
    console.log('Navigated to prototype. Waiting another 20 seconds...');
    await new Promise(r => setTimeout(r, 20000));
  }

  if (videoUrlFound) {
    console.log('\nSUCCESS! Intercepted Video URL:', videoUrlFound);
    const outputPath = path.join(__dirname, '..', 'public', 'landing', 'hero-bg.mp4');
    console.log(`Downloading video to ${outputPath}...`);
    
    const file = fs.createWriteStream(outputPath);
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    };

    await new Promise((resolve, reject) => {
      https.get(videoUrlFound, options, (resStream) => {
        if (resStream.statusCode === 200) {
          resStream.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log('Finished downloading the figma background video file!');
            resolve();
          });
        } else {
          file.close();
          fs.unlinkSync(outputPath);
          reject(new Error(`Status: ${resStream.statusCode}`));
        }
      }).on('error', (err) => {
        file.close();
        fs.unlinkSync(outputPath);
        reject(err);
      });
    });
  } else {
    console.log('\nNo video URL was intercepted. Please double check if you have the figma file open and playing.');
  }

  figmaPage.off('request', requestHandler);
  await figmaPage.setRequestInterception(false);
  await browser.disconnect();
  console.log('Disconnected from Chrome.');
})();
