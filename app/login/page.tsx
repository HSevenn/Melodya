'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

export const dynamic = 'force-dynamic';

type Step = 'email' | 'code';

export default function LoginPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [step, setStep] = useState<Step>('email');

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const saved = sessionStorage.getItem('melodya:lastEmail');
    if (saved && !email) setEmail(saved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSending(true);
    setError(null);

    // ❗ Enviamos OTP (no usamos emailRedirectTo)
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });

    setSending(false);

    if (err) {
      setError(err.message || 'No se pudo enviar el código.');
      return;
    }

    sessionStorage.setItem('melodya:lastEmail', email.trim().toLowerCase());
    setStep('code');
    setCooldown(30);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) return;

    setVerifying(true);
    setError(null);

    // Verifica OTP de email (6 dígitos)
    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: 'email',
    });

    setVerifying(false);

    if (err) {
      setError(err.message || 'Código inválido o expirado.');
      return;
    }

    router.replace('/');
  };

  const handleResend = async () => {
    if (cooldown > 0 || sending) return;
    if (!email) {
      setError('Ingresa tu correo primero.');
      return;
    }

    setSending(true);
    setError(null);

    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });

    setSending(false);

    if (err) {
      setError(err.message || 'No se pudo reenviar el código.');
      return;
    }
    setCooldown(30);
  };

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
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
          {step === 'email' ? 'Entrar' : 'Verificar código'}
        </h2>

        {step === 'email' && (
          <form onSubmit={handleSendCode} style={{ display: 'grid', gap: 12 }}>
            <label style={{ fontSize: 14, opacity: 0.8 }}>Tu correo</label>
            <input
              type="email"
              inputMode="email"
              required
              autoFocus
              placeholder="tucorreo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ height: 44, borderRadius: 10, border: '1px solid #d1d5db', padding: '0 12px' }}
            />

            <button
              type="submit"
              disabled={sending || !email}
              style={{
                height: 44, borderRadius: 10, border: 'none',
                background: '#111827', color: '#fff', fontWeight: 600,
                cursor: sending || !email ? 'not-allowed' : 'pointer',
              }}
            >
              {sending ? 'Enviando…' : 'Enviar código'}
            </button>

            {error && <p style={{ color: '#b91c1c', marginTop: 6, fontWeight: 600 }}>{error}</p>}
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerify} style={{ display: 'grid', gap: 12 }}>
            <p style={{ fontSize: 14, opacity: 0.8 }}>
              Te enviamos un código de <strong>6 dígitos</strong> a <strong>{email}</strong>.
            </p>

            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="Código de 6 dígitos"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              style={{
                height: 44, borderRadius: 10, border: '1px solid #d1d5db',
                padding: '0 12px', letterSpacing: 2,
              }}
            />

            <button
              type="submit"
              disabled={verifying || code.length !== 6}
              style={{
                height: 44, borderRadius: 10, border: 'none',
                background: '#111827', color: '#fff', fontWeight: 600,
                cursor: verifying || code.length !== 6 ? 'not-allowed' : 'pointer',
              }}
            >
              {verifying ? 'Verificando…' : 'Verificar'}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={sending || cooldown > 0}
              style={{
                height: 42, borderRadius: 10, border: '1px solid #d1d5db',
                background: '#fff', cursor: sending || cooldown > 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {sending ? 'Reenviando…' : cooldown > 0 ? `Reenviar código (${cooldown})` : 'Reenviar código'}
            </button>

            {error && <p style={{ color: '#b91c1c', marginTop: 6, fontWeight: 600 }}>{error}</p>}
          </form>
        )}
      </main>
    </div>
  );
}
