import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const results = [];
const add = (ok, what, note) => results.push({ ok, what, note });

function parseVersion(text) {
  return text.replace(/^[^\d]*/, '').split('.').map((n) => Number.parseInt(n, 10) || 0);
}
function atLeast(a, b) {
  for (let i = 0; i < 3; i += 1) if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  return true;
}
function satisfies(version, range) {
  return range.split('||').map((part) => part.trim()).some((condition) => {
    if (condition.startsWith('^')) {
      const min = parseVersion(condition);
      return version[0] === min[0] && atLeast(version, min);
    }
    if (condition.startsWith('>=')) return atLeast(version, parseVersion(condition));
    return false;
  });
}

// Межа версії Node береться з поля engines пакета jsdom, найвимогливішої
// залежності, щоб число не розходилося з деревом залежностей.
const jsdom = path.join(root, 'node_modules', 'jsdom', 'package.json');
if (!fs.existsSync(jsdom)) {
  add(false, 'залежності', 'немає node_modules, потрібно виконати npm ci');
} else {
  const required = JSON.parse(fs.readFileSync(jsdom, 'utf8')).engines?.node ?? '>=0';
  const ok = satisfies(parseVersion(process.versions.node), required);
  add(ok, `Node ${process.versions.node}`, ok ? `потрібно ${required}` : `потрібно ${required}, встановлена версія нижча, слід оновити Node LTS`);
}

const git = (...args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
const version = git('--version');
add(version.status === 0, 'git', version.status === 0 ? version.stdout.trim() : 'git не знайдено, потрібно встановити git');

const isRepoRoot = fs.existsSync(path.join(root, '.git'));
add(isRepoRoot, 'репозиторій', isRepoRoot ? 'корінь проєкту є коренем репозиторію' : 'немає .git, репозиторій потрібно створити з шаблону курсу');
const origin = git('remote', 'get-url', 'origin');
const onGitHub = origin.status === 0 && /github\.com/i.test(origin.stdout);
add(onGitHub, 'origin', onGitHub ? origin.stdout.trim() : 'віддалений репозиторій origin не на GitHub');

// У теці хмарної синхронізації довгі шляхи node_modules і синхронізація
// тисяч файлів ламають встановлення на Windows.
const inCloud = /onedrive|icloud|dropbox|google drive/i.test(root);
add(!inCloud, 'шлях', inCloud ? `${root} у теці хмарної синхронізації, проєкт потрібно перенести в короткий шлях` : root);

for (const r of results) console.log(`${r.ok ? '✓' : '✗'}  ${r.what.padEnd(18)} ${r.note}`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
