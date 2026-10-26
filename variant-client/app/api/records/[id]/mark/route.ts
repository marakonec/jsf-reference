import { revalidateTag } from 'next/cache';
import { toggleMark } from '../../../../../src/server/store';
import { IdSchema } from '../../../../../src/shared/data-contract';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const parsed = IdSchema.safeParse((await params).id);
  if (!parsed.success) return Response.json({ errors: ['id'] }, { status: 400 });
  const marked = await toggleMark(parsed.data);
  revalidateTag('records', { expire: 0 });
  return Response.json({ id: parsed.data, marked });
}
