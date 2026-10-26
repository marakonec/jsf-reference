import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { STEPS } from '../pipeline.config.mjs';
import { npm } from './npm.mjs';

// Локальний запуск не зупиняється на першій червоній перевірці, щоб було видно
// всі, що не пройшли. У конвеєрі кожна перевірка є окремим кроком, і перший
// червоний крок зупиняє решту.
const root = path.resolve(import.meta.dirname, '..');
const only = process.argv.find((a) => a.startsWith('--step='))?.slice('--step='.length);
const steps = only ? STEPS.filter((s) => s.id === only) : STEPS;
if (!steps.length) {
  console.error(`немає кроку «${only}», є ${STEPS.map((s) => s.id).join(', ')}`);
  process.exit(2);
}

const results = [];
for (const step of steps) {
  console.log(`\n▶ ${step.id} · ${step.name}\n$ ${step.command.join(' ')}`);
  const started = Date.now();
  const [program, ...args] = step.command;
  const r = program === 'node'
    ? spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' })
    : npm(args, { cwd: root, stdio: 'inherit' });
  if (r.error) console.error(`не вдалося запустити «${program}»: ${r.error.message}`);
  results.push({ ...step, ok: r.status === 0, seconds: Math.round((Date.now() - started) / 1000) });
}

console.log('');
for (const r of results) console.log(`${r.ok ? '✓' : '✗'}  ${r.id.padEnd(11)} ${r.name.padEnd(48)} ${r.seconds} с`);
const failed = results.filter((r) => !r.ok);
console.log(failed.length ? `ПЕРЕВІРКИ КОНВЕЄРА: ЧЕРВОНІ ✗ — ${failed.map((r) => r.id).join(', ')}` : 'ПЕРЕВІРКИ КОНВЕЄРА: ЗЕЛЕНІ ✓');
process.exit(failed.length ? 1 : 0);
