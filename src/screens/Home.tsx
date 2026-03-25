import { Ico } from '../icons';
import { s } from '../styles';
import type { Screen, CurrentUser, Evento } from '../types';
import { usePWAInstallContext } from '../contexts/PWAInstall';
import { useChurch } from '../contexts/ChurchContext';

interface Props {
  currentUser: CurrentUser;
  isAdmin: boolean;
  goTo: (sc: Screen) => void;
  songsCount: number;
  postsCount: number;
  confirmacoesCount: number;
  proximoEvento: Evento | null;
  onChangeChurch: () => void;
}


export function HomeScreen({
  currentUser,
  isAdmin,
  goTo,
  songsCount,
  postsCount,
  confirmacoesCount,
  proximoEvento,
  onChangeChurch,
}: Props) {
  const { canInstallAndroid, isIOS, isStandalone, iosAdded, triggerInstall, openIOSModal } = usePWAInstallContext();
  const { selectedChurch } = useChurch();
  const showInstallCard = !isStandalone && (canInstallAndroid || (isIOS && !iosAdded));

  const MENU_ITEMS = [
    { icon: Ico.music, label: 'Músicas', sub: `${songsCount} músicas`, sc: 'musicas' },
    { icon: Ico.guitar, label: 'Cifras', sub: 'Para tocar', sc: 'cifras' },
    { icon: Ico.pray, label: 'Oração', sub: 'Pedidos e sorteio semanal', sc: 'oracao' },
    { icon: Ico.feed, label: 'Feed', sub: `${postsCount} posts da APV`, sc: 'feed' },
    { icon: Ico.event, label: 'Eventos', sub: `${confirmacoesCount} confirmados`, sc: 'eventos' },
    { icon: Ico.cross, label: 'Jogando em Comunhão', sub: 'Quiz bíblico — ganhe pontos!', sc: 'jogandoEmComunhao' },
  ];

  return (
    <div className="fade">
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={s.instaHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* 7Teen logo */}
          <div style={{ lineHeight: 1 }}>
            <div style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 900,
              fontSize: 22,
              letterSpacing: -0.5,
              lineHeight: 1,
            }}>
              <span style={{ color: '#BA7517' }}>7</span>
              <span style={{ color: '#fff' }}>Teen</span>
            </div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, color: '#555', lineHeight: 1.2, marginTop: 1 }}>
              Olá, {currentUser.name}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {isAdmin && (
            <button onClick={() => goTo('admin')} style={s.iconBtn}>
              {Ico.admin('#71767b')}
            </button>
          )}
          <img src={currentUser.photo} style={s.avatarSmall} onClick={() => goTo('perfil')} alt="" />
        </div>
      </div>

      {/* ── Church banner ───────────────────────────────────── */}
      {selectedChurch && (
        <div style={{
          margin: '0 0 0',
          padding: '10px 16px',
          background: 'rgba(186,117,23,0.05)',
          borderBottom: '1px solid rgba(186,117,23,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#BA7517" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span style={{
                fontFamily: 'Barlow, sans-serif',
                fontWeight: 700,
                fontSize: 13,
                color: '#e7e9ea',
              }}>
                {selectedChurch.name}
              </span>
              <span style={{
                fontFamily: 'Barlow, sans-serif',
                fontSize: 10,
                color: '#185FA5',
                background: 'rgba(24,95,165,0.12)',
                border: '1px solid rgba(24,95,165,0.2)',
                padding: '1px 6px',
                borderRadius: 20,
                fontWeight: 600,
              }}>
                {selectedChurch.district}
              </span>
            </div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, color: '#555', marginTop: 1 }}>
              Associação Paulista do Vale
            </div>
          </div>
          <button
            onClick={onChangeChurch}
            title="Trocar de igreja"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              padding: '4px 10px',
              cursor: 'pointer',
              fontFamily: 'Barlow, sans-serif',
              fontSize: 11,
              color: '#666',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Trocar
          </button>
        </div>
      )}

      {/* ── Menu grid ──────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        padding: '12px 16px 4px',
      }}>
        {MENU_ITEMS.map((item) => (
          <button
            key={item.sc}
            onClick={() => goTo(item.sc as Screen)}
            style={{
              background: 'rgba(18,20,25,0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 18,
              padding: '18px 14px 14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 10,
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: '0 4px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
              transition: 'transform 0.15s, box-shadow 0.2s',
              position: 'relative',
              overflow: 'hidden',
            }}
            onPointerDown={e => {
              e.currentTarget.style.transform = 'scale(0.97)';
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
            }}
            onPointerUp={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)';
            }}
            onPointerLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)';
            }}
          >
            {/* Icon container */}
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(240,120,48,0.18) 0%, rgba(186,117,23,0.12) 100%)',
              border: '1px solid rgba(240,120,48,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {item.icon('#F07830')}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700,
                  fontSize: 16,
                  color: '#fff',
                  letterSpacing: 0.3,
                  lineHeight: 1.2,
                }}>
                  {item.label}
                </div>
                {/* Feed badge */}
                {item.sc === 'feed' && postsCount > 0 && (
                  <span style={{
                    background: '#F07830',
                    color: '#fff',
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontWeight: 700,
                    fontSize: 10,
                    borderRadius: 99,
                    padding: '1px 6px',
                    lineHeight: 1.6,
                    flexShrink: 0,
                  }}>
                    {postsCount > 99 ? '99+' : postsCount}
                  </span>
                )}
              </div>
              <div style={{
                fontFamily: 'Barlow, sans-serif',
                fontSize: 11,
                color: 'rgba(255,255,255,0.35)',
                marginTop: 3,
              }}>
                {item.sub}
              </div>
            </div>

            {/* Arrow indicator */}
            <span style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              fontSize: 16,
              color: 'rgba(255,255,255,0.3)',
              lineHeight: 1,
            }}>›</span>
          </button>
        ))}
      </div>

      {/* ── Card de instalação PWA ─────────────────────────── */}
      {showInstallCard && (
        <div style={{ margin: '16px 16px 0' }}>
          <button
            onClick={canInstallAndroid ? triggerInstall : openIOSModal}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              width: '100%', padding: '14px 16px',
              background: 'rgba(186,117,23,0.07)',
              border: '1px solid rgba(186,117,23,0.15)',
              borderRadius: 16, cursor: 'pointer', textAlign: 'left',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: '#BA7517',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 900, fontSize: 18, color: '#fff', letterSpacing: -1 }}>
                <span style={{ color: '#000' }}>7</span>T
              </span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'system-ui, sans-serif',
                fontWeight: 900, fontSize: 15, letterSpacing: -0.5,
                lineHeight: 1, color: '#fff', marginBottom: 2,
              }}>
                <span style={{ color: '#BA7517' }}>7</span>Teen
              </div>
              <div style={{
                fontFamily: 'Barlow, sans-serif',
                fontSize: 12, color: '#888', lineHeight: 1.3,
              }}>
                {canInstallAndroid
                  ? 'Instalar 7Teen no seu celular'
                  : 'Adicione à Tela de Início para acessar os jovens da APV'}
              </div>
            </div>

            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: '#BA7517',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {canInstallAndroid ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.684 8.316 12 5m0 0 3.316 3.316M12 5v11M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
                </svg>
              )}
            </div>
          </button>
        </div>
      )}

      {/* ── Próximo evento ─────────────────────────────────── */}
      {proximoEvento && (
        <div
          onClick={() => goTo('eventos')}
          style={{
            margin: '16px 16px 0',
            padding: '14px 16px',
            background: 'rgba(18,20,25,0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(186,117,23,0.18)',
            borderRadius: 16,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <div style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 3,
            color: '#BA7517',
            marginBottom: 6,
            textTransform: 'uppercase',
          }}>
            Próximo encontro
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 20, color: '#fff', letterSpacing: 0.3 }}>
            {proximoEvento.tema}
          </div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#71767b', marginTop: 5, display: 'flex', gap: 12 }}>
            <span>{proximoEvento.data}</span>
            <span>{proximoEvento.hora}</span>
          </div>
        </div>
      )}
    </div>
  );
}
