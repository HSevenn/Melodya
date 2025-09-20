'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

function AuthCallbackInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const supabase = createClient();

  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [message, setMessage] = useState<string>('Conectando... Un momento por favor.');

  useEffect(() => {
    async function run() {
      try {
        // 0) Si ya hay sesión, listo
        const { data: s0 } = await supabase.auth.getSession();
        if (s0?.session) {
          setStatus('ok');
          return router.replace('/');
        }

        // 1) Posibles parámetros de callback
        const code = sp.get('code') ?? '';
        const codeVerifier = sp.get('code_verifier') ?? ''; // PKCE
        const tokenHash = sp.get('token_hash') ?? '';       // Magic Link / confirm
        const type = (sp.get('type') ?? '') as
          | 'magiclink' | 'recovery' | 'invite'
          | 'signup' | 'email_change';

        // 2) Flujos soportados
        if (code && codeVerifier) {
          // ➜ PKCE / OAuth
          const { error } = await supabase.auth.exchangeCodeForSession({ code, codeVerifier });
          if (error) throw error;
          setStatus('ok');
          return router.replace('/');
        }

        if (tokenHash && type) {
          // ➜ Magic Link / confirmación por email (hash)
          const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
          if (error) throw error;
          setStatus('ok');
          return router.replace('/');
        }

        // 3) Si no hay params, intenta leer sesión otra vez por si el SDK ya guardó token
        const { data: s1 } = await supabase.auth.getSession();
        if (s1?.session) {
          setStatus('ok');
          return router.replace('/');
        }

        // 4) Nada funcionó: pedimos reintentar
        setStatus('error');
        setMessage(
          'No se pudo completar con el código. Puedes reenviar un enlace seguro.'
        );
      } catch (e: any) {
        console.error('Auth callback error:', e);
        setStatus('error');
        setMessage(e?.message || 'No se pudo completar el inicio de sesión.');
      }
    }

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResend = () => {
    // Lo llevamos al login para reenviar el enlace mágico
    router.replace('/login?resend=1');
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold mb-6 text-center">Melodya</h1>

      {status === 'checking' && (
        <div className="rounded-lg border p-4 text-sm">
          <p className="font-medium">Conectando…</p>
          <p className="opacity-70">Un momento por favor.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-red-400/40 bg-red-500/5 p-4 text-sm">
            <p className="font-medium text-red-600 dark:text-red-400">Hubo un problema</p>
            <p className="opacity-80">{message}</p>
          </div>

          <button
            onClick={handleResend}
            className="w-full rounded-md border px-4 py-2 text-center text-sm font-medium hover:bg-black/5"
          >
            Reenviar enlace mágico (seguro)
          </button>

          <p className="text-xs opacity-70">
            Consejo: abre el nuevo enlace con un clic normal (sin copiar/pegar) y en este mismo
            navegador. Si usas la app de Gmail, mejor ábrelo en el navegador por defecto.
          </p>
        </div>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  // Suspense evita el warning de Next.js con useSearchParams en build
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-2xl font-bold mb-6 text-center">Melodya</h1>
        <div className="rounded-lg border p-4 text-sm">
          <p className="font-medium">Conectando…</p>
          <p className="opacity-70">Un momento por favor.</p>
        </div>
      </div>
    }>
      <AuthCallbackInner />
    </Suspense>
  );
}
