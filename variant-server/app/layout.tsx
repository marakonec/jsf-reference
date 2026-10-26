import type { ReactNode } from 'react';
import { Header } from '../src/ui/Header';

export const metadata = { title: 'Каталог · запит на сервері' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uk">
      <body style={{ margin: 0, font: '14px/1.5 system-ui, sans-serif' }}>
        <Header variant="запит на сервері" />
        {children}
      </body>
    </html>
  );
}
