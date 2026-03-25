import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, doc, setDoc, getDocs, where } from 'firebase/firestore';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { db } from './firebase';
import { auth } from './firebase';
import { consumeInstallToken, hasInstallToken } from './hooks/useInstallTransfer';
import { usePushNotifications } from './hooks/usePushNotifications';
import { migrateGlobalDataToChurch } from './utils/migration';
import { ADMIN_EMAIL, DEFAULT_SONGS, DEFAULT_CIFRAS, getWeekKey } from './constants';
import { GLOBAL_CSS, s } from './styles';
import type { Screen, CurrentUser, Song, Cifra, Evento, Post, Confirmacao, Sorteio, ChurchJoinRequest } from './types';

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
import { EstudoFacilScreen } from './screens/EstudoFacil';
import { MensagensScreen } from './screens/Mensagens';
import { BuscarScreen } from './screens/Buscar';
import { JogandoEmComunhaoScreen } from './screens/JogandoEmComunhao';
import { UserPerfilScreen } from './screens/UserPerfil';
import { OnboardingScreen } from './screens/Onboarding';
import { UserPhotosProvider } from './contexts/UserPhotos';
import { PWAInstallProvider } from './contexts/PWAInstall';
import { ChurchProvider, useChurch } from './contexts/ChurchContext';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

// ── SPLASH ───────────────────────────────────────────────────────────────────
function Splash() {
  return (
    <div style={{ background: '#BA7517', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 900, fontSize: 56, color: '#fff', letterSpacing: -2, lineHeight: 1 }}>
        <span style={{ color: '#000' }}>7</span>Teen
      </div>
      <div style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 600, fontSize: 11, color: 'rgba(0,0,0,0.5)', letterSpacing: 3, textTransform: 'uppercase' }}>
        Associação Paulista do Vale
      </div>
    </div>
  );
}

// ── AUTH WRAPPER ─────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (hasInstallToken()) consumeInstallToken();
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); });
    return () => unsub();
  }, []);

  if (authLoading) return <Splash />;
  if (!user) return <LoginScreen />;

  return (
    <ChurchProvider>
      <AuthedApp user={user} />
    </ChurchProvider>
  );
}

