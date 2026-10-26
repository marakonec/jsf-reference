import { Suspense } from 'react';
import { RecordCard } from '../../../src/ui/RecordCard';

// Параметр маршруту читає клієнтський хук, тому без Suspense складання
// відмовляється формувати сторінку.
export default function RecordPage() {
  return (
    <Suspense fallback={<main style={{ padding: 16 }}><p>завантаження запису…</p></main>}>
      <RecordCard />
    </Suspense>
  );
}
