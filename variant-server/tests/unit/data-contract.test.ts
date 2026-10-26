// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { IdSchema, NewItemSchema, mismatches } from '../../src/shared/data-contract';

const valid = { name: 'Фланець', category: 'корпус', mass: '12.5', date: '2026-09-17', available: true, note: '' };

describe('NewItemSchema, контракт форми на межі даних', () => {
  test('коректні дані проходять, маса з рядка форми стає числом', () => {
    expect(NewItemSchema.parse(valid).mass).toBe(12.5);
  });

  test('розбіжності називають кожне погане поле', () => {
    expect(mismatches(NewItemSchema, { ...valid, name: 'x', category: 'інше', mass: '-1' }).sort())
      .toEqual(['category', 'mass', 'name']);
  });

  test('ідентифікатор з адреси може бути лише додатним цілим', () => {
    expect(IdSchema.safeParse('5').success).toBe(true);
    expect(IdSchema.safeParse('-1').success).toBe(false);
  });
});
