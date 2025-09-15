'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';

/** Tipos de reacciones permitidas */
type ReactionKind = 'heart' | 'fire';

/** Crea/actualiza el perfil del usuario autenticado */
export async function upsertProfile() {
  'use server';

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const email = user.email ?? '';
  const username = email.split('@')[0] || `user_${user.id.slice(0, 6)}`;

  await supabase.from('profiles').upsert({
    id: user.id,
    username,
    display_name: username,
    avatar_url: null,
  });

  revalidatePath('/');
  return { ok: true };
}

/** Crea un post nuevo desde un <form action={createPost}> */
export async function createPost(formData: FormData) {
  'use server';

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const title = String(formData.get('title') ?? '').trim();
  const artist = String(formData.get('artist') ?? '').trim();
  const cover_url = (String(formData.get('cover_url') ?? '').trim() || null) as string | null;
  const external_url = (String(formData.get('external_url') ?? '').trim() || null) as string | null;
  const note = (String(formData.get('note') ?? '').trim() || null) as string | null;

  if (!title || !artist) {
    throw new Error('Canción y artista son obligatorios');
  }

  await supabase.from('posts').insert({
    user_id: user.id,
    title,
    artist,
    cover_url,
    external_url,
    note,
  });

  revalidatePath('/');
  // Si prefieres volver al home desde el server:
  // redirect('/');
}

/** Crea/actualiza la reacción del usuario a un post */
export async function react(postId: string, kind: ReactionKind) {
  'use server';

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  await supabase.from('reactions').upsert({
    post_id: postId,
    user_id: user.id,
    kind,
  });

  revalidatePath('/');
}
