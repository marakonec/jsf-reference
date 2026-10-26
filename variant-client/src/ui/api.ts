import type { z } from 'zod';
import { ItemSchema, CatalogSchema, mismatches } from '../shared/data-contract';

// Перевірка даних виконується в браузері, тому бібліотека схем потрапляє в
// клієнтський код. Це частина ціни варіанта «запит на клієнті».
async function fetchChecked<T extends z.ZodType>(url: string, schema: T): Promise<z.infer<T>> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  const body: unknown = await response.json();
  const bad = mismatches(schema, body);
  if (bad.length) throw new Error(`дані не відповідають контракту, поля: ${bad.join(', ')}`);
  return body as z.infer<T>;
}

export const CATALOG_KEY = ['records'] as const;
export const fetchCatalog = () => fetchChecked('/api/records', CatalogSchema);
export const fetchItem = (id: number) => fetchChecked(`/api/records/${id}`, ItemSchema);

export async function toggleMark(id: number): Promise<void> {
  const response = await fetch(`/api/records/${id}/mark`, { method: 'POST' });
  if (!response.ok) throw new Error(`позначка: ${response.status}`);
}

export async function createItem(fields: Record<string, FormDataEntryValue>): Promise<{ id?: number; errors?: string[] }> {
  const response = await fetch('/api/records', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(fields),
  });
  return (await response.json()) as { id?: number; errors?: string[] };
}
