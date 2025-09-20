'use client';

import { useEffect } from 'react';

export default function AuthCodeRedirectClient() {
  useEffect(() => {
    try {
      // No hagas nada si ya estás en /auth/callback
      if (location.pathname.startsWith('/auth/callback')) return;

      const url = new URL(location.href);

      // --- Leer posibles params en QUERY ---
      const codeQ = url.searchParams.get('code');
      const atQ = url.searchParams.get('access_token');
      const rtQ = url.searchParams.get('refresh_token');

      // --- Leer posibles params en HASH ---
      const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
      const atH = hash.get('access_token');
      const rtH = hash.get('refresh_token');

      // Si existe code o (access+refresh) en cualquier lado, construimos la redirección
      const hasTokens = (atQ && rtQ) || (atH && rtH);
      if (codeQ || hasTokens) {
        const params = new URLSearchParams();

        if (codeQ) params.set('code', codeQ);

        // Prioriza tokens en QUERY; si no, toma los del HASH
        const access_token = atQ || atH || '';
        const refresh_token = rtQ || rtH || '';
        if (access_token && refresh_token) {
          params.set('access_token', access_token);
          params.set('refresh_token', refresh_token);
        }

        // Preserva ?next= si lo hubiere
        const next = url.searchParams.get('next');
        if (next) params.set('next', next);

        location.replace(`/auth/callback?${params.toString()}`);
      }
    } catch {
      // no-op
    }
  }, []);

  return null;
}
