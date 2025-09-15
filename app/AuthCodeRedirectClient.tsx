'use client';
import { useEffect } from 'react';

/** Detecta ?code=... o tokens en el hash y reenvía al callback */
export default function AuthCodeRedirectClient() {
  useEffect(() => {
    const url = new URL(window.location.href);

    // 1) Supabase con PKCE usa ?code=...
    const code = url.searchParams.get('code');

    // 2) Algunos correos o navegadores ponen tokens en el hash (#access_token=...)
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = hashParams.get('access_token');

    if (code || accessToken) {
      // Conserva todos los query params y limpia el hash
      const qs = url.searchParams.toString();
      window.location.replace(`/auth/callback?${qs}`);
    }
  }, []);

  return null;
}
