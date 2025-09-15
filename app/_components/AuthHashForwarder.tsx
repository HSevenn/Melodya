'use client';
import { useEffect } from 'react';

export default function AuthHashForwarder() {
  useEffect(() => {
    // Si el magic link llegó con #access_token=... en la URL,
    // movemos ese hash a /auth/callback como query (?access_token=...)
    if (typeof window === 'undefined') return;
    if (!window.location.hash) return;

    const hash = new URLSearchParams(window.location.hash.slice(1)); // quita el '#'
    const access_token = hash.get('access_token');
    const refresh_token = hash.get('refresh_token');

    if (access_token && refresh_token) {
      const u = new URL('/auth/callback', window.location.origin);
      u.searchParams.set('access_token', access_token);
      u.searchParams.set('refresh_token', refresh_token);
      window.location.replace(u.toString());
    }
  }, []);

  return null;
}
