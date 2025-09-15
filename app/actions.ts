// /app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import supabaseServer from '@/lib/supabase-server'; // ⬅️ default import

/* Tipos auxiliares (ejemplo)
type ReactionKind = 'heart' | 'fire';
*/

// ✅ Ejemplos de acciones (ajusta a tus acciones reales)

// Crea/actualiza el perfil tras login con magic link
export async function upsertProfile() {
  const supabase = supabaseServer(); // ⬅️ SIN await
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { id, email } = user;
  const username = email?.split('@')[0] ?? `user_${id.slice(0, 6)}`;

  await supabase.from('profiles').upsert({
    id,
    username,
    display_name: username,
    avatar_url: null,
  });

  revalidatePath('/');
}

// Crear post
export async function createPost(input: {
  title: string;
  artist: string;
  cover_url?: string | null;
  track_url?: string | null;
  note?: string | null;
}) {
  const supabase = supabaseServer(); // ⬅️ SIN await
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  await supabase.from('posts').insert({
    user_id: user.id,
    title: input.title,
    artist: input.artist,
    cover_url: input.cover_url ?? null,
    track_url: input.track_url ?? null,
    note: input.note ?? null,
  });

  revalidatePath('/');
  redirect('/');
}

// Reaccionar a un post
export async function react(postId: string, kind: 'heart' | 'fire') {
  const supabase = supabaseServer(); // ⬅️ SIN await
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  await supabase.from('reactions').upsert({
    post_id: postId,
    user_id: user.id,
    kind,
  });

  revalidatePath('/');
}
