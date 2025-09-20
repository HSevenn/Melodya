'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

type Step = 'email' | 'code';

export default function LoginPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Si ya habías enviado un código antes, vuelve al paso "code"
  useEffect(() => {
    const saved = sessionStorage.getItem('melodya:lastEmail') || '';
    if (saved) {
      setEmail(saved);
      setStep('code');
    }
  }, []);

  // Si ya hay sesión, a Home
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace('/');
    })();
  }, [router, supabase]);

  async function handleSend() {
    setMsg(null);
    if (!email) {
      setMsg('Escribe tu correo');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      // SIN redirect, para usar solo OTP por correo
      // (si dejas redirect, Supabase intentará Magic Link/PKCE)
      options: {},
    });
    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    sessionStorage.setItem('melodya:lastEmail', email);
    setStep('code');
    setMsg('Te enviamos un código de 6 dígitos a tu correo.');
  }

  async function handleVerify(e?: React.FormEvent) {
    e?.preventDefault();
    setMsg(null);

    if (!email) {
      setMsg('Falta el correo. Vuelve al paso anterior.');
      setStep('email');
      return;
    }
    if (code.trim().length !== 6) {
      setMsg('El código debe tener 6 dígitos.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'email', // <- clave para OTP por correo
    });
    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    // Si llegó aquí, ya hay sesión
    sessionStorage.removeItem('melodya:lastEmail');
    setMsg(null);
    router.replace('/');
  }

  async function handleResend() {
    if (!email) {
      setMsg('No tengo el correo para reenviar.');
      return;
    }
    setLoading(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({ email, options: {} });
    setLoading(false);
    if (error) setMsg(error.message);
    else setMsg('Te reenviamos un nuevo código.');
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: '0 16px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Melodya</h1>
        <button
          onClick={() => router.push('/')}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}
        >
          Volver
        </button>
      </header>

      <main style={{ marginTop: 28 }}>
        {step === 'email' && (
          <>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Entrar</h2>
            <p style={{ opacity: 0.8, marginBottom: 14 }}>
              Te enviaremos un <strong>código de 6 dígitos</strong> a tu correo.
            </p>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 12 }}
            />
            <button
              onClick={handleSend}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#111827',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Enviando…' : 'Enviar código'}
            </button>
          </>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerify}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Verificar código</h2>
            <p style={{ opacity: 0.8, marginBottom: 8 }}>
              Te enviamos un código de 6 dígitos a <b>{email}</b>.
            </p>

            <input
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Código de 6 dígitos"
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 12 }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#111827',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Verificando…' : 'Verificar'}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                background: '#fff',
                marginTop: 10,
              }}
            >
              Reenviar código
            </button>

            <button
              type="button"
              onClick={() => setStep('email')}
              style={{ display: 'block', marginTop: 10, opacity: 0.8 }}
            >
              Cambiar correo
            </button>
          </form>
        )}

        {msg && <p style={{ marginTop: 14, color: '#b91c1c' }}>{msg}</p>}
      </main>
    </div>
  );
}