// ── AUTHED APP — handles onboarding + main ────────────────────────────────────
function AuthedApp({ user }: { user: User }) {
  const { isChurchSelected, loadChurchFromFirestore } = useChurch();
  const [showOnboarding, setShowOnboarding] = useState(!isChurchSelected);
  // 'switch' mode: user is already in a church but wants to change
  const [switchMode, setSwitchMode] = useState(false);

  // On mount, try to sync church from Firestore (handles approved join requests)
  useEffect(() => {
    loadChurchFromFirestore(user.uid).then(() => {
      // After sync, if we now have a church and were showing onboarding, close it
      setShowOnboarding(prev => prev && !localStorage.getItem('sete_teen_church'));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.uid]);

  // If church gets deselected, show onboarding again
  useEffect(() => {
    if (!isChurchSelected) setShowOnboarding(true);
  }, [isChurchSelected]);

  if (showOnboarding || switchMode) {
    return (
      <OnboardingScreen
        mode={switchMode ? 'switch' : 'first'}
        uid={user.uid}
        userName={user.displayName || 'Membro'}
        userPhoto={user.photoURL || ''}
        onDone={() => { setShowOnboarding(false); setSwitchMode(false); }}
      />
    );
  }

  return <MainApp user={user} onChangeChurch={() => setSwitchMode(true)} />;
}

// ── MAIN APP (dados globais + roteamento) ─────────────────────────────────────
function MainApp({ user, onChangeChurch }: { user: User; onChangeChurch: () => void }) {
  const { selectedChurch } = useChurch();
  const [adminEmails, setAdminEmails] = useState<string[]>([ADMIN_EMAIL]);
  const isAdmin = adminEmails.includes(user.email || '') || user.email === ADMIN_EMAIL;
  const [profileTarget, setProfileTarget] = useState<string | null>(null);
  const baseName = user.displayName?.split(' ')[0] || 'Membro';
  const baseFullName = user.displayName || 'Membro';
  const basePhoto = user.photoURL || null;
  const baseEmail = user.email || '';

  const [firestorePhoto, setFirestorePhoto] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const SETUP_KEY = `pg_setup_${user.uid}`;
  const [setupChecked, setSetupChecked] = useState(() => !!localStorage.getItem(SETUP_KEY));

  useEffect(() => {
    if (user.photoURL) {
      setDoc(doc(db, 'users', user.uid), {
        name: baseName,
        fullName: baseFullName,
        photo: basePhoto,
        email: baseEmail,
      }, { merge: true });
    }

    const uns = onSnapshot(doc(db, 'users', user.uid), snap => {
      const data = snap.data();
      if (data?.photoData) setFirestorePhoto(data.photoData);
      const done = !!data?.setupComplete || !!data?.username;
      if (done) localStorage.setItem(SETUP_KEY, '1');
      setNeedsSetup(!done && !localStorage.getItem(SETUP_KEY));
      setSetupChecked(true);
    });

    const unsAdmins = onSnapshot(doc(db, 'config', 'admins'), snap => {
      if (snap.exists()) {
        const extra: string[] = snap.data().emails || [];
        setAdminEmails([ADMIN_EMAIL, ...extra]);
      }
    });

    return () => { uns(); unsAdmins(); };
  }, [user.uid, baseFullName, basePhoto, baseEmail, baseName]);

  const currentUser: CurrentUser = {
    uid: user.uid,
    name: baseName,
    fullName: baseFullName,
    photo: firestorePhoto || basePhoto || '',
    email: baseEmail,
  };

  usePushNotifications(user.uid);

  const [screen, setScreen] = useState<Screen>(() => {
    const saved = window.localStorage.getItem('pg:screen') as Screen | null;
    return saved ?? 'home';
  });

  const [songs, setSongs] = useState<Song[]>([]);
  const [cifras, setCifras] = useState<Cifra[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [confirmacoes, setConfirmacoes] = useState<Confirmacao[]>([]);
  const [membrosLista, setMembrosLista] = useState<string[]>([]);
  const [sorteioSemana, setSorteioSemana] = useState<Sorteio | null>(null);
  const [solicitacoesPendentes, setSolicitacoesPendentes] = useState<ChurchJoinRequest[]>([]);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  // ── Feed "não lido" ──────────────────────────────────────────────────────
  const FEED_SEEN_KEY = `pg:feedSeen_${user.uid}`;
  const [lastSeenFeedCount, setLastSeenFeedCount] = useState(() =>
    parseInt(localStorage.getItem(`pg:feedSeen_${user.uid}`) || '0')
  );
  const newPostsCount = Math.max(0, posts.length - lastSeenFeedCount);

  useEffect(() => {
    window.localStorage.setItem('pg:screen', screen);
    if (screen === 'feed') {
      localStorage.setItem(FEED_SEEN_KEY, posts.length.toString());
      setLastSeenFeedCount(posts.length);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, posts.length]);

  // ── One-time migration from global collections to church-scoped ─────────
  useEffect(() => {
    if (selectedChurch) migrateGlobalDataToChurch(selectedChurch.id);
  }, [selectedChurch?.id]);

  // ── Global data: feed + sorteio por usuário ─────────────────────────────
  useEffect(() => {
    const unsPosts = onSnapshot(query(collection(db, 'posts'), orderBy('createdAt', 'desc')), snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
      setFeedLoading(false);
    });

    // Sorteio is personal: each user has their own draw for the week
    const unsSorteio = onSnapshot(doc(db, 'sorteios', `${user.uid}_${getWeekKey()}`), snap => {
      setSorteioSemana(snap.exists() ? (snap.data() as Sorteio) : null);
    });

    // Unread messages badge — always-on listener
    const unsMsgs = onSnapshot(
      query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid)),
      snap => {
        let total = 0;
        snap.docs.forEach(d => { total += (d.data().unread?.[user.uid] ?? 0); });
        setUnreadMsgCount(total);
      },
      () => {}
    );

    return () => { unsPosts(); unsSorteio(); unsMsgs(); };
  }, [user.uid]);

  // ── Church-scoped data: songs, cifras, membros, eventos, confirmacoes ────
  useEffect(() => {
    if (!selectedChurch) {
      setSongs([]); setCifras([]); setConfirmacoes([]);
      setMembrosLista([]); setEventos([]);
      return;
    }
    const cid = selectedChurch.id;
    const cRef = (col: string) => collection(db, 'churches', cid, col);

    // Persist churchId to Firestore on every church load (handles first-time + migrations)
    setDoc(doc(db, 'users', user.uid), { churchId: cid }, { merge: true }).catch(() => {});

    // Register member in this church
    if (baseName && baseName !== 'Membro') {
      getDocs(query(cRef('membros'), where('nome', '==', baseName))).then(snap => {
        if (snap.empty) addDoc(cRef('membros'), { nome: baseName });
      });
    }

    const uns1 = onSnapshot(query(cRef('songs'), orderBy('ordem')), async snap => {
      if (snap.empty) {
        for (const song of DEFAULT_SONGS) await addDoc(cRef('songs'), song);
      } else {
        setSongs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Song)));
      }
    });

    const uns2 = onSnapshot(query(cRef('cifras'), orderBy('ordem')), async snap => {
      if (snap.empty) {
        for (const cifra of DEFAULT_CIFRAS) await addDoc(cRef('cifras'), cifra);
      } else {
        setCifras(snap.docs.map(d => ({ id: d.id, ...d.data() } as Cifra)));
      }
    });

    const uns5 = onSnapshot(cRef('confirmacoes'), snap => {
      setConfirmacoes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Confirmacao)));
    });

    const uns6 = onSnapshot(cRef('membros'), snap => {
      if (snap.docs.length > 0) setMembrosLista(snap.docs.map(d => d.data().nome as string));
    });

    const uns8 = onSnapshot(
      query(cRef('eventos'), orderBy('data', 'desc')),
      snap => setEventos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Evento)))
    );

    // Listener persistente de solicitações — ativo em qualquer tela para admins
    let unsSol = () => {};
    if (isAdmin) {
      unsSol = onSnapshot(
        query(
          collection(db, 'churchJoinRequests'),
          where('toChurchId', '==', cid),
          where('status', '==', 'pending')
        ),
        snap => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChurchJoinRequest));
          list.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
          setSolicitacoesPendentes(list);
        },
        () => {}
      );
    }

    return () => { uns1(); uns2(); uns5(); uns6(); uns8(); unsSol(); };
  }, [selectedChurch?.id, baseName, isAdmin]);

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
            newPostsCount={newPostsCount}
            confirmacoesCount={confirmacoesProximo.length}
            proximoEvento={eventos[0] || null}
            onChangeChurch={onChangeChurch}
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
            currentUser={currentUser}
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
            unreadMsgCount={unreadMsgCount}
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

        {screen === 'estudo' && (
          <EstudoFacilScreen goTo={goTo} />
        )}

        {screen === 'mensagens' && (
          <MensagensScreen uid={user.uid} currentUser={currentUser} goTo={goTo} />
        )}

        {screen === 'admin' && isAdmin && (
          <AdminPanel
            goHome={() => goTo('home')}
            songs={songs}
            cifras={cifras}
            eventos={eventos}
            membros={membrosLista}
            adminEmails={adminEmails}
            currentUserUid={user.uid}
            currentUserEmail={user.email || ''}
            solicitacoesPendentes={solicitacoesPendentes}
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
