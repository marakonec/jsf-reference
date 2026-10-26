// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { filterItems, type Item } from '../../src/shared/data';

const items: Item[] = [
  { id: 1, name: 'Фланець кутовий 12', category: 'корпус', mass: 1, date: '2026-01-01', available: true },
  { id: 2, name: 'шків модульний 7', category: 'вузол', mass: 2, date: '2026-01-02', available: false },
];

describe('filterItems', () => {
  test('порожній або пробільний запит повертає всі записи', () => {
    expect(filterItems(items, '')).toHaveLength(2);
    expect(filterItems(items, '   ')).toHaveLength(2);
  });

  test('регістр кирилиці не має значення', () => {
    expect(filterItems(items, 'ФЛАНЕЦЬ').map((item) => item.id)).toEqual([1]);
  });

  test('збіг шукається і за категорією', () => {
    expect(filterItems(items, 'вузол').map((item) => item.id)).toEqual([2]);
  });

  test('пробіли по краях запиту ігноруються', () => {
    expect(filterItems(items, '  шків ').map((item) => item.id)).toEqual([2]);
  });
});
