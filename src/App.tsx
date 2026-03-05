import { useState, useRef, useEffect } from 'react';
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { db } from './firebase';

const auth = getAuth();
const provider = new GoogleAuthProvider();
const MEMBROS = ['César', 'Ana', 'Pedro', 'Maria', 'João', 'Carla', 'Lucas', 'Fernanda', 'Tiago', 'Juliana'];
const SONGS = [
  {
    id: 1, title: 'Não Mais Eu',
    spotify: 'https://open.spotify.com/intl-pt/track/55hYoGlIgSyI5TMTNOsSjL',
    youtube: 'https://youtu.be/wcTCKJUEy2Y',
    sections: [
      { label: 'Verso 1', type: 'verse', lines: ['Foi na cruz, foi na cruz, em que ao fim percebi','Meu pecado recaiu em Jesus','Foi então, pela fé, que meus olhos abri','Que prazer sinto agora em sua luz'] },
      { label: 'Refrão', type: 'chorus', lines: ['Eu irei para a cruz, onde pude perceber','Esse amor que por mim foi pago','Sua mão me curou, sua morte me salvou','Eu irei, eu irei para a cruz'] },
      { label: 'Verso 2', type: 'verse', lines: ['Quão perdido estou, quão vazio o coração','Não sou digno de tanto amor','Foi então, pela fé, que meus olhos abri','Que prazer sinto agora em sua luz'] },
      { label: 'Refrão', type: 'chorus', lines: ['Eu irei para a cruz, onde pude perceber','Este amor que por mim foi pago','Sua mão me curou, sua morte me salvou','Eu irei, eu irei para a cruz'] },
      { label: 'Bridge', type: 'bridge', lines: ['Não mais eu, não mais eu','É Jesus que vive em mim','Cristo vive em mim','Cristo vive em mim'] },
      { label: 'Final', type: 'chorus', lines: ['Eu irei para a cruz, onde pude perceber','Este amor que por mim foi pago','Sua mão me curou, sua morte me salvou','Eu irei, eu irei para a cruz','Eu irei, eu irei para a cruz...'] },
    ],
  },
  {
    id: 2, title: 'Digno',
    spotify: 'https://open.spotify.com/intl-pt/track/2XtXerzRGuuHXbxOIbo44e',
    youtube: 'https://youtu.be/ax-25gXlmBk',
    sections: [
      { label: 'Verso 1', type: 'verse', lines: ['Logo estaremos num lindo lugar','Com jardins e um rio de cristal','Onde andaremos na presença do Senhor'] },
      { label: 'Verso 2', type: 'verse', lines: ['Logo da terra se levantarão','Os que dormem o sono dos justos','A eternidade ali começou'] },
      { label: 'Pré-Refrão', type: 'verse', lines: ['E ao entrar pelas portas do céu','O verei','Correrei pra abraçá-Lo e então cantarei'] },
      { label: 'Refrão', type: 'chorus', lines: ['Digno! É o Cordeiro bendito','Digno! Toda honra e glória a Ti','Tanto esperei por este momento','','Digno! O conflito encerrado está','Digno! Em Teus braços achei meu lugar','Pra sempre irei Te adorar, Digno!'] },
      { label: 'Bridge', type: 'bridge', lines: ['Cantaremos aleluia','Cantaremos aleluia','Cantaremos aleluia','(aleluia, aleluia, aleluia...)'] },
      { label: 'Final', type: 'chorus', lines: ['Aleluia, Aleluia, Aleluia, Digno','Aleluia, Aleluia, Aleluia, Digno'] },
    ],
  },
];
const CIFRAS = [
  { id: 1, title: 'Não Mais Eu', tom: 'G', cifra: `[Intro] G  D  Em  C (2x)

[Verso 1]
G              D
Foi na cruz, foi na cruz,
Em                C
em que ao fim percebi
G              D
Meu pecado recaiu em Jesus
Em              C
Foi então, pela fé, que meus olhos abri

[Refrão]
G        D
Eu irei para a cruz
Em           C
onde pude perceber
G          D
Esse amor que por mim foi pago
Em              C
Sua mão me curou, sua morte me salvou
G    D    Em  C
Eu irei, eu irei para a cruz

[Bridge]
Em        D
Não mais eu, não mais eu
C              G
É Jesus que vive em mim` },
  { id: 2, title: 'Digno', tom: 'A', cifra: `[Intro] A  E  F#m  D (2x)

[Verso]
A                 E
Logo estaremos num lindo lugar
F#m              D
Com jardins e um rio de cristal

[Refrão]
A        E
Digno! É o Cordeiro bendito
F#m         D
Digno! Toda honra e glória a Ti
A              E
Tanto esperei por este momento
F#m     D       A
Pra sempre irei Te adorar, Digno!

[Bridge]
F#m   E    D    A
Cantaremos aleluia (4x)` },
];
const LANCHES = ['🧃 Suco','🥤 Refrigerante','🍕 Salgado','🍰 Bolo','🍪 Biscoito','🫙 Outro'];

// ── ICONS ──────────────────────────────────────────────────────────────────
const Ico = {
  home: (c='#888') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  music: (c='#888') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  guitar: (c='#888') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 8L3.5 15.5A2.5 2.5 0 0 0 7 19l7.5-7.5"/><path d="M14 6l1.5-1.5a2 2 0 0 1 2.83 0l.17.17a2 2 0 0 1 0 2.83L17 9"/><line x1="9" y1="15" x2="12" y2="12"/></svg>,
  pray: (c='#888') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  feed: (c='#888') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  event: (c='#888') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  heart: (f: boolean) => <svg width="16" height="16" viewBox="0 0 24 24" fill={f?'#F07830':'none'} stroke="#F07830" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  comment: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  repost: (c='#888') => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  check: (c='#fff') => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  chevron: (open: boolean) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F07830" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{transform: open?'rotate(90deg)':'none', transition:'transform 0.3s'}}><polyline points="9 18 15 12 9 6"/></svg>,
  back: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F07830" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  camera: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  dots: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>,
};

