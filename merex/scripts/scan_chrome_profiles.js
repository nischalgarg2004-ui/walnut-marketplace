const fs = require('fs');
const path = require('path');

const chromePath = path.join('C:', 'Users', 'nisch', 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
const files = fs.readdirSync(chromePath);

const profiles = files.filter(f => f === 'Default' || f.startsWith('Profile '));
console.log('Found profiles:', profiles);

profiles.forEach(profile => {
  const cookiesPath = path.join(chromePath, profile, 'Network', 'Cookies');
  if (fs.existsSync(cookiesPath)) {
    try {
      // Test if we can read the first byte
      const fd = fs.openSync(cookiesPath, 'r');
      fs.closeSync(fd);
      console.log(`Profile [${profile}] Cookies: UNLOCKED & READABLE`);
    } catch (e) {
      console.log(`Profile [${profile}] Cookies: LOCKED (${e.code})`);
    }
  } else {
    console.log(`Profile [${profile}] Cookies: NOT FOUND`);
  }
});
