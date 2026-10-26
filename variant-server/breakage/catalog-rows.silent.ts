import type { MarkedItem } from './store';

// Тиха поломка замість src/server/catalog-rows.ts. Зменшені пропси втратили
// позначку, тому в каталозі всі записи без позначки.
export function rowsForClient(items: readonly MarkedItem[]): MarkedItem[] {
  return items.map((item) => ({
    id: item.id, name: item.name, category: item.category, mass: item.mass,
    date: item.date, available: item.available, marked: false,
  }));
}
