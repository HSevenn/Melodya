'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

type Step = 'askEmail' | 'verify';

export default function LoginPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [step, setStep] = useState<Step>('askEmail');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function sendCode() {
    setErr(null);
    setLoading(true);
    try {
      // ✅ SIN emailRedirectTo => Supabase manda OTP (6 dígitos), NO magic link
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true, // permite registro automático
        },
      });
      if (error) throw error;
      sessionStorage.setItem('melodya:lastEmail', email);
      setStep('verify');
    } catch (e: any) {
      setErr(e.message ?? 'No se pudo enviar el código');
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setErr(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: 'email', // ✅ verifica OTP por email
      });
      if (error) throw error;
      router.replace('/'); // listo: usuario autenticado
    } catch (e: any) {
      setErr(e.message ?? 'Código inválido');
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!email) return;
    setErr(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true }, // sigue siendo OTP
      });
      if (error) throw error;
    } catch (e: any) {
      setErr(e.message ?? 'No se pudo reenviar el código');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 460, margin: '40px auto', padding: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Melodya</h1>
        <button
          onClick={() => router.push('/')}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd', background: '#fff' }}
        >
          Volver
        </button>
      </header>

      {step === 'askEmail' && (
        <main style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Iniciar sesión</h2>
          <p style={{ marginBottom: 12, opacity: 0.8 }}>
            Ingresa tu correo y te enviaremos un código de 6 dígitos.
          </p>
          <input
            type="email"
            placeholder="tucorreo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd', marginBottom: 12 }}
          />
          <button
            disabled={loading || !email}
            onClick={sendCode}
            style={{
              width: '100%', padding: 12, borderRadius: 8, border: 'none',
              background: '#111827', color: '#fff', cursor: loading || !email ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Enviando…' : 'Enviar código'}
          </button>
          {err && <p style={{ color: '#b91c1c', marginTop: 10 }}>{err}</p>}
        </main>
      )}

      {step === 'verify' && (
        <main style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Verificar código</h2>
          <p style={{ marginBottom: 12, opacity: 0.8 }}>
            Te enviamos un código de 6 dígitos a <b>{email}</b>.
          </p>
          <input
            inputMode="numeric"
            maxLength={6}
            placeholder="Código de 6 dígitos"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd', marginBottom: 12, letterSpacing: 2 }}
          />
          <button
            disabled={loading || code.trim().length !== 6}
            onClick={verifyCode}
            style={{
              width: '100%', padding: 12, borderRadius: 8, border: 'none',
              background: '#111827', color: '#fff', cursor: loading || code.trim().length !== 6 ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Verificando…' : 'Verificar'}
          </button>

          <button
            onClick={resend}
            disabled={loading}
            style={{
              width: '100%', marginTop: 10, padding: 10, borderRadius: 8,
              border: '1px solid #ddd', background: '#fff'
            }}
          >
            Reenviar código
          </button>
          {err && <p style={{ color: '#b91c1c', marginTop: 10 }}>{err}</p>}
        </main>
      )}
    </div>
  );
}
