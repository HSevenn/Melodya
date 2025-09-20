'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser'; // ✅ usa tu cliente

function AuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: any;

    async function run() {
      try {
        setError(null);

        // 1) ¿Viene un "code" (PKCE)?
        const code = params.get('code');

        // 2) ¿Viene access_token en el hash?
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
        const accessToken = hashParams.get('access_token');

        if (code) {
          // ✅ Intercambia el code por la sesión
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) throw exErr;
          router.replace('/'); // éxito
          return;
        }

        if (accessToken) {
          // ✅ Si llega access_token en el hash, úsalo
          const { data, error: setErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') ?? '',
          });
          if (setErr || !data.session) throw setErr ?? new Error('No session');
          router.replace('/');
          return;
        }

        // ❌ Si no hay nada válido:
        setError('No se pudo completar con el código. Puedes reenviar un enlace seguro.');
      } catch (e: any) {
        setError(e?.message || 'No se pudo conectar.');
      }
    }

    run();

    // pequeño cooldown si se reenvía
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    }
    return () => clearInterval(timer);
  }, [params, router, cooldown]);

  const resendSecure = async () => {
    if (cooldown > 0) return;
    // intentamos recuperar el email que guardaste en /login
    const email = sessionStorage.getItem('last_email') || localStorage.getItem('last_email');
    if (!email) {
      setError('Abre /login y pide un enlace nuevo.');
      return;
    }
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
      },
    });
    if (error) {
      setError(error.message);
    } else {
      setCooldown(30);
      setError('Enlace reenviado. Ábrelo con un clic normal en este navegador.');
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: '40px auto', padding: 16 }}>
      <h1>Melodya</h1>
      <h2 style={{ marginTop: 16 }}>Conectando…</h2>
      <p>Un momento por favor.</p>

      {error && (
        <div style={{ marginTop: 12, color: '#b91c1c' }}>
          {error}
          <div style={{ marginTop: 10 }}>
            <button
              onClick={resendSecure}
              disabled={cooldown > 0}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #444',
                background: cooldown > 0 ? '#eee' : '#fff',
                cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Reenviar enlace mágico (seguro)
              {cooldown > 0 ? ` — espera ${cooldown}s` : ''}
            </button>
          </div>
          <p style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
            Consejo: abre el nuevo enlace con un clic normal (no copiar/pegar) y en este mismo
            navegador.
          </p>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Cargando…</div>}>
      <AuthCallbackInner />
    </Suspense>
  );
}
