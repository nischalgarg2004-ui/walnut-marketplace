const path = require('path');
const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');

const chromeUserDir = path.join('C:', 'Users', 'nisch', 'AppData', 'Local', 'Google', 'Chrome', 'User Data');

(async () => {
  console.log('=== Launching Puppeteer with Real Chrome Profile ===');
  const browser = await puppeteer.launch({
    headless: true,
    userDataDir: chromeUserDir,
    args: [
      '--profile-directory=Default',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  const allRequests = [];
  let videoUrlFound = null;

  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const url = request.url();
    const type = request.resourceType();
    
    // Log any S3, video, or media-looking URLs
    if (url.includes('s3') || url.includes('video') || url.includes('mp4') || type === 'media') {
      console.log(`REQ [${type}]: ${url.substring(0, 150)}...`);
      allRequests.push({ url, type });
      if (url.includes('.mp4') || type === 'media' || url.includes('/video/') || url.includes('s3-alpha-sig.figma.com/video')) {
        videoUrlFound = url;
      }
    }
    request.continue();
  });

  console.log('Navigating to Figma design page...');
  try {
    await page.goto('https://www.figma.com/design/lwLwb7I3FUlDSMqaRnCNPK/Untitled?node-id=5-1148&t=Yfkpw0EoyORLvycI-1', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('Editor Page Title:', await page.title());
    await new Promise(r => setTimeout(r, 10000));
    await page.screenshot({ path: path.join(__dirname, 'real_editor_loaded.png') });
    console.log('Saved editor screenshot.');

    const textContent = await page.evaluate(() => document.body.innerText);
    const hasLogin = textContent.toLowerCase().includes('log in') || textContent.toLowerCase().includes('sign up');
    console.log('Is login visible?', hasLogin);

    if (!hasLogin) {
      const protoUrl = 'https://www.figma.com/proto/lwLwb7I3FUlDSMqaRnCNPK/Untitled?node-id=5-1148&scaling=min-zoom';
      console.log('Navigating to prototype page:', protoUrl);
      
      await page.goto(protoUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      console.log('Prototype Page Title:', await page.title());
      
      console.log('Waiting 15 seconds for initial prototype load...');
      await new Promise(r => setTimeout(r, 15000));
      await page.screenshot({ path: path.join(__dirname, 'real_proto_loaded_1.png') });

      // Click center of screen to focus and try to trigger autoplay/play
      console.log('Clicking page to focus and trigger play...');
      await page.mouse.click(720, 450);
      await page.keyboard.press('Space'); // Spacebar can toggle playback or reload
      
      console.log('Waiting another 15 seconds...');
      await new Promise(r => setTimeout(r, 15000));
      await page.screenshot({ path: path.join(__dirname, 'real_proto_loaded_2.png') });
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
            console.error(`Status code: ${resStream.statusCode}`);
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
      console.log('\nNo direct video URL was intercepted.');
      console.log('All logged S3/video/media requests during this run:');
      console.log(JSON.stringify(allRequests, null, 2));
    }

  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await browser.close();
    console.log('Done.');
  }
})();
