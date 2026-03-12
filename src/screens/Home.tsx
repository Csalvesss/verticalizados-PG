import { Ico } from '../icons';
import { s } from '../styles';
import type { Screen, CurrentUser, Evento } from '../types';
import { usePWAInstallContext } from '../contexts/PWAInstall';

interface Props {
  currentUser: CurrentUser;
  isAdmin: boolean;
  goTo: (sc: Screen) => void;
  songsCount: number;
  postsCount: number;
  confirmacoesCount: number;
  proximoEvento: Evento | null;
}

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// Logo SVG do app
function AppLogo({ size = 40 }: { size?: number }) {
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

export function HomeScreen({
  currentUser,
  isAdmin,
  goTo,
  songsCount,
  postsCount,
  confirmacoesCount,
  proximoEvento,
}: Props) {
  const { canInstallAndroid, isIOS, isStandalone, triggerInstall, openIOSModal } = usePWAInstallContext();
  const showInstallCard = !isStandalone && (canInstallAndroid || isIOS);

  const MENU_ITEMS = [
    { icon: Ico.music, label: 'Músicas', sub: `${songsCount} músicas`, sc: 'musicas' },
    { icon: Ico.guitar, label: 'Cifras', sub: 'Para tocar', sc: 'cifras' },
    { icon: Ico.pray, label: 'Oração', sub: 'Sorteio semanal', sc: 'oracao' },
    { icon: Ico.feed, label: 'Feed', sub: `${postsCount} posts`, sc: 'feed' },
    { icon: Ico.event, label: 'Eventos', sub: `${confirmacoesCount} confirmados`, sc: 'eventos' },
    { icon: Ico.cross, label: 'Jogando em Comunhão', sub: 'Quiz bíblico — ganhe pontos!', sc: 'jogandoEmComunhao' },
  ];

  return (
    <div className="fade">
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={s.instaHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
            <svg width="32" height="32" viewBox="4 2 34 52" fill="none">
              <rect x="6" y="4" width="30" height="38" rx="3" fill="#F07830" stroke="#fff" strokeWidth="2.5" />
              <rect x="6" y="4" width="6" height="38" rx="2" fill="#D4621A" stroke="#fff" strokeWidth="1.5" />
              <rect x="19" y="13" width="3" height="16" rx="1.5" fill="#fff" />
              <rect x="14" y="18" width="13" height="3" rx="1.5" fill="#fff" />
              <path d="M26 42 L30 42 L30 50 L28 47 L26 50 Z" fill="#fff" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, color: '#fff', letterSpacing: 2, lineHeight: 1 }}>
              VERTICALIZADOS
            </div>
            <div style={{ fontFamily: 'Barlow', fontSize: 11, color: '#555', lineHeight: 1.2 }}>
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

      {/* ── Menu list ──────────────────────────────────────── */}
      <div style={{ paddingTop: 8 }}>
        {MENU_ITEMS.map((item, i) => (
          <button
            key={item.sc}
            onClick={() => goTo(item.sc as Screen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: '14px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: i < MENU_ITEMS.length - 1 ? '1px solid #111' : 'none',
              cursor: 'pointer',
              gap: 14,
              textAlign: 'left',
            }}
          >
            {/* Icon — no container, just the SVG */}
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24 }}>
              {item.icon('#F07830')}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'Barlow, sans-serif',
                fontWeight: 700,
                fontSize: 15,
                color: '#e7e9ea',
                lineHeight: 1.3,
              }}>
                {item.label}
              </div>
              <div style={{
                fontFamily: 'Barlow, sans-serif',
                fontSize: 12,
                color: '#555',
                marginTop: 1,
              }}>
                {item.sub}
              </div>
            </div>

            <ChevronRight />
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
              background: 'rgba(240,120,48,0.06)',
              border: '1px solid rgba(240,120,48,0.2)',
              borderRadius: 14, cursor: 'pointer', textAlign: 'left',
            }}
          >
            {/* Logo */}
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: '#111', border: '1px solid #2a2a2a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <AppLogo size={30} />
            </div>

            {/* Texto */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: 16, color: '#fff', letterSpacing: 2, lineHeight: 1,
              }}>
                PG VERTICALIZADOS
              </div>
              <div style={{
                fontFamily: 'Barlow, sans-serif',
                fontSize: 12, color: '#888', marginTop: 3, lineHeight: 1.3,
              }}>
                {canInstallAndroid
                  ? 'Toque para instalar o app no seu celular'
                  : 'Adicione à Tela de Início para acesso rápido'}
              </div>
            </div>

            {/* Ícone instalar */}
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: '#F07830',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {canInstallAndroid ? (
                // Ícone download
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z" />
                </svg>
              ) : (
                // Ícone compartilhar iOS
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
            background: 'rgba(240,120,48,0.06)',
            border: '1px solid rgba(240,120,48,0.15)',
            borderRadius: 12,
            cursor: 'pointer',
          }}
        >
          <div style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 3,
            color: '#F07830',
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
