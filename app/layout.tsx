// app/layout.tsx
import './global.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import AuthCodeRedirectClient from './AuthCodeRedirectClient';

export const metadata: Metadata = {
  title: 'Melodya',
  description: 'Comparte lo que estás escuchando',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-dvh bg-white text-neutral-900">
        <AuthCodeRedirectClient />

        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-neutral-200">
          <div className="mx-auto max-w-md flex items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold">Melodya</Link>
            <Link
              href="/login"
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 active:scale-[0.98] transition"
              style={{ minHeight: 44 }}
            >
              Entrar
            </Link>
          </div>
        </header>

        {/* Main Feed centrado */}
        <main className="mx-auto max-w-md w-full px-4 py-4">
          {children}
        </main>

        {/* Botón Compartir fijo (como en tu screenshot) */}
        <button
          className="fixed bottom-5 right-5 rounded-full bg-black text-white px-5 py-3 shadow-lg text-sm font-medium active:scale-95 transition"
          style={{ minHeight: 44 }}
        >
          Compartir
        </button>
      </body>
    </html>
  );
}
