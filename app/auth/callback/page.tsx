// app/auth/callback/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

// Evita SSG/ISR para este callback
export const dynamic = 'force-dynamic';

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="container mx-auto px-4 py-10">
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

  // Cliente de Supabase en el navegador
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

        // Sin parámetros válidos
        router.replace('/');
      } catch (e
