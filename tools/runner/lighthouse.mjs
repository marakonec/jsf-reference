import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';
import lighthouse, { desktopConfig } from 'lighthouse';
import { launchChrome, chromeVersion } from './browser.mjs';
import { printHeader, printTable, printSummary, appendCsv } from './output.mjs';
import { conditions, timestamp } from './conditions.mjs';
import { buildScatter } from './scatter.mjs';
import { MEASUREMENTS } from './paths.mjs';

const { values: args, positionals: [url] } = parseArgs({
  allowPositionals: true,
  options: {
    runs: { type: 'string', default: '10' },
    variant: { type: 'string', default: '' },
    device: { type: 'string', default: 'mobile' },
    // devtools, а не simulate (за замовчуванням у Lighthouse): симуляція за
    // документацією «very fast and deterministic» і гасить розкид прогонів.
    throttling: { type: 'string', default: 'devtools' },
    csv: { type: 'string', default: path.join(MEASUREMENTS, 'lighthouse.csv') },
    highlight: { type: 'string', default: '' },
    component: { type: 'string', default: 'ЛР3' },
  },
});

if (!url) {
  console.error('потрібна адреса, наприклад npm run lighthouse -- http://localhost:3102/ --runs 10');
  process.exit(2);
}
const RUNS = Number(args.runs);
if (!Number.isInteger(RUNS) || RUNS < 1) throw new Error(`--runs має бути цілим числом ≥ 1, отримано ${args.runs}`);
if (!['mobile', 'desktop'].includes(args.device)) throw new Error('--device приймає mobile або desktop');
if (!['devtools', 'simulate', 'provided'].includes(args.throttling)) throw new Error('--throttling приймає devtools, simulate або provided');

// Ідентифікатори аудитів Lighthouse 13.4.1, значення беруться з numericValue.
const METRICS = [
  { key: 'LCP', audit: 'largest-contentful-paint', unit: 'мс' },
  { key: 'FCP', audit: 'first-contentful-paint', unit: 'мс' },
  { key: 'TTFB', audit: 'server-response-time', unit: 'мс' },
  { key: 'TBT', audit: 'total-blocking-time', unit: 'мс' },
  { key: 'CLS', audit: 'cumulative-layout-shift', unit: '—' },
];

function lcpElement(lhr) {
  const node = (lhr.audits['lcp-breakdown-insight']?.details?.items ?? []).find((i) => i.type === 'node');
  return node
    ? { selector: String(node.selector), label: String(node.nodeLabel ?? '').slice(0, 60) }
    : { selector: 'не визначено', label: '' };
}

// Заголовки відповіді документа беруться з журналу протоколу DevTools цього
// прогону (артефакт DevtoolsLog Lighthouse 13.4.1). Vercel додає x-vercel-cache
// і x-vercel-id, на локальній адресі їх немає, і рядки CSV для них не пишуться.
const HEADERS = ['x-vercel-cache', 'x-vercel-id'];

function documentHeaders(artifacts) {
  const event = (artifacts?.DevtoolsLog ?? []).find((e) => e.method === 'Network.responseReceived' && e.params?.type === 'Document');
  const headers = Object.fromEntries(Object.entries(event?.params?.response?.headers ?? {}).map(([k, v]) => [k.toLowerCase(), String(v)]));
  return Object.fromEntries(HEADERS.map((h) => [h, headers[h] ?? null]));
}

function scriptBytes(lhr) {
  const items = lhr.audits['resource-summary']?.details?.items ?? [];
  return items.find((i) => i.resourceType === 'script')?.transferSize ?? null;
}

