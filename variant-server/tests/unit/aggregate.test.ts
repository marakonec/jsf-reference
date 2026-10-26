// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { summarize } from '../../src/shared/aggregate';
import type { Item } from '../../src/shared/data';

const item = (mass: number): Item => ({ id: 1, name: 'x', category: 'вузол', mass, date: '2026-01-01', available: true });

describe('summarize', () => {
  test('порожній перелік дає нуль записів, нульову масу і нуль доступних', () => {
    expect(summarize([])).toEqual({ count: 0, mass: 0, available: 0 });
  });

  test('маса округлюється до сотих, 0.1 + 0.2 дає 0.3', () => {
    expect(summarize([item(0.1), item(0.2)])).toEqual({ count: 2, mass: 0.3, available: 2 });
  });

  test('кількість дорівнює довжині переліку', () => {
    expect(summarize([item(1), item(2), item(3)]).count).toBe(3);
  });
});