type Screen = 'home'|'musicas'|'cifras'|'oracao'|'feed'|'eventos'|'perfil';
interface Post { id:string; user:string; photo:string; text:string; likes:string[]; time:string; createdAt:any; comments:{user:string;photo:string;text:string}[]; repostOf?:{user:string;text:string}; }
interface Confirmado { nome:string; lanche:string|null; hora:string; }

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  if (authLoading) {
    return (
      <div style={{background:'#1A1A1A',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{fontFamily:'Bebas Neue',fontSize:24,color:'#F07830',letterSpacing:3}}>VERTICALIZADOS</div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return <MainApp user={user} />;
}

function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const entrar = async () => {
    setLoading(true);
    setErro('');
    try {
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      setErro('Não foi possível entrar. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div style={{background:'#1A1A1A',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,maxWidth:480,margin:'0 auto'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>

      {/* Logo */}
      <div style={{marginBottom:32,display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>
        <div style={{width:80,height:80,background:'#F07830',borderRadius:20,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="48" height="54" viewBox="0 0 48 52" fill="none">
            <rect x="6" y="4" width="30" height="38" rx="3" fill="#F07830" stroke="#fff" strokeWidth="2.5"/>
            <rect x="6" y="4" width="6" height="38" rx="2" fill="#D4621A" stroke="#fff" strokeWidth="1.5"/>
            <rect x="19" y="13" width="3" height="16" rx="1.5" fill="#fff"/>
            <rect x="14" y="18" width="13" height="3" rx="1.5" fill="#fff"/>
            <path d="M26 42 L30 42 L30 50 L28 47 L26 50 Z" fill="#fff"/>
          </svg>
        </div>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:'Bebas Neue',fontSize:36,color:'#fff',letterSpacing:4,lineHeight:1}}>VERTICALIZADOS</div>
          <div style={{fontFamily:'Barlow Condensed',fontSize:12,fontWeight:700,letterSpacing:4,color:'rgba(255,255,255,0.35)',marginTop:4}}>MJA ESPLANADA</div>
        </div>
      </div>

      {/* Card de login */}
      <div style={{background:'#FFF8F0',borderRadius:24,padding:28,width:'100%',maxWidth:360,boxShadow:'0 8px 40px rgba(0,0,0,0.4)'}}>
        <div style={{fontFamily:'Bebas Neue',fontSize:22,color:'#1A1A1A',letterSpacing:2,marginBottom:6}}>BEM-VINDO(A)!</div>
        <div style={{fontFamily:'Barlow',fontSize:13,color:'#888',marginBottom:24,lineHeight:1.6}}>
          Entre com sua conta Google para acessar o espaço do PG Verticalizados.
        </div>

        <button onClick={entrar} disabled={loading} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:12,padding:'14px 20px',borderRadius:50,background:loading?'#ddd':'#1A1A1A',color:'#fff',border:'none',cursor:loading?'not-allowed':'pointer',fontFamily:'Barlow Condensed',fontWeight:700,fontSize:15,letterSpacing:1,transition:'all 0.2s'}}>
          {!loading && (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {loading ? 'Entrando...' : 'Entrar com Google'}
        </button>

        {erro && <div style={{fontFamily:'Barlow',fontSize:12,color:'#e53935',textAlign:'center',marginTop:12}}>{erro}</div>}

        <div style={{fontFamily:'Barlow',fontSize:11,color:'#bbb',textAlign:'center',marginTop:20,lineHeight:1.6}}>
          Apenas membros do PG Verticalizados devem acessar este espaço.
        </div>
      </div>
    </div>
  );
}

function MainApp({ user }: { user: User }) {
  const currentUser = {
    name: user.displayName?.split(' ')[0] || 'Membro',
    fullName: user.displayName || 'Membro',
    photo: user.photoURL || 'https://i.pravatar.cc/150?img=12',
    email: user.email || '',
  };
  const [screen, setScreen] = useState<Screen>('home');
  const [openSong, setOpenSong] = useState<number|null>(null);
  const [openCifra, setOpenCifra] = useState<number|null>(null);

  // Oração
  const [sorteado, setSorteado] = useState<string|null>(null);
  const [sorteando, setSorteando] = useState(false);
  const [jaOrou, setJaOrou] = useState<string[]>([]);
  const membrosDisponiveis = MEMBROS.filter(m => m !== currentUser.name && !jaOrou.includes(m));

  // Feed — Firestore em tempo real
  const [posts, setPosts] = useState<Post[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedText, setFeedText] = useState('');
  const [commentingOn, setCommentingOn] = useState<string|null>(null);
  const [commentText, setCommentText] = useState('');
  const [repostingOn, setRepostingOn] = useState<string|null>(null);
  const [repostText, setRepostText] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
      setFeedLoading(false);
    });
    return () => unsub();
  }, []);

  // Eventos
  const evento = { tema:'Emanuel – Deus Conosco', data:'Sexta-feira, 07 de março', hora:'19h30', local:'MJA Esplanada' };
  const [confirmados, setConfirmados] = useState<Confirmado[]>([
    { nome:'Ana', lanche:'🧃 Suco', hora:'14:30' },
    { nome:'Pedro', lanche:'🍕 Salgado', hora:'15:10' },
  ]);
  const [lancheSelecionado, setLancheSelecionado] = useState<string|null>(null);
  const euConfirmei = confirmados.find(c => c.nome === currentUser.name);

  // Perfil
  const [profilePhoto, setProfilePhoto] = useState(currentUser.photo);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const goTo = (sc: Screen) => { setScreen(sc); setOpenSong(null); setOpenCifra(null); };

  const sortear = () => {
    if (membrosDisponiveis.length === 0) return;
    setSorteando(true);
    let count = 0;
    const pool = [...membrosDisponiveis];
    const interval = setInterval(() => {
      setSorteado(pool[Math.floor(Math.random() * pool.length)]);
      count++;
      if (count > 18) {
        clearInterval(interval);
        const escolhido = pool[Math.floor(Math.random() * pool.length)];
        setSorteado(escolhido);
        setJaOrou(prev => [...prev, escolhido]);
        setSorteando(false);
      }
    }, 90);
  };

  const postar = async () => {
    if (!feedText.trim()) return;
    const texto = feedText;
    setFeedText('');
    await addDoc(collection(db, 'posts'), {
      user: currentUser.name,
      photo: profilePhoto,
      text: texto,
      likes: [],
      comments: [],
      createdAt: serverTimestamp(),
    });
  };

  const curtir = async (post: Post) => {
    const ref = doc(db, 'posts', post.id);
    const jaGostou = post.likes?.includes(currentUser.name);
    await updateDoc(ref, {
      likes: jaGostou ? arrayRemove(currentUser.name) : arrayUnion(currentUser.name),
    });
  };

  const comentar = async (id: string) => {
    if (!commentText.trim()) return;
    const ref = doc(db, 'posts', id);
    await updateDoc(ref, {
      comments: arrayUnion({ user: currentUser.name, photo: profilePhoto, text: commentText }),
    });
    setCommentText(''); setCommentingOn(null);
  };

  const repostar = async (post: Post) => {
    await addDoc(collection(db, 'posts'), {
      user: currentUser.name,
      photo: profilePhoto,
      text: repostText,
      likes: [],
      comments: [],
      createdAt: serverTimestamp(),
      repostOf: { user: post.user, text: post.text },
    });
    setRepostText(''); setRepostingOn(null);
  };

  const deletarPost = async (id: string) => {
    await deleteDoc(doc(db, 'posts', id));
  };

  const confirmarPresenca = () => {
    setConfirmados([...confirmados, { nome:currentUser.name, lanche:lancheSelecionado, hora:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) }]);
    setLancheSelecionado(null);
  };
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { if (ev.target?.result) setProfilePhoto(ev.target.result as string); };
    reader.readAsDataURL(file);
  };

  const navItems = [
    { id:'home' as Screen, label:'Início', icon:Ico.home },
    { id:'musicas' as Screen, label:'Músicas', icon:Ico.music },
    { id:'cifras' as Screen, label:'Cifras', icon:Ico.guitar },
    { id:'oracao' as Screen, label:'Oração', icon:Ico.pray },
    { id:'feed' as Screen, label:'Feed', icon:Ico.feed },
    { id:'eventos' as Screen, label:'Eventos', icon:Ico.event },
  ];

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@600;700;900&family=Barlow:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#1A1A1A;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:#F07830;border-radius:4px;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pop{0%{transform:scale(0.9);}60%{transform:scale(1.06);}100%{transform:scale(1);}}
        .fade{animation:fadeUp 0.3s ease both;}
        textarea{font-family:'Barlow',sans-serif;font-size:14px;}
        textarea:focus{outline:none;border-color:#F07830!important;}
        .lanche-tag:hover{border-color:#F07830!important;background:rgba(240,120,48,0.08)!important;}
        .post-action:hover{opacity:0.7;}
      `}</style>

      <div style={s.content}>

        {/* ════ HOME ════ */}
        {screen === 'home' && (
          <div className="fade" style={s.page}>
            <div style={s.homeHeader}>
              <div style={s.logoBox}>
                <svg width="32" height="36" viewBox="0 0 48 52" fill="none">
                  <rect x="6" y="4" width="30" height="38" rx="3" fill="#F07830" stroke="#fff" strokeWidth="2.5"/>
                  <rect x="6" y="4" width="6" height="38" rx="2" fill="#D4621A" stroke="#fff" strokeWidth="1.5"/>
                  <rect x="19" y="13" width="3" height="16" rx="1.5" fill="#fff"/>
                  <rect x="14" y="18" width="13" height="3" rx="1.5" fill="#fff"/>
                  <path d="M26 42 L30 42 L30 50 L28 47 L26 50 Z" fill="#fff"/>
                  <line x1="38" y1="6" x2="41" y2="3" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="40" y1="10" x2="44" y2="10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{flex:1}}>
                <div style={s.homeTitle}>VERTICALIZADOS</div>
                <div style={s.homeSub}>MJA · ESPLANADA</div>
              </div>
              <img src={profilePhoto} style={s.avatarSmall} onClick={() => goTo('perfil')}/>
            </div>
            <div style={s.welcomeBox}>
              <div style={{fontSize:11,color:'#F07830',fontFamily:'Barlow Condensed',fontWeight:700,letterSpacing:2,marginBottom:3}}>BOA VINDA, {currentUser.name.toUpperCase()}! 👋</div>
              <div style={{fontSize:13,color:'rgba(255,255,255,0.6)',fontFamily:'Barlow'}}>O que vamos explorar hoje?</div>
            </div>
            <div style={s.grid}>
              {[
                {icon:Ico.music,label:'Músicas',sub:`${SONGS.length} esta semana`,sc:'musicas'},
                {icon:Ico.guitar,label:'Cifras',sub:'Para violonistas',sc:'cifras'},
                {icon:Ico.pray,label:'Oração',sub:'Sorteio semanal',sc:'oracao'},
                {icon:Ico.feed,label:'Feed',sub:`${posts.length} posts`,sc:'feed'},
                {icon:Ico.event,label:'Eventos',sub:`${confirmados.length} confirmados`,sc:'eventos'},
              ].map(item => (
                <div key={item.sc} style={s.gridCard} onClick={() => goTo(item.sc as Screen)}>
                  <div style={{marginBottom:8}}>{item.icon('#F07830')}</div>
                  <div style={{fontFamily:'Bebas Neue',fontSize:17,color:'#1A1A1A',letterSpacing:1}}>{item.label}</div>
                  <div style={{fontFamily:'Barlow',fontSize:11,color:'#999',marginTop:2}}>{item.sub}</div>
                </div>
              ))}
            </div>
            <div style={s.nextEvent}>
              <div style={{fontFamily:'Barlow Condensed',fontSize:10,fontWeight:700,letterSpacing:3,color:'#F07830',marginBottom:3}}>PRÓXIMO ENCONTRO</div>
              <div style={{fontFamily:'Bebas Neue',fontSize:21,color:'#fff',letterSpacing:1}}>{evento.tema}</div>
              <div style={{fontFamily:'Barlow',fontSize:12,color:'rgba(255,255,255,0.45)',marginTop:2}}>{evento.data} · {evento.hora}</div>
            </div>
          </div>
        )}

        {/* ════ MÚSICAS ════ */}
        {screen === 'musicas' && (
          <div className="fade" style={s.page}>
            <div style={s.pageHeader}>
              <button style={s.backBtn} onClick={() => goTo('home')}>{Ico.back()}</button>
              <div style={s.pageTitle}>MÚSICAS DA SEMANA</div>
            </div>
            {SONGS.map(song => {
              const open = openSong === song.id;
              return (
                <div key={song.id} style={s.card}>
                  <div style={s.cardTop} onClick={() => setOpenSong(open ? null : song.id)}>
                    <div style={s.cardNum}><span style={{fontFamily:'Bebas Neue',fontSize:34,color:'#1A1A1A',opacity:0.2}}>{song.id}</span></div>
                    <div style={{flex:1,padding:'14px 12px'}}>
                      <div style={s.cardTag}>MÚSICA</div>
                      <div style={s.cardTitle}>{song.title}</div>
                      <div style={s.cardHint}>{open ? 'Toque para fechar' : 'Toque para ver a letra'}</div>
                    </div>
                    {Ico.chevron(open)}<div style={{width:14}}/>
                  </div>
                  {open && (
                    <div style={{borderTop:'1px dashed rgba(240,120,48,0.25)',padding:'16px 16px 4px'}}>
                      {song.sections.map((sec, i) => (
                        <div key={i} style={{marginBottom:16,...(sec.type==='chorus'?{background:'#F07830',borderRadius:12,padding:'12px 14px'}:{}),...(sec.type==='bridge'?{borderLeft:'4px solid #F07830',paddingLeft:12}:{})}}>
                          <div style={{fontFamily:'Barlow Condensed',fontSize:9,fontWeight:700,letterSpacing:3,textTransform:'uppercase' as const,marginBottom:5,color:sec.type==='chorus'?'rgba(0,0,0,0.4)':'#D4621A'}}>{sec.label}</div>
                          {sec.lines.map((line, j) => (
                            <div key={j} style={{fontFamily:'Barlow',fontSize:13.5,lineHeight:1.85,fontWeight:sec.type==='chorus'?700:500,color:sec.type==='chorus'?'#1A1A1A':'#333'}}>{line||'\u00A0'}</div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{background:'#1A1A1A',padding:'10px 14px',display:'flex',gap:10}}>
                    <a href={song.spotify} target="_blank" style={s.btnSpotify}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                      Spotify
                    </a>
                    <a href={song.youtube} target="_blank" style={s.btnYoutube}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
                      YouTube
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ════ CIFRAS ════ */}
        {screen === 'cifras' && (
          <div className="fade" style={s.page}>
            <div style={s.pageHeader}>
              <button style={s.backBtn} onClick={() => goTo('home')}>{Ico.back()}</button>
              <div style={s.pageTitle}>CIFRAS</div>
            </div>
            {CIFRAS.map(c => {
              const open = openCifra === c.id;
              return (
                <div key={c.id} style={s.card}>
                  <div style={s.cardTop} onClick={() => setOpenCifra(open ? null : c.id)}>
                    <div style={s.cardNum}><span style={{fontFamily:'Bebas Neue',fontSize:34,color:'#1A1A1A',opacity:0.2}}>{c.id}</span></div>
                    <div style={{flex:1,padding:'14px 12px'}}>
                      <div style={s.cardTag}>TOM: {c.tom}</div>
                      <div style={s.cardTitle}>{c.title}</div>
                      <div style={s.cardHint}>{open ? 'Toque para fechar' : 'Toque para ver a cifra'}</div>
                    </div>
                    {Ico.chevron(open)}<div style={{width:14}}/>
                  </div>
                  {open && (
                    <div style={{borderTop:'1px dashed rgba(240,120,48,0.25)',padding:'16px'}}>
                      <pre style={{fontFamily:'monospace',fontSize:13,color:'#1A1A1A',lineHeight:2,whiteSpace:'pre-wrap',wordBreak:'break-word' as const,display:'block'}}>{c.cifra}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ════ ORAÇÃO ════ */}
        {screen === 'oracao' && (
          <div className="fade" style={s.page}>
            <div style={s.pageHeader}>
              <button style={s.backBtn} onClick={() => goTo('home')}>{Ico.back()}</button>
              <div style={s.pageTitle}>ORAÇÃO DA SEMANA</div>
            </div>
            <div style={{...s.card,padding:22,marginBottom:14}}>
              <div style={{fontFamily:'Barlow Condensed',fontSize:10,fontWeight:700,letterSpacing:3,color:'#D4621A',marginBottom:12,textAlign:'center' as const}}>ESTA SEMANA VOCÊ ORA POR</div>
              <div style={{background:'#1A1A1A',borderRadius:16,padding:'24px 16px',marginBottom:18,minHeight:90,display:'flex',flexDirection:'column' as const,alignItems:'center',justifyContent:'center'}}>
                {sorteado ? (
                  <>
                    <div style={{fontFamily:'Bebas Neue',fontSize:48,color:'#F07830',letterSpacing:3,animation:sorteando?'none':'pop 0.4s ease'}}>{sorteado}</div>
                    <div style={{fontFamily:'Barlow',fontSize:12,color:'rgba(255,255,255,0.5)',marginTop:6}}>Interceda por {sorteado} esta semana 🙏</div>
                  </>
                ) : (
                  <div style={{fontFamily:'Barlow',fontSize:13,color:'rgba(255,255,255,0.3)'}}>Nenhum sorteio ainda</div>
                )}
              </div>
              {!sorteado && membrosDisponiveis.length > 0 && (
                <button onClick={sortear} disabled={sorteando} style={{...s.btnOrange,width:'100%',justifyContent:'center',gap:8}}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="3"/><circle cx="8" cy="8" r="1.5" fill="#fff"/><circle cx="16" cy="8" r="1.5" fill="#fff"/><circle cx="8" cy="16" r="1.5" fill="#fff"/><circle cx="16" cy="16" r="1.5" fill="#fff"/><circle cx="12" cy="12" r="1.5" fill="#fff"/></svg>
                  {sorteando ? 'Sorteando...' : 'Sortear membro para orar'}
                </button>
              )}
              {sorteado && !sorteando && (
                <div style={{background:'rgba(240,120,48,0.1)',borderRadius:10,padding:'10px 14px'}}>
                  <div style={{fontFamily:'Barlow',fontSize:12,color:'#ccc',lineHeight:1.6,textAlign:'center' as const}}>O sorteio foi realizado. Ore por <strong style={{color:'#F07830'}}>{sorteado}</strong> durante a semana!</div>
                </div>
              )}
              {membrosDisponiveis.length === 0 && (
                <div style={{background:'rgba(29,185,84,0.1)',borderRadius:10,padding:'12px 14px',textAlign:'center' as const}}>
                  <div style={{fontFamily:'Barlow',fontSize:13,color:'#1DB954',fontWeight:600}}>🎉 Você já orou por todos os membros!</div>
                </div>
              )}
            </div>
            <div style={{...s.card,padding:16}}>
              <div style={s.cardTag}>MEMBROS DO PG</div>
              <div style={{display:'flex',flexWrap:'wrap' as const,gap:8,marginTop:10}}>
                {MEMBROS.filter(m => m !== currentUser.name).map(m => (
                  <div key={m} style={{fontFamily:'Barlow',fontSize:12,padding:'5px 14px',borderRadius:50,fontWeight:600,background:m===sorteado?'#F07830':jaOrou.includes(m)?'#e8e8e8':'#f5f5f5',color:m===sorteado?'#fff':jaOrou.includes(m)?'#bbb':'#555',textDecoration:jaOrou.includes(m)&&m!==sorteado?'line-through':'none'}}>{m}</div>
                ))}
              </div>
              {jaOrou.length > 0 && <div style={{fontFamily:'Barlow',fontSize:11,color:'#bbb',marginTop:10}}>Riscados = já foram sorteados anteriormente</div>}
            </div>
          </div>
        )}

        {/* ════ FEED ════ */}
        {screen === 'feed' && (
          <div className="fade" style={s.page}>
            <div style={s.pageHeader}>
              <button style={s.backBtn} onClick={() => goTo('home')}>{Ico.back()}</button>
              <div style={s.pageTitle}>FEED DO PG</div>
            </div>

            {/* Caixa de post */}
            <div style={{...s.card,padding:14,marginBottom:12}}>
              <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                <img src={profilePhoto} style={s.avatarFeed}/>
                <textarea value={feedText} onChange={e=>setFeedText(e.target.value)} placeholder="O que está no seu coração?" style={{...s.textarea,flex:1,textAlign:'left',color:'#1A1A1A'}} rows={3}/>
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',marginTop:10}}>
                <button onClick={postar} style={s.btnOrange}>Publicar</button>
              </div>
            </div>

            {/* Loading */}
            {feedLoading && (
              <div style={{textAlign:'center',padding:32,color:'rgba(255,255,255,0.3)',fontFamily:'Barlow',fontSize:13}}>Carregando feed...</div>
            )}

            {!feedLoading && posts.length === 0 && (
              <div style={{textAlign:'center',padding:32,color:'rgba(255,255,255,0.3)',fontFamily:'Barlow',fontSize:13}}>Nenhum post ainda. Seja o primeiro! 🙌</div>
            )}

            {posts.map(post => {
              const jaGostou = post.likes?.includes(currentUser.name);
              const tempo = post.createdAt?.toDate ? (() => {
                const d = post.createdAt.toDate();
                const diff = Math.floor((Date.now() - d.getTime()) / 60000);
                if (diff < 1) return 'agora';
                if (diff < 60) return `${diff}min`;
                if (diff < 1440) return `${Math.floor(diff/60)}h`;
                return `${Math.floor(diff/1440)}d`;
              })() : 'agora';

              return (
              <div key={post.id} style={{...s.card,padding:14,marginBottom:12}}>
                {post.repostOf && (
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10,color:'#999',fontFamily:'Barlow',fontSize:12}}>
                    {Ico.repost('#bbb')} <span>{post.user} repostou</span>
                  </div>
                )}

                <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                  <img src={post.photo} style={{...s.avatarFeed,flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div>
                        <span style={{fontFamily:'Barlow Condensed',fontWeight:700,fontSize:15,color:'#1A1A1A'}}>{post.user}</span>
                        <span style={{fontFamily:'Barlow',fontSize:12,color:'#bbb',marginLeft:6}}>· {tempo}</span>
                      </div>
                      {Ico.dots()}
                    </div>

                    {post.repostOf && (
                      <div style={{border:'1.5px solid #e8e8e8',borderRadius:10,padding:'10px 12px',marginTop:8,background:'#fafafa'}}>
                        <div style={{fontFamily:'Barlow Condensed',fontWeight:700,fontSize:13,color:'#555',marginBottom:3,textAlign:'left'}}>{post.repostOf.user}</div>
                        <div style={{fontFamily:'Barlow',fontSize:13,color:'#444',lineHeight:1.6,textAlign:'left'}}>{post.repostOf.text}</div>
                      </div>
                    )}

                    {post.text && <div style={{fontFamily:'Barlow',fontSize:14,color:'#1A1A1A',lineHeight:1.7,marginTop:6,textAlign:'left',display:'block'}}>{post.text}</div>}

                    <div style={{display:'flex',gap:20,marginTop:12,borderTop:'1px solid #f0f0f0',paddingTop:10,alignItems:'center'}}>
                      <button className="post-action" onClick={() => curtir(post)} style={{...s.actionBtn,color:jaGostou?'#F07830':'#888'}}>
                        {Ico.heart(jaGostou)} <span style={{fontSize:12}}>{post.likes?.length || 0}</span>
                      </button>
                      <button className="post-action" onClick={() => setCommentingOn(commentingOn===post.id?null:post.id)} style={{...s.actionBtn,color:'#888'}}>
                        {Ico.comment()} <span style={{fontSize:12}}>{post.comments?.length || 0}</span>
                      </button>
                      <button className="post-action" onClick={() => setRepostingOn(repostingOn===post.id?null:post.id)} style={{...s.actionBtn,color:'#888'}}>
                        {Ico.repost()} <span style={{fontSize:12}}>Repostar</span>
                      </button>
                      {post.user === currentUser.name && (
                        <button className="post-action" onClick={() => deletarPost(post.id)} style={{...s.actionBtn,color:'#ddd',marginLeft:'auto'}}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {post.comments?.length > 0 && (
                  <div style={{marginLeft:46,display:'flex',flexDirection:'column' as const,gap:8,marginTop:10}}>
                    {post.comments.map((c,i) => (
                      <div key={i} style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                        <img src={c.photo} style={{width:28,height:28,borderRadius:'50%',border:'1.5px solid #F07830',flexShrink:0}}/>
                        <div style={{background:'#f5f5f5',borderRadius:10,padding:'7px 10px',flex:1}}>
                          <div style={{fontFamily:'Barlow Condensed',fontWeight:700,fontSize:12,color:'#555',textAlign:'left'}}>{c.user}</div>
                          <div style={{fontFamily:'Barlow',fontSize:13,color:'#444',lineHeight:1.5,textAlign:'left'}}>{c.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {commentingOn === post.id && (
                  <div style={{marginTop:10,marginLeft:46,display:'flex',gap:8}}>
                    <img src={profilePhoto} style={{width:30,height:30,borderRadius:'50%',border:'1.5px solid #F07830',flexShrink:0}}/>
                    <textarea value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Escreva um comentário..." style={{...s.textarea,flex:1,minHeight:40,padding:'8px 10px',fontSize:13,textAlign:'left',color:'#1A1A1A'}} rows={2}/>
                    <button onClick={()=>comentar(post.id)} style={{...s.btnOrange,padding:'8px 14px',fontSize:12,alignSelf:'flex-end'}}>Enviar</button>
                  </div>
                )}

                {repostingOn === post.id && (
                  <div style={{marginTop:10,background:'#f9f9f9',borderRadius:10,padding:12,border:'1px solid #eee'}}>
                    <div style={{fontFamily:'Barlow Condensed',fontSize:10,fontWeight:700,letterSpacing:2,color:'#D4621A',marginBottom:8}}>REPOSTAR COM COMENTÁRIO (opcional)</div>
                    <textarea value={repostText} onChange={e=>setRepostText(e.target.value)} placeholder="Adicione seu comentário..." style={{...s.textarea,width:'100%',marginBottom:10,minHeight:60,textAlign:'left',color:'#1A1A1A'}} rows={2}/>
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={()=>repostar(post)} style={s.btnOrange}>Repostar</button>
                      <button onClick={()=>setRepostingOn(null)} style={{...s.btnOrange,background:'#e0e0e0',color:'#666'}}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}

        {/* ════ EVENTOS ════ */}
        {screen === 'eventos' && (
          <div className="fade" style={s.page}>
            <div style={s.pageHeader}>
              <button style={s.backBtn} onClick={() => goTo('home')}>{Ico.back()}</button>
              <div style={s.pageTitle}>EVENTOS</div>
            </div>
            <div style={{background:'#F07830',borderRadius:20,padding:22,marginBottom:14}}>
              <div style={{fontFamily:'Barlow Condensed',fontSize:10,fontWeight:700,letterSpacing:3,color:'rgba(0,0,0,0.4)',marginBottom:6}}>PRÓXIMO ENCONTRO</div>
              <div style={{fontFamily:'Bebas Neue',fontSize:26,color:'#1A1A1A',letterSpacing:1,lineHeight:1.1,marginBottom:10}}>{evento.tema}</div>
              {[['📅',evento.data],['🕖',evento.hora],['📍',evento.local]].map(([icon,val])=>(
                <div key={val} style={{fontFamily:'Barlow',fontSize:13,color:'rgba(0,0,0,0.6)',display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                  <span>{icon}</span><span>{val}</span>
                </div>
              ))}
            </div>
            {!euConfirmei ? (
              <div style={{...s.card,padding:20,marginBottom:14}}>
                <div style={s.cardTag}>CONFIRMAR PRESENÇA</div>
                <div style={{fontFamily:'Barlow',fontSize:13,color:'#666',margin:'8px 0 16px',lineHeight:1.5}}>Você vai comparecer? Se quiser, selecione o que pode levar de lanche. <span style={{color:'#bbb'}}>(opcional)</span></div>
                <div style={{fontFamily:'Barlow Condensed',fontSize:10,fontWeight:700,letterSpacing:3,color:'#D4621A',marginBottom:10}}>O QUE VOU LEVAR?</div>
                <div style={{display:'flex',flexWrap:'wrap' as const,gap:8,marginBottom:20}}>
                  {LANCHES.map(l=>(
                    <button key={l} className="lanche-tag" onClick={()=>setLancheSelecionado(lancheSelecionado===l?null:l)} style={{fontFamily:'Barlow',fontSize:13,padding:'7px 14px',borderRadius:50,cursor:'pointer',border:`1.5px solid ${lancheSelecionado===l?'#F07830':'#e0e0e0'}`,background:lancheSelecionado===l?'rgba(240,120,48,0.1)':'#fff',color:lancheSelecionado===l?'#F07830':'#555',fontWeight:lancheSelecionado===l?700:400,transition:'all 0.15s'}}>{l}</button>
                  ))}
                </div>
                <button onClick={confirmarPresenca} style={{...s.btnOrange,width:'100%',justifyContent:'center',gap:8}}>
                  {Ico.check()} Confirmar Presença
                </button>
              </div>
            ):(
              <div style={{...s.card,padding:18,marginBottom:14,border:'2px solid #1DB954'}}>
                <div style={{display:'flex',gap:10,alignItems:'center'}}>
                  <div style={{width:40,height:40,background:'#1DB954',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{Ico.check()}</div>
                  <div>
                    <div style={{fontFamily:'Barlow Condensed',fontWeight:700,fontSize:15,color:'#1DB954'}}>PRESENÇA CONFIRMADA!</div>
                    <div style={{fontFamily:'Barlow',fontSize:12,color:'#888',marginTop:2}}>{euConfirmei.lanche?`Você vai levar ${euConfirmei.lanche}`:'Sem lanche selecionado'}</div>
                  </div>
                </div>
              </div>
            )}
            <div style={{...s.card,padding:16}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <div style={s.cardTag}>CONFIRMADOS</div>
                <div style={{background:'#F07830',borderRadius:50,width:24,height:24,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Bebas Neue',fontSize:14,color:'#fff'}}>{confirmados.length}</div>
              </div>
              {confirmados.map((c,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:i<confirmados.length-1?'1px solid #f0f0f0':'none'}}>
                  <div style={{width:8,height:8,background:'#1DB954',borderRadius:'50%',flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:'Barlow Condensed',fontWeight:700,fontSize:14,color:'#1A1A1A'}}>{c.nome}{c.lanche?` vai levar ${c.lanche}`:''}</div>
                    <div style={{fontFamily:'Barlow',fontSize:11,color:'#bbb'}}>Confirmado às {c.hora}</div>
                  </div>
                  <div style={{background:'#e8f8ed',color:'#1DB954',fontFamily:'Barlow Condensed',fontWeight:700,fontSize:10,letterSpacing:1,padding:'3px 10px',borderRadius:50}}>✓ Confirmado</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ PERFIL ════ */}
        {screen === 'perfil' && (
          <div className="fade" style={s.page}>
            <div style={s.pageHeader}>
              <button style={s.backBtn} onClick={() => goTo('home')}>{Ico.back()}</button>
              <div style={s.pageTitle}>MEU PERFIL</div>
            </div>
            <div style={{...s.card,padding:28,textAlign:'center' as const,marginBottom:14}}>
              {/* FOTO COM BOTÃO DE EDITAR */}
              <div style={{position:'relative' as const,width:90,height:90,margin:'0 auto 16px'}}>
                <img src={profilePhoto} style={{width:90,height:90,borderRadius:'50%',border:'4px solid #F07830',objectFit:'cover' as const}}/>
                <button onClick={()=>fileInputRef.current?.click()} style={{position:'absolute' as const,bottom:0,right:0,width:30,height:30,background:'#F07830',border:'2px solid #fff',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                  {Ico.camera()}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{display:'none'}}/>
              </div>
              <div style={{fontFamily:'Bebas Neue',fontSize:28,color:'#1A1A1A',letterSpacing:2}}>{currentUser.name.toUpperCase()}</div>
              <div style={{fontFamily:'Barlow',fontSize:13,color:'#999',marginBottom:22}}>{currentUser.email}</div>
              <div style={{display:'flex',justifyContent:'center',gap:28,marginBottom:22}}>
                {[{n:posts.filter(p=>p.user===currentUser.name).length,label:'Posts'},{n:SONGS.length,label:'Músicas'},{n:jaOrou.length,label:'Orações'}].map(item=>(
                  <div key={item.label}>
                    <div style={{fontFamily:'Bebas Neue',fontSize:30,color:'#F07830'}}>{item.n}</div>
                    <div style={{fontFamily:'Barlow',fontSize:12,color:'#999'}}>{item.label}</div>
                  </div>
                ))}
              </div>
              <div style={{background:'#F07830',borderRadius:12,padding:'12px 16px',textAlign:'left' as const}}>
                <div style={{fontFamily:'Barlow Condensed',fontSize:10,fontWeight:700,letterSpacing:3,color:'rgba(0,0,0,0.4)',marginBottom:3}}>MEMBRO DO PG</div>
                <div style={{fontFamily:'Bebas Neue',fontSize:18,color:'#1A1A1A'}}>VERTICALIZADOS · MJA ESPLANADA</div>
              </div>

              {/* Botão sair */}
              <button onClick={() => signOut(auth)} style={{marginTop:20,width:'100%',padding:'12px',borderRadius:50,background:'transparent',border:'1.5px solid #e0e0e0',color:'#999',fontFamily:'Barlow Condensed',fontWeight:700,fontSize:13,letterSpacing:1,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sair da conta
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ══ BOTTOM NAV ══ */}
      <div style={s.bottomNav}>
        {navItems.map(item => {
          const active = screen === item.id;
          return (
            <button key={item.id} onClick={() => goTo(item.id)} style={{...s.navBtn,background:active?'rgba(240,120,48,0.12)':'transparent'}}>
              {item.icon(active?'#F07830':'#666')}
              <span style={{fontFamily:'Barlow Condensed',fontSize:9,fontWeight:700,letterSpacing:0.5,color:active?'#F07830':'#666'}}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root:{background:'#1A1A1A',minHeight:'100vh',display:'flex',flexDirection:'column',maxWidth:480,margin:'0 auto'},
  content:{flex:1,overflowY:'auto',paddingBottom:70},
  page:{padding:'16px 14px 0'},
  bottomNav:{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:480,background:'#111',borderTop:'1px solid #222',display:'flex',justifyContent:'space-around',padding:'6px 0',zIndex:100},
  navBtn:{border:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'5px 8px',borderRadius:10,cursor:'pointer',transition:'background 0.2s'},
  homeHeader:{display:'flex',alignItems:'center',gap:12,marginBottom:18},
  logoBox:{width:48,height:48,background:'#F07830',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0},
  homeTitle:{fontFamily:'Bebas Neue',fontSize:22,letterSpacing:2,color:'#fff',lineHeight:1},
  homeSub:{fontFamily:'Barlow Condensed',fontWeight:600,fontSize:10,letterSpacing:3,color:'rgba(255,255,255,0.3)'},
  avatarSmall:{width:38,height:38,borderRadius:'50%',border:'2px solid #F07830',marginLeft:'auto',cursor:'pointer'},
  welcomeBox:{background:'rgba(240,120,48,0.1)',borderLeft:'4px solid #F07830',borderRadius:'0 12px 12px 0',padding:'12px 16px',marginBottom:16},
  grid:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14},
  gridCard:{background:'#FFF8F0',borderRadius:16,padding:'18px 14px',cursor:'pointer',boxShadow:'0 4px 16px rgba(0,0,0,0.25)',transition:'transform 0.2s'},
  nextEvent:{background:'rgba(240,120,48,0.1)',border:'1px solid rgba(240,120,48,0.18)',borderRadius:14,padding:'14px 16px',marginBottom:16},
  pageHeader:{display:'flex',alignItems:'center',gap:10,marginBottom:18},
  pageTitle:{fontFamily:'Bebas Neue',fontSize:22,letterSpacing:2,color:'#fff'},
  backBtn:{background:'transparent',border:'none',cursor:'pointer',padding:'4px 6px 4px 0',display:'flex',alignItems:'center'},
  card:{background:'#FFF8F0',borderRadius:18,overflow:'hidden',marginBottom:14,boxShadow:'0 4px 20px rgba(0,0,0,0.22)'},
  cardTop:{display:'flex',alignItems:'center',cursor:'pointer'},
  cardNum:{background:'#F07830',width:56,minHeight:76,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0},
  cardTag:{fontFamily:'Barlow Condensed',fontSize:9,fontWeight:700,letterSpacing:3,color:'#D4621A',textTransform:'uppercase'},
  cardTitle:{fontFamily:'Bebas Neue',fontSize:21,color:'#1A1A1A',letterSpacing:1},
  cardHint:{fontFamily:'Barlow',fontSize:11,color:'#999',fontStyle:'italic',marginTop:2},
  btnSpotify:{display:'flex',alignItems:'center',gap:6,padding:'7px 16px',borderRadius:50,background:'#1DB954',color:'#fff',textDecoration:'none',fontFamily:'Barlow Condensed',fontWeight:700,fontSize:12,letterSpacing:1},
  btnYoutube:{display:'flex',alignItems:'center',gap:6,padding:'7px 16px',borderRadius:50,background:'#FF0000',color:'#fff',textDecoration:'none',fontFamily:'Barlow Condensed',fontWeight:700,fontSize:12,letterSpacing:1},
  btnOrange:{display:'flex',alignItems:'center',gap:6,padding:'9px 20px',borderRadius:50,background:'#F07830',color:'#fff',border:'none',fontFamily:'Barlow Condensed',fontWeight:700,fontSize:13,letterSpacing:1,cursor:'pointer'},
  avatarFeed:{width:36,height:36,borderRadius:'50%',border:'2px solid #F07830'},
  textarea:{border:'1.5px solid #e0e0e0',borderRadius:12,padding:'10px 12px',resize:'none',width:'100%',transition:'border 0.2s',background:'#fff'},
  actionBtn:{display:'flex',alignItems:'center',gap:5,background:'transparent',border:'none',cursor:'pointer',fontFamily:'Barlow',fontSize:13,padding:'4px 0'},
};