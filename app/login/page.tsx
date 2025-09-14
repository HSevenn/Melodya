'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { upsertProfile } from '@/app/actions';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Entrar</h1>
      <p className="text-sm text-neutral-600">Te enviamos un enlace mágico a tu correo.</p>

      {!sent ? (
        <form onSubmit={async (e) => {
          e.preventDefault();
          const { error } = await supabase.auth.signInWithOtp({ email });
          if (error) { alert(error.message); return; }
          setSent(true);
        }} className="space-y-3">
          <input
            type="email"
            required
            placeholder="tu@correo.com"
            className="w-full border rounded px-3 py-2"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
          />
          <button className="px-4 py-2 bg-black text-white rounded">Enviar enlace</button>
        </form>
      ) : (
        <div className="text-sm">Revisa tu correo. Cuando entres, creamos tu perfil…</div>
      )}
      <button
        className="text-sm underline"
        onClick={async ()=>{
          // si ya tienes sesión (después del enlace) completa el perfil:
          await upsertProfile();
          window.location.href = '/';
        }}
      >
        Ya entré con el enlace → Crear/actualizar mi perfil
      </button>
    </div>
  );
}