'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<FallbackUI text="Conectando…" />}>
      <CallbackInner />
    </Suspense>
  );
}

function FallbackUI({ text }: { text: string }) {
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-xl font-semibold">{text}</h1>
      <p className="text-sm text-neutral-600">Un momento por favor.</p>
    </main>
  );
}

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [err, setErr] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

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

  useEffect(() => {
    const run = async () => {
      try {
        const next = params.get('next') || '/';
        const url = new URL(window.location.href);

        // 1) Si vienen tokens (hash o query) => setSession y salir
        const access_q = url.searchParams.get('access_token');
        const refresh_q = url.searchParams.get('refresh_token');
        const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
        const access_h = hash.get('access_token');
        const refresh_h = hash.get('refresh_token');
        const access_token = access_q || access_h || '';
        const refresh_token = refresh_q || refresh_h || '';

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
          router.replace(next);
          return;
        }

        // 2) Si viene code => intentamos PKCE por si está disponible
        const code = url.searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(url.toString());
          if (!error) {
            router.replace(next);
            return;
          }
          // Si falla (falta code_verifier), mostramos opción de reenvío implicit
          setErr('No se pudo completar con el código. Puedes reenviar un enlace seguro.');
          return;
        }

        // 3) Nada útil => a inicio
        router.replace('/');
      } catch (e: any) {
        setErr(e?.message ?? 'No se pudo completar el inicio de sesión.');
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function resendImplicit() {
    try {
      setRetrying(true);
      setErr(null);

      const email = (localStorage.getItem('pending-email') || '').trim();
      if (!email) {
        setErr('No tengo tu correo guardado. Vuelve a /login y solicita un nuevo enlace.');
        setRetrying(false);
        return;
      }

      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${origin}/auth/callback` },
      });
      if (error) throw error;

      setErr('Te reenvié un enlace nuevo. Ábrelo en este mismo navegador.');
    } catch (e: any) {
      setErr(e?.message ?? 'No pude reenviar el enlace. Intenta de nuevo desde /login.');
    } finally {
      setRetrying(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-xl font-semibold">Conectando…</h1>
      <p className="text-sm text-neutral-600">Un momento por favor.</p>

      {err && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-red-500">{err}</p>
          <button
            onClick={resendImplicit}
            className="btn btn-primary"
            disabled={retrying}
          >
            {retrying ? 'Reenviando…' : 'Reenviar enlace mágico (seguro)'}
          </button>
          <p className="text-xs text-neutral-500">
            Consejo: abre el nuevo enlace con un clic normal (no copiar/pegar) y en este mismo navegador.
          </p>
        </div>
      )}
    </main>
  );
}
