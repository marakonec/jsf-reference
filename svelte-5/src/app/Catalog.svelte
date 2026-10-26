<script lang="ts">
  import {
    SORT_KEYS, SORT_LABELS, filterItems, sortItems, summarize, type Item, type SortKey,
  } from '../../../shared/data.js';

  let { items }: { items: readonly Item[] } = $props();

  let filter = $state('');
  let sortKey = $state<SortKey>('name');
  // Позначки, які змінив користувач (id → доступний). Вихідні дані не змінюються.
  let marks = $state<Record<number, boolean>>({});

  let shown = $derived(sortItems(filterItems(items, filter), sortKey));
  let summary = $derived(summarize(shown, (item) => marks[item.id] ?? item.available));

  function toggle(item: Item) {
    // $state стежить за змінами всередині об'єкта, тому досить присвоєння властивості.
    marks[item.id] = !(marks[item.id] ?? item.available);
  }
</script>

<main>
  <h1>Каталог · Svelte 5</h1>
  <label>
    Фільтр
    <input aria-label="Фільтр" bind:value={filter} />
  </label>
  <label>
    Сортування
    <select aria-label="Сортування" bind:value={sortKey}>
      {#each SORT_KEYS as key (key)}<option value={key}>{SORT_LABELS[key]}</option>{/each}
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
      {#each shown as item (item.id)}
        <tr>
          <td>{item.name}</td><td>{item.category}</td><td>{item.mass}</td><td>{item.date}</td>
          <td>
            <input
              type="checkbox"
              aria-label={`Доступний: ${item.name}`}
              checked={marks[item.id] ?? item.available}
              onchange={() => toggle(item)}
            />
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</main>
