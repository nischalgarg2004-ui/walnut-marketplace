const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER EXCEPTION:', err.message));
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  try {
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    console.log('Navigation done.');
  } catch (error) {
    console.error('Navigation failed:', error);
  } finally {
    await browser.close();
  }
})();
