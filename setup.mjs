import { writeFileSync, mkdirSync } from 'fs';

mkdirSync('src/screens', { recursive: true });
mkdirSync('src/components', { recursive: true });

const files = {};

files['src/types.ts'] = `export type Screen = 'home' | 'musicas' | 'cifras' | 'oracao' | 'feed' | 'eventos' | 'perfil' | 'admin';

export interface CurrentUser { uid: string; name: string; fullName: string; photo: string; email: string; }
export interface Section { label: string; type: 'verse' | 'chorus' | 'bridge'; lines: string[]; }
export interface Song { id: string; title: string; spotify?: string; youtube?: string; ordem: number; sections?: Section[]; letra?: string; }
export interface Cifra { id: string; title: string; tom: string; cifra: string; ordem: number; }
export interface Evento { id: string; tema: string; data: string; hora: string; local: string; }
export interface Post { id: string; user: string; userId: string; photo: string; text: string; imageUrl?: string | null; likes: string[]; comments: Comment[]; createdAt: any; repostOf?: { user: string; text: string }; }
export interface Comment { user: string; userId: string; photo: string; text: string; time: string; }
export interface Confirmacao { id: string; userId: string; userName: string; userPhoto: string; eventoId: string; lanche: string | null; hora: string; }
export interface Sorteio { sorteado: string; historico: string[]; semana: string; }
`;

files['src/styles.ts'] = `import type { CSSProperties } from 'react';

export const GLOBAL_CSS = \`
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@600;700;900&family=Barlow:wght@400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body,#root{height:100%;background:#1A1A1A;}
  ::-webkit-scrollbar{width:2px;} ::-webkit-scrollbar-thumb{background:#F07830;border-radius:4px;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
  .fade{animation:fadeUp 0.25s ease both;}
  textarea,input{font-family:'Barlow',sans-serif;}
  textarea:focus,input:focus{outline:none;border-color:#F07830!important;}
  .post-action:hover{opacity:0.7;}
  .post-action{background:transparent;border:none;cursor:pointer;display:flex;align-items:center;gap:5px;}
  button:active{opacity:0.8;}
\`;

export const s: Record<string, CSSProperties> = {
  root: { background: '#1A1A1A', minHeight: '100%', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', position: 'relative' },
  content: { flex: 1, overflowY: 'auto', paddingBottom: 65 },
  page: { padding: '16px 14px 0' },
  instaHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 14px 10px', borderBottom: '1px solid #2a2a2a', background: '#1A1A1A', position: 'sticky', top: 0, zIndex: 50 },
  pageHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 },
  pageTitle: { fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 2, color: '#fff' },
  backBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px 4px 0', display: 'flex', alignItems: 'center' },
  iconBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' },
  bottomNav: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: 'rgba(17,17,17,0.97)', backdropFilter: 'blur(12px)', borderTop: '1px solid #2a2a2a', display: 'flex', justifyContent: 'space-around', padding: '8px 0 10px', zIndex: 100 },
  navBtn: { border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 12px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s' },
  logoBox: { width: 36, height: 36, background: '#F07830', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarSmall: { width: 36, height: 36, borderRadius: '50%', border: '2px solid #F07830', cursor: 'pointer', objectFit: 'cover' },
  welcomeBox: { background: 'rgba(240,120,48,0.08)', borderLeft: '3px solid #F07830', padding: '12px 16px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '14px 14px 0' },
  gridCard: { background: '#FFF8F0', borderRadius: 18, padding: '20px 16px', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.2)', transition: 'transform 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
  nextEvent: { background: 'rgba(240,120,48,0.08)', border: '1px solid rgba(240,120,48,0.15)', borderRadius: 16, padding: '16px', margin: '14px 14px 16px' },
  card: { background: '#FFF8F0', borderRadius: 18, overflow: 'hidden', marginBottom: 14, boxShadow: '0 2px 16px rgba(0,0,0,0.18)' },
  cardTop: { display: 'flex', alignItems: 'center', cursor: 'pointer' },
  cardNum: { background: '#F07830', width: 56, minHeight: 76, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardTag: { fontFamily: 'Barlow Condensed', fontSize: 9, fontWeight: 700, letterSpacing: 3, color: '#D4621A', textTransform: 'uppercase' },
  cardTitle: { fontFamily: 'Bebas Neue', fontSize: 21, color: '#1A1A1A', letterSpacing: 1 },
  cardHint: { fontFamily: 'Barlow', fontSize: 11, color: '#999', fontStyle: 'italic', marginTop: 2 },
  btnOrange: { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 50, background: '#F07830', color: '#fff', border: 'none', fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 13, letterSpacing: 1, cursor: 'pointer' },
  btnSpotify: { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 50, background: '#1DB954', color: '#fff', textDecoration: 'none', fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 12, letterSpacing: 1 },
  btnYoutube: { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 50, background: '#FF0000', color: '#fff', textDecoration: 'none', fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 12, letterSpacing: 1 },
  avatarFeed: { width: 38, height: 38, borderRadius: '50%', border: '2px solid #F07830', objectFit: 'cover' },
  textarea: { border: '1.5px solid #e0e0e0', borderRadius: 12, padding: '10px 12px', resize: 'none', width: '100%', transition: 'border 0.2s', background: '#fff' },
  actionBtn: { display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Barlow', fontSize: 13, padding: '4px 0' },
  adminRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '1px solid #f0ebe3' },
  adminActionBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: '#888', display: 'flex', alignItems: 'center' },
  empty: { fontFamily: 'Barlow', fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 32 },
};
`;

