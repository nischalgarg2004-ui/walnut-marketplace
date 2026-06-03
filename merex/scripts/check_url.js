const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  await page.goto('https://www.figma.com/design/lwLwb7I3FUlDSMqaRnCNPK/Untitled?node-id=5-1148&t=Yfkpw0EoyORLvycI-1', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });
  
  console.log('Final URL after load:', page.url());
  console.log('Page Title:', await page.title());
  
  await browser.close();
})();
