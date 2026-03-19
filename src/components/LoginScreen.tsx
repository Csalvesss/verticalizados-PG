import { useState } from 'react';
import { signInWithGoogleRedirect, registerWithEmail, loginWithEmail, signInWithGoogle } from '../services/authService';
import { APV_CHURCHES } from '../screens/Onboarding';

const STORAGE_KEY = 'sete_teen_church';

function toSlug(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// ── Inline church picker ──────────────────────────────────────────────────────
function ChurchPicker({
  value, onChange, inputStyle,
}: {
  value: { name: string; district: string } | null;
  onChange: (c: { name: string; district: string } | null) => void;
  inputStyle: React.CSSProperties;
}) {
  const [search, setSearch] = useState(value ? value.name : '');
  const [open, setOpen] = useState(false);

  const filtered = search.trim().length >= 1
    ? APV_CHURCHES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.district.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 7)
    : [];

  function pick(c: { name: string; district: string }) {
    setSearch(c.name);
    setOpen(false);
    onChange(c);
  }

  function handleInput(v: string) {
    setSearch(v);
    setOpen(true);
    if (value && v !== value.name) onChange(null);
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={value ? '#BA7517' : '#555'} strokeWidth="2" strokeLinecap="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <input
          type="text"
          placeholder="Buscar sua igreja..."
          value={search}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => setOpen(true)}
          style={{
            ...inputStyle,
            paddingLeft: 38,
            borderColor: value ? '#BA7517' : (inputStyle as any).borderColor,
          }}
          autoComplete="off"
        />
        {value && (
          <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#BA7517" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
          background: '#1a1a1a', border: '1px solid #333', borderRadius: 12,
          overflow: 'hidden', maxHeight: 220, overflowY: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {filtered.map((c, i) => (
            <button
              key={c.name}
              onMouseDown={() => pick(c)}
              style={{
                display: 'block', width: '100%', padding: '11px 14px',
                background: 'transparent', border: 'none',
                borderBottom: i < filtered.length - 1 ? '1px solid #222' : 'none',
                color: '#e7e9ea', textAlign: 'left', cursor: 'pointer',
                fontFamily: 'Barlow, sans-serif', fontSize: 14,
              }}
            >
              {c.name}
              <span style={{ color: '#555', fontSize: 12, marginLeft: 6 }}>— {c.district}</span>
            </button>
          ))}
        </div>
      )}
      {value && (
        <div style={{
          marginTop: 6, fontFamily: 'Barlow, sans-serif', fontSize: 11, color: '#BA7517',
          paddingLeft: 2,
        }}>
          Distrito: {value.district}
        </div>
      )}
    </div>
  );
}

const APP_URL = 'https://verticalizados-pg.netlify.app'; // manter URL do deploy

function isIosStandalone() {
  return (navigator as any).standalone === true;
}
function isAndroidStandalone() {
  return !isIosStandalone() && window.matchMedia('(display-mode: standalone)').matches;
}

// ── LOGO ──────────────────────────────────────────────────────────────────────
function AppLogo({ size = 80 }: { size?: number }) {
  const fontSize = size * 0.45;
  return (
    <div style={{
      width: size, height: size, background: '#BA7517', borderRadius: size * 0.25,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 12px 40px rgba(186,117,23,0.4)', flexShrink: 0,
    }}>
      <span style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: 900,
        fontSize,
        lineHeight: 1,
        letterSpacing: -2,
        color: '#fff',
      }}>
        <span style={{ color: 'rgba(0,0,0,0.7)' }}>7</span>T
      </span>
    </div>
  );
}

