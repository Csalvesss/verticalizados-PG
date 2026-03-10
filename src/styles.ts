import type { CSSProperties } from 'react';

export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@600;700;900&family=Barlow:wght@400;500;600;700&display=swap');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
  }

  html, body, #root {
    height: 100%;
    background: #000;
    color: #e7e9ea;
    font-family: 'Barlow', sans-serif;
  }

  ::-webkit-scrollbar {
    width: 2px;
  }

  ::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 4px;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .fade {
    animation: fadeUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) both;
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
    background: rgba(22, 24, 28, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
`;

export const s: Record<string, CSSProperties> = {
  root: {
    background: '#000',
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: 500,
    margin: '0 auto',
    position: 'relative',
    borderLeft: '1px solid #2f3336',
    borderRight: '1px solid #2f3336',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    paddingBottom: 70,
  },
  page: {
    padding: '0 16px',
  },
  instaHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #2f3336',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(12px)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    borderBottom: '1px solid #2f3336',
    marginBottom: 16,
  },
  pageTitle: {
    fontFamily: 'Barlow Condensed',
    fontWeight: 700,
    fontSize: 19,
    color: '#fff',
    letterSpacing: 0.5,
  },
  backBtn: {
    padding: '6px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
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
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(14px)',
    borderTop: '1px solid #2f3336',
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
    borderBottom: '1px solid #2f3336',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    padding: '16px',
  },
  gridCard: {
    background: '#16181c',
    borderRadius: 16,
    padding: '20px 16px',
    border: '1px solid #2f3336',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  nextEvent: {
    background: 'rgba(240,120,48,0.1)',
    border: '1px solid rgba(240,120,48,0.2)',
    borderRadius: 16,
    padding: '16px',
    margin: '0 16px 16px',
  },
  card: {
    background: '#16181c',
    borderRadius: 16,
    border: '1px solid #2f3336',
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
  },
  cardNum: {
    background: 'rgba(240,120,48,0.15)',
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
    color: '#71767b',
    marginTop: 2,
  },
  btnOrange: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 24px',
    borderRadius: 999,
    background: '#F07830',
    color: '#fff',
    fontFamily: 'Barlow',
    fontWeight: 700,
    fontSize: 14,
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
    background: 'transparent',
    border: '1px solid #2f3336',
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
    color: '#71767b',
    fontFamily: 'Barlow',
    fontSize: 13,
  },
  adminRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 0',
    borderBottom: '1px solid #2f3336',
  },
  adminActionBtn: {
    padding: '6px',
    color: '#71767b',
  },
  empty: {
    fontFamily: 'Barlow',
    fontSize: 14,
    color: '#71767b',
    textAlign: 'center',
    padding: 40,
  },
};
