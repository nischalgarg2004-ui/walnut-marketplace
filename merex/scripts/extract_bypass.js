const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

(async () => {
  console.log('Launching browser with stealth settings...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    ]
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  // Set webdriver to false to bypass bot detection
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
  });

  let videoUrlFound = null;

  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('.mp4') || request.resourceType() === 'media' || url.includes('/video/')) {
      console.log('INTERCEPTED MEDIA URL:', url);
      videoUrlFound = url;
    }
    request.continue();
  });

  console.log('Navigating to Figma...');
  try {
    await page.goto('https://www.figma.com/design/lwLwb7I3FUlDSMqaRnCNPK/Untitled?node-id=5-1148&t=Yfkpw0EoyORLvycI-1', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    console.log('Page loaded. Checking title...');
    console.log('Page Title:', await page.title());
    console.log('Current URL:', page.url());
    
    // Take a screenshot to verify what's rendering
    const screenshotPath = path.join(__dirname, 'figma_bypass_screenshot.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`Saved screenshot to ${screenshotPath}`);
    
    console.log('Waiting 10 seconds for video stream activity...');
    await new Promise(r => setTimeout(r, 10000));
    
    if (videoUrlFound) {
      console.log('Success! Found video URL:', videoUrlFound);
      // Download video
      const outputPath = path.join(__dirname, '..', 'public', 'landing', 'hero-bg.mp4');
      const file = fs.createWriteStream(outputPath);
      https.get(videoUrlFound, (resStream) => {
        resStream.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log('Successfully downloaded figma video to ' + outputPath);
        });
      });
    } else {
      console.log('No video URL intercepted.');
    }
  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await browser.close();
  }
})();
