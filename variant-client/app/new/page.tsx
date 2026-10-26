'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { createItem, CATALOG_KEY } from '../../src/ui/api';

// Тіло запиту контролює клієнт, тому перевірка виконується на сервері,
// а тут лише показується відповідь.
export default function NewItemPage() {
  const [errors, setErrors] = useState<readonly string[]>([]);
  const router = useRouter();
  const queryClient = useQueryClient();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await createItem(Object.fromEntries(new FormData(event.currentTarget)));
    if (response.id === undefined) { setErrors(response.errors ?? ['(невідомо)']); return; }
    await queryClient.invalidateQueries({ queryKey: CATALOG_KEY });
    router.push(`/record/${response.id}`);
  }
  return (
    <main style={{ padding: 16 }}>
      <h1>Новий запис</h1>
      <form onSubmit={submit}>
        <p><label>Назва <input name="name" required /></label></p>
        <p><label>Категорія <input name="category" required /></label></p>
        <p><label>Маса, кг <input name="mass" type="number" step="0.01" required /></label></p>
        {errors.length > 0 && <p role="alert">Не відповідає контракту: {errors.join(', ')}</p>}
        <button type="submit">Створити</button>
      </form>
    </main>
  );
}
