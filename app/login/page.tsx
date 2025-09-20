// app/login/page.tsx
'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import AuthHashForwarder from '@/app/_components/AuthHashForwarder';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 👇 Forzamos flujo IMPLICIT (token en el hash). ¡Adiós code_verifier!
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'implicit',
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    }
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const origin = window.location.origin; // envía de vuelta al MISMO dominio
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${origin}/auth/callback` },
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo enviar el enlace. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <main className="mx-auto max-w-md px-4 py-10">
        <AuthHashForwarder />
        <h1 className="text-2xl font-bold">Revisa tu correo</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Ábrelo desde este mismo dispositivo/navegador.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <AuthHashForwarder />
      <h1 className="text-2xl font-bold mb-4">Iniciar sesión</h1>

      <form onSubmit={onSubmit} className="max-w-sm space-y-3">
        <input
          type="email"
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
