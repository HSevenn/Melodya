// /app/actions.ts
'use server';

import { supabaseServer } from '@/lib/supabase-server';

function sanitize(s: unknown) {
  return String(s ?? '').trim();
}

export async function createPost(fd: FormData) {
  const supabase = supabaseServer(); // ✅ sin await

  // Autenticación (RLS requiere un usuario válido)
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error('Error de sesión. Intenta de nuevo.');
  if (!auth?.user) throw new Error('Debes iniciar sesión para publicar.');

  // Datos
  const title = sanitize(fd.get('title'));
  const artist = sanitize(fd.get('artist'));
  const cover_url = sanitize(fd.get('cover_url'));
  const external_url = sanitize(fd.get('external_url'));
  const note = sanitize(fd.get('note'));

  // Validación mínima
  if (!title || !artist) {
    throw new Error('Canción y Artista son obligatorios.');
  }

  // (Opcional) límites de longitud para evitar basura excesiva
  if (title.length > 140) throw new Error('El título es muy largo (máx. 140).');
  if (artist.length > 140) throw new Error('El artista es muy largo (máx. 140).');
  if (note.length > 500) throw new Error('La nota es muy larga (máx. 500).');

  // Insert
  const { error } = await supabase.from('posts').insert({
    user_id: auth.user.id,
    title,
    artist,
    cover_url: cover_url || null,
    external_url: external_url || null,
    note: note || null,
  });

  if (error) {
    throw new Error(error.message || 'No se pudo crear la publicación.');
  }
}
