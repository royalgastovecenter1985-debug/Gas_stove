// Lists every file in public/ into src/lib/public-files.json (runs before `dev` and `build`).
// On Vercel the server code cannot read public/ from disk, so pages use this list to know which
// .webp / -sm image versions exist.
import fs from 'node:fs';
import path from 'node:path';

const root = 'public';
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else files.push(path.relative(root, full).split(path.sep).join('/'));
  }
})(root);
files.sort();
fs.writeFileSync('src/lib/public-files.json', JSON.stringify(files) + '\n');
console.log(`public-files.json: ${files.length} files`);
