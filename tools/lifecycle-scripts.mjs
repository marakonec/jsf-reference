import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { printHeader, printTable } from './output.mjs';

// Перелік пакетів, що виконують код під час встановлення, береться з поля
// hasInstallScript файлу блокування, тому він однаковий на всіх машинах, навіть
// коли пакет на цій ОС не встановлено. Команди читаються з package.json
// встановленого пакета (події preinstall, install, postinstall). Якщо в корені
// пакета є binding.gyp і немає власних install і preinstall, npm за
// замовчуванням виконує node-gyp rebuild (документація npm, «scripts»).
const root = path.resolve(import.meta.dirname, '..');
const EVENTS = ['preinstall', 'install', 'postinstall'];

const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
const entries = Object.entries(lock.packages).filter(([key]) => key !== '');
// Пакетами рахуються ті самі записи, що й у npm run tree: шлях містить
// node_modules/ і запис не є посиланням на робочий простір. Записи робочих
// просторів і посилання на них теж перевіряються на скрипти встановлення,
// але пакетами з реєстру не є і в лічбу пакетів не входять.
const isPackage = ([key, pkg]) => key.includes('node_modules/') && !pkg.link;
const packageCount = entries.filter(isPackage).length;
const workspaceCount = entries.length - packageCount;
const nameOf = (key, pkg) => pkg.name ?? key.split('node_modules/').pop();

// Хто оголосив пакет, визначається за файлом блокування, бо npm explain не
// знаходить пакет, не встановлений на цій ОС.
function declaredBy(name) {
  return entries
    .filter(([, pkg]) => ['dependencies', 'optionalDependencies'].some((field) => pkg[field]?.[name]))
    .map(([key, pkg]) => `${nameOf(key, pkg)}@${pkg.version}`)
    .join(', ') || 'корінь';
}

const found = [];
let withPrepare = 0;
for (const [key, pkg] of entries) {
  const manifest = path.join(root, key, 'package.json');
  const installed = fs.existsSync(manifest);
  const scripts = installed ? JSON.parse(fs.readFileSync(manifest, 'utf8')).scripts ?? {} : {};
  if (scripts.prepare) withPrepare++;
  const commands = EVENTS.filter((event) => scripts[event]).map((event) => `${event}: ${scripts[event]}`);
  const gyp = installed && !scripts.install && !scripts.preinstall && fs.existsSync(path.join(root, key, 'binding.gyp'));
  if (gyp) commands.push('install (за замовчуванням, binding.gyp): node-gyp rebuild');
  if (!pkg.hasInstallScript && commands.length === 0) continue;
  const name = nameOf(key, pkg);
  found.push({
    name,
    label: `${name}@${pkg.version}`,
    row: {
      'пакет': `${name}@${pkg.version}`,
      'роль': [pkg.dev ? 'dev' : 'prod', pkg.optional ? 'optional' : ''].filter(Boolean).join(' '),
      'хто оголосив': declaredBy(name),
      'платформа': pkg.os ? pkg.os.join(',') : 'усі',
      'на цій машині': installed ? 'встановлено' : 'не встановлено',
      'команди': installed ? (commands.join(' · ') || '(у файлі блокування позначено, у package.json подій немає)') : '(пакет не встановлено, команди не прочитати)',
    },
  });
}

printHeader('ЛР4', 'скрипти встановлення', { mode: 'дерево залежностей за package-lock.json' });
console.log(`пакетів у package-lock.json: ${packageCount} (як у npm run tree) · виконують код під час встановлення: ${found.length}`);
if (workspaceCount) console.log(`перевірено також записів робочих просторів і посилань на них: ${workspaceCount}, пакетами з реєстру вони не є`);
console.log(`prepare оголошують ${withPrepare} встановлених пакетів, для пакетів із реєстру під час встановлення він не виконується`);
console.log('─'.repeat(64));
printTable(found.map((f) => f.row));

if (process.argv.includes('--check')) {
  const policy = JSON.parse(fs.readFileSync(path.join(root, 'dependency-policy.json'), 'utf8'));
  const allowed = new Set(Object.keys(policy.allowedInstallScripts ?? {}));
  const violators = found.filter((f) => !allowed.has(f.name));
  console.log('─'.repeat(64));
  if (violators.length) {
    console.log(`НЕ ДОЗВОЛЕНО ПОЛІТИКОЮ: ${violators.map((f) => f.label).join(', ')}`);
    console.log('пакет потрібно прибрати або записати причину дозволу в dependency-policy.json і ADR-004');
    process.exit(1);
  }
  console.log(`усі ${found.length} дозволені політикою (dependency-policy.json)`);
}
