import { usePWAInstallContext } from '../contexts/PWAInstall';

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );
}

// Logo SVG igual ao da Home
function AppLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="4 2 34 52" fill="none">
      <rect x="6" y="4" width="30" height="38" rx="3" fill="#F07830" stroke="#fff" strokeWidth="2.5" />
      <rect x="6" y="4" width="6" height="38" rx="2" fill="#D4621A" stroke="#fff" strokeWidth="1.5" />
      <rect x="19" y="13" width="3" height="16" rx="1.5" fill="#fff" />
      <rect x="14" y="18" width="13" height="3" rx="1.5" fill="#fff" />
      <path d="M26 42 L30 42 L30 50 L28 47 L26 50 Z" fill="#fff" />
    </svg>
  );
}

export function PWAInstallPrompt() {
  const { showIOSModal, dismissIOSModal } = usePWAInstallContext();

  if (!showIOSModal) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={dismissIOSModal}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          zIndex: 200,
        }}
      />

      {/* Bottom sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 201,
        background: '#0d0d0d',
        borderRadius: '20px 20px 0 0',
        border: '1px solid #2a2a2a',
        borderBottom: 'none',
        padding: '20px 20px 44px',
        maxWidth: 520,
        margin: '0 auto',
      }}>
        {/* Handle + fechar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, position: 'relative' }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: '#2f2f2f' }} />
          <button
            onClick={dismissIOSModal}
            style={{
              position: 'absolute', right: 0, top: -4,
              background: '#1a1a1a', border: 'none', color: '#888',
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          ><CloseIcon /></button>
        </div>

        {/* Logo + nome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: '#111', border: '1px solid #2a2a2a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <AppLogo size={36} />
          </div>
          <div>
            <div style={{
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: 20, color: '#fff', letterSpacing: 2, lineHeight: 1,
            }}>
              PG VERTICALIZADOS
            </div>
            <div style={{
              fontFamily: 'Barlow, sans-serif',
              fontSize: 12, color: '#555', marginTop: 3,
            }}>
              Adicione à Tela de Início para acesso rápido
            </div>
          </div>
        </div>

        {/* Passos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {/* Passo 1 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: '#111', borderRadius: 12,
            padding: '12px 14px', border: '1px solid #1e1e1e',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(240,120,48,0.12)',
              border: '1px solid rgba(240,120,48,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#F07830', flexShrink: 0,
            }}>
              {/* Ícone compartilhar iOS */}
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.684 8.316 12 5m0 0 3.316 3.316M12 5v11M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, color: '#e7e9ea', marginBottom: 2 }}>
                Toque em Compartilhar
              </div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#555', lineHeight: 1.4 }}>
                O ícone <span style={{ color: '#F07830', fontWeight: 600 }}>□↑</span> na barra inferior do Safari
              </div>
            </div>
          </div>

          {/* Passo 2 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: '#111', borderRadius: 12,
            padding: '12px 14px', border: '1px solid #1e1e1e',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(240,120,48,0.12)',
              border: '1px solid rgba(240,120,48,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#F07830', flexShrink: 0,
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 22,
            }}>
              +
            </div>
            <div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, color: '#e7e9ea', marginBottom: 2 }}>
                "Adicionar à Tela de Início"
              </div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#555', lineHeight: 1.4 }}>
                Role a lista e toque nessa opção para instalar
              </div>
            </div>
          </div>
        </div>

        {/* Seta apontando para baixo (onde fica o botão de compartilhar no Safari) */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#F07830" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'bounce 1.5s infinite' }}>
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
          <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(5px)} }`}</style>
        </div>

        <button
          onClick={dismissIOSModal}
          style={{
            width: '100%', padding: '13px',
            borderRadius: 50, border: '1px solid #2a2a2a',
            background: 'transparent', color: '#555',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 13, letterSpacing: 1, cursor: 'pointer',
          }}
        >
          AGORA NÃO
        </button>
      </div>
    </>
  );
}
