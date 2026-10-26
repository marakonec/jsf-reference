// Імпорт простором імен, як у документації zod. Форма `import { z } from 'zod'`
// під Turbopack тягнула в клієнтський код усі мовні пакети повідомлень.
import * as z from 'zod';

export const ItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  category: z.string(),
  mass: z.number(),
  date: z.string(),
  available: z.boolean(),
  marked: z.boolean(),
  verificationCode: z.string(),
});

export const CatalogSchema = z.object({
  items: z.array(ItemSchema.omit({ verificationCode: true })),
  generatedAt: z.string(),
  cached: z.boolean(),
});

// Аргументи серверної дії і тіло запиту до обробника маршруту повністю
// контролює клієнт, тому вхід перевіряється на сервері.
export const NewItemSchema = z.object({
  name: z.string().trim().min(3).max(80),
  category: z.string().trim().min(2).max(40),
  mass: z.coerce.number().positive().max(10000),
});

export const IdSchema = z.coerce.number().int().positive();

export function mismatches(schema: z.ZodType, data: unknown): string[] {
  const result = schema.safeParse(data);
  if (result.success) return [];
  return [...new Set(result.error.issues.map((issue) => issue.path.join('.') || '(корінь)'))];
}
