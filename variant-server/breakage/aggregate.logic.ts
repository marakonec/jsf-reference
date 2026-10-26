import type { Item, Summary } from './data';

// Поломка логіки замість src/shared/aggregate.ts. Без округлення сума мас
// має двійковий «хвіст», наприклад 0.30000000000000004.
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
  return { count: items.length, mass, available };
}
