import { Ico } from '../icons';
import { s } from '../styles';
import type { Screen, CurrentUser, Evento } from '../types';

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
  const MENU_ITEMS = [
    { icon: Ico.music, label: 'Músicas', sub: `${songsCount} músicas`, sc: 'musicas' },
    { icon: Ico.guitar, label: 'Cifras', sub: 'Para tocar', sc: 'cifras' },
    { icon: Ico.pray, label: 'Oração', sub: 'Sorteio semanal', sc: 'oracao' },
    { icon: Ico.feed, label: 'PGWHITTER', sub: `${postsCount} posts`, sc: 'feed' },
    { icon: Ico.event, label: 'Eventos', sub: `${confirmacoesCount} confirmados`, sc: 'eventos' },
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
