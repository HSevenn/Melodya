// app/layout.tsx
import './global.css';
import type { Metadata } from 'next';
import AuthCodeRedirectClient from './AuthCodeRedirectClient';

export const metadata: Metadata = {
  title: 'Melodya',
  description: 'Comparte lo que estás escuchando',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {/* Captura ?code o tokens en cualquier ruta y los envía al callback */}
        <AuthCodeRedirectClient />
        {children}
      </body>
    </html>
  );
}
