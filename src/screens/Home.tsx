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
}

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export function HomeScreen({
  currentUser,
  isAdmin,
  goTo,
  songsCount,
  postsCount,
  confirmacoesCount,
  proximoEvento,
}: Props) {
  const { canInstallAndroid, isIOS, isStandalone, iosAdded, triggerInstall, openIOSModal } = usePWAInstallContext();
  const { selectedChurch, clearChurch } = useChurch();
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
          background: 'rgba(186,117,23,0.06)',
          borderBottom: '1px solid rgba(186,117,23,0.12)',
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
            onClick={clearChurch}
            title="Trocar de igreja"
            style={{
              background: 'transparent',
              border: '1px solid #2a2a2a',
              borderRadius: 20,
              padding: '4px 10px',
              cursor: 'pointer',
              fontFamily: 'Barlow, sans-serif',
              fontSize: 11,
              color: '#555',
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
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24 }}>
              {item.icon('#BA7517')}
            </div>

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
              background: 'rgba(186,117,23,0.06)',
              border: '1px solid rgba(186,117,23,0.2)',
              borderRadius: 14, cursor: 'pointer', textAlign: 'left',
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
            background: 'rgba(186,117,23,0.06)',
            border: '1px solid rgba(186,117,23,0.15)',
            borderRadius: 12,
            cursor: 'pointer',
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
