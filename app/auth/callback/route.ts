// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  // vamos a construir desde ya la respuesta a la que pegaremos las cookies
  const res = NextResponse.redirect(new URL('/', url.origin));

  // Cliente de Supabase para Route Handler, escribiendo cookies en `res`
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options?: CookieOptions) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options?: CookieOptions) {
          res.cookies.set({ name, value: '', ...options, expires: new Date(0) });
        },
      },
    }
  );

  try {
    const code = url.searchParams.get('code');

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } else {
      // soporte para el formato hash (#access_token=...) que tuviste antes
      const access_token = url.searchParams.get('access_token');
      const refresh_token = url.searchParams.get('refresh_token');
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) throw error;
      }
    }
  } catch {
    return NextResponse.redirect(new URL('/login?error=1', url.origin));
  }

  // MUY IMPORTANTE: devolver `res` (que ya lleva las cookies pegadas)
  return res;
}
