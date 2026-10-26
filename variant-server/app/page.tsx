import { Suspense } from 'react';
import { readCatalog } from '../src/server/store';
import { Catalog } from '../src/ui/Catalog';
import { SourceStamp } from '../src/ui/SourceStamp';

export default function CatalogPage() {
  return (
    <main style={{ padding: 16 }}>
      <h1>Каталог</h1>
      <Suspense fallback={<p>завантаження каталогу…</p>}>
        <CatalogContent />
      </Suspense>
    </main>
  );
}

async function CatalogContent() {
  const { items, generatedAt, cached } = await readCatalog();
  return (
    <>
      <SourceStamp generatedAt={generatedAt} cached={cached} />
      <Catalog items={items} />
    </>
  );
}
