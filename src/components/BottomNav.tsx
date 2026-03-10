import type { ReactElement } from 'react';
import { Ico } from '../icons';
import type { Screen } from '../types';

const NAV: { id: Screen; label: string; icon: ((c: string) => ReactElement) | null }[] = [
  { id: 'home', label: 'Início', icon: Ico.home },
  { id: 'musicas', label: 'Músicas', icon: Ico.music },
  { id: 'feed', label: 'Feed', icon: Ico.feed },
  { id: 'eventos', label: 'Eventos', icon: Ico.event },
  { id: 'perfil', label: 'Perfil', icon: null },
];

export function BottomNav({
  screen,
  goTo,
  userPhoto,
}: {
  screen: Screen;
  goTo: (sc: Screen) => void;
  userPhoto: string;
}) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 500,
      background: 'rgba(0,0,0,0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderTop: '1px solid #1a1a1a',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '8px 0 env(safe-area-inset-bottom, 10px)',
      zIndex: 100,
    }}>
      {NAV.map((item) => {
        const active = screen === item.id;
        return (
          <button
            key={item.id}
            onClick={() => goTo(item.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '6px 16px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              flex: 1,
              minWidth: 0,
            }}
          >
            {item.id === 'perfil' ? (
              /* Profile: real avatar with ring when active */
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                padding: active ? 2 : 0,
                background: active ? 'linear-gradient(135deg, #F07830, #D4621A)' : 'transparent',
                transition: 'all 0.2s',
              }}>
                <img
                  src={userPhoto}
                  alt="Perfil"
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: active ? '1.5px solid #000' : '1.5px solid #333',
                    display: 'block',
                    transition: 'border 0.2s',
                  }}
                />
              </div>
            ) : (
              /* Regular icon */
              <div style={{
                transition: 'transform 0.2s',
                transform: active ? 'scale(1.1)' : 'scale(1)',
              }}>
                {item.icon!(active ? '#F07830' : '#555')}
              </div>
            )}

            <span style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontSize: 9,
              fontWeight: active ? 700 : 400,
              letterSpacing: 0.5,
              color: active ? '#F07830' : '#444',
              transition: 'color 0.2s',
              textTransform: 'uppercase',
            }}>
              {item.label}
            </span>

            {active && (
              <div style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: '#F07830',
                marginTop: -2,
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
