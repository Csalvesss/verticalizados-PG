import type { CSSProperties } from 'react';

export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@600;700;900&family=Barlow:wght@400;500;600;700&display=swap');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
  }

  html {
    height: 100%;
    height: -webkit-fill-available;
  }

  body, #root {
    height: 100%;
    min-height: 100vh;
    min-height: 100dvh;
    min-height: -webkit-fill-available;
  }

  body {
    display: flex;
    justify-content: center;
    background: #0f0f0f;
    color: #e7e9ea;
    font-family: 'Barlow', sans-serif;
  }

  #root {
    width: 100%;
  }

  ::-webkit-scrollbar {
    width: 2px;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(240, 120, 48, 0.3);
    border-radius: 4px;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateX(8px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .fade {
    animation: fadeUp 220ms cubic-bezier(0.4, 0, 0.2, 1) both;
  }

  @keyframes navBounce {
    0%   { transform: scale(1); }
    50%  { transform: scale(1.15); }
    100% { transform: scale(1); }
  }
  .nav-icon-active {
    animation: navBounce 200ms ease-out;
  }

  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .skeleton {
    background: linear-gradient(90deg, #1a1a1a 25%, #242424 50%, #1a1a1a 75%);
    background-size: 800px 100%;
    animation: shimmer 1.4s infinite linear;
    border-radius: 6px;
  }

  textarea, input {
    font-family: 'Barlow', sans-serif;
    transition: all 0.2s ease;
  }

  textarea:focus, input:focus {
    outline: none;
    border-color: #F07830 !important;
  }

  button {
    transition: all 0.2s ease;
    cursor: pointer;
    border: none;
    background: transparent;
  }

  button:active {
    transform: scale(0.96);
    opacity: 0.8;
  }

  .glass {
    background: rgba(18, 20, 25, 0.88);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  @media (min-width: 560px) {
    #root {
      max-width: 500px;
      border-left: 1px solid rgba(255,255,255,0.06);
      border-right: 1px solid rgba(255,255,255,0.06);
    }
  }
`;

export const s: Record<string, CSSProperties> = {
  root: {
    background: '#0f0f0f',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: 500,
    margin: '0 auto',
    position: 'relative',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    paddingBottom: 'calc(70px + env(safe-area-inset-bottom, 0px))',
  },
  page: {
    padding: '0 14px',
  },
  instaHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.82)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 16px',
    minHeight: 54,
    background: 'rgba(0,0,0,0.82)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    marginBottom: 0,
  },
  pageTitle: {
    fontFamily: 'Barlow Condensed, sans-serif',
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: 2,
    color: '#fff',
    textTransform: 'uppercase' as const,
    flex: 1,
    textAlign: 'center' as const,
  },
  backBtn: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    color: '#F07830',
  },
  iconBtn: {
    padding: '8px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 500,
    background: 'rgba(0,0,0,0.88)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    justifyContent: 'space-around',
    padding: '6px 0 12px',
    zIndex: 100,
  },
  navBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    padding: '8px 4px',
    borderRadius: 12,
    flex: 1,
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarSmall: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    border: '1.5px solid #F07830',
    objectFit: 'cover',
  },
  welcomeBox: {
    padding: '20px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    padding: '16px',
  },
  gridCard: {
    background: 'rgba(18,20,25,0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: 18,
    padding: '20px 16px 18px',
    border: '1px solid rgba(255,255,255,0.07)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  nextEvent: {
    background: 'rgba(186,117,23,0.07)',
    border: '1px solid rgba(186,117,23,0.18)',
    borderRadius: 16,
    padding: '16px',
    margin: '0 16px 16px',
  },
  card: {
    background: 'rgba(18,20,25,0.9)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,0.07)',
    overflow: 'hidden',
    marginBottom: 12,
    boxShadow: '0 4px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
  },
  cardNum: {
    background: 'rgba(240,120,48,0.07)',
    width: 50,
    minHeight: 70,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTag: {
    fontFamily: 'Barlow Condensed',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 2,
    color: '#F07830',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontFamily: 'Barlow Condensed',
    fontWeight: 700,
    fontSize: 20,
    color: '#fff',
    letterSpacing: 0.5,
  },
  cardHint: {
    fontFamily: 'Barlow',
    fontSize: 12,
    color: '#4a4a4a',
    marginTop: 2,
  },
  btnOrange: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 24px',
    borderRadius: 999,
    background: 'linear-gradient(135deg, #F07830 0%, #BA7517 100%)',
    color: '#fff',
    fontFamily: 'Barlow',
    fontWeight: 700,
    fontSize: 14,
    boxShadow: '0 4px 16px rgba(240,120,48,0.25)',
  },
  btnSpotify: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 999,
    background: '#1DB954',
    color: '#fff',
    textDecoration: 'none',
    fontFamily: 'Barlow Condensed',
    fontWeight: 700,
    fontSize: 12,
  },
  btnYoutube: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 999,
    background: '#FF0000',
    color: '#fff',
    textDecoration: 'none',
    fontFamily: 'Barlow Condensed',
    fontWeight: 700,
    fontSize: 12,
  },
  avatarFeed: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    objectFit: 'cover',
  },
  textarea: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: '12px',
    color: '#fff',
    fontSize: 15,
    width: '100%',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: '#555',
    fontFamily: 'Barlow',
    fontSize: 13,
  },
  adminRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  adminActionBtn: {
    padding: '6px',
    color: '#555',
  },
  empty: {
    fontFamily: 'Barlow',
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    padding: 40,
  },
};
