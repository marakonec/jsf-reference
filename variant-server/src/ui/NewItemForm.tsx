'use client';
import { useActionState } from 'react';
import { createItemAction, type FormState } from '../../app/actions';

// У клієнтський код потрапляє не код серверної дії, а посилання на неї.
export function NewItemForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createItemAction, { errors: [] });
  return (
    <form action={action}>
      <p><label>Назва <input name="name" required /></label></p>
      <p><label>Категорія <input name="category" required /></label></p>
      <p><label>Маса, кг <input name="mass" type="number" step="0.01" required /></label></p>
      {state.errors.length > 0 && <p role="alert">Не відповідає контракту: {state.errors.join(', ')}</p>}
      <button type="submit" disabled={pending}>Створити</button>
    </form>
  );
}
