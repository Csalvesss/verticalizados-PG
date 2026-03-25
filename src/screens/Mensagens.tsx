import { useState, useEffect, useRef } from 'react';
import {
  collection, doc, onSnapshot, addDoc, updateDoc, serverTimestamp,
  query, orderBy, getDoc, setDoc, where, increment,
} from 'firebase/firestore';
import type { Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Ico } from '../icons';
import { Avatar } from '../components/Avatar';
import type { Screen, UserProfile, CurrentUser } from '../types';

// ── Types ────────────────────────────────────────────────────────────────────

interface ConvData {
  id: string;
  participants: string[];
  lastMessage: string;
  lastAt: Timestamp | null;
  lastSender: string;
  unread: Record<string, number>;
  isRequest: boolean;
  otherUser?: UserProfile;
}

interface MsgData {
  id: string;
  senderId: string;
  text: string;
  createdAt: Timestamp | null;
  read: boolean;
}

type View = 'list' | 'chat' | 'new';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeConvId(a: string, b: string) {
  return [a, b].sort().join('__');
}

function fmtTime(ts: Timestamp | null): string {
  if (!ts) return '';
  const d = ts.toDate();
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function fmtDateSeparator(ts: Timestamp | null): string {
  if (!ts) return '';
  return ts.toDate().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function sameDay(a: Timestamp | null, b: Timestamp | null): boolean {
  if (!a || !b) return false;
  const da = a.toDate();
  const db2 = b.toDate();
  return da.getFullYear() === db2.getFullYear() &&
    da.getMonth() === db2.getMonth() &&
    da.getDate() === db2.getDate();
}

// ── Conversation List ─────────────────────────────────────────────────────────

function ConvList({
  uid, conversations, tab, setTab, onOpenConv, onNewChat, goTo,
}: {
  uid: string;
  conversations: ConvData[];
  tab: 'msgs' | 'req';
  setTab: (t: 'msgs' | 'req') => void;
  onOpenConv: (conv: ConvData) => void;
  onNewChat: () => void;
  goTo: (sc: Screen) => void;
}) {
  const direct = conversations.filter(c => !c.isRequest);
  const reqs = conversations.filter(c => c.isRequest);
  const list = tab === 'msgs' ? direct : reqs;

  return (
    <div className="fade" style={{ minHeight: '100vh', paddingBottom: 90 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <button onClick={() => goTo('feed')} style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', marginRight: 8 }}>
          {Ico.back()}
        </button>
        <span style={{ flex: 1, fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 18, color: '#fff', letterSpacing: 0.5 }}>
          Mensagens
        </span>
        <button
          onClick={onNewChat}
          style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}
          title="Nova mensagem"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F07830" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {(['msgs', 'req'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '12px 0', background: 'transparent', border: 'none',
              fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 13,
              letterSpacing: 1, cursor: 'pointer',
              color: tab === t ? '#F07830' : '#555',
              position: 'relative',
            }}
          >
            {t === 'msgs' ? 'MENSAGENS' : 'SOLICITAÇÕES'}
            {t === 'req' && reqs.length > 0 && (
              <span style={{
                marginLeft: 6, background: '#F07830', color: '#fff',
                borderRadius: 99, padding: '1px 6px',
                fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 11,
              }}>{reqs.length}</span>
            )}
            {tab === t && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: '#F07830' }} />
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 12 }}>
          <div style={{ fontSize: 40 }}>💬</div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 18, fontWeight: 700, color: '#333' }}>
            {tab === 'msgs' ? 'Nenhuma conversa ainda' : 'Nenhuma solicitação'}
          </div>
          {tab === 'msgs' && (
            <button
              onClick={onNewChat}
              style={{
                marginTop: 8,
                background: 'linear-gradient(135deg, #F07830, #BA7517)',
                color: '#fff', border: 'none', borderRadius: 99,
                padding: '10px 28px', cursor: 'pointer',
                fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 14,
              }}
            >
              Iniciar conversa
            </button>
          )}
        </div>
      ) : (
        <div>
          {list.map(conv => {
            const other = conv.otherUser;
            const unread = conv.unread[uid] ?? 0;
            const name = other?.fullName || other?.name || 'Membro';
            return (
              <button
                key={conv.id}
                onClick={() => onOpenConv(conv)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', background: 'transparent', border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onPointerDown={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                onPointerUp={e => { e.currentTarget.style.background = 'transparent'; }}
                onPointerLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar src={other?.photo} name={name} size={50} />
                  {unread > 0 && (
                    <div style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 14, height: 14, background: '#F07830',
                      borderRadius: '50%', border: '2px solid #000',
                    }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <span style={{
                      fontFamily: 'Barlow Condensed', fontWeight: unread > 0 ? 700 : 600,
                      fontSize: 15, color: '#fff',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {name}
                    </span>
                    <span style={{ fontFamily: 'Barlow', fontSize: 11, color: '#444', flexShrink: 0, marginLeft: 8 }}>
                      {fmtTime(conv.lastAt)}
                    </span>
                  </div>
                  <div style={{
                    fontFamily: 'Barlow', fontSize: 13,
                    color: unread > 0 ? '#bbb' : '#555',
                    fontWeight: unread > 0 ? 600 : 400,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {conv.lastSender === uid && <span style={{ color: '#444' }}>Você: </span>}
                    {conv.lastMessage || '…'}
                  </div>
                </div>
                {unread > 0 && (
                  <div style={{
                    minWidth: 20, height: 20, background: '#F07830', color: '#fff',
                    borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 11,
                    padding: '0 5px', flexShrink: 0,
                  }}>
                    {unread > 99 ? '99+' : unread}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Chat View ─────────────────────────────────────────────────────────────────

function ChatView({
  uid, convId, otherUser, isRequest, onBack, onAcceptRequest,
}: {
  uid: string;
  convId: string;
  otherUser: UserProfile | null;
  isRequest: boolean;
  onBack: () => void;
  onAcceptRequest?: () => void;
}) {
  const [messages, setMessages] = useState<MsgData[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'conversations', convId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as MsgData)));
    });
    // Mark this user's unread as 0 on open
    updateDoc(doc(db, 'conversations', convId), { [`unread.${uid}`]: 0 }).catch(() => {});
    return () => unsub();
  }, [convId, uid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: messages.length === 1 ? 'instant' : 'smooth' });
  }, [messages]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const send = async () => {
    const t = text.trim();
    if (!t || sending || !otherUser) return;
    setText('');
    setSending(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const convRef = doc(db, 'conversations', convId);
      const snap = await getDoc(convRef);
      const otherUid = otherUser.uid;

      if (!snap.exists()) {
        await setDoc(convRef, {
          participants: [uid, otherUid],
          lastMessage: t,
          lastAt: serverTimestamp(),
          lastSender: uid,
          unread: { [otherUid]: 1, [uid]: 0 },
          isRequest: false,
        });
      } else {
        await updateDoc(convRef, {
          lastMessage: t,
          lastAt: serverTimestamp(),
          lastSender: uid,
          [`unread.${otherUid}`]: increment(1),
          [`unread.${uid}`]: 0,
          ...(isRequest ? {} : {}),
        });
      }

      await addDoc(collection(db, 'conversations', convId, 'messages'), {
        senderId: uid,
        text: t,
        createdAt: serverTimestamp(),
        read: false,
      });
    } finally {
      setSending(false);
    }
  };

  const otherName = otherUser?.fullName || otherUser?.name || 'Membro';

  return (
    <div className="fade" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '10px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <button onClick={onBack} style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', marginRight: 10 }}>
          {Ico.back()}
        </button>
        <Avatar src={otherUser?.photo} name={otherName} size={34} />
        <div style={{ flex: 1, marginLeft: 10 }}>
          <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 16, color: '#fff', lineHeight: 1.2 }}>
            {otherName}
          </div>
          {otherUser?.username && (
            <div style={{ fontFamily: 'Barlow', fontSize: 11, color: '#555' }}>@{otherUser.username}</div>
          )}
        </div>
      </div>

      {/* Request banner */}
      {isRequest && onAcceptRequest && (
        <div style={{
          padding: '12px 16px', background: 'rgba(240,120,48,0.07)',
          borderBottom: '1px solid rgba(240,120,48,0.15)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ flex: 1, fontFamily: 'Barlow', fontSize: 13, color: '#888', lineHeight: 1.4 }}>
            <strong style={{ color: '#ccc' }}>{otherName}</strong> quer te enviar uma mensagem.
          </div>
          <button
            onClick={onAcceptRequest}
            style={{
              background: '#F07830', color: '#fff', border: 'none',
              borderRadius: 99, padding: '7px 18px', cursor: 'pointer',
              fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 13,
              flexShrink: 0,
            }}
          >
            Aceitar
          </button>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#333', fontFamily: 'Barlow', fontSize: 14, marginTop: 40 }}>
            Diga olá para {otherName}! 👋
          </div>
        )}
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === uid;
          const prev = messages[idx - 1] ?? null;
          const showDay = !sameDay(prev?.createdAt ?? null, msg.createdAt);
          return (
            <div key={msg.id}>
              {showDay && (
                <div style={{
                  textAlign: 'center', margin: '12px 0 8px',
                  fontFamily: 'Barlow', fontSize: 11, color: '#444',
                }}>
                  {fmtDateSeparator(msg.createdAt)}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 2 }}>
                <div style={{
                  maxWidth: '78%', padding: '9px 13px',
                  background: isMe ? '#F07830' : '#1e2124',
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  fontFamily: 'Barlow', fontSize: 15, color: '#fff', lineHeight: 1.5,
                  wordBreak: 'break-word',
                }}>
                  {msg.text}
                  <div style={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.3)', marginTop: 3, textAlign: 'right' }}>
                    {fmtTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} style={{ height: 4 }} />
      </div>

      {/* Input */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 500,
        padding: '8px 12px 16px',
        background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'flex-end', gap: 8, boxSizing: 'border-box',
      }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => { setText(e.target.value); autoResize(); }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
          }}
          placeholder="Mensagem..."
          rows={1}
          style={{
            flex: 1, background: '#1a1c1f', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20, padding: '10px 14px',
            fontFamily: 'Barlow', fontSize: 15, color: '#fff', outline: 'none',
            resize: 'none', maxHeight: 120, overflowY: 'auto',
            lineHeight: 1.4, boxSizing: 'border-box',
          }}
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          style={{
            width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
            background: text.trim() ? 'linear-gradient(135deg, #F07830, #BA7517)' : '#1a1c1f',
            border: 'none', cursor: text.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s', boxShadow: text.trim() ? '0 2px 8px rgba(240,120,48,0.4)' : 'none',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={text.trim() ? 'white' : '#333'}>
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── New Chat (user picker) ────────────────────────────────────────────────────

function NewChatView({
  uid, onSelectUser, onBack,
}: {
  uid: string;
  onSelectUser: (user: UserProfile) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), snap => {
      setUsers(
        snap.docs
          .map(d => ({ uid: d.id, ...d.data() } as UserProfile))
          .filter(u => u.uid !== uid)
      );
    });
    return () => unsub();
  }, [uid]);

  const term = search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filtered = users.filter(u => {
    if (!term) return true;
    const name = (u.fullName || u.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const uname = (u.username || '').toLowerCase();
    return name.includes(term) || uname.includes(term);
  });

  return (
    <div className="fade" style={{ minHeight: '100vh', paddingBottom: 90 }}>
      <div style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <button onClick={onBack} style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', marginRight: 8 }}>
          {Ico.back()}
        </button>
        <span style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 18, color: '#fff' }}>
          Nova Mensagem
        </span>
      </div>

      <div style={{ padding: '12px 16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#1a1a1a', border: '1px solid #2f3336',
          borderRadius: 12, padding: '10px 14px',
        }}>
          {Ico.search('#555')}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou @usuario..."
            autoFocus
            style={{
              flex: 1, background: 'transparent', border: 'none',
              fontFamily: 'Barlow', fontSize: 15, color: '#fff', outline: 'none',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1 }}>×</button>
          )}
        </div>
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#444', fontFamily: 'Barlow', fontSize: 14 }}>
          {search ? 'Nenhum membro encontrado' : 'Carregando membros...'}
        </div>
      )}

      {filtered.map(u => {
        const name = u.fullName || u.name || 'Membro';
        return (
          <button
            key={u.uid}
            onClick={() => onSelectUser(u)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', background: 'transparent', border: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              cursor: 'pointer', textAlign: 'left',
            }}
            onPointerDown={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
            onPointerUp={e => { e.currentTarget.style.background = 'transparent'; }}
            onPointerLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Avatar src={u.photo} name={name} size={46} />
            <div>
              <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 15, color: '#fff', lineHeight: 1.2 }}>
                {name}
              </div>
              {u.username && (
                <div style={{ fontFamily: 'Barlow', fontSize: 12, color: '#555', marginTop: 2 }}>@{u.username}</div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export function MensagensScreen({
  uid,
  currentUser,
  goTo,
}: {
  uid: string;
  currentUser: CurrentUser;
  goTo: (sc: Screen) => void;
}) {
  const [view, setView] = useState<View>('list');
  const [activeConvId, setActiveConvId] = useState('');
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [isRequest, setIsRequest] = useState(false);
  const [conversations, setConversations] = useState<ConvData[]>([]);
  const [tab, setTab] = useState<'msgs' | 'req'>('msgs');
  const [usersCache, setUsersCache] = useState<Record<string, UserProfile>>({});

  // Real-time conversations listener
  useEffect(() => {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', uid)
    );
    const unsub = onSnapshot(q, snap => {
      const convs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ConvData));
      convs.sort((a, b) => (b.lastAt?.toMillis() ?? 0) - (a.lastAt?.toMillis() ?? 0));
      setConversations(convs);
    });
    return () => unsub();
  }, [uid]);

  // Enrich with other user profile data (cached)
  useEffect(() => {
    const missingUids = conversations
      .map(c => c.participants.find(p => p !== uid))
      .filter((u): u is string => !!u && !usersCache[u]);

    if (missingUids.length === 0) return;

    Promise.all(missingUids.map(u => getDoc(doc(db, 'users', u)))).then(snaps => {
      const extra: Record<string, UserProfile> = {};
      snaps.forEach(s => {
        if (s.exists()) extra[s.id] = { uid: s.id, ...s.data() } as UserProfile;
      });
      setUsersCache(prev => ({ ...prev, ...extra }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, uid]);

  const enrichedConvs: ConvData[] = conversations.map(c => ({
    ...c,
    otherUser: usersCache[c.participants.find(p => p !== uid) ?? ''],
  }));

  const openConv = (conv: ConvData) => {
    setActiveConvId(conv.id);
    setOtherUser(conv.otherUser ?? null);
    setIsRequest(conv.isRequest ?? false);
    setView('chat');
    updateDoc(doc(db, 'conversations', conv.id), { [`unread.${uid}`]: 0 }).catch(() => {});
  };

  const startConvWith = (user: UserProfile) => {
    const cid = makeConvId(uid, user.uid);
    setActiveConvId(cid);
    setOtherUser(user);
    setIsRequest(false);
    setView('chat');
  };

  const acceptRequest = async () => {
    if (!activeConvId) return;
    await updateDoc(doc(db, 'conversations', activeConvId), { isRequest: false });
    setIsRequest(false);
  };

  if (view === 'new') {
    return (
      <NewChatView
        uid={uid}
        onSelectUser={u => { startConvWith(u); }}
        onBack={() => setView('list')}
      />
    );
  }

  if (view === 'chat' && activeConvId && otherUser) {
    return (
      <ChatView
        uid={uid}
        convId={activeConvId}
        otherUser={otherUser}
        isRequest={isRequest}
        onBack={() => setView('list')}
        onAcceptRequest={isRequest ? acceptRequest : undefined}
      />
    );
  }

  return (
    <ConvList
      uid={uid}
      conversations={enrichedConvs}
      tab={tab}
      setTab={setTab}
      onOpenConv={openConv}
      onNewChat={() => setView('new')}
      goTo={goTo}
    />
  );
}
