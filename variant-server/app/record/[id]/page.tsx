import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { readItem } from '../../../src/server/store';
import { IdSchema } from '../../../src/shared/data-contract';
import { toggleMarkAction } from '../../actions';

export default function RecordPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main style={{ padding: 16 }}>
      <Suspense fallback={<p>завантаження запису…</p>}>
        <RecordContent params={params} />
      </Suspense>
    </main>
  );
}

async function RecordContent({ params }: { params: Promise<{ id: string }> }) {
  const parsed = IdSchema.safeParse((await params).id);
  if (!parsed.success) notFound();
  const item = await readItem(parsed.data);
  if (!item) notFound();
  return (
    <>
      <h1>{item.name}</h1>
      <dl>
        <dt>Категорія</dt><dd>{item.category}</dd>
        <dt>Маса</dt><dd>{item.mass} кг</dd>
        <dt>Дата</dt><dd>{item.date}</dd>
        <dt>Позначений</dt><dd>{item.marked ? 'так' : 'ні'}</dd>
        <dt>Код перевірки</dt><dd><output>{item.verificationCode}</output></dd>
      </dl>
      <form action={toggleMarkAction}>
        <input type="hidden" name="id" value={item.id} />
        <button type="submit">Перемкнути позначку</button>
      </form>
    </>
  );
}
