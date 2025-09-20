'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

type Step = 'request' | 'verify';

export default function LoginPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);

    if (!email) {
      setErr('Ingresa tu correo.');
      return;
    }

    try {
      setLoading(true);

      // Guardamos el email por si luego quieres reintentar
      sessionStorage.setItem('melodya:lastEmail', email);

      // Enviar OTP por email (NO usa redirect/callback)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true, // crea usuario si no existe
          // sin emailRedirectTo, porque no hay redirección
        },
      });

      if (error) throw error;

      setInfo('Te enviamos un código de 6 dígitos a tu correo.');
      setStep('verify');
    } catch (e: any) {
      setErr(e?.message ?? 'No se pudo enviar el código.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);

    if (!email || !token) {
      setErr('Completa correo y código.');
      return;
    }

    try {
      setLoading(true);

      // Verificar OTP (tipo 'email')
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) throw error;

      // Sesión creada. Redirige al home (o donde quieras)
      router.replace('/');
    } catch (e: any) {
      setErr(e?.message ?? 'Código inválido o expirado.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setErr(null);
    setInfo(null);

    try {
      setLoading(true);
      const targetEmail =
        email || sessionStorage.getItem('melodya:lastEmail') || '';

      if (!targetEmail) {
        setErr('No tengo un correo para reenviar. Escribe tu correo otra vez.');
        setStep('request');
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: targetEmail,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;

      setInfo('Hemos reenviado el código a tu correo.');
      if (!email) setEmail(targetEmail);
      setStep('verify');
    } catch (e: any) {
      setErr(e?.message ?? 'No se pudo reenviar el código.');
    } finally {
      setLoading(false);
    }
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
        <h2 style={{ fontSize: 20, marginBottom: 6 }}>
          {step === 'request' ? 'Iniciar sesión' : 'Verificar código'}
        </h2>

        <p style={{ opacity: 0.8, marginBottom: 14 }}>
          {step === 'request'
            ? 'Te enviaremos un código de 6 dígitos a tu correo.'
            : 'Escribe el código de 6 dígitos que te llegó por correo.'}
        </p>

        {err && (
          <p style={{ color: '#b91c1c', fontWeight: 600, marginBottom: 10 }}>{err}</p>
        )}
        {info && (
          <p style={{ color: '#065f46', fontWeight: 600, marginBottom: 10 }}>{info}</p>
        )}

        {step === 'request' ? (
          <form onSubmit={requestCode}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                marginBottom: 10,
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: 'none',
                background: '#111827',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Enviando…' : 'Enviar código'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                marginBottom: 10,
              }}
            />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Código de 6 dígitos"
              required
              maxLength={6}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                marginBottom: 10,
                letterSpacing: 2,
                textAlign: 'center',
                fontWeight: 700,
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: 'none',
                background: '#111827',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: 10,
              }}
            >
              {loading ? 'Verificando…' : 'Verificar'}
            </button>

            <button
              type="button"
              onClick={resend}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                background: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Reenviar código
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
