'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

/** ⚙️ Evita prerender y caching de esta ruta */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  // Reenvío “seguro” del enlace en caso de que falte el code_verifier
  async function resendSafeLink() {
    try {
      setResending(true);
      const email = localStorage.getItem('last-login-email');
      if (!email) throw new Error('No tenemos tu correo para reenviar el enlace.');

      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setError(null);
      alert('Te reenviamos un enlace. Ábrelo con un clic normal y en este mismo navegador.');
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo reenviar el enlace.');
    } finally {
      setResending(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        setError(null);

        // 1) Supabase con PKCE trae ?code=...
        const code = searchParams.get('code');

        // 2) A veces el proveedor deja tokens en el hash (#access_token=...) — limpiar por si acaso
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const accessToken = hashParams.get('access_token');

        if (!code && !accessToken) {
          // Nada útil: volvemos al inicio
          router.replace('/');
          return;
        }

        // Intercambiar el code por la sesión (usa el code_verifier guardado por el SDK)
        if (code) {
          const supabase = supabaseBrowser();
          const { error } = await supabase.auth.exchangeCodeForSession({ code });
          if (error) throw error;
        }

        // ✅ Listo: a la home (o a donde prefieras)
        router.replace('/');
      } catch (e: any) {
        // Si no hay code_verifier válido, Supabase responde con:
        // “both auth code and code verifier should be non-empty”
        setError(
          e?.message ??
            'No se pudo completar con el código. Puedes reenviar un enlace seguro.'
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-3">Melodya</h1>
      <h2 className="text-xl font-semibold mb-2">Conectando…</h2>
      <p className="text-sm text-neutral-500 mb-6">Un momento por favor.</p>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-red-700 mb-4">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={resendSafeLink}
        disabled={resending}
        className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-100 disabled:opacity-50"
      >
        Reenviar enlace mágico (seguro)
      </button>

      <p className="mt-3 text-xs text-neutral-500">
        Consejo: abre el nuevo enlace con un clic normal (no copiar/pegar) y en este mismo
        navegador.
      </p>
    </div>
  );
}

export default function Page() {
  // 👇 Esto satisface a Next: cualquier uso de useSearchParams va dentro de Suspense
  return (
    <Suspense fallback={<div className="container mx-auto max-w-xl px-4 py-10">Conectando…</div>}>
      <CallbackInner />
    </Suspense>
  );
}
