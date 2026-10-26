import fs from 'node:fs';
import path from 'node:path';
import { printHeader, printTable } from './output.mjs';

const root = path.resolve(import.meta.dirname, '..');
const VARIANTS = ['react-ts', 'svelte-5'];

function files(variant) {
  const result = new Map();
  for (const dir of ['src', 'tests']) {
    const base = path.join(root, variant, dir);
    if (!fs.existsSync(base)) continue;
    for (const entry of fs.readdirSync(base, { recursive: true, withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const full = path.join(entry.parentPath ?? entry.path, entry.name);
      // Розширення не враховується, щоб .tsx і .svelte одного файлу зіставлялися.
      const key = path.relative(path.join(root, variant), full).replace(/\.[^.]+$/, '').split(path.sep).join('/');
      result.set(key, fs.readFileSync(full, 'utf8').split('\n').length);
    }
  }
  return result;
}

printHeader('ЛР1', 'різниця двох реалізацій');
const [a, b] = VARIANTS.map(files);
const all = [...new Set([...a.keys(), ...b.keys()])].sort();
printTable(all.map((k) => ({
  'файл': k,
  'react-ts, рядків': a.get(k) ?? '—',
  'svelte-5, рядків': b.get(k) ?? '—',
  'збіг': a.has(k) && b.has(k) ? 'є' : 'НЕМАЄ',
})));
const mismatched = all.filter((k) => !(a.has(k) && b.has(k)));
console.log('─'.repeat(64));
console.log(mismatched.length
  ? `правило однакових імен порушено: ${mismatched.join(', ')}`
  : 'переліки файлів збігаються, різниця лише у вмісті');
