import { useState, useRef, useEffect } from 'react';
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove, query, orderBy, serverTimestamp, getDocs, setDoc } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { db } from './firebase';

const auth = getAuth();
const provider = new GoogleAuthProvider();
const ADMIN_EMAIL = 'ads.cesaralves@gmail.com';

const DEFAULT_SONGS = [
  { title:'Não Mais Eu', spotify:'https://open.spotify.com/intl-pt/track/55hYoGlIgSyI5TMTNOsSjL', youtube:'https://youtu.be/wcTCKJUEy2Y', ordem:0, sections:[
    {label:'Verso 1',type:'verse',lines:['Foi na cruz, foi na cruz, em que ao fim percebi','Meu pecado recaiu em Jesus','Foi então, pela fé, que meus olhos abri','Que prazer sinto agora em sua luz']},
    {label:'Refrão',type:'chorus',lines:['Eu irei para a cruz, onde pude perceber','Esse amor que por mim foi pago','Sua mão me curou, sua morte me salvou','Eu irei, eu irei para a cruz']},
    {label:'Verso 2',type:'verse',lines:['Quão perdido estou, quão vazio o coração','Não sou digno de tanto amor','Foi então, pela fé, que meus olhos abri','Que prazer sinto agora em sua luz']},
    {label:'Bridge',type:'bridge',lines:['Não mais eu, não mais eu','É Jesus que vive em mim','Cristo vive em mim','Cristo vive em mim']},
    {label:'Final',type:'chorus',lines:['Eu irei para a cruz, onde pude perceber','Este amor que por mim foi pago','Sua mão me curou, sua morte me salvou','Eu irei, eu irei para a cruz','Eu irei, eu irei para a cruz...']}
  ], letra:'' },
  { title:'Digno', spotify:'https://open.spotify.com/intl-pt/track/2XtXerzRGuuHXbxOIbo44e', youtube:'https://youtu.be/ax-25gXlmBk', ordem:1, sections:[
    {label:'Verso 1',type:'verse',lines:['Logo estaremos num lindo lugar','Com jardins e um rio de cristal','Onde andaremos na presença do Senhor']},
    {label:'Verso 2',type:'verse',lines:['Logo da terra se levantarão','Os que dormem o sono dos justos','A eternidade ali começou']},
    {label:'Pré-Refrão',type:'verse',lines:['E ao entrar pelas portas do céu','O verei','Correrei pra abraçá-Lo e então cantarei']},
    {label:'Refrão',type:'chorus',lines:['Digno! É o Cordeiro bendito','Digno! Toda honra e glória a Ti','Tanto esperei por este momento','','Digno! O conflito encerrado está','Digno! Em Teus braços achei meu lugar','Pra sempre irei Te adorar, Digno!']},
    {label:'Bridge',type:'bridge',lines:['Cantaremos aleluia','Cantaremos aleluia','Cantaremos aleluia','(aleluia, aleluia, aleluia...)']},
    {label:'Final',type:'chorus',lines:['Aleluia, Aleluia, Aleluia, Digno','Aleluia, Aleluia, Aleluia, Digno']}
  ], letra:'' },
];

const DEFAULT_CIFRAS = [
  { title:'Não Mais Eu', tom:'G', ordem:0, cifra:`[Intro] G  D  Em  C (2x)\n\n[Verso 1]\nG              D\nFoi na cruz, foi na cruz,\nEm                C\nem que ao fim percebi\nG              D\nMeu pecado recaiu em Jesus\nEm              C\nFoi então, pela fé, que meus olhos abri\n\n[Refrão]\nG        D\nEu irei para a cruz\nEm           C\nonde pude perceber\nG          D\nEsse amor que por mim foi pago\nEm              C\nSua mão me curou, sua morte me salvou\nG    D    Em  C\nEu irei, eu irei para a cruz\n\n[Bridge]\nEm        D\nNão mais eu, não mais eu\nC              G\nÉ Jesus que vive em mim` },
  { title:'Digno', tom:'A', ordem:1, cifra:`[Intro] A  E  F#m  D (2x)\n\n[Verso]\nA                 E\nLogo estaremos num lindo lugar\nF#m              D\nCom jardins e um rio de cristal\n\n[Refrão]\nA        E\nDigno! É o Cordeiro bendito\nF#m         D\nDigno! Toda honra e glória a Ti\nA              E\nTanto esperei por este momento\nF#m     D       A\nPra sempre irei Te adorar, Digno!\n\n[Bridge]\nF#m   E    D    A\nCantaremos aleluia (4x)` },
];

// ── ICONS ──────────────────────────────────────────────────────────────────
const Ico = {
  home: (c='#888') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  music: (c='#888') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  guitar: (c='#888') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 8L3.5 15.5A2.5 2.5 0 0 0 7 19l7.5-7.5"/><path d="M14 6l1.5-1.5a2 2 0 0 1 2.83 0l.17.17a2 2 0 0 1 0 2.83L17 9"/><line x1="9" y1="15" x2="12" y2="12"/></svg>,
  pray: (c='#888') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  feed: (c='#888') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  event: (c='#888') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  heart: (f: boolean) => <svg width="18" height="18" viewBox="0 0 24 24" fill={f?'#F07830':'none'} stroke={f?'#F07830':'#888'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  comment: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  repost: (c='#888') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  check: (c='#fff') => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  chevron: (open: boolean) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F07830" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{transform:open?'rotate(90deg)':'none',transition:'transform 0.3s'}}><polyline points="9 18 15 12 9 6"/></svg>,
  back: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F07830" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  camera: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  image: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  admin: (c='#888') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  dots: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>,
  logout: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
};

type Screen = 'home'|'musicas'|'cifras'|'oracao'|'feed'|'eventos'|'perfil'|'admin';
const LANCHES = ['🧃 Suco','🥤 Refrigerante','🍕 Salgado','🍰 Bolo','🍪 Biscoito','🫙 Outro'];

// ── AUTH WRAPPER ────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<User|null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); });
    return () => unsub();
  }, []);
  if (authLoading) return <Splash/>;
  if (!user) return <LoginScreen/>;
  return <MainApp user={user}/>;
}

