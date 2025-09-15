// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  // Preparamos la respuesta a la que vamos a redirigir
  const redirectTo = new URL('/', url.origin);
  const res = NextResponse.redirect(redirectTo);

  // Cliente de Supabase que LEE de req.cookies y ESCRIBE en res.cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options?: CookieOptions) {
          res.cookies.set(name, value, options as any);
        },
        remove(name: string, options?: CookieOptions) {
          res.cookies.set(name, '', { ...options, expires: new Date(0) } as any);
        },
      },
    }
  );

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } else {
      // Soporte para enlaces viejos con tokens en query (poco común en 2024+)
      const access_token = url.searchParams.get('access_token');
      const refresh_token = url.searchParams.get('refresh_token');
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token } as any);
        if (error) throw error;
      }
    }
  } catch {
    return NextResponse.redirect(new URL('/login?error=1', url.origin));
  }

  // MUY IMPORTANTE: devolver la misma `res` donde escribimos las cookies
  return res;
}
