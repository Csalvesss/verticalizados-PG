import { useState } from 'react';
import { signInWithGoogle, registerWithEmail, loginWithEmail } from '../services/authService';

type Mode = 'login' | 'register';

export function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleEmail = async () => {
    if (!email.trim() || !password.trim()) {
      setErro('Preencha todos os campos.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setErro('Informe seu nome.');
      return;
    }
    setLoading(true);
    setErro('');
    try {
      if (mode === 'register') {
        await registerWithEmail(email.trim(), password, name.trim());
      } else {
        await loginWithEmail(email.trim(), password);
      }
    } catch (e: any) {
      const code = e?.code || '';
      if (code === 'auth/email-already-in-use') setErro('Este e-mail já está em uso.');
      else if (code === 'auth/invalid-email') setErro('E-mail inválido.');
      else if (code === 'auth/weak-password') setErro('A senha deve ter pelo menos 6 caracteres.');
      else if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') setErro('E-mail ou senha incorretos.');
      else if (code === 'auth/operation-not-allowed') setErro('Login com e-mail não está ativado. Ative no Firebase Console.');
      else if (code === 'auth/too-many-requests') setErro('Muitas tentativas. Aguarde alguns minutos.');
      else if (code === 'auth/network-request-failed') setErro('Erro de rede. Verifique sua conexão.');
      else setErro('Erro ao entrar. Tente novamente. (' + code + ')');
      setLoading(false);
    }
  };

  const isIosStandalone = !!(navigator as any).standalone;

  const handleGoogle = async () => {
    setLoading(true);
    setErro('');
    try {
      await signInWithGoogle();
    } catch {
      setErro('Não foi possível entrar com Google.');
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 12,
    border: '1px solid #2f3336',
    background: '#0a0a0a',
    color: '#e7e9ea',
    fontSize: 15,
    fontFamily: 'Barlow, sans-serif',
    fontWeight: 500,
  };

  return (
    <div
      style={{
        background: '#000',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@700&family=Barlow:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button:active { transform: scale(0.98); opacity: 0.8; }
      `}</style>

      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div
          style={{
            width: 80,
            height: 80,
            background: '#F07830',
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 12px 40px rgba(240, 120, 48, 0.3)',
          }}
        >
          <svg width="44" height="48" viewBox="0 0 48 52" fill="none">
            <rect x="6" y="4" width="30" height="38" rx="3" fill="#F07830" stroke="#fff" strokeWidth="2.5" />
            <rect x="6" y="4" width="6" height="38" rx="2" fill="#D4621A" stroke="#fff" strokeWidth="1.5" />
            <rect x="19" y="13" width="3" height="16" rx="1.5" fill="#fff" />
            <rect x="14" y="18" width="13" height="3" rx="1.5" fill="#fff" />
          </svg>
        </div>
        <div
          style={{
            fontFamily: 'Bebas Neue',
            fontSize: 38,
            color: '#fff',
            letterSpacing: 4,
          }}
        >
          VERTICALIZADOS
        </div>
        <div
          style={{
            fontFamily: 'Barlow Condensed',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 4,
            color: '#71767b',
            marginTop: 2,
          }}
        >
          MJA ESPLANADA
        </div>
      </div>

      {/* Card */}
      <div
        style={{
          background: '#16181c',
          borderRadius: 24,
          padding: '32px 24px',
          width: '100%',
          maxWidth: 380,
          border: '1px solid #2f3336',
        }}
      >
        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: 24, borderRadius: 12, overflow: 'hidden', border: '1px solid #2f3336' }}>
          <button
            onClick={() => { setMode('login'); setErro(''); }}
            style={{
              flex: 1,
              padding: '10px 0',
              fontFamily: 'Barlow Condensed',
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: 1,
              color: mode === 'login' ? '#fff' : '#555',
              background: mode === 'login' ? '#F07830' : 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            ENTRAR
          </button>
          <button
            onClick={() => { setMode('register'); setErro(''); }}
            style={{
              flex: 1,
              padding: '10px 0',
              fontFamily: 'Barlow Condensed',
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: 1,
              color: mode === 'register' ? '#fff' : '#555',
              background: mode === 'register' ? '#F07830' : 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            CRIAR CONTA
          </button>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && (
            <input
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
          )}
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleEmail(); }}
            style={inputStyle}
          />
        </div>

        {erro && (
          <div
            style={{
              fontFamily: 'Barlow',
              fontSize: 13,
              color: '#f4212e',
              textAlign: 'center',
              marginTop: 12,
              fontWeight: 500,
            }}
          >
            {erro}
          </div>
        )}

        {/* Email button */}
        <button
          onClick={handleEmail}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 999,
            background: loading ? '#333' : '#F07830',
            color: '#fff',
            fontFamily: 'Barlow',
            fontWeight: 700,
            fontSize: 15,
            border: 'none',
            cursor: loading ? 'default' : 'pointer',
            marginTop: 20,
          }}
        >
          {loading ? 'Aguarde...' : mode === 'register' ? 'Criar Conta' : 'Entrar'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#2f3336' }} />
          <span style={{ fontFamily: 'Barlow', fontSize: 12, color: '#555', fontWeight: 600 }}>OU</span>
          <div style={{ flex: 1, height: 1, background: '#2f3336' }} />
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '14px',
            borderRadius: 999,
            background: '#fff',
            color: '#000',
            fontFamily: 'Barlow',
            fontWeight: 700,
            fontSize: 15,
            border: 'none',
            cursor: loading ? 'default' : 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Entrar com Gmail
        </button>

        {/* iOS standalone hint */}
        {isIosStandalone && (
          <div style={{ marginTop: 14 }}>
            <div style={{
              background: 'rgba(240,120,48,0.08)',
              border: '1px solid rgba(240,120,48,0.2)',
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💡</span>
              <div>
                <div style={{ fontFamily: 'Barlow', fontWeight: 700, fontSize: 13, color: '#F07830', marginBottom: 4 }}>
                  Primeira vez com Google?
                </div>
                <div style={{ fontFamily: 'Barlow', fontSize: 13, color: '#999', lineHeight: 1.5 }}>
                  Entre pelo Safari uma vez. Depois, o app vai te reconhecer automaticamente.
                </div>
              </div>
            </div>
            <button
              onClick={() => window.open('https://verticalizados-pg.netlify.app', '_blank')}
              style={{
                width: '100%',
                marginTop: 10,
                padding: '12px',
                borderRadius: 999,
                background: 'transparent',
                border: '1px solid rgba(240,120,48,0.4)',
                color: '#F07830',
                fontFamily: 'Barlow Condensed',
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: 0.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#F07830">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              Abrir no Safari para login com Google
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: 24,
          fontFamily: 'Barlow Condensed',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 2,
          color: '#2f3336',
        }}
      >
        VERTICALIZADOS v2.0
      </div>
    </div>
  );
}
