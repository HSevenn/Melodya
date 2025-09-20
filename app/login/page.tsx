// app/login/page.tsx
'use client';

import { useState } from 'react';
import { sendMagicLink } from '../actions';
import AuthHashForwarder from '@/app/_components/AuthHashForwarder'; // mueve #access_token → query

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ✅ Server Action espera FormData y no retorna valor usable
      const fd = new FormData();
      fd.append('email', email);

      await sendMagicLink(fd);   // ⬅️ sin const ok / sin if (!ok)
      setSent(true);
    } catch (err: any) {
      setError(err?.message ?? 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <main className="container mx-auto px-4 py-10">
        <AuthHashForwarder />
        <h1 className="text-2xl font-bold">Revisa tu correo</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Te enviamos un enlace de acceso. Ábrelo desde este mismo
          dispositivo/navegador.
        </p>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <AuthHashForwarder />
      <h1 className="text-2xl font-bold mb-4">Iniciar sesión</h1>

      <form onSubmit={onSubmit} className="max-w-sm space-y-3">
        <input
          type="email"
          name="email"
          required
          placeholder="tucorreo@ejemplo.com"
          className="w-full rounded border px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? 'Enviando…' : 'Enviar enlace mágico'}
        </button>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </form>
    </main>
  );
}
