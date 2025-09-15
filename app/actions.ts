// /app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';

/* ------------------------- 1) MAGIC LINK ------------------------- */
export async function sendMagicLink(formData: FormData) {
  const email = (formData.get('email') ?? '') as string;
  const redirectTo =
    (formData.get('redirectTo') as string | null) ||
    `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

  if (!email) throw new Error('Escribe tu correo');

  const supabase = supabaseServer();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    console.error('Error enviando Magic Link:', error.message);
    throw new Error('No se pudo enviar el Magic Link');
  }
}

/* --------------------- 2) PERFIL (UPSERT) ------------------------ */
export async function upsertProfile() {
  const supabase = supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  // No devolvemos nada → Promise<void> (requerido por <form action>)
}

/* ----------------------- 3) NUEVO POST --------------------------- */
export async function createPost(formData: FormData) {
  const supabase = supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const title = String(formData.get('title') ?? '').trim();
  const artist = String(formData.get('artist') ?? '').trim();
  const cover_url = (String(formData.get('cover_url') ?? '').trim() || null) as string | null;
  const external_url = (String(formData.get('external_url') ?? '').trim() || null) as string | null;
  const note = (String(formData.get('note') ?? '').trim() || null) as string | null;

  if (!title || !artist) throw new Error('Canción y artista son obligatorios');

  await supabase.from('posts').insert({
    user_id: user.id,
    title,
    artist,
    cover_url,
    external_url,
    note,
  });

  revalidatePath('/');
  // Si prefieres redirigir desde el server:
  // redirect('/');
}

/* ------------------------ 4) REACCIONES -------------------------- */
type ReactionKind = 'heart' | 'fire';

export async function react(postId: string, kind: ReactionKind) {
  const supabase = supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  await supabase.from('reactions').upsert({
    post_id: postId,
    user_id: user.id,
    kind,
  });

  revalidatePath('/');
}
