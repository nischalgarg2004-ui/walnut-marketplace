const puppeteer = require('puppeteer');
const outDir = 'C:/Users/nisch/.gemini/antigravity/brain/c65fe9ca-187c-4a1c-96c5-06ba41cffdb9';

const sizes = [
  { name: 'iphone17', w: 393, h: 852 },
  { name: 'ipad_pro', w: 1024, h: 1366 },
  { name: 'macbook17', w: 1920, h: 1080 },
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });

  for (const s of sizes) {
    const page = await browser.newPage();
    await page.setViewport({ width: s.w, height: s.h, deviceScaleFactor: 1 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 800));

    // screenshot at top
    await page.screenshot({ path: `${outDir}/${s.name}_top.png` });

    // scroll to article section (approx where the 4 cards are)
    await page.evaluate(() => window.scrollTo(0, 1460));
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: `${outDir}/${s.name}_cards.png` });

    await page.close();
    console.log(`Done: ${s.name}`);
  }

  await browser.close();
  console.log('All screenshots saved.');
})();
