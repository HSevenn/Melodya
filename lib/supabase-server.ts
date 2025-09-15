// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  // Si no viene el código, vuelve al home o al login
  if (!code) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // 👇 OJO: aquí SÍ va el await
  const supabase = await supabaseServer();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const to = new URL('/login', req.url);
    to.searchParams.set('error', error.message);
    return NextResponse.redirect(to);
  }

  // Listo: sesión creada. Redirige al home (o donde prefieras)
  return NextResponse.redirect(new URL('/', req.url));
}
