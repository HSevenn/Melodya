// app/login/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

function LoginInner() {
  const supabase = createClient();
  const router = useRouter();
  const sp = useSearchParams();

  const [email, setEmail] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Utilidad: envía Magic Link
  async function sendMagic(to: string) {
    setSending(true);
    setError(null);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOtp({
        email: to,
        options: { emailRedirectTo: redirectTo }
      });
      if (error) throw error;

      // Guarda para reintentos automáticos desde /auth/callback?resend=1
      localStorage.setItem('last-login-email', to);

      setSent(true);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo enviar el enlace.');
    } finally {
      setSending(false);
    }
  }

  // Autodisparo cuando venimos de /auth/callback con ?resend=1
  useEffect(() => {
    const doResend = sp.get('resend') === '1';
    if (!doResend) return;

    const last = localStorage.getItem('last-login-email') || '';
    if (last) {
      setEmail(last);
      // Disparamos solo una vez
      sendMagic(last);
      // limpiamos el query param de la URL (opcional)
      const url = new URL(window.location.href);
      url.searchParams.delete('resend');
      window.history.replaceState({}, '', url.toString());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  // Si ya hay sesión, redirige al home
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) router.replace('/');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Ingresa tu correo.');
      return;
    }
    await sendMagic(email);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold mb-6 text-center">Iniciar sesión</h1>

      {!sent ? (
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />

          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60"
          >
            {sending ? 'Enviando…' : 'Enviar enlace mágico'}
          </button>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <p className="text-xs opacity-70">
            Te enviaremos un enlace por correo. Ábrelo con un clic normal (sin
            copiar/pegar) y en este mismo navegador. Si usas la app de Gmail,
            elige “Abrir en navegador”.
          </p>
        </form>
      ) : (
        <div className="rounded-lg border p-4 text-sm">
          <p className="font-medium">Revisa tu correo ✉️</p>
          <p className="opacity-80">
            Te enviamos un enlace a <span className="font-medium">{email}</span>.
            Ábrelo desde este mismo navegador para completar el acceso.
          </p>
          <button
            onClick={() => sendMagic(email)}
            disabled={sending}
            className="mt-4 w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60"
          >
            {sending ? 'Reenviando…' : 'Reenviar enlace'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  // Suspense para useSearchParams (evita warnings/errores en build)
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-2xl font-bold mb-6 text-center">Iniciar sesión</h1>
        <div className="rounded-lg border p-4 text-sm">
          <p>Preparando…</p>
        </div>
      </div>
    }>
      <LoginInner />
    </Suspense>
  );
}
