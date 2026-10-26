import { readItem } from '../../../../src/server/store';
import { IdSchema } from '../../../../src/shared/data-contract';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const parsed = IdSchema.safeParse((await params).id);
  if (!parsed.success) return Response.json({ errors: ['id'] }, { status: 400 });
  const item = await readItem(parsed.data);
  return item ? Response.json(item) : Response.json({ errors: ['немає такого запису'] }, { status: 404 });
}
