const puppeteer = require('puppeteer');

(async () => {
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
  
  await page.goto('https://www.figma.com/design/lwLwb7I3FUlDSMqaRnCNPK/Untitled?node-id=5-1148&t=Yfkpw0EoyORLvycI-1', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });
  
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Body Text Snippet (first 1000 chars):');
  console.log(bodyText.substring(0, 1000));
  
  const hasLogin = bodyText.toLowerCase().includes('log in') || bodyText.toLowerCase().includes('sign in');
  console.log('Has Log In text:', hasLogin);
  
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(i => ({
      type: i.type,
      name: i.name,
      id: i.id,
      placeholder: i.placeholder
    }));
  });
  console.log('Inputs found on page:', JSON.stringify(inputs, null, 2));

  await browser.close();
})();
