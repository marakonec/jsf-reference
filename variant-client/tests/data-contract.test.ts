// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { IdSchema, NewItemSchema, mismatches } from '../src/shared/data-contract';

describe('межа даних: вхід від користувача', () => {
  test('коректні поля проходять, маса з рядка форми стає числом', () => {
    expect(NewItemSchema.parse({ name: 'Фланець', category: 'корпус', mass: '12.5' }).mass).toBe(12.5);
  });

  test('розбіжності називають кожне погане поле', () => {
    expect(mismatches(NewItemSchema, { name: 'x', category: '', mass: '-1' }).sort())
      .toEqual(['category', 'mass', 'name']);
  });

  test('ідентифікатор з адреси може бути лише додатним цілим', () => {
    expect(IdSchema.safeParse('5').success).toBe(true);
    expect(IdSchema.safeParse('-1').success).toBe(false);
    expect(IdSchema.safeParse('п’ять').success).toBe(false);
  });
});
