import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';

// Без JSF_LR перевіряються лише заповнені розділи журналу. З JSF_LR=N
// (npm run ready -- N) додатково потрібні розділи 1…N журналу, ADR-001…ADR-00N
// з обов'язковими розділами, заповнені DOMAIN.md і CONTRACT.md.
const PLACEHOLDER = /<[A-Za-zА-ЩЬЮЯЄІЇҐа-щьюяєіїґ][^<>]*>/;
const journal = readFileSync('JOURNAL.md', 'utf8');
const lab = Number(process.env.JSF_LR ?? 0);

const REQUIRED_ADR_SECTIONS: Record<number, string[]> = {
  1: ['## Контекст', '## Альтернативи', '## Рішення', '## Наслідки'],
  2: ['## Контекст', '## Рішення', '## Наслідки', '## Мапа стану', '## Рішення щодо маршрутів', '## Перегляд попередніх рішень'],
  3: ['## Контекст', '## Рішення', '## Наслідки', '## Бюджет продуктивності', '## Протокол поломок', '## Дефекти доступності', '## Перегляд попередніх рішень'],
  4: ['## Контекст', '## Рішення', '## Наслідки', '## Аудит залежностей', '## Політика залежностей', '## Політика безпеки вмісту', '## Перегляд попередніх рішень'],
};
const REQUIRED_JOURNAL_SUBSECTIONS: Record<number, string[]> = {
  2: ['### Звіт складання'],
};
// У розділі 2 TTFB і LCP вимірюються на розгорнутих адресах, і для кожного такого
// прогону записуються заголовки документа, за якими видно, хто віддав відповідь.
const REQUIRED_HEADERS: Record<number, string[]> = {
  2: ['x-vercel-cache', 'x-vercel-id'],
};

interface Section { number: number; text: string; forecast: string; interpretation: string; runs: Record<string, string>[] }

function between(text: string, from: string, to: string): string {
  const a = text.indexOf(from);
  if (a < 0) return '';
  const b = to ? text.indexOf(to, a + from.length) : -1;
  return text.slice(a + from.length, b < 0 ? undefined : b).trim();
}

// Таблицею прогонів вважається перша таблиця з колонками variant і value, тому
// таблиці обсягів чи підсумків, поставлені вище або нижче, її не підміняють.
function table(text: string): Record<string, string>[] {
  const all = text.split('\n').map((l) => l.trim());
  const start = all.findIndex((l) => l.startsWith('|') && /\|\s*variant\s*\|/.test(l) && /\|\s*value\s*\|/.test(l));
  const end = start < 0 ? -1 : all.findIndex((l, i) => i > start && !l.startsWith('|'));
  const lines = start < 0 ? [] : all.slice(start, end < 0 ? undefined : end);
  const cells = (l: string) => l.slice(1, -1).split('|').map((c) => c.trim());
  const [head, ...rest] = lines;
  if (!head) return [];
  const columns = cells(head);
  return rest
    .filter((l) => !/^\|[\s|:-]+\|$/.test(l) && !PLACEHOLDER.test(l))
    .map((l) => Object.fromEntries(cells(l).map((c, i) => [columns[i] ?? String(i), c])));
}

const sections: Section[] = journal.split(/^## Розділ /m).slice(1).map((chunk) => ({
  number: Number.parseInt(chunk, 10),
  text: chunk,
  forecast: between(chunk, '### Прогноз', '### Вимірювання'),
  interpretation: between(chunk, '### Інтерпретація', '\n### '),
  runs: table(between(chunk, '### Вимірювання', '### Інтерпретація')),
}));
// Кутові дужки в документах шаблону позначають текст заготовки.
// Код у зворотних апострофах (тип Promise<T>, елемент <style>) заготовкою не є.
const prose = (text: string) => text.replace(/`[^`\n]*`/g, '');
function placeholder(text: string): string {
  const found = PLACEHOLDER.exec(prose(text));
  return found ? `заготовка «${found[0]}» (текст у кутових дужках поза зворотними апострофами вважається незаповненим)` : '';
}

const filled = sections.filter((s) => s.runs.length > 0);
const BYTES = new Set(['Б', 'КБ', 'МБ']);

describe('журнал вимірювань', () => {
  it('заповнені розділи мають прогноз та інтерпретацію без заготовок', () => {
    for (const s of filled) {
      expect(s.forecast.length > 0 && !PLACEHOLDER.test(prose(s.forecast)), `розділ ${s.number}: прогноз`).toBe(true);
      expect(s.interpretation.length > 0 && !PLACEHOLDER.test(prose(s.interpretation)), `розділ ${s.number}: інтерпретація`).toBe(true);
    }
  });

  it("не менше п'яти прогонів на кожну величину, крім детермінованого обсягу", () => {
    for (const s of filled) {
      const groups = new Map<string, number>();
      for (const run of s.runs) {
        const key = `${run['variant']} · ${run['quantity']} · ${run['unit']}`;
        groups.set(key, (groups.get(key) ?? 0) + 1);
      }
      for (const [key, n] of groups) {
        const minimum = BYTES.has(key.split(' · ')[2] ?? '') ? 1 : 5;
        expect(n >= minimum, `розділ ${s.number}: ${key}, прогонів ${n}`).toBe(true);
      }
    }
  });

  it('умови заповнені, якщо є хоч один прогін', () => {
    if (filled.length === 0) return;
    expect(placeholder(between(journal, '## Умови', '## Розділ')), 'умови').toBe('');
  });
});

describe.runIf(lab > 0)(`готовність до захисту ЛР${lab}`, () => {
  it(`розділи журналу 1…${lab} заповнені`, () => {
    for (let n = 1; n <= lab; n += 1) {
      expect(filled.some((s) => s.number === n), `розділ ${n}`).toBe(true);
      for (const heading of REQUIRED_JOURNAL_SUBSECTIONS[n] ?? []) {
        const section = sections.find((s) => s.number === n)?.text ?? '';
        expect(section.includes(heading), `розділ ${n}: ${heading}`).toBe(true);
      }
    }
  });

  it('прогони TTFB на розгорнутих адресах мають заголовки x-vercel-cache і x-vercel-id', () => {
    for (let n = 1; n <= lab; n += 1) {
      const runs = filled.find((s) => s.number === n)?.runs ?? [];
      for (const header of REQUIRED_HEADERS[n] ?? []) {
        for (const run of runs.filter((r) => r['quantity'] === 'TTFB')) {
          const found = runs.some((r) => r['variant'] === run['variant'] && r['run'] === run['run'] && r['quantity'] === header && (r['value'] ?? '') !== '');
          expect(found, `розділ ${n}: ${run['variant']}, прогін ${run['run']}, немає рядка ${header}`).toBe(true);
        }
      }
    }
  });

  it(`ADR-001…ADR-00${lab} заповнені й мають обов'язкові розділи`, () => {
    for (let n = 1; n <= lab; n += 1) {
      const file = `ADR-00${n}.md`;
      expect(existsSync(file), file).toBe(true);
      const text = readFileSync(file, 'utf8');
      expect(placeholder(text), file).toBe('');
      for (const heading of REQUIRED_ADR_SECTIONS[n] ?? []) {
        expect(text.includes(heading), `${file}: ${heading}`).toBe(true);
      }
    }
  });

  it('DOMAIN.md і CONTRACT.md заповнені', () => {
    for (const file of ['DOMAIN.md', 'CONTRACT.md']) {
      expect(placeholder(readFileSync(file, 'utf8')), file).toBe('');
    }
  });
});
