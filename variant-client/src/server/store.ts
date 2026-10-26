import 'server-only';
import { connection } from 'next/server';
import { cacheLife, cacheTag } from 'next/cache';
import baseItems from '../../../data/data.json';
import type { Item } from '../shared/data';
import { sign } from './secret';

// Шар доступу до даних. Джерело імітує віддалене API затримкою
// SOURCE_DELAY_MS (за замовчуванням 300 мс), CACHE_DISABLED=1 вимикає кеш на
// сервері для вимірювання «без кешу». Сховище живе в пам'яті одного процесу,
// на хостингу з кількома екземплярами функції позначки між ними не діляться.

export interface MarkedItem extends Item {
  readonly marked: boolean;
}

export interface CatalogData {
  readonly items: readonly MarkedItem[];
  readonly generatedAt: string;
  readonly cached: boolean;
}

const marked = new Set<number>();
const added: Item[] = [];

export function cacheDisabled(): boolean {
  return process.env['CACHE_DISABLED'] === '1';
}

function sourceDelay(): Promise<void> {
  const ms = Number(process.env['SOURCE_DELAY_MS'] ?? 300);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function allItems(): Item[] {
  return [...(baseItems as Item[]), ...added];
}

async function liveCatalog(cached: boolean): Promise<CatalogData> {
  await sourceDelay();
  return {
    items: allItems().map((item) => ({ ...item, marked: marked.has(item.id) })),
    generatedAt: new Date().toISOString(),
    cached,
  };
}

async function cachedCatalog(): Promise<CatalogData> {
  'use cache';
  cacheTag('records');
  cacheLife('minutes');
  return liveCatalog(true);
}

export async function readCatalog(): Promise<CatalogData> {
  // Рендеринг чекає справжнього запиту, бо змінна оточення і час беруться з нього.
  await connection();
  return cacheDisabled() ? liveCatalog(false) : cachedCatalog();
}

export async function readItem(id: number): Promise<(MarkedItem & { verificationCode: string }) | null> {
  await connection();
  await sourceDelay();
  const item = allItems().find((x) => x.id === id);
  return item ? { ...item, marked: marked.has(id), verificationCode: sign(id) } : null;
}

export async function toggleMark(id: number): Promise<boolean> {
  await sourceDelay();
  if (marked.has(id)) marked.delete(id); else marked.add(id);
  return marked.has(id);
}

export async function createItem(data: { name: string; category: string; mass: number }): Promise<number> {
  await sourceDelay();
  const id = Math.max(...allItems().map((item) => item.id)) + 1;
  added.push({ id, ...data, date: new Date().toISOString().slice(0, 10), available: true });
  return id;
}
