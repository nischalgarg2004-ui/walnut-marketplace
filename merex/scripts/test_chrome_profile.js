const fs = require('fs');
const path = require('path');

const chromePath = path.join('C:', 'Users', 'nisch', 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
console.log(`Checking path: ${chromePath}`);

const exists = fs.existsSync(chromePath);
console.log(`Exists: ${exists}`);

if (exists) {
  try {
    const files = fs.readdirSync(chromePath);
    console.log(`Found ${files.length} items in Chrome User Data.`);
    const defaultProfile = path.join(chromePath, 'Default');
    console.log(`Default Profile exists: ${fs.existsSync(defaultProfile)}`);
  } catch (e) {
    console.error('Error reading dir:', e.message);
  }
}
