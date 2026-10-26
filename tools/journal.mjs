import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// npm run journal -- N переносить у таблицю прогонів розділу N журналу рядки
// файлів CSV теки measurements, у яких колонка component дорівнює ЛРN, і під
// таблицею перераховує медіану, мінімум, максимум і розкид кожної величини
// кожного варіанта за правилами розділу «Протокол вимірювань». Серія це рядки
// однієї величини одного варіанта від прогону 1. Якщо серію повторено, у таблицю
// йде остання за датою, а попередні лишаються в CSV. Рядки таблиці, яких у CSV
// немає (внесені вручну), лишаються. Інтерпретацію студент пише сам.
//   --all   переносити всі серії, а не лише останню
//   --dry   лише показати результат, журнал не змінювати
const root = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const lab = Number(args.find((a) => /^\d+$/.test(a)));
const every = args.includes('--all');
const dry = args.includes('--dry');
if (!(lab >= 1 && lab <= 4)) {
  console.error('потрібен номер роботи, наприклад npm run journal -- 1');
  process.exit(2);
}

const COLUMNS = ['date', 'variant', 'quantity', 'unit', 'run', 'value'];
const DETERMINISTIC = new Set(['Б', 'КБ', 'МБ', '—']);
const PLACEHOLDER = /<[A-Za-zА-ЩЬЮЯЄІЇҐа-щьюяєіїґ][^<>]*>/;
const SUMMARY_HEAD = '| Варіант | Величина | n | Медіана | Мінімум | Максимум | Розкид |';

function readCsvRows() {
  const dir = path.join(root, 'measurements');
  if (!fs.existsSync(dir)) return [];
  const rows = [];
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.csv')).sort()) {
    const [head, ...lines] = fs.readFileSync(path.join(dir, file), 'utf8').split(/\r?\n/).filter(Boolean);
    const cols = head.split(';');
    if (!COLUMNS.every((c) => cols.includes(c)) || !cols.includes('component')) continue;
    for (const line of lines) {
      const cells = line.split(';');
      const row = Object.fromEntries(cols.map((c, i) => [c, (cells[i] ?? '').trim()]));
      if (row.component === `ЛР${lab}`) rows.push(row);
    }
  }
  return rows;
}

// Серії однієї величини одного варіанта, кожна починається з прогону 1.
function latestSeries(rows) {
  const series = new Map();
  for (const row of rows) {
    const key = keyOf(row);
    const list = series.get(key) ?? [];
    const last = list[list.length - 1];
    if (!last || Number(row.run) <= Number(last[last.length - 1].run)) list.push([row]);
    else last.push(row);
    series.set(key, list);
  }
  const result = [];
  for (const list of series.values()) {
    if (every) result.push(...list.flat());
    else result.push(...list.reduce((a, b) => (b[0].date >= a[0].date ? b : a)));
  }
  return result;
}

const cells = (line) => line.trim().slice(1, -1).split('|').map((c) => c.trim());
const keyOf = (row) => `${row.variant}\u0000${row.quantity}\u0000${row.unit}`;
const rowLine = (row) => `| ${COLUMNS.map((c) => row[c]).join(' | ')} |`;
const isTable = (line) => line.trim().startsWith('|');

const file = path.join(root, 'JOURNAL.md');
const text = fs.readFileSync(file, 'utf8');
const eol = text.includes('\r\n') ? '\r\n' : '\n';
const lines = text.split(/\r?\n/);
const start = lines.findIndex((l) => new RegExp(`^## Розділ ${lab}(?!\\d)`).test(l));
if (start < 0) {
  console.error(`у JOURNAL.md немає розділу «## Розділ ${lab}». Спершу його треба додати з частинами «### Прогноз», «### Вимірювання», «### Інтерпретація» і зафіксувати прогноз комітом.`);
  process.exit(1);
}
let end = lines.findIndex((l, i) => i > start && l.startsWith('## '));
if (end < 0) end = lines.length;
const from = lines.findIndex((l, i) => i > start && i < end && l.trim() === '### Вимірювання');
let to = lines.findIndex((l, i) => i > from && i < end && l.startsWith('### '));
if (from < 0) {
  console.error(`у розділі ${lab} немає частини «### Вимірювання»`);
  process.exit(1);
}
if (to < 0) to = end;
let block = lines.slice(from + 1, to);

