import { spawnSync } from 'node:child_process';
import process from 'node:process';

const started = Date.now();
const r = spawnSync(process.execPath, ['--test', '--test-concurrency=1', 'tests/scatter.test.mjs', 'tests/live.test.mjs'], {
  cwd: import.meta.dirname, stdio: 'inherit',
});
console.log(`\n${r.status === 0 ? '✓' : '✗'}  тести              ${((Date.now() - started) / 1000).toFixed(1)} с`);
console.log(r.status === 0 ? 'ГОТОВО ✓' : 'НЕ ГОТОВО ✗ — тести');
process.exit(r.status === 0 ? 0 : 1);
