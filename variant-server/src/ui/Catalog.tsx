'use client';
import { useState } from 'react';
import type { MarkedItem } from '../server/store';
import { CatalogTable } from './CatalogTable';

// Записи приходять пропсом від серверного компонента і перетинають
// серіалізаційну межу. Бібліотек запитів і схем у клієнтському коді немає.
export function Catalog({ items }: { items: readonly MarkedItem[] }) {
  const [filter, setFilter] = useState('');
  return <CatalogTable items={items} filter={filter} onFilterChange={setFilter} />;
}
