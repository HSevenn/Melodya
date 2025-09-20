// app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

type Step = 'email' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Si el usuario ya está logueado, lo mandamos al home
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/');
    });
  }, [router, supabase]);

  // Cooldown para “Reenviar código”
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  async function handleSendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!email) return setError('Escribe tu correo');

    setSending(true);
    try {
      // 🔑 Enviar OTP (SIN emailRedirectTo => NO magic link)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true, // crea cuenta si no existe
        },
      });
      if (error) throw error;

      // Guardamos por si el usuario vuelve a esta página
      sessionStorage.setItem('melodya:lastEmail', email);

      setStep('otp');
      setResendCooldown(30); // evita spam
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo enviar el código');
    } finally {
      setSending(false);
    }
  }

  async function handleVerify(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!token || token.length < 6) return setError('Escribe el código de 6 dígitos');

    setVerifying(true);
    try {
      // ✅ Verificar OTP
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email', // OTP por correo
      });
      if (error) throw error;
      if (!data.session) throw new Error('No se pudo iniciar sesión');

      router.replace('/');
    } catch (err: any) {
      setError(err?.message ?? 'Código inválido o expirado');
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    if (!email) return setError('No tengo el correo para reenviar');

    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) {
      setError(error.message);
    } else {
      setResendCooldown(30);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', padding: '0 16px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Melodya</h1>
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          Volver
        </button>
      </header>

      <main style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
          {step === 'email' ? 'Entrar' : 'Verificar código'}
        </h2>

        {error && (
          <p style={{ color: '#b91c1c', fontWeight: 600, marginBottom: 12 }}>{error}</p>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} style={{ display: 'grid', gap: 10 }}>
            <input
              type="email"
              placeholder="tucorreo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }}
            />
            <button
              type="submit"
              disabled={sending}
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                border: 'none',
                background: '#111827',
                color: '#fff',
                cursor: sending ? 'not-allowed' : 'pointer',
                fontWeight: 700,
              }}
            >
              {sending ? 'Enviando…' : 'Enviar código'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} style={{ display: 'grid', gap: 10 }}>
            <input
              type="email"
              value={email}
              disabled
              style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db', opacity: 0.8 }}
            />
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="Código de 6 dígitos"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
              style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db', letterSpacing: 4 }}
            />
            <button
              type="submit"
              disabled={verifying}
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                border: 'none',
                background: '#111827',
                color: '#fff',
                cursor: verifying ? 'not-allowed' : 'pointer',
                fontWeight: 700,
              }}
            >
              {verifying ? 'Verificando…' : 'Verificar'}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              style={{
                marginTop: 4,
                background: 'transparent',
                border: 'none',
                color: '#111827',
                textDecoration: 'underline',
                cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {resendCooldown > 0 ? `Reenviar código en ${resendCooldown}s` : 'Reenviar código'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
