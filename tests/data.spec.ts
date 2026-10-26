import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import process from 'node:process';

const text = readFileSync('data/data.json', 'utf8');
const items = JSON.parse(text) as Record<string, unknown>[];
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}/.test(v);

describe('набір даних', () => {
  it('основна колекція від 800 до 2000 записів', () => {
    expect(items.length).toBeGreaterThanOrEqual(800);
    expect(items.length).toBeLessThanOrEqual(2000);
  });

  it("запис має атрибути п'яти типів: число, дата, категорія, текст, булеве", () => {
    const values = Object.values(items[0] ?? {});
    const strings = values.filter((v) => typeof v === 'string') as string[];
    expect(values.some((v) => typeof v === 'number')).toBe(true);
    expect(values.some((v) => typeof v === 'boolean')).toBe(true);
    expect(strings.some(isDate)).toBe(true);
    expect(strings.filter((v) => !isDate(v)).length).toBeGreaterThanOrEqual(2);
  });

  it('файли даних разом не більші за 5 МБ', () => {
    expect(statSync('data/data.json').size).toBeLessThanOrEqual(5 * 1024 * 1024);
  });

  it('генератор відтворює файл побайтово', () => {
    const regenerated = execFileSync(process.execPath, ['generator/index.mjs', '--stdout'], { encoding: 'utf8' });
    expect(regenerated === text).toBe(true);
  });
});
