'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

// Evitar SSG/ISR aquí
export const dynamic = 'force-dynamic';

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-4 py-10">
          <h1 className="text-xl font-semibold">Conectando…</h1>
          <p className="text-sm text-neutral-600">Un momento por favor.</p>
        </main>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [err, setErr] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const run = async () => {
      try {
        const next = params.get('next') || '/';

        // 1) Si llegan tokens, setSession directo
        const url = new URL(window.location.href);
        const access_q = url.searchParams.get('access_token');
        const refresh_q = url.searchParams.get('refresh_token');
        const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
        const access_h = hash.get('access_token');
        const refresh_h = hash.get('refresh_token');
        const access_token = access_q || access_h || '';
        const refresh_token = refresh_q || refresh_h || '';

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });
          if (error) throw error;
          router.replace(next);
          return;
        }

        // 2) PKCE: pásale a Supabase la URL completa (no solo el code)
        const code = url.searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(url.toString());
          if (error) throw error;
          router.replace(next);
          return;
        }

        // 3) Nada útil → a inicio
        router.replace('/');
      } catch (e: any) {
        setErr(e?.message ?? 'No se pudo completar el inicio de sesión.');
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-xl font-semibold">Conectando…</h1>
      <p className="text-sm text-neutral-600">Un momento por favor.</p>
      {err && <p className="mt-3 text-sm text-red-500">{err}</p>}
    </main>
  );
}
