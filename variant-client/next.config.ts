import path from 'node:path';
import type { NextConfig } from 'next';

const config: NextConfig = {
  // Нічого не кешується неявно, кеш лише там, де стоїть 'use cache' (src/server/store.ts).
  cacheComponents: true,
  // Без явного значення Next.js 16.4 з cacheComponents друкує попередження
  // (docs/01-app/01-getting-started/08-caching.md у пакеті next 16.4.1).
  partialPrefetching: true,
  // Корінь робочих просторів, бо файл блокування лежить там.
  turbopack: { root: path.join(import.meta.dirname, '..') },
};

export default config;
