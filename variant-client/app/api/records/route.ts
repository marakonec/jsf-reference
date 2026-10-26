import { revalidateTag } from 'next/cache';
import { readCatalog, createItem } from '../../../src/server/store';
import { NewItemSchema, mismatches } from '../../../src/shared/data-contract';

export async function GET(): Promise<Response> {
  return Response.json(await readCatalog());
}

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const bad = mismatches(NewItemSchema, body);
  if (bad.length) return Response.json({ errors: bad }, { status: 400 });
  const id = await createItem(NewItemSchema.parse(body));
  // updateTag доступний лише в серверних діях. В обробнику маршруту
  // revalidateTag з негайним завершенням терміну, інакше наступне читання застаріле.
  revalidateTag('records', { expire: 0 });
  return Response.json({ id }, { status: 201 });
}
