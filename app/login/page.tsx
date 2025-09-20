'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const clean = email.trim().toLowerCase();
    if (!clean) {
      setError('Escribe tu correo.');
      return;
    }

    setSending(true);
    try {
      // Redirige a /auth/callback (debe estar en Redirect URLs en Supabase)
      const redirectTo =
        (typeof window !== 'undefined' ? window.location.origin : '') +
        '/auth/callback';

      const { error } = await supabase.auth.signInWithOtp({
        email: clean,
        options: {
          emailRedirectTo: redirectTo,
          // importa para que Supabase use PKCE correctamente en web
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      setSent(true);
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo enviar el enlace.');
    } finally {
      setSending(false);
    }
  }

  // UI muy simple y mobile-first
  return (
    <main className="mx-auto w-full max-w-sm p-6">
      <h1 className="text-2xl font-bold text-center">Iniciar sesión</h1>

      {sent ? (
        <div className="mt-6 rounded-md border p-4 text-sm">
          <p className="font-medium">Revisa tu correo</p>
          <p className="mt-1 opacity-80">
            Te enviamos un enlace mágico a <strong>{email}</strong>. Ábrelo con
            un clic normal en este mismo navegador.
          </p>
          <button
            onClick={() => {
              setSent(false);
              setEmail('');
            }}
            className="btn btn-outline w-full mt-4"
          >
            Enviar a otro correo
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block">Tu correo</span>
            <input
              type="email"
              inputMode="email"
              placeholder="tucorreo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border px-3 py-2 outline-none"
              required
            />
          </label>

          {error && (
            <p className="text-sm text-red-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="btn btn-primary w-full disabled:opacity-60"
          >
            {sending ? 'Enviando…' : 'Enviar enlace mágico'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/')}
            className="btn btn-outline w-full"
          >
            Volver al inicio
          </button>
        </form>
      )}
    </main>
  );
}
