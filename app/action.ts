'use server';

import { revalidatePath } from 'next/cache';
import { supabaseServer } from '@/lib/supabase-server';

/** Crea/actualiza perfil al loguear con magic link */
export async function upsertProfile() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { id, email } = user;
  const username = email?.split('@')[0] ?? `user_${id.slice(0,6)}`;

  await supabase.from('profiles').upsert({
    id,
    username,
    display_name: username,
    avatar_url: null,
  });
}

/** Crear post (manual) */
export async function createPost(formData: FormData) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const title = String(formData.get('title') || '').trim();
  const artist = String(formData.get('artist') || '').trim();
  const cover_url = String(formData.get('cover_url') || '').trim();
  const external_url = String(formData.get('external_url') || '').trim();
  const note = String(formData.get('note') || '').trim();

  if (!title || !artist) throw new Error('Faltan campos');

  const { error } = await supabase.from('posts').insert({
    user_id: user.id,
    title, artist, cover_url, external_url, note,
  });
  if (error) throw error;

  revalidatePath('/');
}

/** Reaccionar ❤️/🔥 */
export async function react(postId: string, kind: 'heart'|'fire') {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  await supabase.from('reactions').upsert({
    post_id: postId,
    user_id: user.id,
    kind,
  }, { onConflict: 'post_id,user_id,kind' });

  revalidatePath('/');
}