import { rowCount, summary, typeFilter, nextUpdate } from './screen';

async function filterBy(text: string): Promise<void> {
  typeFilter(text);
  await nextUpdate();
}

export const TOTAL = 1000;

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

export const cases: ContractCase[] = [
  {
    name: 'початковий стан показує всі записи',
    async run(expect: Expect) {
      expect(rowCount()).toBe(TOTAL);
      expect(summary().count).toBe(TOTAL);
    },
  },
  {
    name: 'фільтр звужує вибірку, підсумок збігається з таблицею',
    async run(expect: Expect) {
      await filterBy('вузол');
      const n = rowCount();
      expect(n).toBeGreaterThan(0);
      expect(n).toBeLessThan(TOTAL);
      expect(summary().count).toBe(n);
    },
  },
  {
    name: 'регістр не має значення',
    async run(expect: Expect) {
      await filterBy('вузол');
      const lower = rowCount();
      await filterBy('ВУЗОЛ');
      expect(rowCount()).toBe(lower);
    },
  },
  {
    name: 'порожній фільтр повертає всі записи',
    async run(expect: Expect) {
      await filterBy('вузол');
      await filterBy('');
      expect(rowCount()).toBe(TOTAL);
    },
  },
  {
    name: 'рядок, якого немає, дає нуль рядків і нульовий підсумок',
    async run(expect: Expect) {
      await filterBy('щось, чого в каталозі немає');
      expect(rowCount()).toBe(0);
      expect(summary().count).toBe(0);
      expect(summary().mass).toBe(0);
    },
  },
];
