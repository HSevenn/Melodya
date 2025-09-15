'use client';
import { useEffect } from 'react';

function parseHash(hash: string) {
  const h = new URLSearchParams(hash.replace(/^#/, ''));
  return {
    access_token: h.get('access_token') || '',
    refresh_token: h.get('refresh_token') || '',
    type: h.get('type') || '',
  };
}

/** Si el magic link llega como ?code=... o como #access_token=..., redirige a /auth/callback */
export default function AuthCodeRedirectClient() {
  useEffect(() => {
    const url = new URL(window.location.href);

    // 1) PKCE (?code=...)
    const code = url.searchParams.get('code');
    if (code) {
      window.location.replace(`/auth/callback?code=${encodeURIComponent(code)}`);
      return;
    }

    // 2) Hash (#access_token=...)
    if (window.location.hash.startsWith('#')) {
      const { access_token, refresh_token, type } = parseHash(window.location.hash);
      if (access_token && refresh_token) {
        const qp = new URLSearchParams({ access_token, refresh_token, ...(type ? { type } : {}) });
        window.location.replace(`/auth/callback?${qp.toString()}`);
      }
    }
  }, []);

  return null;
}