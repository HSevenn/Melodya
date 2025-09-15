'use client';

import { FormEvent, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle'|'sent'|'error'>('idle');
  const supabase = supabaseBrowser();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState('idle');

    const redirectTo =
      process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
        : `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      console.error(error);
      setState('error');
      return;
    }
    setState('sent');
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Entrar</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          required
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded bg-black text-white"
        >
          Enviarme enlace mágico
        </button>
      </form>

      {state === 'sent' && (
        <p className="mt-4 text-sm text-green-700">
          Revisa tu correo y abre el enlace. Te redirigirá a <code>/auth/callback</code>.
        </p>
      )}
      {state === 'error' && (
        <p className="mt-4 text-sm text-red-700">
          No se pudo enviar el enlace. Intenta de nuevo.
        </p>
      )}
    </div>
  );
}
      >
        Ya entré con el enlace → Crear/actualizar mi perfil
      </button>
    </div>
  );
}
