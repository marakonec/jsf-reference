import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';
import { stats, CSV_COLUMNS } from './output.mjs';

// Діаграма будується власним кодом без графічних бібліотек, щоб сторінка не
// залежала від зовнішнього пакета.
const TIMED = ['LCP', 'FCP', 'TTFB', 'TBT'];

export function parseCsv(text) {
  const [head, ...lines] = text.split(/\r?\n/).filter((l) => l.trim());
  const columns = (head ?? '').split(';');
  if (CSV_COLUMNS.some((c, i) => columns[i] !== c)) throw new Error(`не той формат CSV, очікувано ${CSV_COLUMNS.join(';')}`);
  return lines.map((l) => {
    const parts = l.split(';');
    // Значення заголовків відповіді (x-vercel-cache, x-vercel-id) лишаються рядками.
    const number = (text) => (text !== '' && Number.isFinite(Number(text)) ? Number(text) : text ?? '');
    return Object.fromEntries(CSV_COLUMNS.map((c, i) => [c, c === 'run' ? Number(parts[i]) : c === 'value' ? number(parts[i]) : parts[i] ?? '']));
  });
}

// Серія є однією командою прогонника, тобто рядками з однаковими variant і date.
export function series(rows) {
  const map = new Map();
  for (const r of rows) {
    const key = `${r.variant} · ${r.date}`;
    if (!map.has(key)) map.set(key, { name: r.variant, date: r.date, conditions: r.conditions, versions: r.versions, runs: new Map() });
    const s = map.get(key);
    if (!s.runs.has(r.run)) s.runs.set(r.run, {});
    s.runs.get(r.run)[r.quantity] = r.value;
  }
  return [...map.values()];
}

const escape = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function niceStep(raw) {
  const order = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 5, 10].map((m) => m * order).find((s) => s >= raw);
}

function strip(quantity, list, highlighted) {
  const WIDTH = 960, LEFT = 250, RIGHT = 40, ROW = 64, TOP = 30;
  const all = list.flatMap((s) => [...s.runs.values()].map((r) => r[quantity]).filter(Number.isFinite));
  if (!all.length) return '';
  // Вісь від нуля, щоб розкид було видно відносно самої величини.
  const step = niceStep((Math.max(...all) || 1) / 5);
  const ticks = Math.ceil((Math.max(...all) || 1) / step);
  const max = step * ticks;
  const x = (v) => LEFT + (v / max) * (WIDTH - LEFT - RIGHT);
  const height = TOP + list.length * ROW + 30;
  let svg = `<svg viewBox="0 0 ${WIDTH} ${height}" role="img" aria-label="Розкид ${quantity}">`;
  for (let i = 0; i <= ticks; i++) {
    const v = Math.round(step * i * 1000) / 1000;
    svg += `<line x1="${x(v)}" x2="${x(v)}" y1="${TOP - 8}" y2="${height - 26}" class="grid"/><text x="${x(v)}" y="${height - 8}" class="axis" text-anchor="middle">${v}</text>`;
  }
  list.forEach((s, row) => {
    const y = TOP + row * ROW + ROW / 2;
    const runs = [...s.runs.entries()].filter(([, r]) => Number.isFinite(r[quantity]));
    if (!runs.length) return;
    const st = stats(runs.map(([, r]) => r[quantity]));
    svg += `<text x="10" y="${y - 6}" class="label">${escape(s.name)}</text><text x="10" y="${y + 14}" class="small">${escape(s.date)} · n=${st.n}</text>`;
    svg += `<line x1="${x(st.min)}" x2="${x(st.max)}" y1="${y}" y2="${y}" class="range"/>`;
    svg += `<line x1="${x(st.min)}" x2="${x(st.min)}" y1="${y - 10}" y2="${y + 10}" class="edge"/><line x1="${x(st.max)}" x2="${x(st.max)}" y1="${y - 10}" y2="${y + 10}" class="edge"/>`;
    for (const [number, r] of runs) {
      const marked = highlighted.includes(number);
      const offset = ((number % 3) - 1) * 7;
      svg += `<circle cx="${x(r[quantity])}" cy="${y + offset}" r="${marked ? 8 : 6}" class="${marked ? 'point marked' : 'point'}"><title>прогін ${number}: ${r[quantity]}</title></circle>`;
      if (marked) svg += `<text x="${x(r[quantity])}" y="${y + offset - 12}" class="number" text-anchor="middle">${number}</text>`;
    }
    svg += `<line x1="${x(st.median)}" x2="${x(st.median)}" y1="${y - 18}" y2="${y + 18}" class="median"/><text x="${x(st.median)}" y="${y + 32}" class="small" text-anchor="middle">медіана ${st.median}</text>`;
  });
  return svg + '</svg>';
}

