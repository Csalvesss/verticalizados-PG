import { useState, useEffect } from 'react';
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
  const [bouncing, setBouncing] = useState<Screen | null>(null);

  useEffect(() => {
    setBouncing(screen);
    const t = setTimeout(() => setBouncing(null), 200);
    return () => clearTimeout(t);
  }, [screen]);

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 500,
      background: 'rgba(15, 15, 15, 0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      justifyContent: 'space-around',
      padding: `8px 0 env(safe-area-inset-bottom, 10px)`,
      zIndex: 100,
    }}>
      {NAV.map((item) => {
        const active = screen === item.id;
        const isBouncing = bouncing === item.id;
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
              minHeight: 44,
              position: 'relative',
            }}
          >
            {/* Pill highlight */}
            {active && (
              <div style={{
                position: 'absolute',
                top: 2,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 52,
                height: 34,
                borderRadius: 18,
                background: 'rgba(240,120,48,0.12)',
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
                ...(isBouncing ? { animation: 'navBounce 200ms ease-out' } : {}),
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
                transform: active ? 'scale(1.05)' : 'scale(1)',
                position: 'relative',
                zIndex: 1,
                opacity: active ? 1 : 0.45,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                ...(isBouncing ? { animation: 'navBounce 200ms ease-out' } : {}),
              }}>
                {item.icon!(active ? '#F07830' : '#e7e9ea')}
              </div>
            )}

            <span style={{
              fontFamily: 'Barlow, sans-serif',
              fontSize: 10,
              fontWeight: active ? 600 : 400,
              letterSpacing: 0.2,
              color: active ? '#F07830' : 'rgba(255,255,255,0.35)',
              transition: 'color 0.2s',
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
