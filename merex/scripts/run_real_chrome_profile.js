const path = require('path');
const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');

const chromeUserDir = path.join('C:', 'Users', 'nisch', 'AppData', 'Local', 'Google', 'Chrome', 'User Data');

(async () => {
  console.log('=== Launching Puppeteer using the real Chrome profile ===');
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

  console.log('Navigating to Figma design page...');
  try {
    await page.goto('https://www.figma.com/design/lwLwb7I3FUlDSMqaRnCNPK/Untitled?node-id=5-1148&t=Yfkpw0EoyORLvycI-1', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('Page loaded. Checking state...');
    console.log('Page Title:', await page.title());
    console.log('Current URL:', page.url());

    const textContent = await page.evaluate(() => document.body.innerText);
    const hasLogin = textContent.toLowerCase().includes('log in') || textContent.toLowerCase().includes('sign up');
    console.log('Is on login/signup page?', hasLogin);

    // If we're not on the login page, load the prototype to capture the video
    if (!hasLogin) {
      console.log('Successfully logged in using real Chrome profile!');
      
      const protoUrl = 'https://www.figma.com/proto/lwLwb7I3FUlDSMqaRnCNPK/Untitled?node-id=5-1148&scaling=min-zoom';
      console.log('Navigating to proto URL to trigger video stream:', protoUrl);
      
      await page.goto(protoUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      console.log('Prototype page loaded. Title:', await page.title());
      
      console.log('Waiting 25 seconds for video playback activity...');
      await new Promise(r => setTimeout(r, 25000));
    } else {
      console.log('Figma still reports being logged out.');
      
      // Save screenshot to help debug what it sees
      const debugScreenshot = path.join(__dirname, 'real_chrome_login_failure.png');
      await page.screenshot({ path: debugScreenshot });
      console.log(`Saved failure screenshot to ${debugScreenshot}`);
    }

    if (videoUrlFound) {
      console.log('Success! Found video URL:', videoUrlFound);
      const outputPath = path.join(__dirname, '..', 'public', 'landing', 'hero-bg.mp4');
      console.log(`Downloading video from ${videoUrlFound} to ${outputPath}...`);
      
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
              console.log('Successfully finished downloading figma video!');
              resolve();
            });
          } else {
            console.error(`Failed to download video. Status: ${resStream.statusCode}`);
            file.close();
            fs.unlinkSync(outputPath);
            reject(new Error(`Status code: ${resStream.statusCode}`));
          }
        }).on('error', (err) => {
          console.error('Error downloading:', err);
          file.close();
          fs.unlinkSync(outputPath);
          reject(err);
        });
      });
    } else {
      console.log('No video URL intercepted.');
    }

  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await browser.close();
    console.log('Execution completed.');
  }
})();
