// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await supabaseServer();
    // Intercambia el "code" por la sesión y setea cookies
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Vuelve al home (o a donde prefieras)
  return NextResponse.redirect(new URL('/', request.url));
}
