// /app/login/page.tsx
'use client';

import { useState, useTransition } from 'react';
import { supabaseBrowser } from '@/lib/supabase-client';
import { upsertProfile } from '@/app/actions';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = supabaseBrowser();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // asegúrate de tener NEXT_PUBLIC_SITE_URL configurada
        emailRedirectTo: process.env.NEXT_PUBLIC_SITE_URL,
      },
    });

    if (error) {
      alert(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Entrar</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm">
          Correo
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
          />
        </label>

        <button
          type="submit"
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-60"
          disabled={!email || sent}
        >
          {sent ? 'Enlace enviado ✉️' : 'Enviar enlace mágico'}
        </button>
      </form>

      <div className="mt-6 border-t pt-6">
        <button
          type="button"
          className="px-4 py-2 rounded border"
          onClick={() =>
            startTransition(async () => {
              await upsertProfile();
            })
          }
          disabled={isPending}
          title="Úsalo después de abrir el enlace mágico (ya autenticado)."
        >
          {isPending ? 'Guardando…' : 'Ya entré con el enlace → Crear/actualizar mi perfil'}
        </button>
        <p className="text-xs text-neutral-500 mt-2">
          Primero pulsa “Enviar enlace mágico”, abre el correo y vuelve. Luego presiona este botón para crear/actualizar tu perfil.
        </p>
      </div>
    </div>
  );
}
