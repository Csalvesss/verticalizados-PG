import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { db } from './firebase';

import { ADMIN_EMAIL, DEFAULT_SONGS, DEFAULT_CIFRAS, getWeekKey } from './constants';
import { GLOBAL_CSS, s } from './styles';
import type { Screen, CurrentUser, Song, Cifra, Evento, Post, Confirmacao, Sorteio } from './types';

import { LoginScreen } from './components/LoginScreen';
import { BottomNav } from './components/BottomNav';
import { AdminPanel } from './components/AdminPanel';

import { HomeScreen } from './screens/Home';
import { MusicasScreen } from './screens/Musicas';
import { CifrasScreen } from './screens/Cifras';
import { OracaoScreen } from './screens/Oracao';
import { FeedScreen } from './screens/Feed';
import { EventosScreen } from './screens/Eventos';
import { PerfilScreen } from './screens/Perfil';

const auth = getAuth();

// ── SPLASH ───────────────────────────────────────────────────────────────────
function Splash() {
  return (
    <div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: '#F07830', letterSpacing: 4 }}>VERTICALIZADOS</div>
    </div>
  );
}

// ── AUTH WRAPPER ─────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); });
    return () => unsub();
  }, []);

  if (authLoading) return <Splash />;
  if (!user) return <LoginScreen />;
  return <MainApp user={user} />;
}

// ── MAIN APP (dados globais + roteamento) ─────────────────────────────────────
function MainApp({ user }: { user: User }) {
  const isAdmin = user.email === ADMIN_EMAIL;
  const currentUser: CurrentUser = {
    uid: user.uid,
    name: user.displayName?.split(' ')[0] || 'Membro',
    fullName: user.displayName || 'Membro',
    photo: user.photoURL || 'https://i.pravatar.cc/150?img=12',
    email: user.email || '',
  };

  const [screen, setScreen] = useState<Screen>('home');

  // ── Dados do Firestore ──────────────────────────────────────────────────────
  const [songs, setSongs] = useState<Song[]>([]);
  const [cifras, setCifras] = useState<Cifra[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [confirmacoes, setConfirmacoes] = useState<Confirmacao[]>([]);
  const [membrosLista, setMembrosLista] = useState<string[]>([]);
  const [sorteioSemana, setSorteioSemana] = useState<Sorteio | null>(null);

  useEffect(() => {
    // Músicas — seed automático se vazio
    const uns1 = onSnapshot(query(collection(db, 'songs'), orderBy('ordem')), async snap => {
      if (snap.empty) {
        for (const song of DEFAULT_SONGS) await addDoc(collection(db, 'songs'), song);
      } else {
        setSongs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Song)));
      }
    });

    // Cifras — seed automático se vazio
    const uns2 = onSnapshot(query(collection(db, 'cifras'), orderBy('ordem')), async snap => {
      if (snap.empty) {
        for (const cifra of DEFAULT_CIFRAS) await addDoc(collection(db, 'cifras'), cifra);
      } else {
        setCifras(snap.docs.map(d => ({ id: d.id, ...d.data() } as Cifra)));
      }
    });

    const uns3 = onSnapshot(query(collection(db, 'eventos'), orderBy('data', 'desc')), snap => {
      setEventos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Evento)));
    });

    const uns4 = onSnapshot(query(collection(db, 'posts'), orderBy('createdAt', 'desc')), snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
      setFeedLoading(false);
    });

    const uns5 = onSnapshot(collection(db, 'confirmacoes'), snap => {
      setConfirmacoes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Confirmacao)));
    });

    const uns6 = onSnapshot(collection(db, 'membros'), snap => {
      if (snap.docs.length > 0) setMembrosLista(snap.docs.map(d => d.data().nome as string));
    });

    const semana = getWeekKey();
    const uns7 = onSnapshot(doc(db, 'sorteios', semana), snap => {
      setSorteioSemana(snap.exists() ? (snap.data() as Sorteio) : null);
    });

    return () => { uns1(); uns2(); uns3(); uns4(); uns5(); uns6(); uns7(); };
  }, []);

  const goTo = (sc: Screen) => setScreen(sc);

  const confirmacoesProximo = eventos[0]
    ? confirmacoes.filter(c => c.eventoId === eventos[0].id)
    : [];

  return (
    <div style={s.root}>
      <style>{GLOBAL_CSS}</style>
      <div style={s.content}>

        {screen === 'home' && (
          <HomeScreen
            currentUser={currentUser}
            isAdmin={isAdmin}
            goTo={goTo}
            songsCount={songs.length}
            postsCount={posts.length}
            confirmacoesCount={confirmacoesProximo.length}
            proximoEvento={eventos[0] || null}
          />
        )}

        {screen === 'musicas' && (
          <MusicasScreen songs={songs} goTo={goTo} />
        )}

        {screen === 'cifras' && (
          <CifrasScreen cifras={cifras} goTo={goTo} />
        )}

        {screen === 'oracao' && (
          <OracaoScreen
            goTo={goTo}
            currentUserName={currentUser.name}
            membrosLista={membrosLista}
            sorteioSemana={sorteioSemana}
            isAdmin={isAdmin}
          />
        )}

        {screen === 'feed' && (
          <FeedScreen
            posts={posts}
            loading={feedLoading}
            currentUser={currentUser}
            isAdmin={isAdmin}
            uid={user.uid}
            goTo={goTo}
          />
        )}

        {screen === 'eventos' && (
          <EventosScreen
            eventos={eventos}
            confirmacoes={confirmacoes}
            currentUser={currentUser}
            uid={user.uid}
            goTo={goTo}
          />
        )}

        {screen === 'perfil' && (
          <PerfilScreen
            currentUser={currentUser}
            isAdmin={isAdmin}
            posts={posts}
            uid={user.uid}
            songsCount={songs.length}
            sorteioSemana={sorteioSemana}
            goTo={goTo}
          />
        )}

        {screen === 'admin' && isAdmin && (
          <AdminPanel
            goHome={() => goTo('home')}
            songs={songs}
            cifras={cifras}
            eventos={eventos}
            membros={membrosLista}
          />
        )}

      </div>

      <BottomNav screen={screen} goTo={goTo} userPhoto={currentUser.photo} />
    </div>
  );
}