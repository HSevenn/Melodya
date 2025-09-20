'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

/** Evita prerender/caché de esta ruta: se ejecuta sólo en el navegador */
export const dynamic = 'force-dynamic';

/** Contenido real de la página (usa hooks de cliente como useSearchParams) */
function AuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = supabaseBrowser();

  const [status, setStatus] = useState<'working' | 'ok' | 'error'>('working');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const doExchange = async () => {
      // Si Supabase devolvió un error por querystring, muéstralo.
      const qsError = params.get('error_description') || params.get('error');
      if (qsError) {
        setStatus('error');
        setErrorMsg(qsError);
        return;
      }

      // Supabase con PKCE llega con ?code=...
      const code = params.get('code');
      if (!code) {
        setStatus('error');
        setErrorMsg('No se encontró el código de autenticación.');
        return;
      }

      // Intercambia el código por una sesión (usa el code_verifier guardado en este navegador)
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setStatus('error');
        setErrorMsg(error.message || 'No se pudo completar con el código.');
        return;
      }

      setStatus('ok');
      // Redirige a donde prefieras (home por ahora)
      router.replace('/');
    };

    void doExchange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // Reenviar Magic Link usando el correo guardado en /app/login/page.tsx (sessionStorage)
  const handleResend = async () => {
    if (resendLoading || resendCooldown > 0) return;

    const email = sessionStorage.getItem('melodya:lastEmail');
    if (!email) {
      setErrorMsg('No tengo el correo para reenviar. Vuelve a "Entrar" e ingrésalo primero.');
      return;
    }

    setResendLoading(true);
    setErrorMsg(null);

    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });

    setResendLoading(false);

    if (error) {
      setErrorMsg(error.message || 'No se pudo reenviar el enlace.');
      return;
    }

    // Pequeño cooldown para evitar rate limits
    setResendCooldown(60);
  };

  // Timer para el cooldown del botón “Reenviar”
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', padding: '0 16px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Melodya</h1>
        <button
          onClick={() => router.push('/login')}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          Entrar
        </button>
      </header>

      <main style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 20, marginBottom: 6 }}>Conectando…</h2>
        <p style={{ opacity: 0.8, marginBottom: 14 }}>Un momento por favor.</p>

        {status === 'error' && (
          <>
            <p style={{ color: '#b91c1c', fontWeight: 600, marginTop: 8 }}>
              {errorMsg || 'No se pudo completar con el código. Puedes reenviar un enlace seguro.'}
            </p>

            <div style={{ marginTop: 14 }}>
              <button
                onClick={handleResend}
                disabled={resendLoading || resendCooldown > 0}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#111827',
                  color: '#fff',
                  cursor: resendLoading || resendCooldown > 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {resendLoading
                  ? 'Enviando…'
                  : resendCooldown > 0
                  ? `Reenviar enlace mágico (${resendCooldown})`
                  : 'Reenviar enlace mágico (seguro)'}
              </button>

              <p style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                Consejo: abre el nuevo enlace con un clic normal (no copiar/pegar) y en este mismo
                navegador.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/** Export por defecto: envuelve el contenido en Suspense para CSR */
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div style={{ maxWidth: 520, margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Melodya</h1>
      <p style={{ marginTop: 16 }}>Conectando…</p>
    </div>}>
      <AuthCallbackInner />
    </Suspense>
  );
}
