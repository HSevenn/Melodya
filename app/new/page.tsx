'use client';
import { useState } from 'react';
import { createPost } from '@/app/actions';

export default function NewPostPage() {
  const [pending, setPending] = useState(false);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Nueva publicación</h1>

      <form action={async (fd) => {
        try {
          setPending(true);
          await createPost(fd);
          window.location.href = '/';
        } catch (e: any) {
          alert(e?.message || 'Error');
        } finally {
          setPending(false);
        }
      }} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Canción</label>
          <input name="title" className="w-full border rounded px-3 py-2" placeholder="Ej: Runaway"/>
        </div>
        <div>
          <label className="block text-sm mb-1">Artista</label>
          <input name="artist" className="w-full border rounded px-3 py-2" placeholder="Kanye West"/>
        </div>
        <div>
          <label className="block text-sm mb-1">Portada (URL)</label>
          <input name="cover_url" className="w-full border rounded px-3 py-2" placeholder="https://.../cover.jpg"/>
        </div>
        <div>
          <label className="block text-sm mb-1">Enlace externo (Spotify/Apple)</label>
          <input name="external_url" className="w-full border rounded px-3 py-2" placeholder="https://open.spotify.com/track/..."/>
        </div>
        <div>
          <label className="block text-sm mb-1">Nota (opcional)</label>
          <textarea name="note" className="w-full border rounded px-3 py-2" rows={3} placeholder="Este tema me inspira..."/>
        </div>

        <button disabled={pending} className="px-4 py-2 bg-black text-white rounded">
          {pending ? 'Publicando…' : 'Publicar'}
        </button>
      </form>
    </div>
  );
}