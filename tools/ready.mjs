import process from 'node:process';
import { npm } from './npm.mjs';

const lab = Number(process.argv[2]);
if (![1, 2, 3, 4].includes(lab)) {
  console.error('потрібен номер роботи, наприклад npm run ready -- 1');
  process.exit(2);
}
const r = npm(['exec', '--', 'vitest', 'run', 'tests/journal.spec.ts', 'tests/documents.spec.ts'], {
  stdio: 'inherit',
  env: { ...process.env, JSF_LR: String(lab) },
});
console.log(r.status === 0 ? `ЛР${lab}: ДОКУМЕНТИ ГОТОВІ ✓` : `ЛР${lab}: ДОКУМЕНТИ НЕ ГОТОВІ ✗`);
process.exit(r.status === 0 ? 0 : 1);
