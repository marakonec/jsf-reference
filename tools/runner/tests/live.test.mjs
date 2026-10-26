import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { parseCsv } from '../scatter.mjs';

// Потребує встановленого Chrome або змінної CHROME_PATH.
const root = path.resolve(import.meta.dirname, '..');
const PAGE = `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>т</title></head>
<body><h1>Каталог для перевірки прогонника</h1><label>Фільтр <input aria-label="Фільтр"></label>
<button type="button">Оновити</button>
<label>Сортування <select aria-label="Сортування"><option>назва</option><option>маса</option><option>дата</option></select></label>
<table><tbody aria-label="Записи">${Array.from({ length: 50 }, (_, i) => `<tr><td>запис ${i}</td></tr>`).join('')}</tbody></table>
<script>
const heavy = new URLSearchParams(location.search).has('heavy');
const work = () => {
  const start = performance.now();
  if (heavy) { const end = performance.now() + 150; while (performance.now() < end) {} }
  performance.measure('фільтр каталогу', { start });
};
document.querySelector('input').addEventListener('input', work);
document.querySelector('button').addEventListener('click', work);
document.querySelector('select').addEventListener('change', work);
</script></body></html>`;

let server, url, dir;
before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsf-runner-'));
  server = http.createServer((_, res) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(PAGE); });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}/`;
});
after(() => { server?.close(); fs.rmSync(dir, { recursive: true, force: true }); });

// Асинхронно, бо сервер сторінки живе в цьому самому процесі.
const node = (args) => new Promise((resolve) => {
  execFile(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: 240_000 }, (error, stdout, stderr) => {
    resolve({ status: error ? (error.code ?? 1) : 0, stdout, stderr });
  });
});
const valueOf = (rows, variant, quantity) => rows.find((r) => r.variant === variant && r.quantity === quantity)?.value;

test('два прогони Lighthouse дають по рядку CSV на прогін на кожну величину і scatter.html', async () => {
  const file = path.join(dir, 'lighthouse.csv');
  const r = await node(['lighthouse.mjs', url, '--runs', '2', '--variant', 'перевірка', '--csv', file]);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const rows = parseCsv(fs.readFileSync(file, 'utf8'));
  for (const q of ['LCP', 'FCP', 'TTFB', 'TBT', 'CLS', 'JS']) {
    assert.deepEqual(rows.filter((row) => row.quantity === q).map((row) => row.run), [1, 2], q);
  }
  assert.match(rows[0].conditions, /Lighthouse 13\.4\.1 · navigation · mobile · тротлінг devtools/);
  assert.match(r.stdout, /елемент LCP: /);
  assert.ok(fs.existsSync(path.join(dir, 'scatter.html')));
});

test('введення в поле з важким обробником дає довге завдання на кожен символ, без нього жодного', async () => {
  const file = path.join(dir, 'interaction.csv');
  const heavy = await node(['interaction.mjs', `${url}?heavy`, '--field', 'Фільтр', '--repeat', '1', '--measure', 'фільтр каталогу', '--variant', 'з', '--csv', file]);
  assert.equal(heavy.status, 0, heavy.stderr || heavy.stdout);
  const light = await node(['interaction.mjs', url, '--field', 'Фільтр', '--repeat', '1', '--variant', 'без', '--csv', file]);
  assert.equal(light.status, 0, light.stderr || light.stdout);
  const rows = parseCsv(fs.readFileSync(file, 'utf8'));
  assert.equal(valueOf(rows, 'з', 'довгих завдань'), 2);
  assert.ok(valueOf(rows, 'з', 'найдовше завдання') >= 150);
  assert.ok(valueOf(rows, 'з', 'фільтр каталогу (макс.)') >= 150);
  assert.equal(valueOf(rows, 'без', 'довгих завдань'), 0);
});

test('натискання кнопки і клавіша на списку теж вимірюються як взаємодії', async () => {
  const file = path.join(dir, 'actions.csv');
  const click = await node(['interaction.mjs', `${url}?heavy`, '--click', 'Оновити', '--times', '2', '--repeat', '1', '--variant', 'кнопка', '--csv', file]);
  assert.equal(click.status, 0, click.stderr || click.stdout);
  const press = await node(['interaction.mjs', `${url}?heavy`, '--press', 'ArrowDown', '--on', 'Сортування', '--repeat', '1', '--variant', 'список', '--csv', file]);
  assert.equal(press.status, 0, press.stderr || press.stdout);
  const rows = parseCsv(fs.readFileSync(file, 'utf8'));
  assert.equal(valueOf(rows, 'кнопка', 'довгих завдань'), 2);
  assert.ok(valueOf(rows, 'кнопка', 'найбільша затримка взаємодії') >= 150);
  assert.ok(valueOf(rows, 'список', 'найбільша затримка взаємодії') >= 150);
});

test('без елемента з потрібною роллю й іменем команда завершується поясненням', async () => {
  const r = await node(['interaction.mjs', url, '--field', 'Немає такого поля', '--repeat', '1', '--csv', path.join(dir, 'none.csv')]);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /немає елемента з роллю textbox і доступним іменем «Немає такого поля»/);
});
