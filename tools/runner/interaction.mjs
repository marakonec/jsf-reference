import path from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';
import puppeteer from 'puppeteer-core';
import { launchChrome, chromeVersion } from './browser.mjs';
import { printHeader, printTable, appendCsv } from './output.mjs';
import { conditions, timestamp } from './conditions.mjs';
import { MEASUREMENTS } from './paths.mjs';

const USAGE = [
  'npm run interaction -- АДРЕСА --field "Фільтр" [--text 97]',
  'npm run interaction -- АДРЕСА --click "Назва кнопки" [--role button] [--times 1]',
  'npm run interaction -- АДРЕСА --press ArrowDown --on "Сортування" [--role combobox] [--times 1]',
].join('\n  ');

const { values: args, positionals: [url] } = parseArgs({
  allowPositionals: true,
  options: {
    field: { type: 'string', default: '' },
    text: { type: 'string', default: '97' },
    click: { type: 'string', default: '' },
    press: { type: 'string', default: '' },
    on: { type: 'string', default: '' },
    role: { type: 'string', default: '' },
    times: { type: 'string', default: '1' },
    measure: { type: 'string', default: '' },
    repeat: { type: 'string', default: '3' },
    cpu: { type: 'string', default: '1' },
    variant: { type: 'string', default: '' },
    csv: { type: 'string', default: path.join(MEASUREMENTS, 'interaction.csv') },
    component: { type: 'string', default: 'ЛР3' },
    mode: { type: 'string', default: 'production' },
  },
});

function actionFromArgs() {
  if (args.field) return { kind: 'type', role: 'textbox', name: args.field, describe: `введено «${args.text}» по символу через 400 мс у поле «${args.field}»` };
  if (args.click) return { kind: 'click', role: args.role || 'button', name: args.click, describe: `натискання «${args.click}» (${args.role || 'button'}) × ${args.times}` };
  if (args.press && args.on) return { kind: 'press', role: args.role || 'combobox', name: args.on, describe: `клавіша ${args.press} на «${args.on}» (${args.role || 'combobox'}) × ${args.times}` };
  return null;
}

const action = actionFromArgs();
if (!url || !action) {
  console.error(`потрібні адреса і дія за роллю та доступним іменем:\n  ${USAGE}`);
  process.exit(2);
}
if (!['production', 'development'].includes(args.mode)) throw new Error('--mode приймає production або development');
const REPEAT = Number(args.repeat);
const CPU = Number(args.cpu);
const TIMES = Number(args.times);
const IGNORED = new Set(['(root)', '(program)', '(idle)', '(garbage collector)']);
const target = `::-p-aria([name=${JSON.stringify(action.name)}][role=${JSON.stringify(action.role)}])`;

// Спостерігачі ставляться до завантаження сторінки. Довгі завдання за
// PerformanceObserver типу longtask (від 50 мс), затримка взаємодії за Event
// Timing як найбільша тривалість події в межах одного interactionId.
function observers() {
  const store = { longTasks: [], events: [] };
  window.__runner = store;
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) store.longTasks.push({ start: e.startTime, duration: e.duration });
  }).observe({ type: 'longtask', buffered: true });
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) if (e.interactionId) store.events.push({ id: e.interactionId, start: e.startTime, duration: e.duration });
  }).observe({ type: 'event', durationThreshold: 16, buffered: true });
}

function selfTime(profile) {
  const nodes = new Map(profile.nodes.map((n) => [n.id, n]));
  const time = new Map();
  (profile.samples ?? []).forEach((id, i) => {
    const node = nodes.get(id);
    const delta = (profile.timeDeltas?.[i] ?? 0) / 1000;
    const name = node.callFrame.functionName || '(анонімна)';
    if (IGNORED.has(name)) return;
    const file = node.callFrame.url ? path.posix.basename(new URL(node.callFrame.url).pathname) : '';
    const key = `${name} · ${file || 'вбудований код'}`;
    time.set(key, (time.get(key) ?? 0) + delta);
  });
  return [...time.entries()].sort((a, b) => b[1] - a[1]);
}

