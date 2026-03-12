import { usePWAInstall } from '../hooks/usePWAInstall';

// Ícone de download/instalar
function InstallIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z" />
    </svg>
  );
}

// Ícone de fechar
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );
}

// Ícone de compartilhar do iOS (quadrado com seta para cima)
function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.684 8.316 12 5m0 0 3.316 3.316M12 5v11M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

export function PWAInstallPrompt() {
  const { canInstallAndroid, showIOSInstructions, triggerInstall, dismissIOSModal } = usePWAInstall();

  // ── Android: botão flutuante ────────────────────────────────────────────────
  if (canInstallAndroid) {
    return (
      <button
        onClick={triggerInstall}
        title="Instalar app"
        style={{
          position: 'fixed',
          bottom: 88, // acima da BottomNav (~70px) + folga
          right: 16,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 16px',
          borderRadius: 50,
          background: '#F07830',
          border: 'none',
          color: '#fff',
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: 0.8,
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(240,120,48,0.45)',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)'; }}
        onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
      >
        <InstallIcon />
        INSTALAR APP
      </button>
    );
  }

  // ── iOS: modal com instruções ───────────────────────────────────────────────
  if (showIOSInstructions) {
    return (
      <>
        {/* Overlay */}
        <div
          onClick={dismissIOSModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 200,
          }}
        />

        {/* Bottom sheet */}
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 201,
            background: '#0d0d0d',
            borderRadius: '20px 20px 0 0',
            border: '1px solid #2a2a2a',
            borderBottom: 'none',
            padding: '24px 20px 40px',
            maxWidth: 520,
            margin: '0 auto',
          }}
        >
          {/* Handle + fechar */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
            <div style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
            }}>
              <div style={{
                width: 36, height: 4, borderRadius: 99, background: '#2f2f2f',
              }} />
            </div>
            <button
              onClick={dismissIOSModal}
              style={{
                position: 'absolute',
                right: 16,
                top: 16,
                background: '#1a1a1a',
                border: 'none',
                color: '#888',
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Logo / título */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: 22,
              color: '#F07830',
              letterSpacing: 3,
              marginBottom: 4,
            }}>
              VERTICALIZADOS
            </div>
            <div style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700,
              fontSize: 15,
              color: '#e7e9ea',
              letterSpacing: 0.3,
            }}>
              Adicione à Tela de Início
            </div>
            <div style={{
              fontFamily: 'Barlow, sans-serif',
              fontSize: 13,
              color: '#666',
              marginTop: 4,
            }}>
              Acesse o app como se fosse nativo, sem precisar do navegador.
            </div>
          </div>

          {/* Passos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Passo 1 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              background: '#111',
              borderRadius: 12,
              padding: '12px 14px',
              border: '1px solid #1e1e1e',
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(240,120,48,0.12)',
                border: '1px solid rgba(240,120,48,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F07830',
                flexShrink: 0,
              }}>
                <ShareIcon />
              </div>
              <div>
                <div style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#e7e9ea',
                  marginBottom: 2,
                }}>
                  Toque no botão de compartilhar
                </div>
                <div style={{
                  fontFamily: 'Barlow, sans-serif',
                  fontSize: 12,
                  color: '#555',
                  lineHeight: 1.4,
                }}>
                  O ícone{' '}
                  <span style={{ color: '#F07830', fontWeight: 600 }}>
                    □↑
                  </span>{' '}
                  na barra inferior do Safari
                </div>
              </div>
            </div>

            {/* Passo 2 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              background: '#111',
              borderRadius: 12,
              padding: '12px 14px',
              border: '1px solid #1e1e1e',
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(240,120,48,0.12)',
                border: '1px solid rgba(240,120,48,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F07830',
                flexShrink: 0,
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700,
                fontSize: 18,
              }}>
                +
              </div>
              <div>
                <div style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#e7e9ea',
                  marginBottom: 2,
                }}>
                  Toque em "Adicionar à Tela de Início"
                </div>
                <div style={{
                  fontFamily: 'Barlow, sans-serif',
                  fontSize: 12,
                  color: '#555',
                  lineHeight: 1.4,
                }}>
                  Role a lista de opções e toque em{' '}
                  <span style={{ color: '#e7e9ea' }}>"Adicionar à Tela de Início"</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botão fechar */}
          <button
            onClick={dismissIOSModal}
            style={{
              width: '100%',
              marginTop: 20,
              padding: '13px',
              borderRadius: 50,
              border: '1px solid #2a2a2a',
              background: 'transparent',
              color: '#666',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: 1,
              cursor: 'pointer',
            }}
          >
            AGORA NÃO
          </button>
        </div>
      </>
    );
  }

  return null;
}
