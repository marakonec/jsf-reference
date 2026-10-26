import Link from 'next/link';
import { filterItems, summarize } from '../shared/data';
import type { MarkedItem } from '../server/store';

// Файл без директиви стає клієнтським, бо його імпортує клієнтський Catalog.
export function CatalogTable({
  items,
  filter,
  onFilterChange,
}: {
  items: readonly MarkedItem[];
  filter: string;
  onFilterChange: (value: string) => void;
}) {
  // Іменоване вимірювання видно в панелі Performance на доріжці Timings під
  // своєю назвою, хоч функції в режимі випуску перейменовано.
  const start = performance.now();
  const shown = filterItems(items, filter);
  const summary = summarize(shown);
  if (typeof window !== 'undefined') performance.measure('фільтр каталогу', { start });
  return (
    <>
      <label>
        Фільтр <input aria-label="Фільтр" value={filter} onChange={(e) => onFilterChange(e.target.value)} />
      </label>
      <p role="status" aria-label="Підсумок">Записів: {summary.count} · маса: {summary.mass} кг</p>
      <table>
        <thead>
          <tr><th>Назва</th><th>Категорія</th><th>Маса</th><th>Позначка</th></tr>
        </thead>
        <tbody aria-label="Записи">
          {shown.map((item) => (
            <tr key={item.id}>
              <td><Link href={`/record/${item.id}`} prefetch={false}>{item.name}</Link></td>
              <td>{item.category}</td><td>{item.mass}</td><td>{item.marked ? 'так' : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
