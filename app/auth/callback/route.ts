// /app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;

  // Supabase añade ?code=... en el redirect del magic link
  const code = url.searchParams.get('code');
  // Permite pasar ?next=/new, por ejemplo. Por defecto te llevo al /login
  const next = url.searchParams.get('next') || '/login';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', origin));
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, origin)
    );
  }

  // Sesión creada en cookies -> redirige a la página indicada
  return NextResponse.redirect(new URL(next, origin));
}
