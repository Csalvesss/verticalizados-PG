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
    { icon: Ico.music, label: 'Músicas', sub: songsCount + ' músicas', sc: 'musicas', color: '#F07830' },
    { icon: Ico.guitar, label: 'Cifras', sub: 'Para tocar', sc: 'cifras', color: '#D4621A' },
    { icon: Ico.pray, label: 'Oração', sub: 'Sorteio semanal', sc: 'oracao', color: '#F07830' },
    { icon: Ico.feed, label: 'Feed', sub: postsCount + ' posts', sc: 'feed', color: '#D4621A' },
    { icon: Ico.event, label: 'Eventos', sub: confirmacoesCount + ' confirmados', sc: 'eventos', color: '#F07830' },
  ];

  return (
    <div className="fade">
      <div style={s.instaHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={s.logoBox}>
            <svg width="20" height="22" viewBox="0 0 48 52" fill="none">
              <rect x="6" y="4" width="30" height="38" rx="3" fill="#F07830" stroke="#fff" strokeWidth="2.5" />
              <rect x="6" y="4" width="6" height="38" rx="2" fill="#D4621A" stroke="#fff" strokeWidth="1.5" />
              <rect x="19" y="13" width="3" height="16" rx="1.5" fill="#fff" />
              <rect x="14" y="18" width="13" height="3" rx="1.5" fill="#fff" />
              <path d="M26 42 L30 42 L30 50 L28 47 L26 50 Z" fill="#fff" />
            </svg>
          </div>
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 20, color: '#fff', letterSpacing: 2 }}>
            VERTICALIZADOS
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isAdmin && (
            <button onClick={() => goTo('admin')} style={s.iconBtn}>
              {Ico.admin('#71767b')}
            </button>
          )}
          <img src={currentUser.photo} style={s.avatarSmall} onClick={() => goTo('perfil')} alt="" />
        </div>
      </div>

      <div style={s.welcomeBox}>
        <div
          style={{
            fontSize: 11,
            color: '#F07830',
            fontFamily: 'Barlow Condensed',
            fontWeight: 700,
            letterSpacing: 2,
            marginBottom: 4,
          }}
        >
          BOA VINDA, {currentUser.name.toUpperCase()}! 👋
        </div>
        <div style={{ fontSize: 18, color: '#fff', fontFamily: 'Barlow', fontWeight: 600 }}>
          O que vamos explorar hoje?
        </div>
      </div>

      <div style={s.grid}>
        {MENU_ITEMS.map((item) => (
          <div key={item.sc} style={s.gridCard} onClick={() => goTo(item.sc as Screen)}>
            <div
              style={{
                width: 42,
                height: 42,
                background: 'rgba(240,120,48,0.1)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              {item.icon(item.color)}
            </div>
            <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 18, color: '#fff', letterSpacing: 0.5 }}>
              {item.label}
            </div>
            <div style={{ fontFamily: 'Barlow', fontSize: 12, color: '#71767b', marginTop: 2 }}>
              {item.sub}
            </div>
          </div>
        ))}
      </div>

      {proximoEvento && (
        <div style={s.nextEvent}>
          <div
            style={{
              fontFamily: 'Barlow Condensed',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 3,
              color: '#F07830',
              marginBottom: 8,
            }}
          >
            PRÓXIMO ENCONTRO
          </div>
          <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 22, color: '#fff', letterSpacing: 0.5 }}>
            {proximoEvento.tema}
          </div>
          <div style={{ fontFamily: 'Barlow', fontSize: 13, color: '#71767b', marginTop: 6, display: 'flex', gap: 12 }}>
            <span>📅 {proximoEvento.data}</span>
            <span>🕖 {proximoEvento.hora}</span>
          </div>
        </div>
      )}
    </div>
  );
}
