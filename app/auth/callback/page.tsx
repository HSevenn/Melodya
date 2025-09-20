'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuth = async () => {
      const code = searchParams.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error('❌ Error al intercambiar el código:', error.message);
        } else {
          console.log('✅ Sesión creada con éxito');
          router.push('/'); // redirige al home o donde quieras
        }
      }
    };

    handleAuth();
  }, [router, searchParams]);

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h2>Conectando...</h2>
      <p>Un momento por favor.</p>
    </div>
  );
}
