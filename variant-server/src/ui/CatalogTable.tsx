// Рядки посилаються на картку елементом a, бо з Link видалення тисячі рядків триває помітно довше.
import { filterItems } from '../shared/data';
import { summarize } from '../shared/aggregate';
import type { MarkedItem } from '../server/store';
import { recordHref } from './record-href';
import { SummaryStatus } from './SummaryStatus';

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
      <SummaryStatus summary={summary} />
      <table>
        <thead>
          <tr><th>Назва</th><th>Категорія</th><th>Маса</th><th>Позначка</th></tr>
        </thead>
        <tbody aria-label="Записи">
          {shown.map((item) => (
            <tr key={item.id}>
              <td><a href={recordHref(item.id)}>{item.name}</a></td>
              <td>{item.category}</td><td>{item.mass}</td><td>{item.marked ? 'так' : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
