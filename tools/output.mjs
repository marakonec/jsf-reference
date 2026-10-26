import fs from 'node:fs';
import path from 'node:path';
import { conditions, timestamp } from './conditions.mjs';

const WIDTH = 64;

export function printHeader(label, quantity, options = {}) {
  console.log('');
  console.log(`── ${label} · ${quantity} ` + '─'.repeat(Math.max(0, WIDTH - label.length - quantity.length - 6)));
  console.log(`умови: ${conditions(options)}`);
  console.log(`дата: ${timestamp()}`);
  console.log('─'.repeat(WIDTH));
}

export function printTable(rows) {
  if (rows.length === 0) return;
  const columns = Object.keys(rows[0]);
  const widths = columns.map((c) => Math.max(c.length, ...rows.map((r) => String(r[c]).length)));
  const line = (values) => values.map((v, i) => String(v).padEnd(widths[i])).join('  ');
  console.log(line(columns));
  for (const r of rows) console.log(line(columns.map((c) => r[c])));
}

// Середнє не рахується, бо ховає розкид і викиди.
export function stats(values) {
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  return { median: mid, min: s[0], max: s[s.length - 1], spread: s[s.length - 1] - s[0], n: s.length };
}

export function printSummary(name, values, unit) {
  const s = stats(values);
  console.log('─'.repeat(WIDTH));
  console.log(`${name}: медіана ${s.median} ${unit} · мін ${s.min} · макс ${s.max} · розкид ${s.spread} (n=${s.n})`);
}

export const CSV_COLUMNS = ['date', 'component', 'variant', 'quantity', 'unit', 'run', 'value', 'conditions', 'versions'];

export function appendCsv(file, rows) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const header = fs.existsSync(file) ? '' : CSV_COLUMNS.join(';') + '\n';
  const body = rows.map((r) => CSV_COLUMNS.map((c) => String(r[c] ?? '')).join(';')).join('\n') + '\n';
  fs.appendFileSync(file, header + body, 'utf8');
  console.log(`запис: ${path.relative(process.cwd(), file)} (+${rows.length} рядків)`);
}
