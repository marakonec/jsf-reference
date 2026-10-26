import { spawnSync } from 'node:child_process';
import process from 'node:process';

// Під `npm run` змінна npm_execpath вказує на сценарій npm, і його можна
// запустити тим самим Node без оболонки. Оболонка на Windows потрібна лише
// поза npm run, бо там npm є файлом .cmd.
export function npm(args, options = {}) {
  const cli = process.env.npm_execpath;
  if (cli && /npm-cli\.js$/.test(cli)) return spawnSync(process.execPath, [cli, ...args], options);
  return spawnSync('npm', args, { ...options, shell: process.platform === 'win32' });
}
