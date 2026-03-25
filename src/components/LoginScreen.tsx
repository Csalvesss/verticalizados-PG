import { useState } from 'react';
import { registerWithEmail, loginWithEmail, resetPassword } from '../services/authService';
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
          className="login-input"
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
          background: '#18191d', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14,
          overflow: 'hidden', maxHeight: 220, overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}>
          {filtered.map((c, i) => (
            <button
              key={c.name}
              onMouseDown={() => pick(c)}
              style={{
                display: 'block', width: '100%', padding: '11px 14px',
                background: 'transparent', border: 'none',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
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

const APP_URL = 'https://verticalizados-pg.netlify.app';

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
      width: size, height: size,
      background: 'linear-gradient(135deg, #F07830 0%, #BA7517 100%)',
      borderRadius: size * 0.25,
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
        <span style={{ color: 'rgba(0,0,0,0.6)' }}>7</span>T
      </span>
    </div>
  );
}

// ── IOS STANDALONE: PRIMEIRO ACESSO ──────────────────────────────────────────
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
    border: '1.5px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.4)',
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
        await loginWithEmail(email.trim(), password, true);
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

  function copyLink() {
    navigator.clipboard.writeText(APP_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  }

  return (
    <div style={{
      background: 'radial-gradient(ellipse at 50% 0%, rgba(186,117,23,0.12) 0%, #000 55%)',
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 24px 32px',
      overflowY: 'auto',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@700&family=Barlow:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button:active { transform: scale(0.97); opacity: 0.85; }
        input::placeholder { color: #444; }
        .login-input:focus { border-color: #BA7517 !important; box-shadow: 0 0 0 3px rgba(186,117,23,0.1) !important; }
      `}</style>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ margin: '0 auto 14px', width: 'fit-content' }}>
          <AppLogo size={72} />
        </div>
        <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 900, fontSize: 38, lineHeight: 1, letterSpacing: -1 }}>
          <span style={{ color: '#BA7517' }}>7</span>
          <span style={{ color: '#fff' }}>Teen</span>
        </div>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#666', marginTop: 2 }}>
          ASSOCIAÇÃO PAULISTA DO VALE
        </div>
      </div>

      <div style={{
        width: '100%', maxWidth: 360,
        background: 'rgba(20,21,24,0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: 28, padding: '28px 22px',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>

        {mode === 'choose' && (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(240,120,48,0.08)', borderRadius: 12,
              padding: '10px 14px', marginBottom: 22,
              border: '1px solid rgba(240,120,48,0.15)',
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%', background: '#F07830', flexShrink: 0,
              }} />
              <span style={{ fontFamily: 'Barlow', fontSize: 12, color: '#aaa', lineHeight: 1.4 }}>
                <strong style={{ color: '#F07830' }}>Só desta vez:</strong> entre uma vez aqui no app e ele vai lembrar você automaticamente.
              </span>
            </div>

            <button
              onClick={() => setMode('email')}
              style={{
                width: '100%', padding: '16px', borderRadius: 14, marginBottom: 10,
                background: 'linear-gradient(135deg, #F07830 0%, #BA7517 100%)',
                border: 'none', color: '#fff',
                fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 17, letterSpacing: 0.5,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 4px 20px rgba(240,120,48,0.3)',
              }}
            >
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="2.5" stroke="#fff" strokeWidth="1.8"/>
                <path d="M2 8l10 6 10-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Entrar com E-mail
            </button>

            <button
              onClick={() => setMode('register')}
              style={{
                width: '100%', padding: '14px', borderRadius: 14, marginBottom: 16,
                background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#aaa',
                fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 16, letterSpacing: 0.5,
                cursor: 'pointer',
              }}
            >
              Criar conta nova
            </button>
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
                  className="login-input"
                  type="text" placeholder="Seu nome" value={name}
                  onChange={(e) => setName(e.target.value)} style={inputStyle}
                />
              )}
              <input
                className="login-input"
                type="email" placeholder="E-mail" value={email}
                onChange={(e) => setEmail(e.target.value)} style={inputStyle}
              />
              <input
                className="login-input"
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
                background: 'rgba(244,33,46,0.08)', borderRadius: 10, padding: '8px 12px',
              }}>
                {erro}
              </div>
            )}

            <button
              onClick={handleEmail} disabled={loading}
              style={{
                width: '100%', padding: '15px', borderRadius: 14, marginTop: 20,
                background: loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #F07830 0%, #BA7517 100%)',
                color: loading ? '#444' : '#fff',
                fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 17, letterSpacing: 0.5,
                border: loading ? '1px solid rgba(255,255,255,0.06)' : 'none',
                cursor: loading ? 'default' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(240,120,48,0.3)',
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

      <div style={{
        marginTop: 20, width: '100%', maxWidth: 360,
        background: 'rgba(10,10,10,0.8)', borderRadius: 14, padding: '14px 16px',
        border: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ fontFamily: 'Barlow', fontSize: 12, color: '#3a3a3a', lineHeight: 1.5, marginBottom: 8 }}>
          Prefere entrar pelo Safari? Abra o link lá e faça login.
        </div>
        <button
          onClick={copyLink}
          style={{
            padding: '7px 14px', borderRadius: 20,
            background: 'transparent', border: '1px solid #1e1e1e',
            color: copied ? '#4caf50' : '#3a3a3a',
            fontFamily: 'Barlow', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            transition: 'color 0.2s',
          }}
        >
          {copied ? 'Link copiado ✓' : 'Copiar link do app'}
        </button>
      </div>

      <div style={{
        fontFamily: 'Barlow Condensed', fontSize: 10, fontWeight: 700,
        letterSpacing: 2, color: '#1a1a1a', marginTop: 24,
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
  const [resetSent, setResetSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPass, setShowPass] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) { setErro('Digite seu e-mail acima primeiro.'); return; }
    setLoading(true); setErro('');
    try {
      await resetPassword(email.trim());
      setResetSent(true);
    } catch {
      setErro('Não foi possível enviar. Verifique o e-mail.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async () => {
    if (!email.trim() || !password.trim()) { setErro('Preencha todos os campos.'); return; }
    if (mode === 'register' && !name.trim()) { setErro('Informe seu nome.'); return; }
    if (mode === 'register' && !selectedChurchLocal) { setErro('Selecione sua igreja.'); return; }
    setLoading(true); setErro('');
    try {
      if (mode === 'register') {
        const church = { id: toSlug(selectedChurchLocal!.name), name: selectedChurchLocal!.name, district: selectedChurchLocal!.district, directorUid: null };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(church));
        await registerWithEmail(email.trim(), password, name.trim());
      } else {
        await loginWithEmail(email.trim(), password, rememberMe);
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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: 14,
    border: '1.5px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.35)',
    color: '#e7e9ea', fontSize: 16, fontFamily: 'Barlow, sans-serif',
    fontWeight: 500, outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  return (
    <div style={{
      background: 'radial-gradient(ellipse at 50% 0%, rgba(186,117,23,0.14) 0%, #000 60%)',
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px 16px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@700&family=Barlow:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button:active { transform: scale(0.97); opacity: 0.85; }
        input::placeholder { color: #3d3d3d; }
        .login-input:focus {
          border-color: #BA7517 !important;
          box-shadow: 0 0 0 3px rgba(186,117,23,0.12) !important;
        }
        .tab-btn { transition: background 0.2s, color 0.2s, box-shadow 0.2s; }
        .remember-check { transition: background 0.2s, border-color 0.2s; }
      `}</style>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ margin: '0 auto 14px', width: 'fit-content' }}>
          <AppLogo size={76} />
        </div>
        <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 900, fontSize: 42, lineHeight: 1, letterSpacing: -1.5 }}>
          <span style={{ color: '#BA7517' }}>7</span>
          <span style={{ color: '#fff' }}>Teen</span>
        </div>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, fontWeight: 700, letterSpacing: 4, color: '#666', marginTop: 4 }}>
          ASSOCIAÇÃO PAULISTA DO VALE
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: 'rgba(18,19,22,0.95)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 28,
        padding: '32px 28px',
        width: '100%', maxWidth: 400,
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 28,
          background: 'rgba(0,0,0,0.5)', borderRadius: 15, padding: 4,
        }}>
          {(['login', 'register'] as Mode[]).map(m => (
            <button
              key={m}
              className="tab-btn"
              onClick={() => { setMode(m); setErro(''); }}
              style={{
                flex: 1, padding: '10px 0',
                fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 13, letterSpacing: 1.5,
                color: mode === m ? '#fff' : '#444',
                background: mode === m
                  ? 'linear-gradient(135deg, #F07830 0%, #BA7517 100%)'
                  : 'transparent',
                border: 'none', cursor: 'pointer', borderRadius: 11,
                boxShadow: mode === m ? '0 2px 16px rgba(240,120,48,0.25)' : 'none',
              }}
            >
              {m === 'login' ? 'ENTRAR' : 'CRIAR CONTA'}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'register' && (
            <input
              className="login-input"
              type="text" placeholder="Seu nome completo" value={name}
              onChange={(e) => setName(e.target.value)} style={inputStyle}
            />
          )}
          <input
            className="login-input"
            type="email" placeholder="E-mail" value={email}
            onChange={(e) => setEmail(e.target.value)} style={inputStyle}
          />

          {/* Senha com botão mostrar/ocultar */}
          <div style={{ position: 'relative' }}>
            <input
              className="login-input"
              type={showPass ? 'text' : 'password'}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && mode === 'login') handleEmail(); }}
              style={{ ...inputStyle, paddingRight: 48 }}
            />
            <button
              onClick={() => setShowPass(!showPass)}
              style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                color: '#444', display: 'flex', alignItems: 'center', lineHeight: 1,
              }}
            >
              {showPass ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          {mode === 'register' && (
            <ChurchPicker
              value={selectedChurchLocal}
              onChange={setSelectedChurchLocal}
              inputStyle={inputStyle}
            />
          )}
        </div>

        {/* Manter conectado + Esqueci senha */}
        {mode === 'login' && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 16,
          }}>
            <label
              style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setRememberMe(!rememberMe)}
            >
              <div
                className="remember-check"
                style={{
                  width: 19, height: 19, borderRadius: 6,
                  border: `1.5px solid ${rememberMe ? '#BA7517' : 'rgba(255,255,255,0.12)'}`,
                  background: rememberMe ? 'linear-gradient(135deg, #F07830, #BA7517)' : 'rgba(0,0,0,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: rememberMe ? '0 2px 10px rgba(186,117,23,0.3)' : 'none',
                }}
              >
                {rememberMe && (
                  <svg viewBox="0 0 12 10" width="10" height="10" fill="none">
                    <path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span style={{
                fontFamily: 'Barlow, sans-serif', fontSize: 13,
                color: rememberMe ? '#ccc' : '#444',
                transition: 'color 0.2s',
              }}>
                Manter conectado
              </span>
            </label>

            <div style={{ textAlign: 'right' }}>
              {resetSent ? (
                <span style={{ fontFamily: 'Barlow', fontSize: 12, color: '#4caf50' }}>
                  E-mail enviado!
                </span>
              ) : (
                <button
                  onClick={handleReset}
                  disabled={loading}
                  style={{
                    background: 'none', border: 'none', color: '#444',
                    fontFamily: 'Barlow', fontSize: 12, cursor: 'pointer', padding: 0,
                  }}
                >
                  Esqueci a senha
                </button>
              )}
            </div>
          </div>
        )}

        {/* Erro */}
        {erro && (
          <div style={{
            fontFamily: 'Barlow', fontSize: 13, color: '#f4212e',
            textAlign: 'center', marginTop: 14, fontWeight: 500,
            background: 'rgba(244,33,46,0.07)', borderRadius: 10, padding: '9px 12px',
            border: '1px solid rgba(244,33,46,0.12)',
          }}>
            {erro}
          </div>
        )}

        {/* Botão principal */}
        <button
          onClick={handleEmail}
          disabled={loading}
          style={{
            width: '100%', padding: '15px', borderRadius: 14, marginTop: 20,
            background: loading
              ? 'rgba(255,255,255,0.04)'
              : 'linear-gradient(135deg, #F07830 0%, #BA7517 100%)',
            color: loading ? '#444' : '#fff',
            fontFamily: 'Barlow', fontWeight: 700, fontSize: 15,
            border: loading ? '1px solid rgba(255,255,255,0.06)' : 'none',
            cursor: loading ? 'default' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 24px rgba(240,120,48,0.3)',
            transition: 'all 0.2s',
            letterSpacing: 0.3,
          }}
        >
          {loading ? 'Aguarde...' : mode === 'register' ? 'Criar Conta' : 'Entrar'}
        </button>

      </div>

      <div style={{
        marginTop: 28,
        fontFamily: 'Barlow Condensed', fontSize: 10, fontWeight: 700,
        letterSpacing: 2, color: '#1e1e1e',
      }}>
        7TEEN APV v3.0
      </div>
    </div>
  );
}

// ── ENTRY POINT ───────────────────────────────────────────────────────────────
export function LoginScreen() {
  if (isIosStandalone()) return <IosFirstAccessScreen />;
  if (isAndroidStandalone()) return <IosFirstAccessScreen />;
  return <BrowserLoginScreen />;
}
