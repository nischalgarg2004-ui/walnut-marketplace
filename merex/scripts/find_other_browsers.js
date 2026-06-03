const fs = require('fs');
const path = require('path');

const user = 'nisch';
const localApp = `C:\\Users\\${user}\\AppData\\Local`;
const roamingApp = `C:\\Users\\${user}\\AppData\\Roaming`;

const targets = [
  { name: 'Brave', path: path.join(localApp, 'BraveSoftware', 'Brave-Browser', 'User Data') },
  { name: 'Firefox', path: path.join(roamingApp, 'Mozilla', 'Firefox', 'Profiles') },
  { name: 'Opera', path: path.join(roamingApp, 'Opera Software', 'Opera Stable') },
  { name: 'Vivaldi', path: path.join(localApp, 'Vivaldi', 'User Data') }
];

targets.forEach(t => {
  if (fs.existsSync(t.path)) {
    console.log(`Found ${t.name} directory at: ${t.path}`);
    if (t.name === 'Firefox') {
      try {
        const dirs = fs.readdirSync(t.path);
        console.log(`Firefox profiles found:`, dirs);
        dirs.forEach(d => {
          const cookiesFile = path.join(t.path, d, 'cookies.sqlite');
          if (fs.existsSync(cookiesFile)) {
            try {
              const fd = fs.openSync(cookiesFile, 'r');
              fs.closeSync(fd);
              console.log(`  Firefox profile [${d}] cookies.sqlite: UNLOCKED`);
            } catch (e) {
              console.log(`  Firefox profile [${d}] cookies.sqlite: LOCKED (${e.code})`);
            }
          }
        });
      } catch (e) {
        console.error('Error reading Firefox profiles:', e.message);
      }
    } else {
      const defaultCookies = path.join(t.path, 'Default', 'Network', 'Cookies');
      if (fs.existsSync(defaultCookies)) {
        try {
          const fd = fs.openSync(defaultCookies, 'r');
          fs.closeSync(fd);
          console.log(`  ${t.name} Default Cookies: UNLOCKED`);
        } catch (e) {
          console.log(`  ${t.name} Default Cookies: LOCKED (${e.code})`);
        }
      }
    }
  } else {
    console.log(`No ${t.name} directory found.`);
  }
});
