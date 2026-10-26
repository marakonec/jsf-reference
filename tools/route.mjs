import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import zlib from 'node:zlib';
import { printHeader, printTable, appendCsv } from './output.mjs';
import { conditions, timestamp } from './conditions.mjs';

// --component ЛРn задає роботу, до якої належить вимір (за замовчуванням ЛР2),
// --files перелічує файли JavaScript маршруту, щоб порівняти маршрути між собою.
const args = process.argv.slice(2);
const listFiles = args.includes('--files');
if (listFiles) args.splice(args.indexOf('--files'), 1);
const at = args.indexOf('--component');
const component = at >= 0 ? args.splice(at, 2)[1] : 'ЛР2';
const [variant, route = '/'] = args;
if (!variant) {
  console.error('потрібен варіант, наприклад npm run route -- variant-server / --component ЛР3');
  process.exit(2);
}
const root = path.resolve(import.meta.dirname, '..');
const dir = path.join(root, variant);
if (!fs.existsSync(path.join(dir, '.next', 'BUILD_ID'))) {
  console.error(`варіант ${variant} не зібрано, спершу npm run build`);
  process.exit(2);
}

const PORT = 3150;
const next = createRequire(path.join(dir, 'package.json')).resolve('next/dist/bin/next');
const server = spawn(process.execPath, [next, 'start', '-p', String(PORT)], {
  cwd: dir, stdio: 'ignore', env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
});

try {
  let html = '';
  for (let attempt = 0; attempt < 60 && !html; attempt += 1) {
    try {
      html = await (await fetch(`http://localhost:${PORT}${route}`)).text();
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  if (!html) throw new Error(`сервер не відповів на http://localhost:${PORT}${route}`);

  // Сценарії з noModule сучасний браузер не завантажує.
  const noModule = new Set([...html.matchAll(/<script src="([^"]+)" noModule/g)].map((m) => m[1]));
  const chunks = [...new Set(html.match(/\/_next\/static\/chunks\/[\w.-]+\.js/g) ?? [])]
    .filter((c) => !noModule.has(c));
  const contents = chunks.map((c) => fs.readFileSync(path.join(dir, '.next', c.replace('/_next/', ''))));
  const bytes = contents.reduce((sum, b) => sum + b.length, 0);
  const gzip = contents.reduce((sum, b) => sum + zlib.gzipSync(b).length, 0);

  printHeader(component, `JS маршруту ${route} · ${variant}`, { extra: 'next start, локально' });
  printTable([{ 'варіант': variant, 'маршрут': route, 'файлів JS': chunks.length, 'JS, Б': bytes, 'JS gzip, Б': gzip, 'документ, Б': Buffer.byteLength(html) }]);
  if (listFiles) printTable(chunks.map((c, i) => ({ 'файл': c.replace('/_next/static/chunks/', ''), 'Б': contents[i].length })));
  appendCsv(path.join(root, 'measurements', 'bundle-size.csv'), [{
    date: timestamp(), component, variant, quantity: `JS маршруту ${route}`, unit: 'Б',
    run: 1, value: bytes, conditions: conditions({ extra: 'next start, локально' }), versions: process.version,
  }]);
} finally {
  server.kill();
}
