import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { printHeader, printTable } from './output.mjs';
import { npm } from './npm.mjs';

// Перелік складових генерує npm sbom (документація npm, «npm sbom»), а тут він
// звіряється з пакетами, встановленими за файлом блокування на цій машині.
// Необов'язкові пакети під іншу ОС не встановлені й до переліку не входять.
// Без --omit=dev, бо 17.09.2026 у npm 10.9.7, 11.2.0, 11.19.1 і 12.0.2 перелік з
// --omit=dev не містив react, react-dom і scheduler. Повний перелік позначає
// залежності випуску полем scope: "required".
const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'check-reports', 'sbom.cdx.json');
const r = npm(['sbom', '--sbom-format=cyclonedx', '--sbom-type=application'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, r.stdout, 'utf8');
const sbom = JSON.parse(r.stdout);

// Робочий простір у файлі блокування має запис теки і посилання
// node_modules/ІМ'Я (link: true). npm sbom називає робочий простір іменем теки.
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
const tree = new Set(Object.entries(lock.packages)
  .filter(([key, pkg]) => key && !pkg.link && fs.existsSync(path.join(root, key, 'package.json')))
  .map(([key, pkg]) => key.includes('node_modules/')
    ? `${pkg.name ?? key.split('node_modules/').pop()}@${pkg.version}`
    : `${key}@${pkg.version}`));
const components = new Set(sbom.components.map((c) => `${c.name}@${c.version}`));
const onlyInTree = [...tree].filter((c) => !components.has(c));
const onlyInSbom = [...components].filter((c) => !tree.has(c));

printHeader('ЛР4', 'перелік складових', { mode: `CycloneDX ${sbom.specVersion} · npm sbom` });
printTable([
  { 'що': 'складових у переліку', 'кількість': sbom.components.length },
  { 'що': '  з них scope: required', 'кількість': sbom.components.filter((c) => c.scope === 'required').length },
  { 'що': 'різних пакетів, встановлених за файлом блокування', 'кількість': tree.size },
  { 'що': 'є в дереві залежностей, немає в переліку', 'кількість': onlyInTree.length },
  { 'що': 'є в переліку, немає в дереві залежностей', 'кількість': onlyInSbom.length },
]);
console.log(`запис: ${path.relative(root, out)}`);
const ok = onlyInTree.length === 0 && onlyInSbom.length === 0;
if (!ok) console.log(`розбіжність: ${[...onlyInTree, ...onlyInSbom].slice(0, 10).join(', ')}`);
console.log(ok ? 'ПЕРЕЛІК СКЛАДОВИХ ВІДПОВІДАЄ ДЕРЕВУ ЗАЛЕЖНОСТЕЙ ✓' : 'ПЕРЕЛІК СКЛАДОВИХ НЕ ВІДПОВІДАЄ ДЕРЕВУ ЗАЛЕЖНОСТЕЙ ✗');
process.exit(ok ? 0 : 1);
