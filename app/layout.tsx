import './globals.css';

export const metadata = {
  title: 'Melodya',
  description: 'Comparte lo que escuchas. Minimal y social.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-white text-neutral-900">
        <header className="border-b">
          <div className="mx-auto max-w-xl px-4 py-3 flex items-center justify-between">
            <div className="font-bold">Melodya</div>
            <a href="/login" className="text-sm underline">Entrar</a>
          </div>
        </header>
        <main className="mx-auto max-w-xl px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}