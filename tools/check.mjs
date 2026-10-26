import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { npm } from './npm.mjs';

// Кроки виконуються сценарієм, а не ланцюжком `&&` у package.json, бо оболонки
// Windows і Unix обробляють такий ланцюжок по-різному.
const STEPS = [
  ['середовище', ['node', 'tools/env.mjs']],
  ['перевірка типів', ['npm', 'run', '--silent', 'typecheck']],
  ['лінтинг', ['npm', 'run', '--silent', 'lint']],
  ['складання', ['npm', 'run', '--silent', 'build']],
  ['тести', ['npm', 'run', '--silent', 'test']],
];

const results = [];
for (const [name, [command, ...args]] of STEPS) {
  const started = Date.now();
  const r = command === 'node'
    ? spawnSync(process.execPath, args, { stdio: 'inherit' })
    : npm(args, { stdio: 'inherit' });
  results.push({ name, ok: r.status === 0, seconds: ((Date.now() - started) / 1000).toFixed(1) });
  if (name === 'середовище' && r.status !== 0) break;
}

console.log('');
for (const r of results) console.log(`${r.ok ? '✓' : '✗'}  ${r.name.padEnd(18)} ${r.seconds} с`);
const failed = results.filter((r) => !r.ok);
console.log(failed.length ? `НЕ ГОТОВО ✗ — ${failed.map((r) => r.name).join(', ')}` : 'ГОТОВО ✓');
process.exit(failed.length ? 1 : 0);