function Splash() {
  return (
    <div style={{background:'#1A1A1A',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{fontFamily:'Bebas Neue',fontSize:28,color:'#F07830',letterSpacing:4}}>VERTICALIZADOS</div>
    </div>
  );
}

// ── LOGIN ───────────────────────────────────────────────────────────────────
function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const entrar = async () => {
    setLoading(true); setErro('');
    try { await signInWithPopup(auth, provider); }
    catch { setErro('Não foi possível entrar. Tente novamente.'); setLoading(false); }
  };
  return (
    <div style={{background:'#1A1A1A',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <div style={{marginBottom:36,display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>
        <div style={{width:88,height:88,background:'#F07830',borderRadius:22,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 32px rgba(240,120,48,0.4)'}}>
          <svg width="52" height="56" viewBox="0 0 48 52" fill="none"><rect x="6" y="4" width="30" height="38" rx="3" fill="#F07830" stroke="#fff" strokeWidth="2.5"/><rect x="6" y="4" width="6" height="38" rx="2" fill="#D4621A" stroke="#fff" strokeWidth="1.5"/><rect x="19" y="13" width="3" height="16" rx="1.5" fill="#fff"/><rect x="14" y="18" width="13" height="3" rx="1.5" fill="#fff"/><path d="M26 42 L30 42 L30 50 L28 47 L26 50 Z" fill="#fff"/></svg>
        </div>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:'Bebas Neue',fontSize:38,color:'#fff',letterSpacing:4,lineHeight:1}}>VERTICALIZADOS</div>
          <div style={{fontFamily:'Barlow Condensed',fontSize:11,fontWeight:700,letterSpacing:4,color:'rgba(255,255,255,0.3)',marginTop:4}}>MJA ESPLANADA</div>
        </div>
      </div>
      <div style={{background:'#FFF8F0',borderRadius:24,padding:28,width:'100%',maxWidth:360,boxShadow:'0 12px 48px rgba(0,0,0,0.5)'}}>
        <div style={{fontFamily:'Bebas Neue',fontSize:24,color:'#1A1A1A',letterSpacing:2,marginBottom:6}}>BEM-VINDO(A)!</div>
        <div style={{fontFamily:'Barlow',fontSize:13,color:'#888',marginBottom:24,lineHeight:1.6}}>Entre com sua conta Google para acessar o espaço do PG.</div>
        <button onClick={entrar} disabled={loading} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:12,padding:'15px 20px',borderRadius:50,background:loading?'#ccc':'#1A1A1A',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Barlow Condensed',fontWeight:700,fontSize:15,letterSpacing:1}}>
          {!loading && <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>}
          {loading ? 'Entrando...' : 'Entrar com Google'}
        </button>
        {erro && <div style={{fontFamily:'Barlow',fontSize:12,color:'#e53935',textAlign:'center',marginTop:12}}>{erro}</div>}
        <div style={{fontFamily:'Barlow',fontSize:11,color:'#bbb',textAlign:'center',marginTop:20,lineHeight:1.6}}>Apenas membros do PG Verticalizados devem acessar.</div>
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
function MainApp({ user }: { user: User }) {
  const isAdmin = user.email === ADMIN_EMAIL;
  const currentUser = { name: user.displayName?.split(' ')[0] || 'Membro', fullName: user.displayName || 'Membro', photo: user.photoURL || 'https://i.pravatar.cc/150?img=12', email: user.email || '' };

  const [screen, setScreen] = useState<Screen>('home');
  const [openSong, setOpenSong] = useState<string|null>(null);
  const [openCifra, setOpenCifra] = useState<string|null>(null);

  // ── Firestore data ──
  const [songs, setSongs] = useState<any[]>([]);
  const [cifras, setCifras] = useState<any[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [confirmacoes, setConfirmacoes] = useState<any[]>([]);
  const [sorteioSemana, setSorteioSemana] = useState<any>(null);

  useEffect(() => {
    const uns1 = onSnapshot(query(collection(db,'songs'), orderBy('ordem')), async s => {
      if (s.empty) { for (const song of DEFAULT_SONGS) await addDoc(collection(db,'songs'), song); }
      else setSongs(s.docs.map(d=>({id:d.id,...d.data()})));
    });
    const uns2 = onSnapshot(query(collection(db,'cifras'), orderBy('ordem')), async s => {
      if (s.empty) { for (const cifra of DEFAULT_CIFRAS) await addDoc(collection(db,'cifras'), cifra); }
      else setCifras(s.docs.map(d=>({id:d.id,...d.data()})));
    });
    const uns3 = onSnapshot(query(collection(db,'eventos'), orderBy('data','desc')), s => setEventos(s.docs.map(d=>({id:d.id,...d.data()}))));
    const uns4 = onSnapshot(query(collection(db,'posts'), orderBy('createdAt','desc')), s => { setPosts(s.docs.map(d=>({id:d.id,...d.data()}))); setFeedLoading(false); });
    const uns5 = onSnapshot(collection(db,'confirmacoes'), s => setConfirmacoes(s.docs.map(d=>({id:d.id,...d.data()}))));
    // Sorteio da semana atual
    const semana = getWeekKey();
    const uns6 = onSnapshot(doc(db,'sorteios',semana), s => { if(s.exists()) setSorteioSemana(s.data()); else setSorteioSemana(null); });
    return () => { uns1(); uns2(); uns3(); uns4(); uns5(); uns6(); };
  }, []);

  // ── Feed state ──
  const [feedText, setFeedText] = useState('');
  const [feedImage, setFeedImage] = useState<string|null>(null);
  const [commentingOn, setCommentingOn] = useState<string|null>(null);
  const [commentText, setCommentText] = useState('');
  const [repostingOn, setRepostingOn] = useState<string|null>(null);
  const [repostText, setRepostText] = useState('');
  const feedImgRef = useRef<HTMLInputElement>(null);

  // ── Evento state ──
  const [lancheSelecionado, setLancheSelecionado] = useState<string|null>(null);
  const proximoEvento = eventos[0] || null;
  const euConfirmei = confirmacoes.find(c => c.userId === user.uid && c.eventoId === proximoEvento?.id);
  const confirmacoesEvento = confirmacoes.filter(c => c.eventoId === proximoEvento?.id);

  // ── Oração state ──
  const [membrosLista, setMembrosLista] = useState<string[]>(['Ana','Pedro','Maria','João','Carla','Lucas','Fernanda','Tiago','Juliana']);
  const [sorteando, setSorteando] = useState(false);
  const sorteadoAtual = sorteioSemana?.sorteado || null;
  const jaOrou = sorteioSemana?.historico || [];

  useEffect(() => {
    onSnapshot(collection(db,'membros'), s => {
      if(s.docs.length > 0) setMembrosLista(s.docs.map(d => d.data().nome));
    });
  }, []);

  const membrosDisponiveis = membrosLista.filter(m => m !== currentUser.name && !jaOrou.includes(m));

  const goTo = (sc: Screen) => { setScreen(sc); setOpenSong(null); setOpenCifra(null); };

  // ── FUNÇÕES ────────────────────────────────────────────────────────────────
  const sortear = async () => {
    if (membrosDisponiveis.length === 0) return;
    setSorteando(true);
    let count = 0;
    const pool = [...membrosDisponiveis];
    const interval = setInterval(async () => {
      count++;
      if (count > 18) {
        clearInterval(interval);
        const escolhido = pool[Math.floor(Math.random() * pool.length)];
        const semana = getWeekKey();
        await setDoc(doc(db,'sorteios',semana), { sorteado: escolhido, historico: arrayUnion(escolhido), semana }, {merge:true});
        setSorteando(false);
      }
    }, 90);
  };

  const postar = async () => {
    if (!feedText.trim() && !feedImage) return;
    const texto = feedText; const img = feedImage;
    setFeedText(''); setFeedImage(null);
    await addDoc(collection(db,'posts'), { user: currentUser.name, userId: user.uid, photo: currentUser.photo, text: texto, imageUrl: img || null, likes: [], comments: [], createdAt: serverTimestamp() });
  };
  const curtir = async (post: any) => {
    const ref = doc(db,'posts',post.id);
    const jaGostou = post.likes?.includes(user.uid);
    await updateDoc(ref, { likes: jaGostou ? arrayRemove(user.uid) : arrayUnion(user.uid) });
  };
  const comentar = async (id: string) => {
    if (!commentText.trim()) return;
    await updateDoc(doc(db,'posts',id), { comments: arrayUnion({ user: currentUser.name, userId: user.uid, photo: currentUser.photo, text: commentText, time: new Date().toISOString() }) });
    setCommentText(''); setCommentingOn(null);
  };
  const repostar = async (post: any) => {
    await addDoc(collection(db,'posts'), { user: currentUser.name, userId: user.uid, photo: currentUser.photo, text: repostText, imageUrl: null, likes: [], comments: [], createdAt: serverTimestamp(), repostOf: { user: post.user, text: post.text } });
    setRepostText(''); setRepostingOn(null);
  };
  const deletarPost = async (id: string) => { await deleteDoc(doc(db,'posts',id)); };

  const confirmarPresenca = async () => {
    if (!proximoEvento) return;
    await addDoc(collection(db,'confirmacoes'), { userId: user.uid, userName: currentUser.name, userPhoto: currentUser.photo, eventoId: proximoEvento.id, lanche: lancheSelecionado, hora: new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) });
    setLancheSelecionado(null);
  };

  const handleFeedImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { if(ev.target?.result) setFeedImage(ev.target.result as string); };
    reader.readAsDataURL(file);
  };

  const navItems = [
    {id:'home' as Screen,label:'Início',icon:Ico.home},
    {id:'musicas' as Screen,label:'Músicas',icon:Ico.music},
    {id:'cifras' as Screen,label:'Cifras',icon:Ico.guitar},
    {id:'oracao' as Screen,label:'Oração',icon:Ico.pray},
    {id:'feed' as Screen,label:'Feed',icon:Ico.feed},
    {id:'eventos' as Screen,label:'Eventos',icon:Ico.event},
  ];

  const tempo = (ts: any) => {
    if (!ts?.toDate) return 'agora';
    const diff = Math.floor((Date.now() - ts.toDate().getTime()) / 60000);
    if (diff < 1) return 'agora'; if (diff < 60) return `${diff}min`;
    if (diff < 1440) return `${Math.floor(diff/60)}h`; return `${Math.floor(diff/1440)}d`;
  };

  return (
    <div style={s.root}>
      <style>{CSS}</style>
      <div style={s.content}>

        {/* ════ HOME ════ */}
        {screen === 'home' && (
          <div className="fade">
            {/* Header tipo Instagram */}
            <div style={s.instaHeader}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={s.logoBox}>
                  <svg width="26" height="30" viewBox="0 0 48 52" fill="none"><rect x="6" y="4" width="30" height="38" rx="3" fill="#F07830" stroke="#fff" strokeWidth="2.5"/><rect x="6" y="4" width="6" height="38" rx="2" fill="#D4621A" stroke="#fff" strokeWidth="1.5"/><rect x="19" y="13" width="3" height="16" rx="1.5" fill="#fff"/><rect x="14" y="18" width="13" height="3" rx="1.5" fill="#fff"/><path d="M26 42 L30 42 L30 50 L28 47 L26 50 Z" fill="#fff"/></svg>
                </div>
                <span style={{fontFamily:'Bebas Neue',fontSize:22,color:'#fff',letterSpacing:2}}>VERTICALIZADOS</span>
              </div>
              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                {isAdmin && <button onClick={()=>goTo('admin')} style={s.iconBtn}>{Ico.admin('#F07830')}</button>}
                <img src={currentUser.photo} style={s.avatarSmall} onClick={()=>goTo('perfil')}/>
              </div>
            </div>

            {/* Stories-style greeting */}
            <div style={s.welcomeBox}>
              <span style={{fontSize:11,color:'#F07830',fontFamily:'Barlow Condensed',fontWeight:700,letterSpacing:2}}>BOA VINDA, {currentUser.name.toUpperCase()}! 👋</span>
              <span style={{fontSize:13,color:'rgba(255,255,255,0.5)',fontFamily:'Barlow',marginTop:2,display:'block'}}>O que vamos explorar hoje?</span>
            </div>

            {/* Grid full-width */}
            <div style={s.grid}>
              {[
                {icon:Ico.music,label:'Músicas',sub:`${songs.length} músicas`,sc:'musicas',color:'#F07830'},
                {icon:Ico.guitar,label:'Cifras',sub:'Para violonistas',sc:'cifras',color:'#D4621A'},
                {icon:Ico.pray,label:'Oração',sub:'Sorteio semanal',sc:'oracao',color:'#F07830'},
                {icon:Ico.feed,label:'Feed',sub:`${posts.length} posts`,sc:'feed',color:'#D4621A'},
                {icon:Ico.event,label:'Eventos',sub:`${confirmacoesEvento.length} confirmados`,sc:'eventos',color:'#F07830'},
              ].map(item => (
                <div key={item.sc} style={s.gridCard} onClick={()=>goTo(item.sc as Screen)}>
                  <div style={{width:40,height:40,background:`${item.color}18`,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:10}}>{item.icon(item.color)}</div>
                  <div style={{fontFamily:'Bebas Neue',fontSize:18,color:'#1A1A1A',letterSpacing:1}}>{item.label}</div>
                  <div style={{fontFamily:'Barlow',fontSize:11,color:'#aaa',marginTop:2}}>{item.sub}</div>
                </div>
              ))}
            </div>

            {proximoEvento && (
              <div style={s.nextEvent}>
                <div style={{fontFamily:'Barlow Condensed',fontSize:10,fontWeight:700,letterSpacing:3,color:'#F07830',marginBottom:4}}>PRÓXIMO ENCONTRO</div>
                <div style={{fontFamily:'Bebas Neue',fontSize:22,color:'#fff',letterSpacing:1}}>{proximoEvento.tema}</div>
                <div style={{fontFamily:'Barlow',fontSize:12,color:'rgba(255,255,255,0.4)',marginTop:2}}>{proximoEvento.data} · {proximoEvento.hora}</div>
              </div>
            )}
          </div>
        )}

        {/* ════ MÚSICAS ════ */}
        {screen === 'musicas' && (
          <div className="fade" style={s.page}>
            <div style={s.pageHeader}>
              <button style={s.backBtn} onClick={()=>goTo('home')}>{Ico.back()}</button>
              <div style={s.pageTitle}>MÚSICAS DA SEMANA</div>
            </div>
            {songs.length === 0 && <div style={s.empty}>Nenhuma música cadastrada ainda.</div>}
            {songs.map((song,idx) => {
              const open = openSong === song.id;
              return (
                <div key={song.id} style={s.card}>
                  <div style={s.cardTop} onClick={()=>setOpenSong(open?null:song.id)}>
                    <div style={s.cardNum}><span style={{fontFamily:'Bebas Neue',fontSize:34,color:'#fff',opacity:0.5}}>{idx+1}</span></div>
                    <div style={{flex:1,padding:'14px 12px'}}>
                      <div style={s.cardTag}>MÚSICA</div>
                      <div style={s.cardTitle}>{song.title}</div>
                      <div style={s.cardHint}>{open?'Toque para fechar':'Toque para ver a letra'}</div>
                    </div>
                    {Ico.chevron(open)}<div style={{width:14}}/>
                  </div>
                  {open && (
                    <div style={{borderTop:'1px dashed rgba(240,120,48,0.25)',padding:'16px 16px 4px'}}>
                      {(song.sections||[]).map((sec: any,i: number) => (
                        <div key={i} style={{marginBottom:16,...(sec.type==='chorus'?{background:'#F07830',borderRadius:12,padding:'12px 14px'}:{}),...(sec.type==='bridge'?{borderLeft:'4px solid #F07830',paddingLeft:12}:{})}}>
                          <div style={{fontFamily:'Barlow Condensed',fontSize:9,fontWeight:700,letterSpacing:3,textTransform:'uppercase' as const,marginBottom:5,color:sec.type==='chorus'?'rgba(0,0,0,0.4)':'#D4621A'}}>{sec.label}</div>
                          {(sec.lines||[]).map((line: string,j: number) => (
                            <div key={j} style={{fontFamily:'Barlow',fontSize:13.5,lineHeight:1.85,fontWeight:sec.type==='chorus'?700:500,color:sec.type==='chorus'?'#1A1A1A':'#333'}}>{line||'\u00A0'}</div>
                          ))}
                        </div>
                      ))}
                      {song.letra && <div style={{fontFamily:'Barlow',fontSize:13.5,lineHeight:2,color:'#333',whiteSpace:'pre-wrap'}}>{song.letra}</div>}
                    </div>
                  )}
                  <div style={{background:'#1A1A1A',padding:'10px 14px',display:'flex',gap:10}}>
                    {song.spotify && <a href={song.spotify} target="_blank" style={s.btnSpotify}><svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>Spotify</a>}
                    {song.youtube && <a href={song.youtube} target="_blank" style={s.btnYoutube}><svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>YouTube</a>}
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
              <button style={s.backBtn} onClick={()=>goTo('home')}>{Ico.back()}</button>
              <div style={s.pageTitle}>CIFRAS</div>
            </div>
            {cifras.length === 0 && <div style={s.empty}>Nenhuma cifra cadastrada ainda.</div>}
            {cifras.map((c,idx) => {
              const open = openCifra === c.id;
              return (
                <div key={c.id} style={{...s.card,overflow:open?'visible':'hidden'}}>
                  <div style={s.cardTop} onClick={()=>setOpenCifra(open?null:c.id)}>
                    <div style={s.cardNum}><span style={{fontFamily:'Bebas Neue',fontSize:34,color:'#fff',opacity:0.5}}>{idx+1}</span></div>
                    <div style={{flex:1,padding:'14px 12px'}}>
                      <div style={s.cardTag}>TOM: {c.tom}</div>
                      <div style={s.cardTitle}>{c.title}</div>
                      <div style={s.cardHint}>{open?'Toque para fechar':'Toque para ver a cifra'}</div>
                    </div>
                    {Ico.chevron(open)}<div style={{width:14}}/>
                  </div>
                  {open && (
                    <div style={{borderTop:'1px dashed rgba(240,120,48,0.25)',padding:'16px',overflowX:'auto'}}>
                      <pre style={{fontFamily:'"Courier New",monospace',fontSize:12.5,color:'#1A1A1A',lineHeight:1.9,whiteSpace:'pre',display:'block'}}>{c.cifra}</pre>
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
              <button style={s.backBtn} onClick={()=>goTo('home')}>{Ico.back()}</button>
              <div style={s.pageTitle}>ORAÇÃO DA SEMANA</div>
            </div>
            <div style={{...s.card,padding:22,marginBottom:14}}>
              <div style={{fontFamily:'Barlow Condensed',fontSize:10,fontWeight:700,letterSpacing:3,color:'#D4621A',marginBottom:12,textAlign:'center' as const}}>ESTA SEMANA VOCÊ ORA POR</div>
              <div style={{background:'#1A1A1A',borderRadius:16,padding:'24px 16px',marginBottom:18,minHeight:90,display:'flex',flexDirection:'column' as const,alignItems:'center',justifyContent:'center'}}>
                {sorteadoAtual ? (
                  <>
                    <div style={{fontFamily:'Bebas Neue',fontSize:48,color:'#F07830',letterSpacing:3}}>{sorteadoAtual}</div>
                    <div style={{fontFamily:'Barlow',fontSize:12,color:'rgba(255,255,255,0.5)',marginTop:6}}>Interceda por {sorteadoAtual} esta semana 🙏</div>
                  </>
                ) : (
                  <div style={{fontFamily:'Barlow',fontSize:13,color:'rgba(255,255,255,0.3)'}}>{sorteando ? 'Sorteando...' : 'Nenhum sorteio ainda'}</div>
                )}
              </div>
              {!sorteadoAtual && membrosDisponiveis.length > 0 && (
                <button onClick={sortear} disabled={sorteando} style={{...s.btnOrange,width:'100%',justifyContent:'center',gap:8}}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="3"/><circle cx="8" cy="8" r="1.5" fill="#fff"/><circle cx="16" cy="8" r="1.5" fill="#fff"/><circle cx="8" cy="16" r="1.5" fill="#fff"/><circle cx="16" cy="16" r="1.5" fill="#fff"/><circle cx="12" cy="12" r="1.5" fill="#fff"/></svg>
                  {sorteando ? 'Sorteando...' : 'Sortear membro para orar'}
                </button>
              )}
              {sorteadoAtual && (
                <div style={{background:'rgba(240,120,48,0.1)',borderRadius:10,padding:'10px 14px',textAlign:'center' as const}}>
                  <div style={{fontFamily:'Barlow',fontSize:12,color:'#1A1A1A',lineHeight:1.6}}>Ore por <strong style={{color:'#D4621A'}}>{sorteadoAtual}</strong> durante a semana!</div>
                </div>
              )}
            </div>
            <div style={{...s.card,padding:16}}>
              <div style={s.cardTag}>MEMBROS DO PG</div>
              <div style={{display:'flex',flexWrap:'wrap' as const,gap:8,marginTop:10}}>
                {membrosLista.filter(m=>m!==currentUser.name).map(m => (
                  <div key={m} style={{fontFamily:'Barlow',fontSize:12,padding:'5px 14px',borderRadius:50,fontWeight:600,background:m===sorteadoAtual?'#F07830':jaOrou.includes(m)?'#e8e8e8':'#f5f5f5',color:m===sorteadoAtual?'#fff':jaOrou.includes(m)?'#bbb':'#555',textDecoration:jaOrou.includes(m)&&m!==sorteadoAtual?'line-through':'none'}}>{m}</div>
                ))}
              </div>
              {jaOrou.length > 0 && <div style={{fontFamily:'Barlow',fontSize:11,color:'#bbb',marginTop:10}}>Riscados = já foram sorteados anteriormente</div>}
            </div>
          </div>
        )}

        {/* ════ FEED ════ */}
        {screen === 'feed' && (
          <div className="fade">
            <div style={s.instaHeader}>
              <button style={s.backBtn} onClick={()=>goTo('home')}>{Ico.back()}</button>
              <div style={s.pageTitle}>FEED DO PG</div>
              <div style={{width:32}}/>
            </div>

            {/* Post box */}
            <div style={{background:'#FFF8F0',borderBottom:'1px solid #ede8e0',padding:'12px 14px'}}>
              <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                <img src={currentUser.photo} style={s.avatarFeed}/>
                <div style={{flex:1,minWidth:0}}>
                  <textarea value={feedText} onChange={e=>setFeedText(e.target.value)} placeholder="Compartilhe algo com o PG..." style={{...s.textarea,border:'none',background:'transparent',padding:'4px 0',fontSize:14,color:'#1A1A1A',textAlign:'left',resize:'none',minHeight:40}} rows={2}/>
                  {feedImage && (
                    <div style={{position:'relative' as const,marginTop:8}}>
                      <img src={feedImage} style={{width:'100%',borderRadius:12,maxHeight:180,objectFit:'cover' as const}}/>
                      <button onClick={()=>setFeedImage(null)} style={{position:'absolute' as const,top:6,right:6,background:'rgba(0,0,0,0.5)',border:'none',borderRadius:'50%',width:24,height:24,color:'#fff',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
                    </div>
                  )}
                </div>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8,paddingTop:8,borderTop:'1px solid #ede8e0'}}>
                <button onClick={()=>feedImgRef.current?.click()} style={{...s.iconBtn,gap:6,display:'flex',alignItems:'center',fontFamily:'Barlow',fontSize:12,color:'#aaa'}}>
                  {Ico.image()} <span>Foto</span>
                </button>
                <input ref={feedImgRef} type="file" accept="image/*" onChange={handleFeedImage} style={{display:'none'}}/>
                <button onClick={postar} disabled={!feedText.trim()&&!feedImage} style={{...s.btnOrange,padding:'8px 22px',fontSize:13,opacity:(!feedText.trim()&&!feedImage)?0.5:1}}>Publicar</button>
              </div>
            </div>

            {feedLoading && <div style={s.empty}>Carregando...</div>}
            {!feedLoading && posts.length === 0 && <div style={s.empty}>Nenhum post ainda. Seja o primeiro! 🙌</div>}

            {posts.map(post => {
              const jaGostou = post.likes?.includes(user.uid);
              const podeApagar = post.userId === user.uid || isAdmin;
              return (
                <div key={post.id} style={{background:'#FFF8F0',borderBottom:'1px solid #ede8e0'}}>
                  {post.repostOf && <div style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px 0',color:'#aaa',fontFamily:'Barlow',fontSize:11}}>{Ico.repost('#ccc')} <span>{post.user} repostou</span></div>}
                  <div style={{display:'flex',gap:10,padding:'12px 14px 0',alignItems:'flex-start'}}>
                    <img src={post.photo} style={{...s.avatarFeed,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                        <div>
                          <span style={{fontFamily:'Barlow Condensed',fontWeight:700,fontSize:15,color:'#1A1A1A'}}>{post.user}</span>
                          <span style={{fontFamily:'Barlow',fontSize:12,color:'#bbb',marginLeft:5}}>· {tempo(post.createdAt)}</span>
                        </div>
                        {podeApagar && <button onClick={()=>deletarPost(post.id)} style={{...s.iconBtn,color:'#ddd',marginLeft:8}}>{Ico.trash()}</button>}
                      </div>
                      {post.repostOf && (
                        <div style={{border:'1.5px solid #ede8e0',borderRadius:10,padding:'8px 12px',marginTop:6,background:'#faf7f3'}}>
                          <div style={{fontFamily:'Barlow Condensed',fontWeight:700,fontSize:12,color:'#888'}}>{post.repostOf.user}</div>
                          <div style={{fontFamily:'Barlow',fontSize:13,color:'#555',lineHeight:1.6,textAlign:'left'}}>{post.repostOf.text}</div>
                        </div>
                      )}
                      {post.text && <div style={{fontFamily:'Barlow',fontSize:14,color:'#1A1A1A',lineHeight:1.7,marginTop:4,textAlign:'left',wordBreak:'break-word' as const}}>{post.text}</div>}
                    </div>
                  </div>
                  {post.imageUrl && <img src={post.imageUrl} style={{width:'100%',maxHeight:320,objectFit:'cover' as const,marginTop:8,display:'block'}}/>}
                  {/* Ações */}
                  <div style={{display:'flex',gap:0,padding:'4px 14px 4px 60px',borderTop:'1px solid #f5f0ea',marginTop:8}}>
                    <button className="post-action" onClick={()=>curtir(post)} style={{...s.actionBtn,color:jaGostou?'#F07830':'#999',flex:1,justifyContent:'center',padding:'8px 0'}}>
                      {Ico.heart(jaGostou)} <span style={{fontSize:13,marginLeft:4}}>{post.likes?.length||0}</span>
                    </button>
                    <button className="post-action" onClick={()=>setCommentingOn(commentingOn===post.id?null:post.id)} style={{...s.actionBtn,color:'#999',flex:1,justifyContent:'center',padding:'8px 0'}}>
                      {Ico.comment()} <span style={{fontSize:13,marginLeft:4}}>{post.comments?.length||0}</span>
                    </button>
                    <button className="post-action" onClick={()=>setRepostingOn(repostingOn===post.id?null:post.id)} style={{...s.actionBtn,color:'#999',flex:1,justifyContent:'center',padding:'8px 0'}}>
                      {Ico.repost()} <span style={{fontSize:13,marginLeft:4}}>Repostar</span>
                    </button>
                  </div>
                  {/* Comentários */}
                  {post.comments?.length > 0 && (
                    <div style={{padding:'0 14px 8px 60px',display:'flex',flexDirection:'column' as const,gap:6}}>
                      {post.comments.map((c: any,i: number) => (
                        <div key={i} style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                          <img src={c.photo} style={{width:24,height:24,borderRadius:'50%',flexShrink:0}}/>
                          <div style={{background:'#f5f0ea',borderRadius:12,padding:'6px 10px',flex:1,minWidth:0}}>
                            <span style={{fontFamily:'Barlow Condensed',fontWeight:700,fontSize:12,color:'#555'}}>{c.user} </span>
                            <span style={{fontFamily:'Barlow',fontSize:13,color:'#444',wordBreak:'break-word' as const}}>{c.text}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Caixa comentar */}
                  {commentingOn === post.id && (
                    <div style={{display:'flex',gap:8,padding:'0 14px 10px 60px',alignItems:'center'}}>
                      <input value={commentText} onChange={e=>setCommentText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&comentar(post.id)} placeholder="Comentar..." style={{flex:1,border:'1px solid #ede8e0',borderRadius:20,padding:'8px 14px',fontFamily:'Barlow',fontSize:13,color:'#1A1A1A',background:'#fff',outline:'none'}}/>
                      <button onClick={()=>comentar(post.id)} style={{...s.btnOrange,padding:'7px 14px',fontSize:12}}>↑</button>
                    </div>
                  )}
                  {/* Caixa repostar */}
                  {repostingOn === post.id && (
                    <div style={{margin:'0 14px 10px',background:'#faf7f3',borderRadius:10,padding:12,border:'1px solid #ede8e0'}}>
                      <div style={{fontFamily:'Barlow Condensed',fontSize:10,fontWeight:700,letterSpacing:2,color:'#D4621A',marginBottom:8}}>REPOSTAR COM COMENTÁRIO (opcional)</div>
                      <textarea value={repostText} onChange={e=>setRepostText(e.target.value)} placeholder="Adicione seu comentário..." style={{...s.textarea,marginBottom:10,minHeight:50,color:'#1A1A1A',textAlign:'left'}} rows={2}/>
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
              <button style={s.backBtn} onClick={()=>goTo('home')}>{Ico.back()}</button>
              <div style={s.pageTitle}>EVENTOS</div>
            </div>
            {!proximoEvento && <div style={s.empty}>Nenhum evento cadastrado ainda.</div>}
            {proximoEvento && (
              <>
                <div style={{background:'#F07830',borderRadius:20,padding:22,marginBottom:14}}>
                  <div style={{fontFamily:'Barlow Condensed',fontSize:10,fontWeight:700,letterSpacing:3,color:'rgba(0,0,0,0.4)',marginBottom:6}}>PRÓXIMO ENCONTRO</div>
                  <div style={{fontFamily:'Bebas Neue',fontSize:26,color:'#1A1A1A',letterSpacing:1,lineHeight:1.1,marginBottom:10}}>{proximoEvento.tema}</div>
                  {[['📅',proximoEvento.data],['🕖',proximoEvento.hora],['📍',proximoEvento.local]].map(([icon,val])=>(
                    <div key={val} style={{fontFamily:'Barlow',fontSize:13,color:'rgba(0,0,0,0.6)',display:'flex',gap:8,alignItems:'center',marginBottom:4}}><span>{icon}</span><span>{val}</span></div>
                  ))}
                </div>
                {!euConfirmei ? (
                  <div style={{...s.card,padding:20,marginBottom:14}}>
                    <div style={s.cardTag}>CONFIRMAR PRESENÇA</div>
                    <div style={{fontFamily:'Barlow',fontSize:13,color:'#666',margin:'8px 0 16px',lineHeight:1.5}}>Você vai comparecer? Selecione o que pode levar. <span style={{color:'#bbb'}}>(opcional)</span></div>
                    <div style={{display:'flex',flexWrap:'wrap' as const,gap:8,marginBottom:20}}>
                      {LANCHES.map(l=>(
                        <button key={l} onClick={()=>setLancheSelecionado(lancheSelecionado===l?null:l)} style={{fontFamily:'Barlow',fontSize:13,padding:'7px 14px',borderRadius:50,cursor:'pointer',border:`1.5px solid ${lancheSelecionado===l?'#F07830':'#e0e0e0'}`,background:lancheSelecionado===l?'rgba(240,120,48,0.1)':'#fff',color:lancheSelecionado===l?'#F07830':'#555',fontWeight:lancheSelecionado===l?700:400,transition:'all 0.15s'}}>{l}</button>
                      ))}
                    </div>
                    <button onClick={confirmarPresenca} style={{...s.btnOrange,width:'100%',justifyContent:'center',gap:8}}>{Ico.check()} Confirmar Presença</button>
                  </div>
                ) : (
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
                    <div style={{background:'#F07830',borderRadius:50,width:24,height:24,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Bebas Neue',fontSize:14,color:'#fff'}}>{confirmacoesEvento.length}</div>
                  </div>
                  {confirmacoesEvento.map((c,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:i<confirmacoesEvento.length-1?'1px solid #f0f0f0':'none'}}>
                      <img src={c.userPhoto} style={{width:32,height:32,borderRadius:'50%'}}/>
                      <div style={{flex:1}}>
                        <div style={{fontFamily:'Barlow Condensed',fontWeight:700,fontSize:14,color:'#1A1A1A'}}>{c.userName}{c.lanche?` · ${c.lanche}`:''}</div>
                        <div style={{fontFamily:'Barlow',fontSize:11,color:'#bbb'}}>Confirmado às {c.hora}</div>
                      </div>
                    </div>
                  ))}
                  {confirmacoesEvento.length === 0 && <div style={{fontFamily:'Barlow',fontSize:13,color:'#bbb'}}>Ninguém confirmou ainda.</div>}
                </div>
              </>
            )}
          </div>
        )}

        {/* ════ PERFIL ════ */}
        {screen === 'perfil' && (
          <div className="fade" style={s.page}>
            <div style={s.pageHeader}>
              <button style={s.backBtn} onClick={()=>goTo('home')}>{Ico.back()}</button>
              <div style={s.pageTitle}>MEU PERFIL</div>
            </div>
            <div style={{...s.card,padding:28,textAlign:'center' as const,marginBottom:14}}>
              <img src={currentUser.photo} style={{width:90,height:90,borderRadius:'50%',border:'4px solid #F07830',objectFit:'cover' as const,margin:'0 auto 16px'}}/>
              <div style={{fontFamily:'Bebas Neue',fontSize:28,color:'#1A1A1A',letterSpacing:2}}>{currentUser.fullName.toUpperCase()}</div>
              <div style={{fontFamily:'Barlow',fontSize:13,color:'#999',marginBottom:22}}>{currentUser.email}</div>
              <div style={{display:'flex',justifyContent:'center',gap:28,marginBottom:22}}>
                {[{n:posts.filter(p=>p.userId===user.uid).length,label:'Posts'},{n:songs.length,label:'Músicas'},{n:jaOrou.length,label:'Orações'}].map(item=>(
                  <div key={item.label}>
                    <div style={{fontFamily:'Bebas Neue',fontSize:30,color:'#F07830'}}>{item.n}</div>
                    <div style={{fontFamily:'Barlow',fontSize:12,color:'#999'}}>{item.label}</div>
                  </div>
                ))}
              </div>
              <div style={{background:'#F07830',borderRadius:12,padding:'12px 16px',textAlign:'left' as const,marginBottom:16}}>
                <div style={{fontFamily:'Barlow Condensed',fontSize:10,fontWeight:700,letterSpacing:3,color:'rgba(0,0,0,0.4)',marginBottom:3}}>MEMBRO DO PG</div>
                <div style={{fontFamily:'Bebas Neue',fontSize:18,color:'#1A1A1A'}}>VERTICALIZADOS · MJA ESPLANADA</div>
              </div>
              {isAdmin && <div style={{background:'#1A1A1A',borderRadius:12,padding:'10px 16px',textAlign:'left' as const,marginBottom:16,display:'flex',alignItems:'center',gap:8}}>{Ico.admin('#F07830')}<div style={{fontFamily:'Barlow Condensed',fontWeight:700,fontSize:14,color:'#F07830',letterSpacing:1}}>ADMINISTRADOR</div></div>}
              <button onClick={()=>signOut(auth)} style={{width:'100%',padding:'12px',borderRadius:50,background:'transparent',border:'1.5px solid #e0e0e0',color:'#999',fontFamily:'Barlow Condensed',fontWeight:700,fontSize:13,letterSpacing:1,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                {Ico.logout()} Sair da conta
              </button>
            </div>
          </div>
        )}

        {/* ════ ADMIN ════ */}
        {screen === 'admin' && isAdmin && <AdminPanel goHome={()=>goTo('home')} songs={songs} cifras={cifras} eventos={eventos} membros={membrosLista}/>}

      </div>

      {/* ══ BOTTOM NAV ══ */}
      <div style={s.bottomNav}>
        {navItems.map(item => {
          const active = screen === item.id;
          return (
            <button key={item.id} onClick={()=>goTo(item.id)} style={{...s.navBtn,background:active?'rgba(240,120,48,0.12)':'transparent'}}>
              {item.icon(active?'#F07830':'#555')}
              <span style={{fontFamily:'Barlow Condensed',fontSize:9,fontWeight:700,letterSpacing:0.5,color:active?'#F07830':'#555'}}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ goHome, songs, cifras, eventos, membros }: any) {
  const [tab, setTab] = useState<'songs'|'cifras'|'eventos'|'membros'>('songs');
  const [form, setForm] = useState<any>(null);
  const [editId, setEditId] = useState<string|null>(null);

  const salvarSong = async () => {
    if (!form?.title) return;
    const data = { title: form.title, letra: form.letra||'', spotify: form.spotify||'', youtube: form.youtube||'', ordem: songs.length, sections: [] };
    if (editId) await updateDoc(doc(db,'songs',editId), data);
    else await addDoc(collection(db,'songs'), data);
    setForm(null); setEditId(null);
  };
  const salvarCifra = async () => {
    if (!form?.title) return;
    const data = { title: form.title, tom: form.tom||'', cifra: form.cifra||'', ordem: cifras.length };
    if (editId) await updateDoc(doc(db,'cifras',editId), data);
    else await addDoc(collection(db,'cifras'), data);
    setForm(null); setEditId(null);
  };
  const salvarEvento = async () => {
    if (!form?.tema) return;
    const data = { tema: form.tema, data: form.data||'', hora: form.hora||'', local: form.local||'' };
    if (editId) await updateDoc(doc(db,'eventos',editId), data);
    else await addDoc(collection(db,'eventos'), data);
    setForm(null); setEditId(null);
  };
  const salvarMembro = async () => {
    if (!form?.nome) return;
    await addDoc(collection(db,'membros'), { nome: form.nome });
    setForm(null);
  };
  const deletar = async (colecao: string, id: string) => { await deleteDoc(doc(db,colecao,id)); };

  const inp = (field: string, placeholder: string, multiline=false) => multiline
    ? <textarea value={form?.[field]||''} onChange={e=>setForm({...form,[field]:e.target.value})} placeholder={placeholder} style={{...s.textarea,marginBottom:8,color:'#1A1A1A',textAlign:'left' as const}} rows={4}/>
    : <input value={form?.[field]||''} onChange={e=>setForm({...form,[field]:e.target.value})} placeholder={placeholder} style={{border:'1.5px solid #e0e0e0',borderRadius:10,padding:'10px 12px',fontFamily:'Barlow',fontSize:13,width:'100%',marginBottom:8,color:'#1A1A1A',outline:'none'}}/>;

  return (
    <div className="fade" style={s.page}>
      <div style={s.pageHeader}>
        <button style={s.backBtn} onClick={goHome}>{Ico.back()}</button>
        <div style={s.pageTitle}>PAINEL ADMIN</div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:8,marginBottom:16,overflowX:'auto' as const}}>
        {(['songs','cifras','eventos','membros'] as const).map(t=>(
          <button key={t} onClick={()=>{setTab(t);setForm(null);setEditId(null);}} style={{fontFamily:'Barlow Condensed',fontWeight:700,fontSize:12,letterSpacing:1,padding:'8px 16px',borderRadius:50,border:'none',cursor:'pointer',background:tab===t?'#F07830':'#f0ebe3',color:tab===t?'#fff':'#888',whiteSpace:'nowrap' as const}}>
            {t==='songs'?'MÚSICAS':t==='cifras'?'CIFRAS':t==='eventos'?'EVENTOS':'MEMBROS'}
          </button>
        ))}
      </div>

      {/* Form */}
      {form !== null && (
        <div style={{...s.card,padding:16,marginBottom:14}}>
          <div style={{fontFamily:'Bebas Neue',fontSize:18,color:'#1A1A1A',letterSpacing:1,marginBottom:12}}>{editId?'EDITAR':'NOVO'} {tab.toUpperCase().slice(0,-1)}</div>
          {tab==='songs' && <>{inp('title','Título da música')}{inp('letra','Letra completa...',true)}{inp('spotify','Link Spotify')}{inp('youtube','Link YouTube')}</>}
          {tab==='cifras' && <>{inp('title','Título')}{inp('tom','Tom (ex: D, G, A)')}{inp('cifra','Cifra completa...',true)}</>}
          {tab==='eventos' && <>{inp('tema','Tema do evento')}{inp('data','Data (ex: Sexta-feira, 14 de março)')}{inp('hora','Hora (ex: 19h30)')}{inp('local','Local')}</>}
          {tab==='membros' && <>{inp('nome','Nome do membro')}</>}
          <div style={{display:'flex',gap:8,marginTop:8}}>
            <button onClick={tab==='songs'?salvarSong:tab==='cifras'?salvarCifra:tab==='eventos'?salvarEvento:salvarMembro} style={s.btnOrange}>{Ico.check()} Salvar</button>
            <button onClick={()=>{setForm(null);setEditId(null);}} style={{...s.btnOrange,background:'#e0e0e0',color:'#666'}}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Listas */}
      <div style={{...s.card,padding:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={s.cardTag}>{tab==='songs'?`${songs.length} MÚSICAS`:tab==='cifras'?`${cifras.length} CIFRAS`:tab==='eventos'?`${eventos.length} EVENTOS`:`${membros.length} MEMBROS`}</div>
          <button onClick={()=>{setForm({});setEditId(null);}} style={{...s.btnOrange,padding:'6px 14px',fontSize:11,gap:4}}>{Ico.plus()} Novo</button>
        </div>
        {tab==='songs' && songs.map((item: any)=>(
          <div key={item.id} style={s.adminRow}>
            <div style={{fontFamily:'Barlow Condensed',fontWeight:700,fontSize:14,color:'#1A1A1A',flex:1}}>{item.title}</div>
            <button onClick={()=>{setForm({...item});setEditId(item.id);}} style={s.adminActionBtn}>{Ico.edit()}</button>
            <button onClick={()=>deletar('songs',item.id)} style={{...s.adminActionBtn,color:'#e53935'}}>{Ico.trash()}</button>
          </div>
        ))}
        {tab==='cifras' && cifras.map((item: any)=>(
          <div key={item.id} style={s.adminRow}>
            <div style={{fontFamily:'Barlow Condensed',fontWeight:700,fontSize:14,color:'#1A1A1A',flex:1}}>{item.title} <span style={{color:'#aaa',fontWeight:400}}>· Tom {item.tom}</span></div>
            <button onClick={()=>{setForm({...item});setEditId(item.id);}} style={s.adminActionBtn}>{Ico.edit()}</button>
            <button onClick={()=>deletar('cifras',item.id)} style={{...s.adminActionBtn,color:'#e53935'}}>{Ico.trash()}</button>
          </div>
        ))}
        {tab==='eventos' && eventos.map((item: any)=>(
          <div key={item.id} style={s.adminRow}>
            <div style={{fontFamily:'Barlow Condensed',fontWeight:700,fontSize:14,color:'#1A1A1A',flex:1}}>{item.tema} <span style={{color:'#aaa',fontWeight:400,fontSize:11}}>· {item.data}</span></div>
            <button onClick={()=>{setForm({...item});setEditId(item.id);}} style={s.adminActionBtn}>{Ico.edit()}</button>
            <button onClick={()=>deletar('eventos',item.id)} style={{...s.adminActionBtn,color:'#e53935'}}>{Ico.trash()}</button>
          </div>
        ))}
        {tab==='membros' && membros.map((nome: string, i: number)=>(
          <div key={i} style={s.adminRow}>
            <div style={{fontFamily:'Barlow',fontSize:14,color:'#1A1A1A',flex:1}}>{nome}</div>
            <button onClick={async()=>{
              const snap = await getDocs(query(collection(db,'membros')));
              const found = snap.docs.find(d=>d.data().nome===nome);
              if(found) await deleteDoc(doc(db,'membros',found.id));
            }} style={{...s.adminActionBtn,color:'#e53935'}}>{Ico.trash()}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── HELPERS ──────────────────────────────────────────────────────────────────
function getWeekKey() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}`;
}

// ── STYLES ───────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@600;700;900&family=Barlow:wght@400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body,#root{height:100%;background:#1A1A1A;}
  ::-webkit-scrollbar{width:2px;} ::-webkit-scrollbar-thumb{background:#F07830;border-radius:4px;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
  @keyframes pop{0%{transform:scale(0.9);}60%{transform:scale(1.06);}100%{transform:scale(1);}}
  .fade{animation:fadeUp 0.25s ease both;}
  textarea,input{font-family:'Barlow',sans-serif;}
  textarea:focus,input:focus{outline:none;border-color:#F07830!important;}
  .post-action:hover{opacity:0.7;}
  .post-action{background:transparent;border:none;cursor:pointer;display:flex;align-items:center;gap:5px;}
`;

const s: Record<string, React.CSSProperties> = {
  root:{background:'#1A1A1A',minHeight:'100%',display:'flex',flexDirection:'column',maxWidth:480,margin:'0 auto',position:'relative'},
  content:{flex:1,overflowY:'auto',paddingBottom:65},
  page:{padding:'16px 14px 0'},
  instaHeader:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 14px 10px',borderBottom:'1px solid #2a2a2a',background:'#1A1A1A',position:'sticky' as const,top:0,zIndex:50},
  bottomNav:{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:480,background:'rgba(17,17,17,0.97)',backdropFilter:'blur(12px)',borderTop:'1px solid #2a2a2a',display:'flex',justifyContent:'space-around',padding:'8px 0 10px',zIndex:100},
  navBtn:{border:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'4px 12px',borderRadius:12,cursor:'pointer',transition:'all 0.2s'},
  logoBox:{width:36,height:36,background:'#F07830',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0},
  homeTitle:{fontFamily:'Bebas Neue',fontSize:22,letterSpacing:2,color:'#fff',lineHeight:1},
  avatarSmall:{width:36,height:36,borderRadius:'50%',border:'2px solid #F07830',cursor:'pointer',objectFit:'cover' as const},
  welcomeBox:{background:'rgba(240,120,48,0.08)',borderLeft:'3px solid #F07830',padding:'12px 16px',margin:'0 0 0 0'},
  grid:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,padding:'14px 14px 0'},
  gridCard:{background:'#FFF8F0',borderRadius:18,padding:'20px 16px',cursor:'pointer',boxShadow:'0 2px 12px rgba(0,0,0,0.2)',transition:'transform 0.15s',display:'flex',flexDirection:'column' as const,alignItems:'flex-start'},
  nextEvent:{background:'rgba(240,120,48,0.08)',border:'1px solid rgba(240,120,48,0.15)',borderRadius:16,padding:'16px',margin:'14px 14px 16px'},
  pageHeader:{display:'flex',alignItems:'center',gap:10,marginBottom:18},
  pageTitle:{fontFamily:'Bebas Neue',fontSize:22,letterSpacing:2,color:'#fff'},
  backBtn:{background:'transparent',border:'none',cursor:'pointer',padding:'4px 6px 4px 0',display:'flex',alignItems:'center'},
  iconBtn:{background:'transparent',border:'none',cursor:'pointer',padding:'4px',display:'flex',alignItems:'center'},
  card:{background:'#FFF8F0',borderRadius:18,overflow:'hidden',marginBottom:14,boxShadow:'0 2px 16px rgba(0,0,0,0.18)'},
  cardTop:{display:'flex',alignItems:'center',cursor:'pointer'},
  cardNum:{background:'#F07830',width:56,minHeight:76,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0},
  cardTag:{fontFamily:'Barlow Condensed',fontSize:9,fontWeight:700,letterSpacing:3,color:'#D4621A',textTransform:'uppercase'},
  cardTitle:{fontFamily:'Bebas Neue',fontSize:21,color:'#1A1A1A',letterSpacing:1},
  cardHint:{fontFamily:'Barlow',fontSize:11,color:'#999',fontStyle:'italic',marginTop:2},
  empty:{fontFamily:'Barlow',fontSize:13,color:'rgba(255,255,255,0.3)',textAlign:'center' as const,padding:32},
  btnSpotify:{display:'flex',alignItems:'center',gap:6,padding:'7px 16px',borderRadius:50,background:'#1DB954',color:'#fff',textDecoration:'none',fontFamily:'Barlow Condensed',fontWeight:700,fontSize:12,letterSpacing:1},
  btnYoutube:{display:'flex',alignItems:'center',gap:6,padding:'7px 16px',borderRadius:50,background:'#FF0000',color:'#fff',textDecoration:'none',fontFamily:'Barlow Condensed',fontWeight:700,fontSize:12,letterSpacing:1},
  btnOrange:{display:'flex',alignItems:'center',gap:6,padding:'9px 20px',borderRadius:50,background:'#F07830',color:'#fff',border:'none',fontFamily:'Barlow Condensed',fontWeight:700,fontSize:13,letterSpacing:1,cursor:'pointer'},
  avatarFeed:{width:38,height:38,borderRadius:'50%',border:'2px solid #F07830',objectFit:'cover' as const},
  textarea:{border:'1.5px solid #e0e0e0',borderRadius:12,padding:'10px 12px',resize:'none' as const,width:'100%',transition:'border 0.2s',background:'#fff'},
  actionBtn:{display:'flex',alignItems:'center',gap:5,background:'transparent',border:'none',cursor:'pointer',fontFamily:'Barlow',fontSize:13,padding:'4px 0'},
  adminRow:{display:'flex',alignItems:'center',gap:8,padding:'10px 0',borderBottom:'1px solid #f0ebe3'},
  adminActionBtn:{background:'transparent',border:'none',cursor:'pointer',padding:'4px',color:'#888',display:'flex',alignItems:'center'},
};