import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { npm as runNpm } from './npm.mjs';

// `npm run <скрипт> --workspaces` мовчки пропускає пакет без такого скрипта,
// тому скрипт запускається в кожному пакеті окремо, і відсутній скрипт є помилкою.
const root = path.resolve(import.meta.dirname, '..');
const script = process.argv[2];
if (!script) {
  console.error('потрібна назва скрипта, наприклад node tools/workspaces.mjs build');
  process.exit(2);
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const npm = (args) => runNpm(['run', '--silent', ...args], { cwd: root, stdio: 'inherit' }).status;

let failed = 0;
if (manifest.scripts[`${script}:root`]) {
  console.log(`\n▸ корінь · ${script}`);
  if (npm([`${script}:root`]) !== 0) failed += 1;
}
for (const workspace of manifest.workspaces ?? []) {
  console.log(`\n▸ ${workspace} · ${script}`);
  if (npm([script, '--workspace', workspace]) !== 0) failed += 1;
}
process.exit(failed ? 1 : 0);
