'use client';

import { useState, useTransition } from 'react';
import { sendMagicLink, upsertProfile } from '@/app/actions';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [pendingSend, startSend] = useTransition();
  const [pendingUpsert, startUpsert] = useTransition();

  return (
    <div className="space-y-8 max-w-md mx-auto">
      <h1 className="text-xl font-semibold">Entrar</h1>

      {/* 1) Pedir Magic Link por email */}
      <form
        action={(formData) => {
          // Esta es una Server Action referenciada (sendMagicLink)
          // Vuelve void/Promise<void> en el servidor
          startSend(async () => {
            await sendMagicLink(formData);
          });
        }}
        className="space-y-3 border rounded-lg p-4"
      >
        <label className="block text-sm font-medium">Correo</label>
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className="w-full border rounded px-3 py-2"
        />

        {/* URL de redirección opcional (si tu action la usa) */}
        <input type="hidden" name="redirectTo" value="/auth/callback" />

        <button
          type="submit"
          disabled={pendingSend}
          className="px-4 py-2 rounded bg-black text-white"
        >
          {pendingSend ? 'Enviando enlace…' : 'Enviar Magic Link'}
        </button>

        <p className="text-xs text-neutral-500">
          Revisa tu correo y abre el enlace para iniciar sesión.
        </p>
      </form>

      {/* 2) Crear/actualizar perfil tras abrir el Magic Link */}
      <form
        action={(formData) => {
          // upsertProfile DEBE devolver void/Promise<void>
          startUpsert(async () => {
            await upsertProfile();
          });
        }}
        className="space-y-3 border rounded-lg p-4"
      >
        <label className="block text-sm font-medium">Usuario</label>
        <input
          name="username"
          placeholder="tu_usuario"
          className="w-full border rounded px-3 py-2"
        />

        <label className="block text-sm font-medium">Nombre para mostrar</label>
        <input
          name="display_name"
          placeholder="Tu nombre"
          className="w-full border rounded px-3 py-2"
        />

        <button
          type="submit"
          disabled={pendingUpsert}
          className="px-4 py-2 rounded border"
        >
          {pendingUpsert ? 'Guardando…' : 'Ya entré con el enlace — Crear/actualizar mi perfil'}
        </button>
      </form>
    </div>
  );
}