files['src/constants.ts'] = `export const ADMIN_EMAIL = 'ads.cesaralves@gmail.com';
export const LANCHES = ['🧃 Suco', '🥤 Refrigerante', '🍕 Salgado', '🍰 Bolo', '🍪 Biscoito', '🫙 Outro'];

export const DEFAULT_SONGS = [
  { title:'Não Mais Eu', spotify:'https://open.spotify.com/intl-pt/track/55hYoGlIgSyI5TMTNOsSjL', youtube:'https://youtu.be/wcTCKJUEy2Y', ordem:0, letra:'', sections:[
    {label:'Verso 1',type:'verse',lines:['Foi na cruz, foi na cruz, em que ao fim percebi','Meu pecado recaiu em Jesus','Foi então, pela fé, que meus olhos abri','Que prazer sinto agora em sua luz']},
    {label:'Refrão',type:'chorus',lines:['Eu irei para a cruz, onde pude perceber','Esse amor que por mim foi pago','Sua mão me curou, sua morte me salvou','Eu irei, eu irei para a cruz']},
    {label:'Bridge',type:'bridge',lines:['Não mais eu, não mais eu','É Jesus que vive em mim','Cristo vive em mim','Cristo vive em mim']},
    {label:'Final',type:'chorus',lines:['Eu irei para a cruz, onde pude perceber','Este amor que por mim foi pago','Sua mão me curou, sua morte me salvou','Eu irei, eu irei para a cruz']}
  ]},
  { title:'Digno', spotify:'https://open.spotify.com/intl-pt/track/2XtXerzRGuuHXbxOIbo44e', youtube:'https://youtu.be/ax-25gXlmBk', ordem:1, letra:'', sections:[
    {label:'Verso 1',type:'verse',lines:['Logo estaremos num lindo lugar','Com jardins e um rio de cristal','Onde andaremos na presença do Senhor']},
    {label:'Refrão',type:'chorus',lines:['Digno! É o Cordeiro bendito','Digno! Toda honra e glória a Ti','Tanto esperei por este momento','Pra sempre irei Te adorar, Digno!']},
    {label:'Bridge',type:'bridge',lines:['Cantaremos aleluia','Cantaremos aleluia','(aleluia, aleluia, aleluia...)']}
  ]},
];

export const DEFAULT_CIFRAS = [
  { title:'Não Mais Eu', tom:'G', ordem:0, cifra:'[Intro] G  D  Em  C\\n\\n[Verso]\\nG D Em C\\nFoi na cruz, foi na cruz\\n\\n[Refrão]\\nG D\\nEu irei para a cruz\\nEm C\\nonde pude perceber' },
  { title:'Digno', tom:'A', ordem:1, cifra:'[Intro] A  E  F#m  D\\n\\n[Verso]\\nA E\\nLogo estaremos num lindo lugar\\nF#m D\\nCom jardins e um rio de cristal\\n\\n[Refrão]\\nA E\\nDigno! É o Cordeiro bendito' },
];

export function getWeekKey(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return \`\${now.getFullYear()}-W\${week}\`;
}

export function tempoRelativo(ts: any): string {
  if (!ts?.toDate) return 'agora';
  const diff = Math.floor((Date.now() - ts.toDate().getTime()) / 60000);
  if (diff < 1) return 'agora';
  if (diff < 60) return \`\${diff}min\`;
  if (diff < 1440) return \`\${Math.floor(diff / 60)}h\`;
  return \`\${Math.floor(diff / 1440)}d\`;
}
`;

for (const [path, content] of Object.entries(files)) {
  writeFileSync(path, content);
  console.log('✅ criado:', path);
}

console.log('\nAgora rode: git add . && git commit -m "fix: add missing files" && git push');
