import { cp, mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const files = (await readdir(root)).filter(name => name === 'index.html' || (/\.(js|css)$/.test(name) && !name.endsWith('.config.js')));
const directories = ['assets', 'data'];

// Validate source before replacing the previous generated output.
for (const name of [...files.filter(name => name.endsWith('.js')), 'server.mjs']) {
  execFileSync(process.execPath, ['--check', path.join(root, name)], { stdio: 'inherit' });
}
for (const name of [...files, ...directories]) await stat(path.join(root, name));
if (path.dirname(output) !== path.resolve(root) || path.basename(output) !== 'dist') {
  throw new Error('Invalid build output directory');
}
await rm(output, { recursive: true, force: true });
await mkdir(output);
for (const name of [...files, ...directories]) {
  await cp(path.join(root, name), path.join(output, name), { recursive: true });
}

// Check local references, including CSS fonts and dynamically rendered icons.
async function verify(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { await verify(file); continue; }
    if (!/\.(html|css|js)$/.test(file)) continue;
    const source = await readFile(file, 'utf8');
    const refs = [...source.matchAll(/(?:["'])(\/?assets\/[^"']+)["']/g),
      ...source.matchAll(/url\(\s*["']?([^\s)"']+)["']?\s*\)/g)];
    for (const [, ref] of refs) {
      if (/^(data:|https?:|#)/.test(ref) || ref.includes('\\') || ref.includes('+')) continue;
      const target = ref.startsWith('/') ? path.join(output, ref.slice(1)) : path.resolve(path.dirname(file), ref);
      if (!target.startsWith(output + path.sep)) throw new Error(`Asset outside build: ${ref}`);
      await stat(target);
    }
  }
}
await verify(output);
console.log('Build complete: dist/ (HTML, JavaScript, CSS, icons and fonts).');
