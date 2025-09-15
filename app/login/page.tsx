'use client';

import { useEffect, useState } from 'react';
import { upsertProfile } from '@/app/actions';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  // Si llega ?error=1 avisamos
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('error')) alert('El enlace es inválido o expiró. Pide uno nuevo.');
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
    if (error) return alert(error.message);
    setSent(true);
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-xl font-semibold">Entrar</h1>

      {/* --- Formulario para pedir el Magic Link --- */}
      <form onSubmit={handleSend} className="space-y-3">
        <label className="block text-sm">Correo</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className="w-full border rounded px-3 py-2"
        />
        <button className="px-4 py-2 bg-black text-white rounded">
          Enviar Magic Link
        </button>
        {sent && (
          <p className="text-sm text-neutral-600">
            Revisa tu correo y abre el enlace para iniciar sesión.
          </p>
        )}
      </form>

      {/* --- Crear/actualizar perfil --- */}
      <form>
        <button
          className="mt-6 text-sm underline"
          type="submit"
          formAction={upsertProfile}
        >
          Ya entré con el enlace — Crear/actualizar mi perfil
        </button>
      </form>
    </div>
  );
}
