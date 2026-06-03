const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
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
  
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  console.log('Navigating to Figma design page...');
  await page.goto('https://www.figma.com/design/lwLwb7I3FUlDSMqaRnCNPK/Untitled?node-id=5-1148&t=Yfkpw0EoyORLvycI-1', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  console.log('Waiting 10 seconds...');
  await new Promise(r => setTimeout(r, 10000));

  const url = page.url();
  const title = await page.title();
  console.log(`Current URL: ${url}`);
  console.log(`Page Title: ${title}`);

  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  console.log(`Body HTML Length: ${bodyHTML.length}`);
  
  const textContent = await page.evaluate(() => document.body.innerText);
  console.log('Text content (first 2000 chars):');
  console.log(textContent.substring(0, 2000));

  // Find all buttons, inputs, links
  const elements = await page.evaluate(() => {
    const elList = [];
    document.querySelectorAll('button, input, a, h1, h2, h3').forEach(el => {
      elList.push({
        tag: el.tagName,
        text: el.innerText || el.value || el.placeholder || '',
        class: el.className
      });
    });
    return elList;
  });
  console.log('Key elements found:', JSON.stringify(elements.slice(0, 50), null, 2));

  await browser.close();
})();
