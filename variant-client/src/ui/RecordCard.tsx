'use client';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchItem, toggleMark, CATALOG_KEY } from './api';

// Код перевірки підписує на сервері обробник маршруту, ключа постачальника в
// клієнтському коді цього варіанта немає.
export function RecordCard() {
  const id = Number(useParams<{ id: string }>().id);
  const queryClient = useQueryClient();
  const { data: item, error, isPending } = useQuery({ queryKey: ['record', id], queryFn: () => fetchItem(id) });
  const mutation = useMutation({
    mutationFn: () => toggleMark(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['record', id] });
      await queryClient.invalidateQueries({ queryKey: CATALOG_KEY });
    },
  });
  if (error) return <main style={{ padding: 16 }}><p role="alert">Помилка: {error.message}</p></main>;
  if (isPending) return <main style={{ padding: 16 }}><p>завантаження запису…</p></main>;
  return (
    <main style={{ padding: 16 }}>
      <h1>{item.name}</h1>
      <dl>
        <dt>Категорія</dt><dd>{item.category}</dd>
        <dt>Маса</dt><dd>{item.mass} кг</dd>
        <dt>Дата</dt><dd>{item.date}</dd>
        <dt>Позначений</dt><dd>{item.marked ? 'так' : 'ні'}</dd>
        <dt>Код перевірки</dt><dd><output>{item.verificationCode}</output></dd>
      </dl>
      <button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}>Перемкнути позначку</button>
    </main>
  );
}
