'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCatalog, CATALOG_KEY } from './api';
import { CatalogTable } from './CatalogTable';
import { SourceStamp } from './SourceStamp';

// Сторінка приходить оболонкою, дані окремим запитом після гідратації.
export function Catalog() {
  const [filter, setFilter] = useState('');
  const { data, error, isPending } = useQuery({ queryKey: CATALOG_KEY, queryFn: fetchCatalog });
  if (error) return <p role="alert">Помилка: {error.message}</p>;
  if (isPending) return <p>завантаження каталогу…</p>;
  return (
    <>
      <SourceStamp generatedAt={data.generatedAt} cached={data.cached} />
      <CatalogTable items={data.items} filter={filter} onFilterChange={setFilter} />
    </>
  );
}
