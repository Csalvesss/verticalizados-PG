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

export function HomeScreen({ currentUser, isAdmin, goTo, songsCount, postsCount, confirmacoesCount, proximoEvento }: Props) {
  return (
    <div className="fade">
      <div style={s.instaHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={s.logoBox}>
            <svg width="26" height="30" viewBox="0 0 48 52" fill="none">
              <rect x="6" y="4" width="30" height="38" rx="3" fill="#F07830" stroke="#fff" strokeWidth="2.5" />
              <rect x="6" y="4" width="6" height="38" rx="2" fill="#D4621A" stroke="#fff" strokeWidth="1.5" />
              <rect x="19" y="13" width="3" height="16" rx="1.5" fill="#fff" />
              <rect x="14" y="18" width="13" height="3" rx="1.5" fill="#fff" />
              <path d="M26 42 L30 42 L30 50 L28 47 L26 50 Z" fill="#fff" />
            </svg>
          </div>
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: '#fff', letterSpacing: 2 }}>VERTICALIZADOS</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {isAdmin && (
            <button onClick={() => goTo('admin')} style={s.iconBtn}>{Ico.admin('#F07830')}</button>
          )}
          <img src={currentUser.photo} style={s.avatarSmall} onClick={() => goTo('perfil')} alt="perfil" />
        </div>
      </div>

      <div style={s.welcomeBox}>
        <span style={{ fontSize: 11, color: '#F07830', fontFamily: 'Barlow Condensed', fontWeight: 700, letterSpacing: 2 }}>
          BOA VINDA, {currentUser.name.toUpperCase()}! 👋
        </span>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow', marginTop: 2, display: 'block' }}>
          O que vamos explorar hoje?
        </span>
      </div>

      <div style={s.grid}>
        {[
          { icon: Ico.music, label: 'Músicas', sub: `${songsCount} músicas`, sc: 'musicas', color: '#F07830' },
          { icon: Ico.guitar, label: 'Cifras', sub: 'Para violonistas', sc: 'cifras', color: '#D4621A' },
          { icon: Ico.pray, label: 'Oração', sub: 'Sorteio semanal', sc: 'oracao', color: '#F07830' },
          { icon: Ico.feed, label: 'Feed', sub: `${postsCount} posts`, sc: 'feed', color: '#D4621A' },
          { icon: Ico.event, label: 'Eventos', sub: `${confirmacoesCount} confirmados`, sc: 'eventos', color: '#F07830' },
        ].map(item => (
          <div key={item.sc} style={s.gridCard} onClick={() => goTo(item.sc as Screen)}>
            <div style={{ width: 40, height: 40, background: `${item.color}18`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              {item.icon(item.color)}
            </div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, color: '#1A1A1A', letterSpacing: 1 }}>{item.label}</div>
            <div style={{ fontFamily: 'Barlow', fontSize: 11, color: '#aaa', marginTop: 2 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {proximoEvento && (
        <div style={s.nextEvent}>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#F07830', marginBottom: 4 }}>PRÓXIMO ENCONTRO</div>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: '#fff', letterSpacing: 1 }}>{proximoEvento.tema}</div>
          <div style={{ fontFamily: 'Barlow', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{proximoEvento.data} · {proximoEvento.hora}</div>
        </div>
      )}
    </div>
  );
}