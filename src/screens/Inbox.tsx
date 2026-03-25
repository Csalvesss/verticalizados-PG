import { useState, useEffect, useRef } from 'react';
import {
  collection, query, where, onSnapshot, orderBy,
  doc, updateDoc, arrayUnion, getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Avatar } from '../components/Avatar';
import { Ico } from '../icons';

interface Conversation {
  id: string;
  participants: string[];
  participantInfo: Record<string, { name: string; photo: string }>;
  lastMessage: string;
  lastMessageType?: string;
  lastSenderId?: string;
  lastAt: any;
  unread: Record<string, number>;
  request?: boolean;
  hiddenFor?: string[];
}

interface UserResult {
  uid: string;
  name: string;
  fullName: string;
  photo: string;
}

interface Props {
  uid: string;
  currentUserName: string;
  goBack: () => void;
  onOpenChat: (convId: string, otherUser: { uid: string; name: string; photo: string }) => void;
}

function fmtTime(ts: any): string {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60 * 60 * 1000) {
    const mins = Math.floor(diff / 60000);
    return mins < 1 ? 'agora' : `${mins}m`;
  }
  if (diff < 24 * 60 * 60 * 1000) {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function InboxScreen({ uid, goBack, onOpenChat }: Props) {
  const [tab, setTab] = useState<'mensagens' | 'solicitacoes'>('mensagens');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCache, setUserCache] = useState<Record<string, { name: string; photo: string }>>({});

  // Long-press to delete
  const [pressedConv, setPressedConv] = useState<string | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // New conversation modal
  const [showNewConv, setShowNewConv] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', uid),
      orderBy('lastAt', 'desc'),
    );
    const uns = onSnapshot(q, snap => {
      setConversations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Conversation)));
      setLoading(false);
    });
    return () => uns();
  }, [uid]);

  // Fetch missing user info from Firestore when participantInfo is absent
  useEffect(() => {
    const missing = conversations
      .map(c => c.participants.find(p => p !== uid) || '')
      .filter(id => id && !userCache[id] && (!c_info(id) || !c_info(id)?.name));

    if (missing.length === 0) return;

    missing.forEach(async otherId => {
      if (userCache[otherId]) return;
      try {
        const snap = await getDoc(doc(db, 'users', otherId));
        if (snap.exists()) {
          const data = snap.data();
          setUserCache(prev => ({
            ...prev,
            [otherId]: {
              name: data.fullName || data.name || 'Usuário',
              photo: data.photo || '',
            },
          }));
        }
      } catch {
        // ignore
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, uid]);

  function c_info(otherId: string) {
    return conversations
      .flatMap(c => Object.entries(c.participantInfo || {}))
      .find(([id]) => id === otherId)?.[1];
  }

  function getOtherInfo(conv: Conversation) {
    const otherId = conv.participants.find(p => p !== uid) || '';
    const fromDoc = conv.participantInfo?.[otherId];
    const fromCache = userCache[otherId];
    const name = fromDoc?.name || fromCache?.name || 'Usuário';
    const photo = fromDoc?.photo || fromCache?.photo || '';
    return { uid: otherId, name, photo };
  }

  // Long-press handlers
  const handleTouchStart = (convId: string) => {
    pressTimer.current = setTimeout(() => {
      setPressedConv(convId);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleTouchMove = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const hideConversation = async (convId: string) => {
    setPressedConv(null);
    try {
      await updateDoc(doc(db, 'conversations', convId), {
        hiddenFor: arrayUnion(uid),
      });
    } catch {
      // ignore
    }
  };

  // User search for new conversation
  useEffect(() => {
    if (!showNewConv) {
      setSearchQuery('');
      setSearchResults([]);
      return;
    }
  }, [showNewConv]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const snap = await getDoc(doc(db, 'config', 'admins')); // dummy read to check connectivity
        void snap;
        // Query users by name prefix — Firestore doesn't support full text search,
        // so we fetch a limited set and filter client-side
        const usersSnap = await import('firebase/firestore').then(({ getDocs, query: q2, collection: col, limit }) =>
          getDocs(q2(col(db, 'users'), limit(50)))
        );
        const q = searchQuery.toLowerCase();
        const results: UserResult[] = [];
        usersSnap.forEach(d => {
          if (d.id === uid) return;
          const data = d.data();
          const name = (data.fullName || data.name || '').toLowerCase();
          const username = (data.username || '').toLowerCase();
          if (name.includes(q) || username.includes(q)) {
            results.push({
              uid: d.id,
              name: data.fullName || data.name || 'Usuário',
              fullName: data.fullName || data.name || 'Usuário',
              photo: data.photo || '',
            });
          }
        });
        setSearchResults(results.slice(0, 10));
      } catch {
        // ignore
      }
      setSearching(false);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery, uid]);

  const startConversation = (other: UserResult) => {
    setShowNewConv(false);
    const convId = [uid, other.uid].sort().join('_');
    onOpenChat(convId, { uid: other.uid, name: other.name, photo: other.photo });
  };

  const accepted = conversations.filter(c =>
    (!c.request || c.participants[0] === uid) &&
    !(c.hiddenFor || []).includes(uid)
  );
  const requests = conversations.filter(c =>
    c.request && c.participants[0] !== uid &&
    !(c.hiddenFor || []).includes(uid)
  );
  const list = tab === 'mensagens' ? accepted : requests;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#000' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #1e1e1e',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button onClick={goBack} style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}>
          {Ico.back()}
        </button>
        <span style={{
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
          fontSize: 19, color: '#fff', letterSpacing: 0.3,
        }}>
          Mensagens
        </span>
        {/* New conversation button */}
        <button
          onClick={() => setShowNewConv(true)}
          style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1e1e1e' }}>
        {(['mensagens', 'solicitacoes'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '14px 0', background: 'transparent', border: 'none',
              cursor: 'pointer', position: 'relative',
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
              fontSize: 13, letterSpacing: 1.2,
              color: tab === t ? '#F07830' : '#555',
              textTransform: 'uppercase',
            }}
          >
            {t === 'mensagens' ? 'Mensagens' : 'Solicitações'}
            {tab === t && (
              <span style={{
                position: 'absolute', bottom: 0, left: '50%',
                transform: 'translateX(-50%)',
                width: 40, height: 2, background: '#F07830', borderRadius: 2, display: 'block',
              }} />
            )}
            {t === 'solicitacoes' && requests.length > 0 && (
              <span style={{
                marginLeft: 6, background: '#F07830', color: '#fff',
                borderRadius: 99, padding: '1px 6px', fontSize: 10, fontWeight: 700,
              }}>
                {requests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Hint for long-press */}
      {list.length > 0 && (
        <div style={{ padding: '6px 16px', fontFamily: 'Barlow, sans-serif', fontSize: 11, color: '#333' }}>
          Segure para excluir uma conversa
        </div>
      )}

      {/* Conversation list */}
      <div style={{ flex: 1 }}>
        {loading && (
          <div style={{ padding: 40, textAlign: 'center', color: '#555', fontFamily: 'Barlow, sans-serif', fontSize: 14 }}>
            Carregando...
          </div>
        )}

        {!loading && list.length === 0 && (
          <div style={{ padding: '60px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>
              {tab === 'mensagens' ? '💬' : '📬'}
            </div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: '#888', marginBottom: 8 }}>
              {tab === 'mensagens' ? 'Nenhuma conversa ainda' : 'Sem solicitações'}
            </div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#444', marginBottom: 24 }}>
              {tab === 'mensagens'
                ? 'Toque no ícone de edição acima para começar uma nova conversa.'
                : 'Novas mensagens de não-seguidores aparecerão aqui.'}
            </div>
            {tab === 'mensagens' && (
              <button
                onClick={() => setShowNewConv(true)}
                style={{
                  padding: '12px 28px', borderRadius: 999, border: 'none',
                  background: 'linear-gradient(135deg, #F07830 0%, #BA7517 100%)',
                  color: '#fff', fontFamily: 'Barlow Condensed', fontWeight: 700,
                  fontSize: 14, letterSpacing: 1, cursor: 'pointer',
                }}
              >
                Nova Conversa
              </button>
            )}
          </div>
        )}

        {list.map(conv => {
          const other = getOtherInfo(conv);
          const unread = conv.unread?.[uid] || 0;
          const isMine = conv.lastSenderId === uid;
          const preview = isMine ? `Você: ${conv.lastMessage}` : conv.lastMessage;

          return (
            <div
              key={conv.id}
              style={{ position: 'relative' }}
              onTouchStart={() => handleTouchStart(conv.id)}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
              onMouseDown={() => handleTouchStart(conv.id)}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
            >
              <button
                onClick={() => {
                  if (pressedConv) { setPressedConv(null); return; }
                  onOpenChat(conv.id, other);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '12px 16px',
                  background: pressedConv === conv.id ? 'rgba(240,120,48,0.07)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #0d0d0d',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.2s',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                  overflow: 'hidden',
                  border: unread > 0 ? '2px solid #F07830' : '2px solid transparent',
                }}>
                  <Avatar src={other.photo} name={other.name} size={48} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'Barlow Condensed, sans-serif', fontWeight: unread > 0 ? 700 : 600,
                    fontSize: 16, color: '#fff', lineHeight: 1.2, marginBottom: 2,
                  }}>
                    {other.name}
                  </div>
                  <div style={{
                    fontFamily: 'Barlow, sans-serif', fontSize: 13,
                    color: unread > 0 ? '#ccc' : '#555',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    fontWeight: unread > 0 ? 600 : 400,
                  }}>
                    {preview || 'Iniciar conversa'}
                  </div>
                </div>

                {/* Time + unread badge */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: '#555' }}>
                    {fmtTime(conv.lastAt)}
                  </span>
                  {unread > 0 && (
                    <span style={{
                      background: '#F07830', color: '#fff',
                      borderRadius: 99, minWidth: 18, height: 18,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontFamily: 'Barlow Condensed', fontWeight: 700,
                      padding: '0 4px',
                    }}>
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Long-press delete overlay */}
      {pressedConv && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
          onClick={() => setPressedConv(null)}
        >
          <div
            style={{
              background: '#1a1a1a', borderRadius: '20px 20px 0 0',
              width: '100%', maxWidth: 500,
              padding: '20px 0 calc(20px + env(safe-area-inset-bottom, 0px))',
              border: '1px solid #2a2a2a',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              padding: '0 20px 16px',
              fontFamily: 'Barlow Condensed', fontWeight: 700,
              fontSize: 16, color: '#888', letterSpacing: 1,
              borderBottom: '1px solid #222', marginBottom: 8,
            }}>
              CONVERSA
            </div>
            <button
              onClick={() => hideConversation(pressedConv)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                width: '100%', padding: '14px 20px',
                background: 'transparent', border: 'none', cursor: 'pointer',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth="2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
              <span style={{ fontFamily: 'Barlow', fontSize: 15, color: '#ff4444' }}>
                Excluir conversa
              </span>
            </button>
            <button
              onClick={() => setPressedConv(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                width: '100%', padding: '14px 20px',
                background: 'transparent', border: 'none', cursor: 'pointer',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              <span style={{ fontFamily: 'Barlow', fontSize: 15, color: '#888' }}>
                Cancelar
              </span>
            </button>
          </div>
        </div>
      )}

      {/* New conversation modal */}
      {showNewConv && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
          onClick={() => setShowNewConv(false)}
        >
          <div
            style={{
              background: '#111', borderRadius: '20px 20px 0 0',
              width: '100%', maxWidth: 500,
              maxHeight: '80dvh', display: 'flex', flexDirection: 'column',
              border: '1px solid #222',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid #222',
            }}>
              <span style={{
                fontFamily: 'Barlow Condensed', fontWeight: 700,
                fontSize: 18, color: '#fff', letterSpacing: 0.3,
              }}>
                Nova conversa
              </span>
              <button
                onClick={() => setShowNewConv(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Search input */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a1a1a' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,255,255,0.06)', borderRadius: 12,
                padding: '10px 14px',
              }}>
                {Ico.search()}
                <input
                  autoFocus
                  placeholder="Buscar por nome..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1, background: 'transparent', border: 'none',
                    outline: 'none', color: '#fff',
                    fontFamily: 'Barlow, sans-serif', fontSize: 15,
                  }}
                />
              </div>
            </div>

            {/* Search results */}
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
              {searching && (
                <div style={{ padding: 20, textAlign: 'center', color: '#555', fontFamily: 'Barlow', fontSize: 14 }}>
                  Buscando...
                </div>
              )}
              {!searching && searchQuery && searchResults.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: '#555', fontFamily: 'Barlow', fontSize: 14 }}>
                  Nenhum usuário encontrado
                </div>
              )}
              {!searching && !searchQuery && (
                <div style={{ padding: 20, textAlign: 'center', color: '#444', fontFamily: 'Barlow', fontSize: 14 }}>
                  Digite para buscar um usuário
                </div>
              )}
              {searchResults.map(user => (
                <button
                  key={user.uid}
                  onClick={() => startConversation(user)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', padding: '12px 16px',
                    background: 'transparent', border: 'none',
                    borderBottom: '1px solid #0d0d0d',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                    <Avatar src={user.photo} name={user.name} size={44} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 600, fontSize: 16, color: '#fff' }}>
                      {user.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
