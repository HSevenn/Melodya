'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

export const dynamic = 'force-dynamic';

function AuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = supabaseBrowser();

      // soporte de ?code=... y de hash tipo #access_token=... (algunos clientes)
      const code = params.get('code');
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const accessToken = hashParams.get('access_token');

      try {
        if (code) {
          // ✅ IMPORTANTE: pasar el string, no { code }
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) throw exErr;
          router.replace('/');
          return;
        }

        if (accessToken) {
          // fallback raro: setSession con access_token (por si el cliente de correo lo pone en el hash)
          const refreshToken = hashParams.get('refresh_token') ?? undefined;
          const { error: setErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken!,
          } as any);
          if (setErr) throw setErr;
          router.replace('/');
          return;
        }

        setError('No se encontró código de autenticación.');
      } catch (e: any) {
        setError(e?.message ?? 'No se pudo completar el login.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="container mx-auto max-w-md p-6">
      <h1 className="text-xl font-semibold mb-2">Conectando…</h1>
      {error ? (
        <>
          <p className="text-red-500 mb-3">{error}</p>
          <p className="text-sm">
            Consejo: abre el enlace del correo con un clic normal (no copiar/pegar) y en este mismo
            navegador. Si falla, vuelve a solicitarlo desde “Entrar”.
          </p>
        </>
      ) : (
        <p>Un momento por favor…</p>
      )}
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<main className="container mx-auto max-w-md p-6">Cargando…</main>}>
      <AuthCallbackInner />
    </Suspense>
  );
}
