const fs = require('fs');
const path = require('path');

const edgePath = path.join('C:', 'Users', 'nisch', 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data');
console.log(`Checking path: ${edgePath}`);

const exists = fs.existsSync(edgePath);
console.log(`Exists: ${exists}`);

if (exists) {
  try {
    const files = fs.readdirSync(edgePath);
    console.log(`Found ${files.length} items in Edge User Data.`);
    const defaultProfile = path.join(edgePath, 'Default');
    console.log(`Default Profile exists: ${fs.existsSync(defaultProfile)}`);
    
    // Try copying cookies
    const cookiesSrc = path.join(edgePath, 'Default', 'Network', 'Cookies');
    const cookiesDest = path.join('C:', 'Users', 'nisch', '.gemini', 'antigravity', 'scratch', 'edge_cookies_temp');
    if (fs.existsSync(cookiesSrc)) {
      fs.copyFileSync(cookiesSrc, cookiesDest);
      console.log('Successfully copied Edge Cookies file!');
    } else {
      console.log('Edge Cookies file does not exist at expected path.');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}