function highlightedComparison(list, highlighted) {
  if (highlighted.length !== 2) return '';
  const [a, b] = highlighted;
  const rows = [];
  for (const s of list) {
    const ra = s.runs.get(a), rb = s.runs.get(b);
    if (!ra || !rb) continue;
    for (const q of ['LCP', 'TTFB']) {
      if (!Number.isFinite(ra[q]) || !Number.isFinite(rb[q])) continue;
      const st = stats([...s.runs.values()].map((r) => r[q]).filter(Number.isFinite));
      rows.push(`<tr><td>${escape(s.name)}</td><td>${q}</td><td>${ra[q]}</td><td>${rb[q]}</td><td>${rb[q] - ra[q]}</td><td>${st.min}–${st.max} (${st.spread})</td></tr>`);
    }
  }
  if (!rows.length) return '';
  return `<h2>Два прогони проти розподілу</h2><table><thead><tr><th>серія</th><th>величина</th><th>прогін ${a}</th><th>прогін ${b}</th><th>різниця</th><th>мін–макс серії (розкид)</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
}

export function buildScatter(csvText, { highlight = '' } = {}) {
  const highlighted = String(highlight).split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0);
  const list = series(parseCsv(csvText));
  const conditionLines = [...new Set(list.map((s) => `${s.name} · ${s.date}: ${s.conditions} · ${s.versions}`))];
  const quantities = new Set(list.flatMap((s) => [...s.runs.values()].flatMap((r) => Object.keys(r))));
  const strips = TIMED.filter((q) => quantities.has(q)).map((q) => `<h2>${q}, мс</h2>${strip(q, list, highlighted)}`).join('');
  const others = [...quantities].filter((q) => !TIMED.includes(q));
  const tables = list.map((s) => {
    const columns = [...TIMED, ...others].filter((q) => [...s.runs.values()].some((r) => q in r));
    const body = [...s.runs.entries()].sort(([a], [b]) => a - b)
      .map(([number, r]) => `<tr${highlighted.includes(number) ? ' class="marked"' : ''}><td>${number}</td>${columns.map((q) => `<td>${escape(r[q] ?? '')}</td>`).join('')}</tr>`).join('');
    return `<h3>${escape(s.name)} · ${escape(s.date)}</h3><table><thead><tr><th>прогін</th>${columns.map((q) => `<th>${q}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>`;
  }).join('');
  return `<!doctype html>
<html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Розкид прогонів</title>
<style>
:root{--bg:#fff;--text:#101828;--muted:#667085;--line:#d0d5dd;--point:#1d4ed8;--marked:#c2410c;--median:#101828}
@media (prefers-color-scheme: dark){:root{--bg:#0c111d;--text:#f5f5f6;--muted:#98a2b3;--line:#344054;--point:#60a5fa;--marked:#fb923c;--median:#f5f5f6}}
body{margin:0 auto;max-width:1000px;padding:16px;background:var(--bg);color:var(--text);font:18px/1.45 system-ui,sans-serif}
h1{font-size:28px;margin:8px 0}h2{font-size:22px;margin:28px 0 4px}h3{font-size:18px;margin:18px 0 4px}
.conditions{color:var(--muted);font-size:14px;margin:0;padding-left:18px}
svg{width:100%;height:auto;display:block}
.grid{stroke:var(--line);stroke-width:1}.axis,.small{fill:var(--muted);font-size:13px}.label{fill:var(--text);font-size:16px;font-weight:600}
.range{stroke:var(--muted);stroke-width:2}.edge{stroke:var(--muted);stroke-width:2}
.point{fill:var(--point);fill-opacity:.75}.marked{fill:var(--marked);fill-opacity:1}.number{fill:var(--marked);font-size:14px;font-weight:700}
.median{stroke:var(--median);stroke-width:4}
table{border-collapse:collapse;font-size:15px;margin:6px 0 12px}td,th{border:1px solid var(--line);padding:3px 10px;text-align:right}th{background:color-mix(in srgb,var(--line) 35%,transparent)}
tr.marked td{color:var(--marked);font-weight:700}
.note{font-size:15px;color:var(--muted)}
</style></head><body>
<h1>Розкид прогонів</h1>
<p class="note">Кожна точка відповідає окремому прогону. Риска показує медіану, «вуса» мінімум і максимум. Середнє не показується. На іншій машині числа будуть іншими, порівнюється форма розкиду.</p>
<ul class="conditions">${conditionLines.map((c) => `<li>${escape(c)}</li>`).join('')}</ul>
${highlightedComparison(list, highlighted)}
${strips}
<h2>Усі значення</h2>${tables}
</body></html>
`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const { values: args, positionals: [file] } = parseArgs({ allowPositionals: true, options: { highlight: { type: 'string', default: '' }, out: { type: 'string', default: '' } } });
  if (!file) {
    console.error('потрібен файл CSV, наприклад npm run html -- ../../measurements/lighthouse.csv --highlight 2,7');
    process.exit(2);
  }
  const out = args.out || path.join(path.dirname(file), 'scatter.html');
  fs.writeFileSync(out, buildScatter(fs.readFileSync(file, 'utf8'), { highlight: args.highlight }), 'utf8');
  console.log(`діаграма: ${out}`);
}
