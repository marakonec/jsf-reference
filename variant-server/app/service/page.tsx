import type { Metadata } from 'next';
import { Suspense } from 'react';
import { readCatalog } from '../../src/server/store';
import { sign } from '../../src/server/secret';

// Службовий маршрут без посилань у навігації. Метадані robots просять пошукові
// системи не індексувати сторінку.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function ServicePage() {
  return (
    <main style={{ padding: 16 }}>
      <h1>Службовий перелік кодів перевірки</h1>
      <Suspense fallback={<p>завантаження…</p>}>
        <VerificationCodes />
      </Suspense>
    </main>
  );
}

async function VerificationCodes() {
  const { items } = await readCatalog();
  return (
    <table>
      <thead>
        <tr><th>Запис</th><th>Код перевірки</th></tr>
      </thead>
      <tbody>
        {items.slice(0, 50).map((item) => (
          <tr key={item.id}><td>{item.name}</td><td>{sign(item.id)}</td></tr>
        ))}
      </tbody>
    </table>
  );
}
