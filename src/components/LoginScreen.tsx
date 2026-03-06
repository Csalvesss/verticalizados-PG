import { useState } from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const auth = getAuth();
const provider = new GoogleAuthProvider();

export function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const entrar = async () => {
    setLoading(true);
    setErro('');
    try {
      await signInWithPopup(auth, provider);
    } catch {
      setErro('Não foi possível entrar. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#1A1A1A', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>

      <div style={{ marginBottom: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 88, height: 88, background: '#F07830', borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(240,120,48,0.4)' }}>
          <svg width="52" height="56" viewBox="0 0 48 52" fill="none">
            <rect x="6" y="4" width="30" height="38" rx="3" fill="#F07830" stroke="#fff" strokeWidth="2.5" />
            <rect x="6" y="4" width="6" height="38" rx="2" fill="#D4621A" stroke="#fff" strokeWidth="1.5" />
            <rect x="19" y="13" width="3" height="16" rx="1.5" fill="#fff" />
            <rect x="14" y="18" width="13" height="3" rx="1.5" fill="#fff" />
            <path d="M26 42 L30 42 L30 50 L28 47 L26 50 Z" fill="#fff" />
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 38, color: '#fff', letterSpacing: 4, lineHeight: 1 }}>VERTICALIZADOS</div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, fontWeight: 700, letterSpacing: 4, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>MJA ESPLANADA</div>
        </div>
      </div>

      <div style={{ background: '#FFF8F0', borderRadius: 24, padding: 28, width: '100%', maxWidth: 360, boxShadow: '0 12px 48px rgba(0,0,0,0.5)' }}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 24, color: '#1A1A1A', letterSpacing: 2, marginBottom: 6 }}>BEM-VINDO(A)!</div>
        <div style={{ fontFamily: 'Barlow', fontSize: 13, color: '#888', marginBottom: 24, lineHeight: 1.6 }}>
          Entre com sua conta Google para acessar o espaço do PG.
        </div>

        <button onClick={entrar} disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '15px 20px', borderRadius: 50, background: loading ? '#ccc' : '#1A1A1A', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>
          {!loading && (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {loading ? 'Entrando...' : 'Entrar com Google'}
        </button>

        {erro && <div style={{ fontFamily: 'Barlow', fontSize: 12, color: '#e53935', textAlign: 'center', marginTop: 12 }}>{erro}</div>}
        <div style={{ fontFamily: 'Barlow', fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
          Apenas membros do PG Verticalizados devem acessar.
        </div>
      </div>
    </div>
  );
}