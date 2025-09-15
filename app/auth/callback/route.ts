import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const access_token = url.searchParams.get('access_token');
  const refresh_token = url.searchParams.get('refresh_token');

  const supabase = await supabaseServer();

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw new Error(`exchangeCodeForSession: ${error.message}`);
    } else if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token } as any);
      if (error) throw new Error(`setSession: ${error.message}`);
    } else {
      throw new Error('no_code_or_tokens');
    }
  } catch (e: any) {
    const msg = encodeURIComponent(e?.message || 'unknown');
    return NextResponse.redirect(new URL(`/login?error=${msg}`, url.origin));
  }

  return NextResponse.redirect(new URL('/', url.origin));
}
