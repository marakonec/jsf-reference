import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

// Заготовки в шаблонах позначено як <...>. Тест навмисно червоний у щойно
// створеному репозиторії, поки в ATTRIBUTION.md немає власного рядка.
const DOCUMENTS = [
  'DOMAIN.md', 'CONTRACT.md', 'JOURNAL.md', 'ATTRIBUTION.md',
  'ADR-000.md', 'ADR-001.md', 'ADR-002.md', 'ADR-003.md', 'ADR-004.md',
];

describe('комплектність документів', () => {
  it.each(DOCUMENTS)('%s існує', (file) => {
    expect(existsSync(file)).toBe(true);
  });

  it('ADR-000 є заповненим зразком без заготовок', () => {
    const text = readFileSync('ADR-000.md', 'utf8');
    expect(text).toContain('## Рішення');
    expect(text).not.toMatch(/<[^>]*>/);
  });

  // Рядок, перша колонка якого починається словом «приклад», не зараховується.
  it('ATTRIBUTION.md має власний рядок студента', () => {
    const own = readFileSync('ATTRIBUTION.md', 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('|') && !line.includes('---') && !line.includes('<'))
      .filter((line) => !/^\|\s*приклад/i.test(line) && !line.includes('Звідки'));
    expect(own.length).toBeGreaterThanOrEqual(1);
  });

  it('JOURNAL.md має розділ умов і тріаду прогноз, вимірювання, інтерпретація', () => {
    const text = readFileSync('JOURNAL.md', 'utf8');
    expect(text).toContain('## Умови');
    for (const block of ['### Прогноз', '### Вимірювання', '### Інтерпретація']) {
      expect(text).toContain(block);
    }
  });
});
