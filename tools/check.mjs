import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { STEPS } from '../pipeline.config.mjs';
import { npm } from './npm.mjs';

// Кроки коду беруться з того самого переліку, що й у конвеєрі (pipeline.config.mjs, check: true).
const steps = [
  { name: 'середовище', command: ['node', 'tools/env.mjs'] },
  ...STEPS.filter((s) => s.check),
];

const results = [];
for (const step of steps) {
  const started = Date.now();
  const [program, ...args] = step.command;
  const r = program === 'node'
    ? spawnSync(process.execPath, args, { stdio: 'inherit' })
    : npm(args, { stdio: 'inherit' });
  results.push({ name: step.name, ok: r.status === 0, seconds: ((Date.now() - started) / 1000).toFixed(1) });
  if (step.name === 'середовище' && r.status !== 0) break;
}

console.log('');
for (const r of results) console.log(`${r.ok ? '✓' : '✗'}  ${r.name.padEnd(48)} ${r.seconds} с`);
const failed = results.filter((r) => !r.ok);
console.log(failed.length ? `НЕ ГОТОВО ✗ — ${failed.map((r) => r.name).join(', ')}` : 'ГОТОВО ✓');
process.exit(failed.length ? 1 : 0);
