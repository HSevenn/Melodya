'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [msg, setMsg] = useState('Procesando inicio de sesión…');

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = supabaseBrowser();
        // Intercambia el código/token del hash por una sesión (PKCE / magic link)
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.hash);
        if (error) {
          setMsg('El enlace es inválido o expiró. Solicita otro.');
          return;
        }
        // Listo: ya hay cookie de sesión. Redirige al feed o a /new
        router.replace('/');
      } catch (e) {
        setMsg('Ocurrió un error al iniciar sesión.');
      }
    };
    run();
  }, [router]);

  return (
    <div className="p-8">
      <p>{msg}</p>
    </div>
  );
}