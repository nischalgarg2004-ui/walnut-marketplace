const puppeteer = require('puppeteer');
const outDir = 'C:/Users/nisch/.gemini/antigravity/brain/c65fe9ca-187c-4a1c-96c5-06ba41cffdb9';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 1 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 800));

  // find subscribe section position
  const subY = await page.evaluate(() => {
    const el = document.querySelector('[class*="subscribe"], section:has(h2)');
    // Try to find the h2 with "Tune into"
    const all = document.querySelectorAll('h2');
    for (const h of all) {
      if (h.textContent && h.textContent.includes('Tune into')) {
        return h.getBoundingClientRect().top + window.scrollY - 200;
      }
    }
    return 3500;
  });
  
  console.log('Subscribe Y:', subY);
  await page.evaluate((y) => window.scrollTo(0, y), subY);
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: `${outDir}/iphone17_subscribe.png` });
  console.log('Done');
  await browser.close();
})();
