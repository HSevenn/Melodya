// app/auth/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

// evita cualquier intento de prerender/caché en esta ruta
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const run = async () => {
      const code = params.get('code');               // PKCE auth code
      const error = params.get('error_description') || params.get('error');

      // Si Supabase nos devolvió un error directo en la URL
      if (error) {
        setStatus('error');
        setMessage(error);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No llegó ningún código de verificación en la URL.');
        return;
      }

      try {
        const supabase = supabaseBrowser();

        // Intercambia el código por una sesión. Supabase usa internamente el
        // code_verifier guardado en el mismo navegador donde se solicitó el link.
        const { error: exErr } = await supabase.auth.exchangeCodeForSession (code) ;

        if (exErr) {
          // Caso típico: “both auth code and code verifier should be non-empty”
          setStatus('error');
          setMessage(
            'No se pudo completar con el código. Puedes reenviar un enlace seguro desde la pantalla de inicio de sesión.'
          );
          return;
        }

        // Sesión OK → redirigimos al home (o a donde prefieras)
        setStatus('ok');
        router.replace('/');
      } catch (e: any) {
        setStatus('error');
        setMessage(e?.message ?? 'Error desconocido al validar el enlace.');
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'checking') {
    return (
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-2">Conectando…</h1>
        <p className="text-sm opacity-80">Un momento por favor.</p>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-3">Conectando…</h1>
        <p className="text-sm text-red-500 mb-4">{message}</p>

        <a
          href="/login"
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-100"
        >
          Reenviar enlace mágico (seguro)
        </a>

        <p className="mt-3 text-xs opacity-70">
          Consejo: abre el nuevo enlace con un clic normal (sin copiar/pegar) y en el mismo
          navegador donde solicitaste el correo.
        </p>
      </main>
    );
  }

  // status === 'ok' → se redirige; dejamos un fallback por si tarda un frame.
  return null;
}
