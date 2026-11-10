// Runs automatically after `npm run build` (npm "postbuild" hook).
// Makes .next/standalone a complete, copy-and-run server: node .next/standalone/server.js
import fs from 'node:fs';

const out = '.next/standalone';
if (!fs.existsSync(out)) process.exit(0);

fs.cpSync('public', `${out}/public`, { recursive: true });
fs.cpSync('.next/static', `${out}/.next/static`, { recursive: true });

console.log(`
✓ Standalone server ready in ${out}
  Start it with:  node ${out}/server.js
  Remember: set UPLOAD_DIR to a folder OUTSIDE the deploy folder (and copy storage/uploads there),
  plus APP_URL, DB_* and SESSION_SECRET in the server environment. See README.md → Deploying.
`);
