'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      const supabase = supabaseBrowser();

      const redirect =
        (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || window.location.origin) +
        '/auth/callback';

      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: redirect,
        },
      });

      if (err) throw err;

      // guardo el último correo para reenvío “seguro” desde /auth/callback si lo usas
      try {
        localStorage.setItem('sb-last-email', email);
      } catch {}
      setSent(true);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo enviar el enlace.');
    }
  }

  return (
    <main className="container mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold mb-4">Iniciar sesión</h1>

      {sent ? (
        <p className="text-sm">
          Te enviamos un enlace mágico a <b>{email}</b>. Revísalo y ábrelo con un clic normal.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
            className="w-full rounded border px-3 py-2"
          />
          <button type="submit" className="btn btn-primary">Enviar enlace mágico</button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      )}
    </main>
  );
}
