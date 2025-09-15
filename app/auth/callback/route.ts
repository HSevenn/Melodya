// /app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import supabaseServer from '@/lib/supabase-server'; // ⬅️ default import

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? '/';
  if (!code) {
    return NextResponse.redirect(`${base}/login?error=missing_code`);
  }

  const supabase = supabaseServer(); // ⬅️ SIN await
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${base}/login?error=auth`);
  }

  // Opcional: crear/actualizar perfil aquí, o confías en tu acción upsertProfile()
  return NextResponse.redirect(`${base}/login?ok=1`);
}