const chrome = await launchChrome();
const csv = [];
const runs = [];
let description = '';
try {
  const browser = await chromeVersion(chrome.port);
  const flags = { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance'], throttlingMethod: args.throttling };
  const config = args.device === 'desktop' ? desktopConfig : undefined;

  // Прогони йдуть по одному: документація Lighthouse забороняє збирати кілька
  // звітів одночасно на одній машині.
  for (let i = 1; i <= RUNS; i++) {
    process.stdout.write(`прогін ${i}/${RUNS}… `);
    const result = await lighthouse(url, flags, config);
    const lhr = result?.lhr;
    if (!lhr) throw new Error('Lighthouse не повернув результату');
    if (lhr.runtimeError) throw new Error(`Lighthouse: ${lhr.runtimeError.code}, ${lhr.runtimeError.message}`);
    const t = lhr.configSettings.throttling;
    if (!description) {
      description = [
        `Lighthouse ${lhr.lighthouseVersion}`, 'navigation', lhr.configSettings.formFactor,
        `тротлінг ${lhr.configSettings.throttlingMethod}`,
        lhr.configSettings.throttlingMethod === 'devtools'
          ? `затримка запиту ${t.requestLatencyMs} мс · прийом ${Math.round(t.downloadThroughputKbps)} кбіт/с · ЦП ×${t.cpuSlowdownMultiplier}`
          : lhr.configSettings.throttlingMethod === 'simulate'
            ? `RTT ${t.rttMs} мс · ${Math.round(t.throughputKbps)} кбіт/с · ЦП ×${t.cpuSlowdownMultiplier}`
            : 'без обмежень з боку Lighthouse',
        browser, `benchmarkIndex ${Math.round(lhr.environment.benchmarkIndex)}`,
      ].join(' · ');
    }
    const run = { run: i };
    for (const m of METRICS) {
      const value = lhr.audits[m.audit]?.numericValue;
      run[m.key] = value === undefined ? null : m.key === 'CLS' ? Math.round(value * 1000) / 1000 : Math.round(value);
    }
    run.JS = scriptBytes(lhr);
    run.element = lcpElement(lhr);
    Object.assign(run, documentHeaders(result.artifacts));
    runs.push(run);
    const cache = run['x-vercel-cache'] ? ` · x-vercel-cache ${run['x-vercel-cache']}` : '';
    console.log(`LCP ${run.LCP} мс · TTFB ${run.TTFB} мс · TBT ${run.TBT} мс${cache}`);
  }
} catch (error) {
  console.error(`lighthouse: ${error.message}`);
  process.exitCode = 1;
} finally {
  chrome.kill();
}
if (process.exitCode) process.exit();

const variant = args.variant || new URL(url).host + new URL(url).pathname;
const fullConditions = conditions({ extra: `${description} · адреса ${url} · прогонів ${RUNS}` });
printHeader(args.component, `Lighthouse × ${RUNS}: ${variant}`, { extra: description });
printTable(runs.map((r) => ({ 'прогін': r.run, 'LCP, мс': r.LCP, 'FCP, мс': r.FCP, 'TTFB, мс': r.TTFB, 'TBT, мс': r.TBT, CLS: r.CLS, 'JS, Б': r.JS })));
if (runs.some((r) => r['x-vercel-id'])) {
  console.log('─'.repeat(64));
  printTable(runs.map((r) => ({ 'прогін': r.run, 'x-vercel-cache': r['x-vercel-cache'] ?? '—', 'x-vercel-id': r['x-vercel-id'] ?? '—' })));
}
console.log('─'.repeat(64));
// Підпис вузла може змінюватися між прогонами, тому групування за селектором.
for (const [selector, group] of Object.entries(Object.groupBy(runs, (r) => r.element.selector))) {
  console.log(`елемент LCP: ${selector}, у ${group.length} із ${runs.length} прогонів (підпис «${group[0].element.label}»)`);
}
for (const q of ['LCP', 'TTFB', 'TBT']) {
  const values = runs.map((r) => r[q]).filter((v) => v !== null);
  if (values.length) printSummary(q, values, 'мс');
}
const date = timestamp();
for (const r of runs) {
  for (const m of [...METRICS, { key: 'JS', unit: 'Б' }, ...HEADERS.map((h) => ({ key: h, unit: '—' }))]) {
    if (r[m.key] === null) continue;
    csv.push({ date, component: args.component, variant, quantity: m.key, unit: m.unit, run: r.run, value: r[m.key], conditions: fullConditions, versions: process.version });
  }
}
const csvFile = path.resolve(args.csv);
appendCsv(csvFile, csv);
const htmlFile = path.join(path.dirname(csvFile), 'scatter.html');
fs.writeFileSync(htmlFile, buildScatter(fs.readFileSync(csvFile, 'utf8'), { highlight: args.highlight }), 'utf8');
console.log(`діаграма: ${path.relative(process.cwd(), htmlFile)}`);
