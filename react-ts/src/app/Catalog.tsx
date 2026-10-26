import { useMemo, useState } from 'react';
import {
  SORT_KEYS, SORT_LABELS, filterItems, sortItems, summarize, type Item, type SortKey,
} from '../../../shared/data.js';

export function Catalog({ items }: { items: readonly Item[] }) {
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  // Позначки, які змінив користувач (id → доступний). Вихідні дані не змінюються.
  const [marks, setMarks] = useState<Readonly<Record<number, boolean>>>({});

  const shown = useMemo(
    () => sortItems(filterItems(items, filter), sortKey),
    [items, filter, sortKey],
  );
  const summary = useMemo(
    () => summarize(shown, (item) => marks[item.id] ?? item.available),
    [shown, marks],
  );

  function toggle(item: Item) {
    // Новий об'єкт, бо React порівнює стан за посиланням.
    setMarks((previous) => ({ ...previous, [item.id]: !(previous[item.id] ?? item.available) }));
  }

  return (
    <main>
      <h1>Каталог · React + TypeScript</h1>
      <label>
        Фільтр{' '}
        <input aria-label="Фільтр" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </label>{' '}
      <label>
        Сортування{' '}
        <select
          aria-label="Сортування"
          value={sortKey}
          // Значенням може бути лише один із SORT_KEYS, бо лише вони виведені як option.
          onChange={(e) => setSortKey(e.target.value as SortKey)}
        >
          {SORT_KEYS.map((key) => <option key={key} value={key}>{SORT_LABELS[key]}</option>)}
        </select>
      </label>
      <p role="status" aria-label="Підсумок">
        Записів: {summary.count} · маса: {summary.mass} кг · доступних: {summary.available}
      </p>
      <table>
        <thead>
          <tr><th>Назва</th><th>Категорія</th><th>Маса</th><th>Дата</th><th>Доступний</th></tr>
        </thead>
        <tbody aria-label="Записи">
          {shown.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td><td>{item.category}</td><td>{item.mass}</td><td>{item.date}</td>
              <td>
                <input
                  type="checkbox"
                  aria-label={`Доступний: ${item.name}`}
                  checked={marks[item.id] ?? item.available}
                  onChange={() => toggle(item)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
