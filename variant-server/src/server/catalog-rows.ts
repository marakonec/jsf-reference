import type { MarkedItem } from './store';

// Пропси клієнтського компонента серіалізуються в потік сторінки, тому через
// межу сервер → клієнт передаються лише ці поля.
export function rowsForClient(items: readonly MarkedItem[]): MarkedItem[] {
  return items.map((item) => ({
    id: item.id, name: item.name, category: item.category, mass: item.mass,
    date: item.date, available: item.available, marked: item.marked,
  }));
}
