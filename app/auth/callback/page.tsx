'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [err, setErr] = useState<string | null>(null);

  // Cliente de Supabase en el navegador (sin helpers extra)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    (async () => {
      try {
        const next = params.get('next') || '/';
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        const code = params.get('code');

        // Caso 1: tokens directos (hash → query por AuthHashForwarder)
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) throw error;
          router.replace(next);
          return;
        }

        // Caso 2: código PKCE/Magic Link
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          router.replace(next);
          return;
        }

        // Sin parámetros válidos → al inicio
        router.replace('/');
      } catch (e: any) {
        setErr(e?.message ?? 'No se pudo completar el inicio de sesión.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-xl font-semibold">Conectando…</h1>
      <p className="text-sm text-neutral-600">Un momento por favor.</p>
      {err && <p className="mt-3 text-sm text-red-500">{err}</p>}
    </main>
  );
}
