'use server';
import { redirect } from 'next/navigation';
import { updateTag } from 'next/cache';
import { IdSchema, NewItemSchema, mismatches } from '../src/shared/data-contract';
import { toggleMark, createItem } from '../src/server/store';

// Серверна дія доступна прямим POST-запитом, а не лише з цієї форми
// (документація Next.js, Data Security), тому FormData перевіряється тут.

export async function toggleMarkAction(form: FormData): Promise<void> {
  const id = IdSchema.parse(form.get('id'));
  await toggleMark(id);
  updateTag('records');
  redirect(`/record/${id}`);
}

export interface FormState { readonly errors: readonly string[] }

export async function createItemAction(_previous: FormState, form: FormData): Promise<FormState> {
  const raw = Object.fromEntries(form);
  const bad = mismatches(NewItemSchema, raw);
  if (bad.length) return { errors: bad };
  const id = await createItem(NewItemSchema.parse(raw));
  updateTag('records');
  redirect(`/record/${id}`);
}
