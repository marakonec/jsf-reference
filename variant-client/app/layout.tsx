import type { ReactNode } from 'react';
import { Header } from '../src/ui/Header';
import { QueryProvider } from '../src/ui/Providers';

export const metadata = { title: 'Каталог · запит на клієнті' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uk">
      <body style={{ margin: 0, font: '14px/1.5 system-ui, sans-serif' }}>
        <Header variant="запит на клієнті" />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
