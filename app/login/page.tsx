'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  type Step = 'email' | 'code';
  const [step, setStep] = useState<Step>('email');

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // precargar correo si ya lo guardamos antes
  useEffect(() => {
    const saved = sessionStorage.getItem('melodya:lastEmail');
    if (saved) setEmail(saved);
  }, []);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setErr(null);
    if (!email) return setErr('Escribe tu correo.');

    setLoading(true);
    // 👉 OTP por correo (sin link)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true, // crea usuario si no existe
        // importante: no ponemos emailRedirectTo para que NO sea magic link
      },
    });
    setLoading(false);

    if (error) return setErr(error.message);

    sessionStorage.setItem('melodya:lastEmail', email);
    setStep('code');
  }

  async function verifyCode(e?: React.FormEvent) {
    e?.preventDefault();
    setErr(null);
    if (!email) return setErr('Falta el correo.');
    if (!code || code.trim().length !== 6) {
      return setErr('El código debe tener 6 dígitos.');
    }

    setLoading(true);
    // 👉 verificar OTP de 6 dígitos
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'email', // ¡clave! para código por correo
    });
    setLoading(false);

    if (error) return setErr(error.message);
    if (!data.session) return setErr('No se creó la sesión.');

    // listo: refrescamos y vamos al home
    router.replace('/');
    router.refresh();
  }

  function resetToEmail() {
    setStep('email');
    setCode('');
    setErr(null);
  }

  async function resend() {
    if (loading) return;
    await sendCode();
  }

  return (
    <div style={{ maxWidth: 420, margin: '32px auto', padding: '0 16px' }}>
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

        {step === 'email' && (
          <form onSubmit={sendCode}>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="tucorreo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #d1d5db',
                marginBottom: 12,
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: 'none',
                background: '#111827',
                color: '#fff',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Enviando…' : 'Enviar código'}
            </button>
            {err && <p style={{ color: '#b91c1c', marginTop: 10 }}>{err}</p>}
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={verifyCode}>
            <p style={{ opacity: 0.8, marginBottom: 8 }}>
              Te enviamos un código de <strong>6 dígitos</strong> a <strong>{email}</strong>.
            </p>

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Código de 6 dígitos"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D+/g, '').slice(0, 6))}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #d1d5db',
                letterSpacing: '4px',
                textAlign: 'center',
                fontWeight: 700,
                marginBottom: 12,
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: 'none',
                background: '#111827',
                color: '#fff',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Verificando…' : 'Verificar'}
            </button>

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button
                type="button"
                onClick={resend}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                Reenviar código
              </button>
              <button
                type="button"
                onClick={resetToEmail}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                Cambiar correo
              </button>
            </div>

            {err && <p style={{ color: '#b91c1c', marginTop: 10 }}>{err}</p>}
          </form>
        )}
      </main>
    </div>
  );
}
