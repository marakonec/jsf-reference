import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { printHeader, printTable } from './output.mjs';

const [variant, needle] = process.argv.slice(2);
if (!variant || !needle) {
  console.error('потрібні варіант і рядок, наприклад npm run find -- variant-server ШУКАНИЙ_РЯДОК');
  process.exit(2);
}
const build = path.resolve(import.meta.dirname, '..', variant, '.next');
if (!fs.existsSync(build)) {
  console.error(`немає ${path.relative(process.cwd(), build)}, спершу npm run build`);
  process.exit(2);
}

function filesContaining(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && !e.name.endsWith('.map'))
    .map((e) => path.join(e.parentPath, e.name))
    .filter((f) => fs.readFileSync(f, 'utf8').includes(needle));
}

const client = filesContaining(path.join(build, 'static'));
const server = filesContaining(path.join(build, 'server'));
printHeader('ЛР2', `рядок «${needle}» у складанні ${variant}`);
printTable([
  { 'де': '.next/static (браузер)', 'файлів': client.length, 'перший файл': path.basename(client[0] ?? '—') },
  { 'де': '.next/server (сервер)', 'файлів': server.length, 'перший файл': path.basename(server[0] ?? '—') },
]);