async function perform(page, element) {
  if (action.kind === 'type') {
    // Цифри, а не кирилиця: для символів поза розкладкою US Puppeteer надсилає
    // лише подію input без keydown і keyup, і Event Timing взаємодії не бачить.
    await element.type(args.text, { delay: 400 });
    return;
  }
  for (let i = 0; i < TIMES; i++) {
    // Елемент шукається заново, бо після попередньої дії його могли перемалювати.
    const current = i === 0 ? element : await page.waitForSelector(target);
    if (action.kind === 'click') await current.click();
    else {
      await current.focus();
      await page.keyboard.press(args.press);
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
}

const chrome = await launchChrome();
const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}` });
const browserVersion = await chromeVersion(chrome.port);
const rows = [];
const csv = [];
const total = new Map();
try {
  for (let n = 1; n <= REPEAT; n++) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.evaluateOnNewDocument(observers);
    const cdp = await page.createCDPSession();
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    await page.goto(url, { waitUntil: 'networkidle0' }).catch((error) => {
      throw new Error(`адреса ${url} не відповідає (${error.message}), спершу потрібно запустити сервер застосунку`);
    });
    const element = await page.waitForSelector(target, { timeout: 15_000 }).catch(() => null);
    if (!element) throw new Error(`на сторінці немає елемента з роллю ${action.role} і доступним іменем «${action.name}»`);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const baseline = await page.evaluate(() => performance.now());
    await cdp.send('Profiler.enable');
    await cdp.send('Profiler.setSamplingInterval', { interval: 100 });
    await cdp.send('Profiler.start');
    await perform(page, element);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const { profile } = await cdp.send('Profiler.stop');
    const collected = await page.evaluate((from, measureName) => ({
      longTasks: window.__runner.longTasks.filter((t) => t.start >= from).map((t) => t.duration),
      events: window.__runner.events.filter((e) => e.start >= from),
      measures: measureName ? performance.getEntriesByName(measureName).filter((m) => m.startTime >= from).map((m) => m.duration) : [],
    }), baseline, args.measure);
    await page.close();

    const interactions = new Map();
    for (const e of collected.events) interactions.set(e.id, Math.max(interactions.get(e.id) ?? 0, e.duration));
    const maxDelay = interactions.size ? Math.max(...interactions.values()) : 0;
    const longest = collected.longTasks.length ? Math.max(...collected.longTasks) : 0;
    const functions = selfTime(profile);
    for (const [k, ms] of functions) total.set(k, (total.get(k) ?? 0) + ms);
    const row = {
      'повтор': n,
      'довгих завдань': collected.longTasks.length, 'найдовше, мс': Math.round(longest),
      'взаємодій': interactions.size, 'найбільша затримка, мс': Math.round(maxDelay),
    };
    const values = [['найдовше завдання', longest, 'мс'], ['найбільша затримка взаємодії', maxDelay, 'мс'], ['довгих завдань', collected.longTasks.length, 'шт']];
    if (args.measure) {
      const maxMeasure = collected.measures.length ? Math.max(...collected.measures) : 0;
      row[`${args.measure}, мс`] = Math.round(maxMeasure);
      values.push([`${args.measure} (макс.)`, maxMeasure, 'мс']);
    }
    row['функція з найбільшим часом'] = functions[0] ? `${functions[0][0]} (${Math.round(functions[0][1])} мс)` : '—';
    rows.push(row);
    for (const [quantity, value, unit] of values) {
      csv.push({ date: timestamp(), component: args.component, variant: args.variant || url, quantity, unit, run: n, value: Math.round(value), conditions: '', versions: process.version });
    }
  }
} catch (error) {
  console.error(`interaction: ${error.message}`);
  process.exitCode = 1;
} finally {
  await browser.disconnect();
  chrome.kill();
}
if (process.exitCode) process.exit();

const mode = args.mode === 'production' ? 'випуск' : 'розробка';
const extra = `${browserVersion} · headless · ЦП ×${CPU} · ${action.describe} · адреса ${url}`;
for (const r of csv) r.conditions = conditions({ mode, extra });
printHeader(args.component, `взаємодія × ${REPEAT}`, { mode, extra });
printTable(rows);
console.log('─'.repeat(64));
console.log("власний час функцій за всі повтори (перші п'ять):");
for (const [k, ms] of [...total.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)) console.log(`  ${String(Math.round(ms)).padStart(6)} мс  ${k}`);
appendCsv(path.resolve(args.csv), csv);
