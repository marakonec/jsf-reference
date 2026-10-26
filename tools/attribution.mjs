import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { printHeader, printTable } from './output.mjs';

// Прямі залежності кореня і робочих просторів проти рядків таблиці ATTRIBUTION.md.
// Пакет зараховано, якщо його ім'я стоїть окремим словом у колонці «Що» або
// «Звідки», тому один рядок може покривати групу пакетів, а згадка команди в
// колонці «Що змінено» рядком для пакета не вважається. Висновки про рядки без пакета пише студент.
const root = path.resolve(import.meta.dirname, '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const rootManifest = read('package.json');
const manifests = [
  { file: 'package.json', manifest: rootManifest },
  ...(rootManifest.workspaces ?? []).map((w) => ({ file: `${w}/package.json`, manifest: read(path.join(w, 'package.json')) })),
];
const workspaceNames = new Set(manifests.map((m) => m.manifest.name));

const direct = new Map();
for (const { file, manifest } of manifests) {
  for (const [field, kind] of [['dependencies', 'випуск'], ['devDependencies', 'розробка']]) {
    for (const [name, version] of Object.entries(manifest[field] ?? {})) {
      if (workspaceNames.has(name)) continue;
      const entry = direct.get(name) ?? { versions: new Set(), kinds: new Set(), files: [] };
      entry.versions.add(version);
      entry.kinds.add(kind);
      entry.files.push(file);
      direct.set(name, entry);
    }
  }
}

const rows = fs.readFileSync(path.join(root, 'ATTRIBUTION.md'), 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.startsWith('|') && !/^\|[\s|:-]+\|$/.test(line) && !line.includes('Звідки'));

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const named = (row) => row.split('|').slice(1, 3).join(' | ');
const mentions = (row, name) => new RegExp(`(^|[^\\w@/.-])${escape(name)}($|[^\\w/.-])`).test(named(row));
const firstCell = (row) => row.split('|')[1]?.trim() ?? '';

const missing = [...direct.keys()].filter((name) => !rows.some((row) => mentions(row, name))).sort();
const withoutPackage = rows.filter((row) => ![...direct.keys()].some((name) => mentions(row, name)));

printHeader('ЛР4', 'атрибуція проти прямих залежностей', { mode: 'package.json кореня й робочих просторів' });
console.log(`прямих залежностей: ${direct.size} · рядків атрибуції: ${rows.length}`);
console.log('─'.repeat(64));
printTable([...direct.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, e]) => ({
  'пакет': name,
  'версія': [...e.versions].join(', '),
  'роль': [...e.kinds].join(', '),
  'де названо': e.files.join(', '),
  'рядок атрибуції': missing.includes(name) ? 'НЕМАЄ' : 'є',
})));
console.log('─'.repeat(64));
console.log(`рядки атрибуції без жодного пакета (${withoutPackage.length}), у переліку складових їх немає:`);
for (const row of withoutPackage) console.log(`  · ${firstCell(row)}`);
console.log('─'.repeat(64));
if (missing.length) {
  console.log(`АТРИБУЦІЯ НЕПОВНА ✗ — без рядка: ${missing.join(', ')}`);
  process.exit(1);
}
console.log('КОЖНА ПРЯМА ЗАЛЕЖНІСТЬ МАЄ РЯДОК АТРИБУЦІЇ ✓');
