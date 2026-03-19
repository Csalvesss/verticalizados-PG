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
            aria-label={item.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px 6px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              flex: 1,
              minWidth: 0,
              position: 'relative',
            }}
          >
            {/* Pill highlight behind icon+label */}
            {active && (
              <div style={{
                position: 'absolute',
                top: 2,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 52,
                height: 34,
                borderRadius: 18,
                background: 'rgba(240,120,48,0.14)',
                transition: 'all 0.2s',
                pointerEvents: 'none',
              }} />
            )}

            {item.id === 'perfil' ? (
              <div style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                padding: active ? 2 : 1,
                background: active ? 'linear-gradient(135deg, #F07830, #D4621A)' : '#222',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                position: 'relative',
                zIndex: 1,
              }}>
                <img
                  src={userPhoto}
                  alt="Perfil"
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #000',
                    display: 'block',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ) : (
              <div style={{
                transition: 'transform 0.2s',
                transform: active ? 'scale(1.08)' : 'scale(1)',
                position: 'relative',
                zIndex: 1,
              }}>
                {item.icon!(active ? '#F07830' : '#4a4a4a')}
              </div>
            )}

            <span style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontSize: 9,
              fontWeight: active ? 700 : 400,
              letterSpacing: 0.5,
              color: active ? '#F07830' : '#3a3a3a',
              transition: 'color 0.2s',
              textTransform: 'uppercase',
              position: 'relative',
              zIndex: 1,
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
