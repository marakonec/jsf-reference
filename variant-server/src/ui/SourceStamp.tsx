// Час формування даних не змінюється між оновленнями сторінки, поки дані
// беруться з кешу, і змінюється щоразу без кешу.
export function SourceStamp({ generatedAt, cached }: { generatedAt: string; cached: boolean }) {
  return (
    <p id="source-stamp" style={{ font: '700 18px/1.4 system-ui,sans-serif' }}>
      дані сформовано: {generatedAt.slice(11, 23)} · кеш на сервері: {cached ? 'увімкнено' : 'вимкнено'}
    </p>
  );
}
