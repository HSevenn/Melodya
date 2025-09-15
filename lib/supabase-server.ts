// /lib/supabase-server.ts
'use server';

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function supabaseServer() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,        // ← pon estas envs en Vercel
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,   // ← idem
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options?: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options?: CookieOptions) {
          // “borrar” cookie
          cookieStore.set({ name, value: '', ...options, expires: new Date(0) });
        },
      },
    }
  );

  return supabase;
}
