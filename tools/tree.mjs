import fs from 'node:fs';
import path from 'node:path';
import { printHeader, printTable } from './output.mjs';

// Пакети, названі в кореневому package.json і в package.json робочих просторів,
// проти записів файлу блокування. Посилання на робочі простори (link: true) не рахуються.
const root = path.resolve(import.meta.dirname, '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const rootManifest = read('package.json');
const manifests = [rootManifest, ...(rootManifest.workspaces ?? []).map((w) => read(path.join(w, 'package.json')))];
const workspaceNames = new Set(manifests.map((m) => m.name));
const named = (field) => new Set(manifests.flatMap((m) => Object.keys(m[field] ?? {})).filter((n) => !workspaceNames.has(n)));
const prod = named('dependencies');
const dev = named('devDependencies');

const packages = Object.entries(read('package-lock.json').packages)
  .filter(([key, pkg]) => key.includes('node_modules/') && !pkg.link);
const count = (predicate) => packages.filter(([, pkg]) => predicate(pkg)).length;

printHeader('ЛР4', 'маніфест проти дерева залежностей', { mode: 'дерево залежностей за package-lock.json' });
printTable([
  { 'що': 'названо в package.json', 'усього': new Set([...prod, ...dev]).size, 'випуск': prod.size, 'розробка': dev.size },
  { 'що': 'пакетів у package-lock.json', 'усього': packages.length, 'випуск': count((p) => !p.dev && !p.devOptional), 'розробка': count((p) => p.dev || p.devOptional) },
  { 'що': "з них необов'язкових (під певну ОС)", 'усього': count((p) => p.optional), 'випуск': '', 'розробка': '' },
]);
const times = Math.round(packages.length / new Set([...prod, ...dev]).size);
const word = times % 10 >= 2 && times % 10 <= 4 && (times % 100 < 12 || times % 100 > 14) ? 'рази' : 'разів';
console.log(`у файлі блокування в ${times} ${word} більше пакетів, ніж названо в маніфестах`);
console.log('записи робочих просторів і посилання на них пакетами не рахуються, npm run lifecycle рахує так само');
console.log("ланцюг для окремого пакета показує стандартна команда npm explain \"НАЗВА_ПАКЕТА\"");
