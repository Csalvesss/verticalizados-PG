import { Ico } from '../icons';
import { s } from '../styles';
import type { Screen } from '../types';

const NAV = [
  { id: 'home' as Screen, label: 'Início', icon: Ico.home },
  { id: 'musicas' as Screen, label: 'Músicas', icon: Ico.music },
  { id: 'cifras' as Screen, label: 'Cifras', icon: Ico.guitar },
  { id: 'oracao' as Screen, label: 'Oração', icon: Ico.pray },
  { id: 'feed' as Screen, label: 'Feed', icon: Ico.feed },
  { id: 'eventos' as Screen, label: 'Eventos', icon: Ico.event },
];

export function BottomNav({
  screen,
  goTo,
}: {
  screen: Screen;
  goTo: (sc: Screen) => void;
}) {
  return (
    <div style={s.bottomNav}>
      {NAV.map((item) => {
        const active = screen === item.id;
        return (
          <button
            key={item.id}
            onClick={() => goTo(item.id)}
            style={{
              ...s.navBtn,
              background: 'transparent',
            }}
          >
            <div
              style={{
                transition: '0.2s',
                transform: active ? 'translateY(-2px)' : 'none',
              }}
            >
              {item.icon(active ? '#F07830' : '#71767b')}
            </div>
            <span
              style={{
                fontFamily: 'Barlow Condensed',
                fontSize: 10,
                fontWeight: active ? 700 : 500,
                letterSpacing: 0.5,
                color: active ? '#F07830' : '#71767b',
                transition: '0.2s',
              }}
            >
              {item.label}
            </span>
            {active && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  width: 24,
                  height: 3,
                  background: '#F07830',
                  borderRadius: '0 0 4px 4px',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
