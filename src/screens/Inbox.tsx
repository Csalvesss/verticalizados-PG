import { useState, useEffect } from 'react';
import {
  collection, query, where, onSnapshot, orderBy,
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

  const accepted = conversations.filter(c => !c.request || c.participants[0] === uid);
  const requests = conversations.filter(c => c.request && c.participants[0] !== uid);
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
        {/* Edit icon placeholder */}
        <button style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', opacity: 0.5 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
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
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#444' }}>
              {tab === 'mensagens'
                ? 'Envie uma mensagem para começar uma conversa.'
                : 'Novas mensagens de não-seguidores aparecerão aqui.'}
            </div>
          </div>
        )}

        {list.map(conv => {
          const otherId = conv.participants.find(p => p !== uid) || '';
          const other = conv.participantInfo?.[otherId] || { name: 'Usuário', photo: '' };
          const unread = conv.unread?.[uid] || 0;
          const isMine = conv.lastSenderId === uid;
          const preview = conv.lastMessageType === 'sticker'
            ? (isMine ? `Você: ${conv.lastMessage}` : conv.lastMessage)
            : (isMine ? `Você: ${conv.lastMessage}` : conv.lastMessage);

          return (
            <button
              key={conv.id}
              onClick={() => onOpenChat(conv.id, { uid: otherId, name: other.name, photo: other.photo })}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '12px 16px',
                background: 'transparent', border: 'none',
                borderBottom: '1px solid #0d0d0d',
                cursor: 'pointer', textAlign: 'left',
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
          );
        })}
      </div>
    </div>
  );
}
