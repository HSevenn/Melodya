'use client';

import { useState } from 'react';
import { upsertProfile } from '@/app/actions';
import { createBrowserClient } from '@supabase/ssr';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  // Cliente de Supabase para el navegador (no usa tu helper de server)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const site = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // 👇 muy importante: que apunte al callback
          emailRedirectTo: `${site}/auth/callback?next=/`,
        },
      });
      if (error) throw error;
      alert('Te enviamos un enlace a tu correo. Revisa tu inbox.');
    } catch (err: any) {
      alert(err?.message || 'Error enviando el enlace');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Entrar</h1>

      <form onSubmit={sendMagicLink} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            required
            className="w-full border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
          />
        </div>
        <button disabled={sending} className="px-4 py-2 rounded bg-black text-white">
          {sending ? 'Enviando…' : 'Recibir enlace mágico'}
        </button>
      </form>

      <form action={upsertProfile}>
        <button className="mt-6 text-sm underline" type="submit">
          Ya entré con el enlace → Crear/actualizar mi perfil
        </button>
      </form>
    </div>
  );
}
