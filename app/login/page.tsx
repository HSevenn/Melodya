'use client';

import { useState, useTransition, FormEvent } from 'react';
import { supabaseBrowser } from '@/lib/supabase-client';
import { upsertProfile } from '@/app/actions';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const supabase = supabaseBrowser();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // redirige a tu sitio (home). Debe coincidir con Auth redirect URL en Supabase.
     emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      alert(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Entrar</h1>

      <form onSubmit={onSend} className="space-y-3">
        <input
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <button
          type="submit"
          className="px-4 py-2 rounded bg-black text-white"
        >
          Enviar magic link
        </button>
      </form>

      {sent && (
        <div className="space-y-2">
          <p>Revisa tu correo y haz clic en el enlace.</p>
          <button
            onClick={() =>
              startTransition(async () => {
                await upsertProfile();
              })
            }
            disabled={pending}
            className="px-4 py-2 rounded border"
          >
            {pending
              ? 'Guardando…'
              : 'Ya entré con el enlace — Crear/actualizar mi perfil'}
          </button>
        </div>
      )}
    </div>
  );
}
