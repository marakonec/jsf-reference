import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { printHeader, printTable } from './output.mjs';

// Пошук пакетів і версій з опису інциденту у файлах блокування проєкту й
// прогонника. Шукається файл блокування, а не встановлене дерево залежностей,
// бо на іншій ОС необов'язкові пакети не встановлюються.
//   npm run lockfile -- "debug@4.4.2" "chalk@5.6.1"
const root = path.resolve(import.meta.dirname, '..');
const LOCKFILES = ['package-lock.json', 'tools/runner/package-lock.json'];

const specs = process.argv.slice(2).filter((arg) => !arg.startsWith('--')).map((arg) => {
  const at = arg.lastIndexOf('@');
  return at > 0 ? { name: arg.slice(0, at), version: arg.slice(at + 1) } : { name: arg, version: '' };
});
if (specs.length === 0) {
  console.error('потрібні пакети з інциденту, наприклад npm run lockfile -- "debug@4.4.2" "chalk@5.6.1"');
  process.exit(2);
}

const nameOf = (key, pkg) => pkg.name ?? key.split('node_modules/').pop();
const rows = [];
const hits = [];
for (const lockfile of LOCKFILES) {
  const file = path.join(root, lockfile);
  if (!fs.existsSync(file)) continue;
  const entries = Object.entries(JSON.parse(fs.readFileSync(file, 'utf8')).packages)
    .filter(([key, pkg]) => key.includes('node_modules/') && !pkg.link);
  for (const spec of specs) {
    const found = entries.filter(([key, pkg]) => nameOf(key, pkg) === spec.name);
    const exact = found.filter(([, pkg]) => pkg.version === spec.version);
    if (exact.length) hits.push(`${spec.name}@${spec.version} (${lockfile})`);
    rows.push({
      'файл блокування': lockfile,
      'шукали': spec.version ? `${spec.name}@${spec.version}` : spec.name,
      'версії у файлі': [...new Set(found.map(([, pkg]) => pkg.version))].join(', ') || 'пакета немає',
      'збіг з інцидентом': spec.version ? (exact.length ? 'ТАК' : 'ні') : '',
      'роль': lockfile.startsWith('tools/') ? 'прогонник' : [...new Set(found.map(([, pkg]) => (pkg.dev ? 'розробка' : 'випуск')))].join(', '),
      'копій': found.length,
    });
  }
}

printHeader('ЛР4', 'пакети інциденту у файлі блокування', { mode: 'package-lock.json проєкту і tools/runner' });
printTable(rows);
console.log('─'.repeat(64));
if (hits.length) {
  console.log(`У ФАЙЛІ БЛОКУВАННЯ Є ВЕРСІЇ З ІНЦИДЕНТУ ✗ — ${hits.join(', ')}`);
  process.exit(1);
}
console.log('ВЕРСІЙ З ІНЦИДЕНТУ У ФАЙЛАХ БЛОКУВАННЯ НЕМАЄ ✓');
console.log("ланцюг до кореня для знайденого пакета показує npm explain \"НАЗВА_ПАКЕТА\"");
