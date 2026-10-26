export interface Item {
  readonly id: number;
  readonly name: string;
  readonly category: string;
  readonly mass: number;
  readonly date: string;
  readonly available: boolean;
}

export type SortKey = 'name' | 'mass' | 'date';

export const SORT_KEYS: readonly SortKey[] = ['name', 'mass', 'date'];

export const SORT_LABELS: Readonly<Record<SortKey, string>> = { name: 'назва', mass: 'маса', date: 'дата' };

export interface Summary {
  readonly count: number;
  readonly mass: number;
  readonly available: number;
}

export function filterItems<T extends Item>(items: readonly T[], query: string): readonly T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) => item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q),
  );
}

export function sortItems<T extends Item>(items: readonly T[], key: SortKey): readonly T[] {
  const copy = [...items];
  if (key === 'mass') return copy.sort((a, b) => a.mass - b.mass);
  return copy.sort((a, b) => a[key].localeCompare(b[key], 'uk'));
}

// Агрегат рахується від показаних записів. `isAvailable` враховує позначки,
// які змінив користувач.
export function summarize<T extends Item>(
  items: readonly T[],
  isAvailable: (item: T) => boolean = (item) => item.available,
): Summary {
  let mass = 0;
  let available = 0;
  for (const item of items) {
    mass += item.mass;
    if (isAvailable(item)) available += 1;
  }
  return { count: items.length, mass: Math.round(mass * 100) / 100, available };
}
