import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildScatter, parseCsv, series } from '../scatter.mjs';

const HEADER = 'date;component;variant;quantity;unit;run;value;conditions;versions';
function csv(seriesCount, runCount) {
  const lines = [HEADER];
  for (let s = 0; s < seriesCount; s++) {
    for (let r = 1; r <= runCount; r++) {
      for (const [q, u, v] of [['LCP', 'мс', 700 + r * 10 + s], ['TTFB', 'мс', 5 + r], ['TBT', 'мс', 400 + r], ['CLS', '—', 0], ['JS', 'Б', 142041]]) {
        lines.push(`2026-09-16 15:0${s};ЛР3;варіант ${s};${q};${u};${r};${v};умови серії ${s};v24.22.1`);
      }
    }
  }
  return lines.join('\n') + '\n';
}

test('CSV іншого формату відхиляється з назвою очікуваних колонок', () => {
  assert.throws(() => parseCsv('a;b;c\n1;2;3\n'), /date;component;variant/);
});

test('серія є однією командою з однаковими variant і date, прогони не агрегуються', () => {
  const s = series(parseCsv(csv(2, 10)));
  assert.equal(s.length, 2);
  assert.equal(s[0].runs.size, 10);
  assert.equal(s[0].runs.get(3).LCP, 730);
});

test('десять прогонів дають десять точок на кожній часовій смузі, медіану, мінімум і максимум', () => {
  const html = buildScatter(csv(1, 10));
  assert.equal((html.match(/<svg /g) ?? []).length, 3, 'LCP, TTFB, TBT, бо FCP у цьому CSV немає');
  assert.equal((html.match(/<circle /g) ?? []).length, 30);
  assert.equal((html.match(/class="median"/g) ?? []).length, 3);
  assert.equal((html.match(/class="edge"/g) ?? []).length, 6);
  assert.match(html, /медіана 755/);
  assert.doesNotMatch(html, /середн[єя] \d/);
});

test('умови й версії потрапляють у верхню частину сторінки', () => {
  assert.match(buildScatter(csv(1, 5)), /умови серії 0 · v24\.22\.1/);
});

test('два виділені прогони дають таблицю різниці поруч із розкидом серії', () => {
  const html = buildScatter(csv(1, 10), { highlight: '2,7' });
  assert.match(html, /Два прогони проти розподілу/);
  assert.match(html, /<td>LCP<\/td><td>720<\/td><td>770<\/td><td>50<\/td><td>710–800 \(90\)<\/td>/);
  assert.equal((html.match(/class="point marked"/g) ?? []).length, 6);
});

test('сторінка самодостатня, без зовнішніх сценаріїв і стилів', () => {
  assert.doesNotMatch(buildScatter(csv(1, 3)), /<script|<link|https?:\/\//);
});
