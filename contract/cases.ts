import items from '../data/data.json';
import { rowCount, tableRows, statusNumbers, typeInto, choose, toggleRow, nextUpdate } from './screen.js';

// Підмножина інтерфейсу expect, якої досить випадкам. Завдяки їй файл не
// залежить від тестового засобу конкретної реалізації.
export interface Expect {
  (value: unknown): {
    toBe(expected: unknown): void;
    toBeGreaterThan(limit: number): void;
    toBeLessThan(limit: number): void;
  };
}

export interface ContractCase {
  name: string;
  run(expect: Expect): Promise<void>;
}

export const TOTAL = items.length;
const GROUP = 'Записи';

// Числа, яких немає на сторінці, стають NaN, і перевірка падає.
const summary = () => {
  const [count = NaN, mass = NaN, available = NaN] = statusNumbers('Підсумок');
  return { count, mass, available };
};

async function after(action: () => void): Promise<void> {
  action();
  await nextUpdate();
}

export const cases: ContractCase[] = [
  {
    name: 'початковий стан показує всі записи, підсумок збігається з таблицею',
    async run(expect) {
      expect(rowCount(GROUP)).toBe(TOTAL);
      expect(summary().count).toBe(TOTAL);
    },
  },
  {
    name: 'фільтр звужує вибірку без урахування регістру',
    async run(expect) {
      await after(() => typeInto('Фільтр', 'вузол'));
      const lower = rowCount(GROUP);
      expect(lower).toBeGreaterThan(0);
      expect(lower).toBeLessThan(TOTAL);
      expect(summary().count).toBe(lower);
      await after(() => typeInto('Фільтр', 'ВУЗОЛ'));
      expect(rowCount(GROUP)).toBe(lower);
    },
  },
  {
    name: 'відсутній збіг дає нуль, порожній фільтр повертає всі записи',
    async run(expect) {
      await after(() => typeInto('Фільтр', 'чого в каталозі немає'));
      expect(rowCount(GROUP)).toBe(0);
      expect(summary().mass).toBe(0);
      await after(() => typeInto('Фільтр', ''));
      expect(rowCount(GROUP)).toBe(TOTAL);
    },
  },
  {
    name: 'сортування за масою впорядковує рядки й не змінює підсумку',
    async run(expect) {
      const before = summary();
      await after(() => choose('Сортування', 'mass'));
      const masses = tableRows(GROUP).map((cells) => Number(cells[2]));
      expect(masses.every((m, i) => i === 0 || (masses[i - 1] ?? m) <= m)).toBe(true);
      expect(summary().mass).toBe(before.mass);
    },
  },
  {
    name: 'позначка в одному рядку змінює лише лічильник доступних на одиницю',
    async run(expect) {
      const before = summary();
      await after(() => toggleRow(GROUP, 0));
      const changed = summary();
      expect(Math.abs(changed.available - before.available)).toBe(1);
      expect(changed.count).toBe(before.count);
      await after(() => toggleRow(GROUP, 0));
      expect(summary().available).toBe(before.available);
    },
  },
];