// ── IOS STANDALONE: PRIMEIRO ACESSO ──────────────────────────────────────────
// iOS isola storage do Safari e do app instalado. O usuário precisa fazer login
// UMA VEZ dentro do app. Após isso, o app lembra automaticamente para sempre.
function IosFirstAccessScreen() {
  const [mode, setMode] = useState<'choose' | 'email' | 'register'>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedChurchLocal, setSelectedChurchLocal] = useState<{ name: string; district: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [copied, setCopied] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '15px 16px', borderRadius: 14,
    border: '1.5px solid #2a2a2a', background: '#111',
    color: '#e7e9ea', fontSize: 16, fontFamily: 'Barlow, sans-serif',
    fontWeight: 500, outline: 'none',
  };

  async function handleEmail() {
    if (!email.trim() || !password.trim()) { setErro('Preencha e-mail e senha.'); return; }
    if (mode === 'register' && !name.trim()) { setErro('Informe seu nome.'); return; }
    if (mode === 'register' && !selectedChurchLocal) { setErro('Selecione sua igreja.'); return; }
    setLoading(true); setErro('');
    try {
      if (mode === 'register') {
        const church = { id: toSlug(selectedChurchLocal!.name), name: selectedChurchLocal!.name, district: selectedChurchLocal!.district, directorUid: null };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(church));
        await registerWithEmail(email.trim(), password, name.trim());
      } else {
        await loginWithEmail(email.trim(), password);
      }
    } catch (e: any) {
      if (mode === 'register') localStorage.removeItem(STORAGE_KEY);
      const c = e?.code || '';
      if (c === 'auth/user-not-found' || c === 'auth/wrong-password' || c === 'auth/invalid-credential') setErro('E-mail ou senha incorretos.');
      else if (c === 'auth/email-already-in-use') setErro('E-mail já cadastrado. Escolha "Já tenho conta".');
      else if (c === 'auth/weak-password') setErro('Senha deve ter pelo menos 6 caracteres.');
      else if (c === 'auth/invalid-email') setErro('E-mail inválido.');
      else if (c === 'auth/too-many-requests') setErro('Muitas tentativas. Aguarde.');
      else setErro('Erro ao entrar. Tente novamente.');
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true); setErro('');
    try {
      await signInWithGoogleRedirect();
      // página redireciona para o Google — não é necessário resetar loading
    } catch {
      setErro('Não foi possível conectar com o Google.');
      setLoading(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(APP_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  }

  return (
    <div style={{
      background: '#000', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 24px 32px',
      overflowY: 'auto',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@700&family=Barlow:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button:active { transform: scale(0.97); opacity: 0.85; }
        input::placeholder { color: #444; }
      `}</style>

      {/* Logo + título */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ margin: '0 auto 14px', width: 'fit-content' }}>
          <AppLogo size={72} />
        </div>
        <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 900, fontSize: 38, lineHeight: 1, letterSpacing: -1 }}>
          <span style={{ color: '#BA7517' }}>7</span>
          <span style={{ color: '#fff' }}>Teen</span>
        </div>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#555', marginTop: 2 }}>
          ASSOCIAÇÃO PAULISTA DO VALE
        </div>
      </div>

      {/* Card principal */}
      <div style={{
        width: '100%', maxWidth: 360,
        background: '#111', borderRadius: 24, padding: '28px 22px',
        border: '1px solid #1e1e1e',
      }}>

        {mode === 'choose' && (
          <>
            {/* Badge "primeira vez" */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(240,120,48,0.1)', borderRadius: 10,
              padding: '10px 14px', marginBottom: 22,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: '#F07830', flexShrink: 0,
              }} />
              <span style={{ fontFamily: 'Barlow', fontSize: 12, color: '#aaa', lineHeight: 1.4 }}>
                <strong style={{ color: '#F07830' }}>Só desta vez:</strong> entre uma vez aqui no app e ele vai lembrar você automaticamente.
              </span>
            </div>

            {/* Opção email — destaque */}
            <button
              onClick={() => setMode('email')}
              style={{
                width: '100%', padding: '16px', borderRadius: 14, marginBottom: 12,
                background: '#F07830', border: 'none', color: '#fff',
                fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 17, letterSpacing: 0.5,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="2.5" stroke="#fff" strokeWidth="1.8"/>
                <path d="M2 8l10 6 10-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Entrar com E-mail
            </button>

            {/* Criar conta */}
            <button
              onClick={() => setMode('register')}
              style={{
                width: '100%', padding: '14px', borderRadius: 14, marginBottom: 16,
                background: 'transparent', border: '1.5px solid #2a2a2a', color: '#ccc',
                fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 16, letterSpacing: 0.5,
                cursor: 'pointer',
              }}
            >
              Criar conta nova
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: '#1e1e1e' }} />
              <span style={{ fontFamily: 'Barlow', fontSize: 11, color: '#444' }}>OU</span>
              <div style={{ flex: 1, height: 1, background: '#1e1e1e' }} />
            </div>

            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              style={{
                width: '100%', padding: '13px', borderRadius: 14,
                background: '#fff', border: 'none', color: '#111',
                fontFamily: 'Barlow', fontWeight: 700, fontSize: 14,
                cursor: loading ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                opacity: loading ? 0.6 : 1,
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {loading ? 'Redirecionando...' : 'Entrar com Gmail'}
            </button>
            <div style={{
              fontFamily: 'Barlow', fontSize: 10, color: '#333',
              textAlign: 'center', marginTop: 8, lineHeight: 1.5,
            }}>
              Você será levado ao Google e voltará aqui automaticamente.
            </div>
          </>
        )}

        {(mode === 'email' || mode === 'register') && (
          <>
            <button
              onClick={() => { setMode('choose'); setErro(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', color: '#555',
                fontFamily: 'Barlow', fontSize: 13, cursor: 'pointer',
                padding: 0, marginBottom: 20,
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="#555" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Voltar
            </button>

            <div style={{
              fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 18,
              color: '#fff', letterSpacing: 0.3, marginBottom: 20,
            }}>
              {mode === 'register' ? 'Criar conta' : 'Entrar com e-mail'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {mode === 'register' && (
                <input
                  type="text" placeholder="Seu nome" value={name}
                  onChange={(e) => setName(e.target.value)} style={inputStyle}
                />
              )}
              <input
                type="email" placeholder="E-mail" value={email}
                onChange={(e) => setEmail(e.target.value)} style={inputStyle}
              />
              <input
                type="password" placeholder="Senha" value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && mode === 'email') handleEmail(); }}
                style={inputStyle}
              />
              {mode === 'register' && (
                <ChurchPicker
                  value={selectedChurchLocal}
                  onChange={setSelectedChurchLocal}
                  inputStyle={inputStyle}
                />
              )}
            </div>

            {erro && (
              <div style={{
                fontFamily: 'Barlow', fontSize: 13, color: '#f4212e',
                textAlign: 'center', marginTop: 12, fontWeight: 500,
              }}>
                {erro}
              </div>
            )}

            <button
              onClick={handleEmail} disabled={loading}
              style={{
                width: '100%', padding: '15px', borderRadius: 14, marginTop: 20,
                background: loading ? '#333' : '#F07830', color: '#fff',
                fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 17, letterSpacing: 0.5,
                border: 'none', cursor: loading ? 'default' : 'pointer',
              }}
            >
              {loading ? 'Aguarde...' : mode === 'register' ? 'Criar Conta' : 'Entrar'}
            </button>

            {mode === 'email' && (
              <button
                onClick={() => { setMode('register'); setErro(''); }}
                style={{
                  width: '100%', marginTop: 12, padding: '12px',
                  background: 'none', border: 'none', color: '#555',
                  fontFamily: 'Barlow', fontSize: 13, cursor: 'pointer',
                }}
              >
                Não tem conta? Criar agora
              </button>
            )}
          </>
        )}
      </div>

      {/* Dica de copiar link para Safari */}
      <div style={{
        marginTop: 24, width: '100%', maxWidth: 360,
        background: '#0d0d0d', borderRadius: 14, padding: '14px 16px',
        border: '1px solid #1a1a1a',
      }}>
        <div style={{ fontFamily: 'Barlow', fontSize: 12, color: '#444', lineHeight: 1.5, marginBottom: 8 }}>
          Prefere entrar pelo Safari? Abra o link lá e faça login.
        </div>
        <button
          onClick={copyLink}
          style={{
            padding: '7px 14px', borderRadius: 20,
            background: 'transparent', border: '1px solid #222',
            color: copied ? '#4caf50' : '#444',
            fontFamily: 'Barlow', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            transition: 'color 0.2s',
          }}
        >
          {copied ? 'Link copiado ✓' : 'Copiar link do app'}
        </button>
      </div>

      <div style={{
        fontFamily: 'Barlow Condensed', fontSize: 10, fontWeight: 700,
        letterSpacing: 2, color: '#1e1e1e', marginTop: 28,
      }}>
        7TEEN APV v3.0
      </div>
    </div>
  );
}

// ── LOGIN NORMAL (browser) ────────────────────────────────────────────────────
type Mode = 'login' | 'register';

function BrowserLoginScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedChurchLocal, setSelectedChurchLocal] = useState<{ name: string; district: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleEmail = async () => {
    if (!email.trim() || !password.trim()) { setErro('Preencha todos os campos.'); return; }
    if (mode === 'register' && !name.trim()) { setErro('Informe seu nome.'); return; }
    if (mode === 'register' && !selectedChurchLocal) { setErro('Selecione sua igreja.'); return; }
    setLoading(true); setErro('');
    try {
      if (mode === 'register') {
        // Save church to localStorage before auth state fires so ChurchProvider finds it
        const church = { id: toSlug(selectedChurchLocal!.name), name: selectedChurchLocal!.name, district: selectedChurchLocal!.district, directorUid: null };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(church));
        await registerWithEmail(email.trim(), password, name.trim());
      } else {
        await loginWithEmail(email.trim(), password);
      }
    } catch (e: any) {
      if (mode === 'register') localStorage.removeItem(STORAGE_KEY);
      const code = e?.code || '';
      if (code === 'auth/email-already-in-use') setErro('Este e-mail já está em uso.');
      else if (code === 'auth/invalid-email') setErro('E-mail inválido.');
      else if (code === 'auth/weak-password') setErro('Senha com pelo menos 6 caracteres.');
      else if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') setErro('E-mail ou senha incorretos.');
      else if (code === 'auth/operation-not-allowed') setErro('Login com e-mail não ativado.');
      else if (code === 'auth/too-many-requests') setErro('Muitas tentativas. Aguarde.');
      else if (code === 'auth/network-request-failed') setErro('Erro de rede. Verifique sua conexão.');
      else setErro('Erro ao entrar. (' + code + ')');
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true); setErro('');
    try {
      await signInWithGoogle();
    } catch {
      setErro('Não foi possível entrar com Google.');
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: 12,
    border: '1px solid #2f3336', background: '#0a0a0a',
    color: '#e7e9ea', fontSize: 16, fontFamily: 'Barlow, sans-serif',
    fontWeight: 500, outline: 'none',
  };

  return (
    <div style={{
      background: '#000', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 24,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@700&family=Barlow:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button:active { transform: scale(0.98); opacity: 0.8; }
        input::placeholder { color: #555; }
      `}</style>

      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ margin: '0 auto 16px', width: 'fit-content' }}>
          <AppLogo size={80} />
        </div>
        <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 900, fontSize: 42, lineHeight: 1, letterSpacing: -1 }}>
          <span style={{ color: '#BA7517' }}>7</span>
          <span style={{ color: '#fff' }}>Teen</span>
        </div>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, fontWeight: 700, letterSpacing: 4, color: '#71767b', marginTop: 2 }}>
          ASSOCIAÇÃO PAULISTA DO VALE
        </div>
      </div>

      <div style={{
        background: '#16181c', borderRadius: 24, padding: '32px 24px',
        width: '100%', maxWidth: 380, border: '1px solid #2f3336',
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: 24, borderRadius: 12, overflow: 'hidden', border: '1px solid #2f3336' }}>
          {(['login', 'register'] as Mode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); setErro(''); }} style={{
              flex: 1, padding: '10px 0',
              fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 14, letterSpacing: 1,
              color: mode === m ? '#fff' : '#555',
              background: mode === m ? '#F07830' : 'transparent',
              border: 'none', cursor: 'pointer',
            }}>
              {m === 'login' ? 'ENTRAR' : 'CRIAR CONTA'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && (
            <input type="text" placeholder="Seu nome" value={name}
              onChange={(e) => setName(e.target.value)} style={inputStyle} />
          )}
          <input type="email" placeholder="E-mail" value={email}
            onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="Senha" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && mode === 'login') handleEmail(); }}
            style={inputStyle} />
          {mode === 'register' && (
            <ChurchPicker
              value={selectedChurchLocal}
              onChange={setSelectedChurchLocal}
              inputStyle={inputStyle}
            />
          )}
        </div>

        {erro && (
          <div style={{ fontFamily: 'Barlow', fontSize: 13, color: '#f4212e', textAlign: 'center', marginTop: 12, fontWeight: 500 }}>
            {erro}
          </div>
        )}

        <button onClick={handleEmail} disabled={loading} style={{
          width: '100%', padding: '14px', borderRadius: 999, marginTop: 20,
          background: loading ? '#333' : '#F07830', color: '#fff',
          fontFamily: 'Barlow', fontWeight: 700, fontSize: 15,
          border: 'none', cursor: loading ? 'default' : 'pointer',
        }}>
          {loading ? 'Aguarde...' : mode === 'register' ? 'Criar Conta' : 'Entrar'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#2f3336' }} />
          <span style={{ fontFamily: 'Barlow', fontSize: 12, color: '#555', fontWeight: 600 }}>OU</span>
          <div style={{ flex: 1, height: 1, background: '#2f3336' }} />
        </div>

        <button onClick={handleGoogle} disabled={loading} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 10, padding: '14px', borderRadius: 999,
          background: '#fff', color: '#000',
          fontFamily: 'Barlow', fontWeight: 700, fontSize: 15,
          border: 'none', cursor: loading ? 'default' : 'pointer',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Entrar com Gmail
        </button>
      </div>

      <div style={{
        position: 'fixed', bottom: 24,
        fontFamily: 'Barlow Condensed', fontSize: 10, fontWeight: 700,
        letterSpacing: 2, color: '#2f3336',
      }}>
        7TEEN APV v3.0
      </div>
    </div>
  );
}

// ── ENTRY POINT ───────────────────────────────────────────────────────────────
export function LoginScreen() {
  // iOS standalone: mostrar tela de primeiro acesso dedicada
  if (isIosStandalone()) return <IosFirstAccessScreen />;

  // Android standalone: o Chrome compartilha storage, mas pode precisar de login
  // Usa a mesma tela dedicada (sem o banner de copiar link)
  if (isAndroidStandalone()) return <IosFirstAccessScreen />;

  return <BrowserLoginScreen />;
}
