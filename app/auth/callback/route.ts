// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { upsertProfile } from '@/app/actions';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', req.url));
  }

const supabase = await supabaseServer();
const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, req.url)
    );
  }

  // crea/actualiza perfil después de iniciar sesión
  await upsertProfile();

  // a dónde quieres mandar al usuario después de loguear:
  return NextResponse.redirect(new URL('/', req.url));
}
