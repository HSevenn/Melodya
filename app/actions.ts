// /app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';

/** Tipos útiles */
type ReactionKind = 'heart' | 'fire';

/** Pequeño helper para asegurar sesión */
async function getCurrentUser() {
  const supabase = await supabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('No autenticado');
  return { supabase, user };
}

/** Crea/actualiza perfil al loguear con magic link */
export async function upsertProfile() {
  const { supabase, user } = await getCurrentUser();

  const email = user.email ?? '';
  const username = email.split('@')[0] || `user_${user.id.slice(0, 6)}`;

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    username,
    display_name: username,
    avatar_url: null,
  });

  if (error) throw error;

  // refresca feed y perfil
  revalidatePath('/');
  revalidatePath(`/u/${username}`);
}

/** Enviar magic link */
export async function loginWithMagicLink(email: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/login`
        : undefined,
    },
  });
  if (error) throw error;
}

/** Cerrar sesión */
export async function logout() {
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  redirect('/login');
}

/** Crear post (desde /new) */
export async function createPost(formData: FormData) {
  const { supabase, user } = await getCurrentUser();

  const track_id  = String(formData.get('track_id') || '');
  const title     = String(formData.get('title') || '');
  const artist    = String(formData.get('artist') || '');
  const cover_url = String(formData.get('cover_url') || '');
  const note      = String(formData.get('note') || '');

  if (!track_id || !title || !artist) {
    throw new Error('Faltan datos de la canción');
  }

  const { error } = await supabase.from('posts').insert({
    user_id: user.id,
    track_id,
    title,
    artist,
    cover_url: cover_url || null,
    note: note || null,
  });

  if (error) throw error;

  revalidatePath('/');
  redirect('/');
}

/** Reaccionar (❤️ / 🔥) a un post */
export async function react(postId: string, kind: ReactionKind) {
  const { supabase, user } = await getCurrentUser();

  const { error } = await supabase.from('reactions').upsert({
    user_id: user.id,
    post_id: postId,
    kind,
  }, { onConflict: 'user_id,post_id' });

  if (error) throw error;

  revalidatePath('/'); // refresca feed
}

/** Eliminar post propio */
export async function deletePost(postId: string) {
  const { supabase, user } = await getCurrentUser();

  // asegura ownership
  const { data: post, error: fetchErr } = await supabase
    .from('posts')
    .select('id,user_id')
    .eq('id', postId)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!post) throw new Error('Post no encontrado');
  if (post.user_id !== user.id) throw new Error('No autorizado');

  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) throw error;

  revalidatePath('/');
}

/** Seguir / dejar de seguir a un usuario */
export async function toggleFollow(targetUserId: string) {
  const { supabase, user } = await getCurrentUser();

  // ¿ya lo sigo?
  const { data: existing, error: qErr } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .maybeSingle();

  if (qErr && qErr.code !== 'PGRST116') throw qErr; // ignora "no rows"

  let error = null;
  if (existing) {
    const res = await supabase
      .from('follows')
      .delete()
      .eq('id', existing.id);
    error = res.error;
  } else {
    const res = await supabase
      .from('follows')
      .insert({ follower_id: user.id, following_id: targetUserId });
    error = res.error;
  }
  if (error) throw error;

  revalidatePath('/');
}
