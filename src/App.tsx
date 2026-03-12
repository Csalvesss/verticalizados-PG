import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, doc, setDoc, getDocs, where } from 'firebase/firestore';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { db } from './firebase';
import { auth } from './firebase';
import { getRedirectResultOnLoad } from './services/authService';
import { consumeInstallToken, hasInstallToken } from './hooks/useInstallTransfer';
import { ADMIN_EMAIL, DEFAULT_SONGS, DEFAULT_CIFRAS, getWeekKey } from './constants';
import { GLOBAL_CSS, s } from './styles';
import type { Screen, CurrentUser, Song, Cifra, Evento, Post, Confirmacao, Sorteio } from './types';

import { LoginScreen } from './components/LoginScreen';
import { SetupPerfil } from './components/SetupPerfil';
import { BottomNav } from './components/BottomNav';
import { AdminPanel } from './components/AdminPanel';

import { HomeScreen } from './screens/Home';
import { MusicasScreen } from './screens/Musicas';
import { CifrasScreen } from './screens/Cifras';
import { OracaoScreen } from './screens/Oracao';
import { FeedScreen } from './screens/Feed';
import { EventosScreen } from './screens/Eventos';
import { PerfilScreen } from './screens/Perfil';
import { ComunhaoScreen } from './screens/Comunhao';
import { NotificacoesScreen } from './screens/Notificacoes';
import { BuscarScreen } from './screens/Buscar';
import { JogandoEmComunhaoScreen } from './screens/JogandoEmComunhao';
import { UserPerfilScreen } from './screens/UserPerfil';
import { UserPhotosProvider } from './contexts/UserPhotos';
import { PWAInstallProvider } from './contexts/PWAInstall';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

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
    // 1. Tenta consumir install token (?t= na URL) — login automático ao abrir PWA
    if (hasInstallToken()) consumeInstallToken();

    // 2. Captura resultado de signInWithRedirect (iOS/Android PWA standalone)
    getRedirectResultOnLoad();

    // 3. Escuta mudanças de auth (inclui resultado dos passos acima)
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); });
    return () => unsub();
  }, []);

  if (authLoading) return <Splash />;
  if (!user) return <LoginScreen />;
  return <MainApp user={user} />;
}

// ── MAIN APP (dados globais + roteamento) ─────────────────────────────────────
function MainApp({ user }: { user: User }) {
  const [adminEmails, setAdminEmails] = useState<string[]>([ADMIN_EMAIL]);
  const isAdmin = adminEmails.includes(user.email || '') || user.email === ADMIN_EMAIL;
  const [profileTarget, setProfileTarget] = useState<string | null>(null);
  const baseName = user.displayName?.split(' ')[0] || 'Membro';
  const baseFullName = user.displayName || 'Membro';
  const basePhoto = user.photoURL || null;
  const baseEmail = user.email || '';

  // Track uploaded photo from Firestore
  const [firestorePhoto, setFirestorePhoto] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupChecked, setSetupChecked] = useState(false);

  useEffect(() => {
    // Save basic profile info for search (without marking setup as complete)
    if (user.photoURL) {
      setDoc(doc(db, 'users', user.uid), {
        name: baseName,
        fullName: baseFullName,
        photo: basePhoto,
        email: baseEmail,
      }, { merge: true });
    }

    // Listen for photoData from Firestore (uploaded via profile edit)
    const uns = onSnapshot(doc(db, 'users', user.uid), snap => {
      const data = snap.data();
      if (data?.photoData) setFirestorePhoto(data.photoData);
      // All users (including Google) must complete setup with a username
      const done = !!data?.setupComplete || !!data?.username;
      setNeedsSetup(!done);
      setSetupChecked(true);
    });

    // Auto-register as member for prayer draw
    (async () => {
      if (baseName && baseName !== 'Membro') {
        const snap = await getDocs(query(collection(db, 'membros'), where('nome', '==', baseName)));
        if (snap.empty) {
          await addDoc(collection(db, 'membros'), { nome: baseName });
        }
      }
    })();

    // Listen to admin emails config
    const unsAdmins = onSnapshot(doc(db, 'config', 'admins'), snap => {
      if (snap.exists()) {
        const extra: string[] = snap.data().emails || [];
        setAdminEmails([ADMIN_EMAIL, ...extra]);
      }
    });

    return () => { uns(); unsAdmins(); };
  }, [user.uid, baseFullName, basePhoto, baseEmail, baseName]);

  // Use Firestore photo if available (uploaded), otherwise Firebase Auth photo
  const currentUser: CurrentUser = {
    uid: user.uid,
    name: baseName,
    fullName: baseFullName,
    photo: firestorePhoto || basePhoto || '',
    email: baseEmail,
  };

  const [screen, setScreen] = useState<Screen>(() => {
    const saved = window.localStorage.getItem('pg:screen') as Screen | null;
    return saved ?? 'home';
  });

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
    window.localStorage.setItem('pg:screen', screen);
  }, [screen]);

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

  if (!setupChecked) return <Splash />;
  if (needsSetup) return <SetupPerfil user={user} onDone={() => setNeedsSetup(false)} />;

  return (
    <PWAInstallProvider uid={user.uid}>
    <UserPhotosProvider>
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
            adminEmails={adminEmails}
            goTo={goTo}
            onOpenProfile={(targetUid) => {
              setProfileTarget(targetUid);
              goTo('userPerfil');
            }}
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
            goTo={goTo}
            onOpenProfile={(targetUid) => {
              setProfileTarget(targetUid);
              goTo('userPerfil');
            }}
          />
        )}

        {screen === 'comunhao' && (
          <ComunhaoScreen currentUser={currentUser} isAdmin={isAdmin} uid={user.uid} goTo={goTo} />
        )}

        {screen === 'notificacoes' && (
          <NotificacoesScreen uid={user.uid} goTo={goTo} />
        )}

        {screen === 'buscar' && (
          <BuscarScreen
            uid={user.uid}
            goTo={goTo}
            onOpenProfile={(targetUid) => {
              setProfileTarget(targetUid);
              goTo('userPerfil');
            }}
          />
        )}

        {screen === 'jogandoEmComunhao' && (
          <JogandoEmComunhaoScreen currentUser={currentUser} goTo={goTo} />
        )}

        {screen === 'admin' && isAdmin && (
          <AdminPanel
            goHome={() => goTo('home')}
            songs={songs}
            cifras={cifras}
            eventos={eventos}
            membros={membrosLista}
            adminEmails={adminEmails}
          />
        )}

        {screen === 'userPerfil' && profileTarget && (
          <UserPerfilScreen
            targetUserId={profileTarget}
            currentUid={user.uid}
            posts={posts}
            adminEmails={adminEmails}
            goBack={() => goTo('feed')}
            onOpenProfile={(targetUid) => { setProfileTarget(targetUid); goTo('userPerfil'); }}
          />
        )}

      </div>

      <BottomNav screen={screen} goTo={goTo} userPhoto={currentUser.photo} />
      <PWAInstallPrompt />
    </div>
    </UserPhotosProvider>
    </PWAInstallProvider>
  );
}
