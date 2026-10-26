import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { printHeader, printTable, appendCsv } from './output.mjs';
import { conditions, timestamp } from './conditions.mjs';
import { npm } from './npm.mjs';

const VARIANTS = ['react-ts', 'svelte-5'];
const root = path.resolve(import.meta.dirname, '..');

function bundleBytes(variant) {
  const r = npm(['run', '--silent', 'build', '--workspace', variant], { cwd: root, stdio: 'ignore' });
  if (r.status !== 0) throw new Error(`складання ${variant} не пройшло`);
  const dir = path.join(root, variant, 'dist', 'assets');
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.js'))
    .reduce((sum, f) => sum + fs.statSync(path.join(dir, f)).size, 0);
}

printHeader('ЛР1', 'обсяг складання в режимі випуску');
const rows = [];
const csv = [];
const sizes = [];
for (const variant of VARIANTS) {
  const bytes = bundleBytes(variant);
  sizes.push(bytes);
  rows.push({ 'варіант': variant, 'байтів': bytes, 'КБ': (bytes / 1024).toFixed(1) });
  csv.push({
    date: timestamp(), component: 'ЛР1', variant, quantity: 'обсяг складання',
    unit: 'Б', run: 1, value: bytes, conditions: conditions(), versions: process.version,
  });
}
printTable(rows);
const [a, b] = sizes;
console.log('─'.repeat(64));
console.log(`різниця: ${(Math.abs(a - b) / 1024).toFixed(1)} КБ · відношення ${(Math.max(a, b) / Math.min(a, b)).toFixed(1)}×`);
console.log('це число детерміноване, розкиду між прогонами немає');
appendCsv(path.join(root, 'measurements', 'bundle-size.csv'), csv);
