import Link from 'next/link';

export function Header({ variant }: { variant: string }) {
  return (
    <header style={{ padding: '8px 16px', display: 'flex', gap: 16, alignItems: 'baseline' }}>
      <strong>Варіант: {variant}</strong>
      <nav style={{ display: 'flex', gap: 16 }}>
        <Link href="/" prefetch={false}>Каталог</Link>
        <Link href="/new" prefetch={false}>Новий запис</Link>
      </nav>
    </header>
  );
}
