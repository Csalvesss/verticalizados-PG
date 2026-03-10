import { useState } from 'react';
import { signInWithGoogle } from '../services/authService';

export function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const entrar = async () => {
    setLoading(true);
    setErro('');
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error(e);
      setErro('Não foi possível entrar. Tente novamente.');
      setLoading(false);
    }
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
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@700&family=Barlow:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button:active { transform: scale(0.98); opacity: 0.8; }
      `}</style>

      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <div
          style={{
            width: 88,
            height: 88,
            background: '#F07830',
            borderRadius: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 12px 40px rgba(240, 120, 48, 0.3)',
          }}
        >
          <svg width="48" height="52" viewBox="0 0 48 52" fill="none">
            <rect x="6" y="4" width="30" height="38" rx="3" fill="#F07830" stroke="#fff" strokeWidth="2.5" />
            <rect x="6" y="4" width="6" height="38" rx="2" fill="#D4621A" stroke="#fff" strokeWidth="1.5" />
            <rect x="19" y="13" width="3" height="16" rx="1.5" fill="#fff" />
            <rect x="14" y="18" width="13" height="3" rx="1.5" fill="#fff" />
          </svg>
        </div>
        <div
          style={{
            fontFamily: 'Bebas Neue',
            fontSize: 42,
            color: '#fff',
            letterSpacing: 4,
          }}
        >
          VERTICALIZADOS
        </div>
        <div
          style={{
            fontFamily: 'Barlow Condensed',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 4,
            color: '#71767b',
            marginTop: 4,
          }}
        >
          MJA ESPLANADA
        </div>
      </div>

      <div
        style={{
          background: '#16181c',
          borderRadius: 28,
          padding: '40px 32px',
          width: '100%',
          maxWidth: 380,
          border: '1px solid #2f3336',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'Barlow Condensed',
            fontSize: 24,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: 0.5,
            marginBottom: 8,
          }}
        >
          BEM-VINDO(A)!
        </div>
        <div
          style={{
            fontFamily: 'Barlow',
            fontSize: 15,
            color: '#71767b',
            marginBottom: 32,
            lineHeight: 1.5,
          }}
        >
          Entre com sua conta Google para acessar o sistema do PG.
        </div>

        <button
          onClick={entrar}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '16px 24px',
            borderRadius: 999,
            background: loading ? '#2f3336' : '#fff',
            color: '#000',
            border: 'none',
            cursor: loading ? 'default' : 'pointer',
            fontFamily: 'Barlow',
            fontWeight: 700,
            fontSize: 16,
            transition: '0.2s',
          }}
        >
          {!loading && (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          {loading ? 'Aguarde...' : 'Entrar com Google'}
        </button>

        {erro && (
          <div
            style={{
              fontFamily: 'Barlow',
              fontSize: 13,
              color: '#f4212e',
              textAlign: 'center',
              marginTop: 16,
              fontWeight: 500,
            }}
          >
            {erro}
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
