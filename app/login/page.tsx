'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase-browser'; // ✅ usa tu cliente

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    try {
      // guarda el email por si hay que reenviar seguro en /auth/callback
      sessionStorage.setItem('last_email', email);
      localStorage.setItem('last_email', email);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true,
        },
      });
      if (error) throw error;

      setSent(true);
    } catch (err: any) {
      setError(err?.message || 'No se pudo enviar el enlace.');
    }
  }

  if (sent) {
    return (
      <main style={{ maxWidth: 420, margin: '40px auto', padding: 16 }}>
        <h1>Revisa tu correo</h1>
        <p>Te enviamos un enlace mágico. Ábrelo con un clic normal en este navegador.</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 420, margin: '40px auto', padding: 16 }}>
      <h1>Iniciar sesión</h1>
      <form onSubmit={onSubmit} style={{ marginTop: 16 }}>
        <input
          type="email"
          placeholder="tucorreo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc' }}
        />
        <button
          type="submit"
          style={{
            marginTop: 12,
            width: '100%',
            padding: 12,
            borderRadius: 8,
            background: '#111',
            color: '#fff',
            border: '1px solid #111',
          }}
        >
          Enviar enlace mágico
        </button>
        {error && <p style={{ color: '#b91c1c', marginTop: 8 }}>{error}</p>}
      </form>
    </main>
  );
}
