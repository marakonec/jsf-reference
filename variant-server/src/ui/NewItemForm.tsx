'use client';
import { useActionState, useId, useRef } from 'react';
import { createItemAction, type FormState } from '../../app/actions';
import { CATEGORIES } from '../shared/data';
import { ConfirmDialog } from './ConfirmDialog';
import { FormField } from './FormField';

const MESSAGES: Record<string, string> = {
  name: 'Назва має містити від 3 до 80 знаків.',
  category: 'Категорію потрібно обрати з переліку.',
  mass: 'Маса має бути додатним числом не більше за 10000 кг.',
  date: 'Потрібна дата надходження.',
  note: 'Примітка має бути не довшою за 200 знаків.',
};

export function NewItemForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createItemAction, { errors: [] });
  const form = useRef<HTMLFormElement>(null);
  const errorsId = useId();
  const error = (field: string) => (state.errors.includes(field) ? MESSAGES[field] : undefined);
  return (
    <>
      {/* Посилений індикатор фокуса, щоб його було видно під час трансляції екрана. */}
      <style>{'.record-form :focus-visible { outline: 3px solid #1d4ed8; outline-offset: 2px; }'}</style>
      <form ref={form} action={action} className="record-form" aria-describedby={state.errors.length ? errorsId : undefined}>
        <FormField label="Назва" error={error('name')}>
          {(control) => <input {...control} name="name" required minLength={3} maxLength={80} />}
        </FormField>
        <FormField label="Категорія" error={error('category')}>
          {(control) => (
            <select {...control} name="category" required defaultValue="">
              <option value="" disabled>оберіть…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </FormField>
        <FormField label="Маса, кг" error={error('mass')}>
          {(control) => <input {...control} name="mass" type="number" step="0.01" min="0.01" required />}
        </FormField>
        <FormField label="Дата надходження" error={error('date')}>
          {(control) => <input {...control} name="date" type="date" required />}
        </FormField>
        <p>
          <label><input name="available" type="checkbox" defaultChecked /> Доступний для замовлення</label>
        </p>
        <FormField label="Примітка" hint="до 200 знаків" error={error('note')}>
          {(control) => <textarea {...control} name="note" maxLength={200} rows={3} />}
        </FormField>
        {state.errors.length > 0 && <p id={errorsId} role="alert">Запис не створено, позначені поля потрібно виправити.</p>}
        <p>
          <button type="submit" disabled={pending}>Створити</button>{' '}
          {/* reset() повертає поля до defaultValue. Якщо форма підставляє введене зі стану дії,
              очищають її зміною key форми. */}
          <ConfirmDialog trigger="Очистити форму" title="Очистити форму?" confirmLabel="Очистити" onConfirm={() => form.current?.reset()}>
            Усі введені значення буде втрачено.
          </ConfirmDialog>
        </p>
      </form>
    </>
  );
}
