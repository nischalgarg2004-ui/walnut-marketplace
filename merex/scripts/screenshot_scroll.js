const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000 });

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  await page.waitForSelector('h2', { timeout: 10000 });

  // Scroll to "Final thoughts" using textContent
  console.log('Scrolling to Final thoughts card...');
  await page.evaluate(() => {
    const h2s = Array.from(document.querySelectorAll('h2'));
    const finalThoughtsHeader = h2s.find(h2 => h2.textContent.includes('Final thoughts'));
    if (finalThoughtsHeader) {
      // scroll so it is centered
      finalThoughtsHeader.scrollIntoView({ block: 'center' });
    }
  });
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Capture screenshot of Final thoughts card
  let screenshotPath = path.join(__dirname, 'final_thoughts_view.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`Saved screenshot of Final thoughts card to ${screenshotPath}`);

  // Scroll down by 500px to see what follows it immediately (no dead space)
  console.log('Scrolling down past Final thoughts card...');
  await page.evaluate(() => {
    window.scrollBy(0, 500);
  });
  await new Promise(resolve => setTimeout(resolve, 800));
  
  screenshotPath = path.join(__dirname, 'after_final_thoughts.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`Saved screenshot of section end to ${screenshotPath}`);

  // Scroll to the giant text marquee (at the bottom, scrollY ~ 6700)
  console.log('Scrolling to giant marquee section...');
  await page.evaluate(() => {
    window.scrollTo(0, 6800);
  });
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Capture initial marquee position
  screenshotPath = path.join(__dirname, 'marquee_pos_1.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`Saved marquee pos 1 to ${screenshotPath}`);

  // Scroll down by another 300px
  console.log('Scrolling down by 300px...');
  await page.evaluate(() => {
    window.scrollBy(0, 300);
  });
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Capture second marquee position
  screenshotPath = path.join(__dirname, 'marquee_pos_2.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`Saved marquee pos 2 to ${screenshotPath}`);

  await browser.close();
  console.log('Browser closed.');
})();