// Попередній підсумок, записаний цією командою, прибирається, бо рахується заново.
const old = block.findIndex((l) => l.trim().startsWith('| Варіант | Величина | n |'));
if (old >= 0) {
  let stop = old;
  while (stop < block.length && isTable(block[stop])) stop += 1;
  if (block[stop] === '' && block[old - 1] === '') stop += 1;
  block.splice(old, stop - old);
}

let head = block.findIndex((l) => isTable(l) && /\|\s*variant\s*\|/.test(l) && /\|\s*value\s*\|/.test(l));
if (head < 0) {
  while (block.length && block[block.length - 1] === '') block.pop();
  block.push('', `| ${COLUMNS.join(' | ')} |`, `|${COLUMNS.map(() => '---').join('|')}|`);
  head = block.length - 2;
}
const header = cells(block[head]);
let tail = head + 1;
while (tail < block.length && isTable(block[tail])) tail += 1;
const existing = block.slice(head + 2, tail).filter((l) => !PLACEHOLDER.test(l));
const table = existing.map((l) => Object.fromEntries(cells(l).map((c, i) => [header[i] ?? String(i), c])));
const fromCsv = latestSeries(readCsvRows());
const csvKeys = new Set(fromCsv.map(keyOf));
const manual = table.filter((row) => !csvKeys.has(keyOf(row)));
const known = new Set(table.map(rowLine));
const added = fromCsv.filter((row) => !known.has(rowLine(row)));
// Рядки впорядковано за величиною і варіантом, тож серії однієї величини стоять поруч.
const order = (a, b) => a.quantity.localeCompare(b.quantity, 'uk') || a.variant.localeCompare(b.variant, 'uk') || a.date.localeCompare(b.date) || Number(a.run) - Number(b.run);
const all = [...manual, ...[...fromCsv].sort(order)];

function number(value) {
  const n = Number(String(value).replace(',', '.'));
  return value !== '' && Number.isFinite(n) ? n : null;
}
function digits(value) {
  const m = /[.,](\d+)$/.exec(value);
  return m ? m[1].length : 0;
}
function format(x, d, comma) {
  let s = x.toFixed(d);
  if (Math.abs(Number(s) - x) > 1e-9 * Math.max(1, Math.abs(x))) s = x.toFixed(d + 1);
  return comma ? s.replace('.', ',') : s;
}

const groups = new Map();
for (const row of all) {
  if (DETERMINISTIC.has(row.unit) || number(row.value) === null) continue;
  const key = keyOf(row);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(row.value);
}
const summary = [];
const few = [];
for (const [key, values] of groups) {
  const [variant, quantity, unit] = key.split('\u0000');
  const v = values.map(number).sort((a, b) => a - b);
  const n = v.length;
  const median = n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2;
  const d = Math.max(...values.map(digits));
  const comma = values.some((x) => x.includes(','));
  const f = (x) => format(x, d, comma);
  summary.push(`| ${variant} | ${quantity}, ${unit} | ${n} | ${f(median)} | ${f(v[0])} | ${f(v[n - 1])} | ${f(v[n - 1] - v[0])} |`);
  if (n < 5) few.push(`${variant} · ${quantity}: ${n}`);
}

const runs = [block[head], block[head + 1], ...all.map(rowLine)];
const summaryLines = summary.length ? ['', SUMMARY_HEAD, '|---|---|---|---|---|---|---|', ...summary] : [];
block = [...block.slice(0, head), ...runs, ...summaryLines, ...block.slice(tail)];
const result = [...lines.slice(0, from + 1), ...block, ...lines.slice(to)].join(eol);

console.log(`Розділ ${lab}: у таблиці прогонів ${all.length} рядків, з них з CSV ${fromCsv.length} (нових ${added.length}), внесених вручну ${manual.length}.`);
if (summary.length) console.log(summaryLines.join('\n'));
if (few.length) console.log(`\nМенше п'яти прогонів (протокол вимагає не менше п'яти): ${few.join('; ')}`);
if (!all.length) {
  console.error(`\nУ measurements/*.csv немає рядків з component = ЛР${lab}. Прогонник пише їх, якщо задано --component ЛР${lab}.`);
  process.exit(1);
}
if (dry) console.log('\n--dry: JOURNAL.md не змінено.');
else fs.writeFileSync(file, result);
