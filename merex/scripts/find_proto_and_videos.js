const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

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
  await page.setViewport({ width: 1440, height: 900 });
  
  // Set webdriver to false
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  const interceptedUrls = [];

  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || request.resourceType() === 'media' || url.includes('/video/')) {
      console.log('INTERCEPTED MEDIA URL:', url);
      interceptedUrls.push(url);
    }
    request.continue();
  });

  console.log('Navigating to Figma design page...');
  try {
    await page.goto('https://www.figma.com/design/lwLwb7I3FUlDSMqaRnCNPK/Untitled?node-id=5-1148&t=Yfkpw0EoyORLvycI-1', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    console.log('Page loaded. Title:', await page.title());
    console.log('Current URL:', page.url());
    
    // Wait for 15 seconds to let canvas render
    console.log('Waiting 15 seconds...');
    await new Promise(r => setTimeout(r, 15000));

    // Get all links
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.innerText,
        href: a.href
      }));
    });
    console.log('Links found on page:', links.length);
    links.forEach(l => {
      if (l.href.includes('/proto/') || l.href.includes('prototype') || l.href.includes('play')) {
        console.log(`Proto Link: [${l.text}] -> ${l.href}`);
      }
    });

    // Take screenshot of the editor
    const screenshotPath = path.join(__dirname, 'figma_editor.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`Saved editor screenshot to ${screenshotPath}`);

    // If there is a prototype link, navigate to it to trigger video playback!
    const protoLink = links.find(l => l.href.includes('/proto/'));
    if (protoLink) {
      console.log('Navigating to prototype link:', protoLink.href);
      // Remove interception listener to avoid issues or keep it
      await page.goto(protoLink.href, { waitUntil: 'networkidle2', timeout: 60000 });
      console.log('Prototype page loaded. Title:', await page.title());
      console.log('Waiting 20 seconds for video playback in prototype...');
      await new Promise(r => setTimeout(r, 20000));
      
      const protoScreenshotPath = path.join(__dirname, 'figma_proto.png');
      await page.screenshot({ path: protoScreenshotPath });
      console.log(`Saved prototype screenshot to ${protoScreenshotPath}`);
    } else {
      console.log('No direct prototype link found in links, trying to build one...');
      // Build a prototype URL if possible
      // Design URL: https://www.figma.com/design/lwLwb7I3FUlDSMqaRnCNPK/Untitled?node-id=5-1148
      // Prototype URL format: https://www.figma.com/proto/lwLwb7I3FUlDSMqaRnCNPK/Untitled?node-id=5-1148&scaling=min-zoom&starting-point-node-id=5%3A1148
      const protoUrl = 'https://www.figma.com/proto/lwLwb7I3FUlDSMqaRnCNPK/Untitled?node-id=5-1148&scaling=min-zoom';
      console.log('Navigating to constructed proto URL:', protoUrl);
      await page.goto(protoUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      console.log('Constructed prototype page loaded. Title:', await page.title());
      console.log('Waiting 20 seconds for video playback in constructed prototype...');
      await new Promise(r => setTimeout(r, 20000));
      
      const protoScreenshotPath = path.join(__dirname, 'figma_proto.png');
      await page.screenshot({ path: protoScreenshotPath });
      console.log(`Saved prototype screenshot to ${protoScreenshotPath}`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
    console.log('Done. Intercepted URLs:', interceptedUrls);
  }
})();
