import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection, addDoc, doc, onSnapshot, updateDoc,
  query, orderBy, serverTimestamp, setDoc, getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Avatar } from '../components/Avatar';
import { Ico } from '../icons';

// ── Types ────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  text?: string;
  sticker?: string;
  reactions: Record<string, string>;
  replyTo?: { messageId: string; text: string; senderName: string; sticker?: string };
  createdAt: any;
  editedAt?: any;
  deleted?: boolean;
}

interface Props {
  convId: string;
  otherUser: { uid: string; name: string; photo: string };
  currentUser: { uid: string; name: string; photo: string };
  goBack: () => void;
}

// ── Emoji data ────────────────────────────────────────────────────────────────
const QUICK_EMOJIS = ['❤️', '😂', '😮', '😢', '🙏', '👍'];

const STICKER_CATEGORIES = [
  {
    label: '😊',
    emojis: ['😊','😂','🥹','😍','😎','🤩','😅','😭','🥺','😤','🤔','😴','🤗','😇','😈','🤣','😘','🤭','😏','🤯'],
  },
  {
    label: '🙏',
    emojis: ['🙏','👋','🤝','👏','💪','🤙','👍','👎','✌️','🤞','🫶','❤️‍🔥','🫂','💅','🫵','🤌'],
  },
  {
    label: '❤️',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💫','⭐','🌟','✨','🔥','💥','🎉','🎊','🥳','🎈','🏆','🎯'],
  },
  {
    label: '✝️',
    emojis: ['✝️','🕊️','🙌','📖','🫶','🙏','⛪','🎵','🎶','💒','🌈','☀️','🌸','🌿','🦋','🕊','🌅','🌻','🍞','🍷'],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function convIdFor(a: string, b: string) {
  return [a, b].sort().join('_');
}

function fmtTime(ts: any): string {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(ts: any): string {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function sameDay(a: any, b: any): boolean {
  if (!a || !b) return false;
  const da = a.toDate ? a.toDate() : new Date(a);
  const db2 = b.toDate ? b.toDate() : new Date(b);
  return da.toDateString() === db2.toDateString();
}

// ── Component ────────────────────────────────────────────────────────────────
export function ChatScreen({ convId: convIdProp, otherUser, currentUser, goBack }: Props) {
  const convId = convIdProp || convIdFor(currentUser.uid, otherUser.uid);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [pressedMsg, setPressedMsg] = useState<ChatMessage | null>(null);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [stickerCat, setStickerCat] = useState(0);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesColRef = collection(db, 'conversations', convId, 'messages');

  // ── Load messages ────────────────────────────────────────────────────────
  useEffect(() => {
    const q = query(messagesColRef, orderBy('createdAt', 'asc'));
    const uns = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
    });
    // Mark conversation as read
    setDoc(doc(db, 'conversations', convId), {
      [`unread.${currentUser.uid}`]: 0,
    }, { merge: true });
    return () => uns();
  }, [convId, currentUser.uid]);

  // ── Scroll to bottom ─────────────────────────────────────────────────────
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Ensure conversation doc exists ───────────────────────────────────────
  useEffect(() => {
    const ref = doc(db, 'conversations', convId);
    getDoc(ref).then(snap => {
      if (!snap.exists()) {
        setDoc(ref, {
          participants: [currentUser.uid, otherUser.uid],
          participantInfo: {
            [currentUser.uid]: { name: currentUser.name, photo: currentUser.photo },
            [otherUser.uid]: { name: otherUser.name, photo: otherUser.photo },
          },
          lastMessage: '',
          lastAt: serverTimestamp(),
          unread: { [currentUser.uid]: 0, [otherUser.uid]: 0 },
          request: true,
        });
      }
    });
  }, [convId]);

  // ── Send message ─────────────────────────────────────────────────────────
  const send = useCallback(async (msgText?: string, sticker?: string) => {
    const content = msgText ?? text;
    if (!content.trim() && !sticker) return;

    // If editing
    if (editingMsg) {
      await updateDoc(doc(messagesColRef, editingMsg.id), {
        text: content.trim(),
        editedAt: serverTimestamp(),
      });
      setEditingMsg(null);
      setText('');
      return;
    }

    const msgData: any = {
      senderId: currentUser.uid,
      senderName: currentUser.name,
      senderPhoto: currentUser.photo,
      reactions: {},
      createdAt: serverTimestamp(),
      deleted: false,
    };

    if (sticker) {
      msgData.sticker = sticker;
    } else {
      msgData.text = content.trim();
    }

    if (replyingTo) {
      msgData.replyTo = {
        messageId: replyingTo.id,
        text: replyingTo.text || replyingTo.sticker || '',
        senderName: replyingTo.senderName,
        sticker: replyingTo.sticker,
      };
      setReplyingTo(null);
    }

    await addDoc(messagesColRef, msgData);
    setText('');

    // Update conversation metadata
    await setDoc(doc(db, 'conversations', convId), {
      participants: [currentUser.uid, otherUser.uid],
      participantInfo: {
        [currentUser.uid]: { name: currentUser.name, photo: currentUser.photo },
        [otherUser.uid]: { name: otherUser.name, photo: otherUser.photo },
      },
      lastMessage: sticker ? `${sticker}` : (content.trim().slice(0, 60)),
      lastMessageType: sticker ? 'sticker' : 'text',
      lastSenderId: currentUser.uid,
      lastAt: serverTimestamp(),
      [`unread.${otherUser.uid}`]: (await getDoc(doc(db, 'conversations', convId))).data()?.unread?.[otherUser.uid] + 1 || 1,
      [`unread.${currentUser.uid}`]: 0,
    }, { merge: true });

    if (showStickerPicker) setShowStickerPicker(false);
  }, [text, editingMsg, replyingTo, currentUser, otherUser, convId, showStickerPicker]);

  // ── React to message ──────────────────────────────────────────────────────
  const reactToMessage = async (msg: ChatMessage, emoji: string) => {
    const current = msg.reactions?.[currentUser.uid];
    const newReactions = { ...msg.reactions };
    if (current === emoji) {
      delete newReactions[currentUser.uid];
    } else {
      newReactions[currentUser.uid] = emoji;
    }
    await updateDoc(doc(messagesColRef, msg.id), { reactions: newReactions });
    setPressedMsg(null);
  };

  // ── Delete/Unsend message ─────────────────────────────────────────────────
  const unsendMessage = async (msg: ChatMessage) => {
    await updateDoc(doc(messagesColRef, msg.id), {
      deleted: true,
      text: '',
      sticker: null,
    });
    setPressedMsg(null);
  };

  // ── Long press ────────────────────────────────────────────────────────────
  const handleTouchStart = (msg: ChatMessage, e: React.TouchEvent) => {
    e.preventDefault();
    const isMine = msg.senderId === currentUser.uid;
    void isMine;
    pressTimer.current = setTimeout(() => {
      setPressedMsg(msg);
    }, 450);
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  // ── Reactions summary ─────────────────────────────────────────────────────
  const getReactionSummary = (reactions: Record<string, string>) => {
    if (!reactions || Object.keys(reactions).length === 0) return null;
    const counts: Record<string, number> = {};
    Object.values(reactions).forEach(e => { counts[e] = (counts[e] || 0) + 1; });
    return Object.entries(counts).map(([emoji, count]) => `${emoji}${count > 1 ? count : ''}`).join(' ');
  };

  // ── Edit start ────────────────────────────────────────────────────────────
  const startEdit = (msg: ChatMessage) => {
    setEditingMsg(msg);
    setText(msg.text || '');
    setPressedMsg(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ── Reply start ───────────────────────────────────────────────────────────
  const startReply = (msg: ChatMessage) => {
    setReplyingTo(msg);
    setPressedMsg(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ── Copy ──────────────────────────────────────────────────────────────────
  const copyMessage = (msg: ChatMessage) => {
    navigator.clipboard?.writeText(msg.text || msg.sticker || '');
    setPressedMsg(null);
  };

  // ── Keyboard send ─────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // ── Render messages ───────────────────────────────────────────────────────
  const renderMessages = () => {
    return messages.map((msg, i) => {
      const isMine = msg.senderId === currentUser.uid;
      const prev = messages[i - 1];
      const showDate = !prev || !sameDay(prev.createdAt, msg.createdAt);
      const reactions = getReactionSummary(msg.reactions || {});
      const isLastInGroup = !messages[i + 1] || messages[i + 1]?.senderId !== msg.senderId;

      return (
        <div key={msg.id}>
          {/* Date separator */}
          {showDate && msg.createdAt && (
            <div style={{
              textAlign: 'center', padding: '16px 0 8px',
              fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#555',
            }}>
              {fmtDate(msg.createdAt)}
            </div>
          )}

          {/* Message row */}
          <div style={{
            display: 'flex',
            flexDirection: isMine ? 'row-reverse' : 'row',
            alignItems: 'flex-end',
            gap: 8,
            padding: `2px 12px ${reactions ? '18px' : '2px'}`,
            position: 'relative',
          }}>
            {/* Other user avatar */}
            {!isMine && isLastInGroup && (
              <div style={{ width: 28, height: 28, flexShrink: 0 }}>
                <Avatar src={otherUser.photo} name={otherUser.name} size={28} />
              </div>
            )}
            {!isMine && !isLastInGroup && <div style={{ width: 28, flexShrink: 0 }} />}

            {/* Bubble */}
            <div
              onTouchStart={(e) => handleTouchStart(msg, e)}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchEnd}
              onContextMenu={(e) => {
                e.preventDefault();
                setPressedMsg(msg);
              }}
              style={{ maxWidth: '70%', position: 'relative' }}
            >
              {/* Reply preview */}
              {msg.replyTo && !msg.deleted && (
                <div style={{
                  background: isMine ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.06)',
                  borderLeft: '2px solid rgba(255,255,255,0.4)',
                  borderRadius: '8px 8px 0 0',
                  padding: '6px 10px',
                  marginBottom: -6,
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.6)',
                  fontFamily: 'Barlow, sans-serif',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 220,
                }}>
                  <span style={{ fontWeight: 700, color: isMine ? 'rgba(255,255,255,0.8)' : '#F07830' }}>
                    {msg.replyTo.senderName}
                  </span>
                  {' · '}
                  {msg.replyTo.sticker || msg.replyTo.text}
                </div>
              )}

              {/* Bubble content */}
              <div style={{
                background: msg.deleted
                  ? 'transparent'
                  : isMine
                    ? '#F07830'
                    : '#1c1c1e',
                color: msg.deleted ? '#555' : '#fff',
                borderRadius: isMine
                  ? (isLastInGroup ? '18px 18px 4px 18px' : '18px')
                  : (isLastInGroup ? '18px 18px 18px 4px' : '18px'),
                padding: msg.sticker && !msg.deleted ? '8px' : '10px 14px',
                fontSize: msg.sticker && !msg.deleted ? 36 : 15,
                fontFamily: 'Barlow, sans-serif',
                lineHeight: 1.4,
                wordBreak: 'break-word',
                border: msg.deleted ? '1px solid #333' : 'none',
                fontStyle: msg.deleted ? 'italic' : 'normal',
                userSelect: 'none',
              }}>
                {msg.deleted
                  ? (isMine ? 'Você cancelou o envio desta mensagem' : 'Esta mensagem foi apagada')
                  : (msg.sticker || msg.text)}
              </div>

              {/* Time + edited */}
              {isLastInGroup && (
                <div style={{
                  fontSize: 10, color: '#555', fontFamily: 'Barlow, sans-serif',
                  textAlign: isMine ? 'right' : 'left',
                  marginTop: 2, paddingLeft: 4, paddingRight: 4,
                }}>
                  {msg.editedAt && <span style={{ marginRight: 4 }}>Editado ·</span>}
                  {fmtTime(msg.createdAt)}
                </div>
              )}

              {/* Reactions */}
              {reactions && (
                <div style={{
                  position: 'absolute',
                  bottom: -18,
                  [isMine ? 'right' : 'left']: 4,
                  background: '#1c1c1e',
                  border: '1px solid #2a2a2a',
                  borderRadius: 20,
                  padding: '2px 8px',
                  fontSize: 13,
                  fontFamily: 'system-ui',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  zIndex: 1,
                }}>
                  {reactions}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    });
  };

  // ── Long press context menu ────────────────────────────────────────────────
  const renderContextMenu = () => {
    if (!pressedMsg) return null;
    const isMine = pressedMsg.senderId === currentUser.uid;

    return (
      <div
        onClick={() => setPressedMsg(null)}
        style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', flexDirection: 'column',
          alignItems: isMine ? 'flex-end' : 'flex-start',
          justifyContent: 'center',
          padding: '0 16px',
        }}
      >
        {/* Quick emoji bar */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#1c1c1e', borderRadius: 40,
            padding: '10px 16px',
            display: 'flex', gap: 8, alignItems: 'center',
            border: '1px solid #2a2a2a',
            marginBottom: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {QUICK_EMOJIS.map(emoji => {
            const isActive = pressedMsg.reactions?.[currentUser.uid] === emoji;
            return (
              <button
                key={emoji}
                onClick={() => reactToMessage(pressedMsg, emoji)}
                style={{
                  fontSize: 26, background: 'transparent', border: 'none',
                  cursor: 'pointer', padding: 4, borderRadius: '50%',
                  transform: isActive ? 'scale(1.3)' : 'scale(1)',
                  transition: 'transform 0.15s',
                  filter: isActive ? 'none' : 'opacity(0.85)',
                }}
              >
                {emoji}
              </button>
            );
          })}
          <button
            onClick={() => { setPressedMsg(null); setShowStickerPicker(true); }}
            style={{
              fontSize: 22, background: '#2a2a2a', border: 'none',
              cursor: 'pointer', padding: '4px 8px', borderRadius: '50%',
              color: '#888', fontFamily: 'system-ui',
            }}
          >
            +
          </button>
        </div>

        {/* Message preview */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: isMine ? '#F07830' : '#1c1c1e',
            color: '#fff', borderRadius: 16,
            padding: pressedMsg.sticker ? '8px' : '10px 14px',
            fontSize: pressedMsg.sticker ? 36 : 15,
            fontFamily: 'Barlow, sans-serif',
            maxWidth: '70%',
            marginBottom: 12,
            opacity: 0.9,
          }}
        >
          {pressedMsg.sticker || pressedMsg.text}
        </div>

        {/* Action list */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#1c1c1e', borderRadius: 16,
            overflow: 'hidden', width: 220,
            border: '1px solid #2a2a2a',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {/* Reply */}
          <ActionItem
            label="Responder"
            icon="↩"
            onClick={() => startReply(pressedMsg)}
          />
          {/* Edit (only mine, not deleted, not sticker) */}
          {isMine && !pressedMsg.deleted && !pressedMsg.sticker && (
            <ActionItem
              label="Editar"
              icon="✏️"
              onClick={() => startEdit(pressedMsg)}
            />
          )}
          {/* Copy (not deleted, not sticker) */}
          {!pressedMsg.deleted && pressedMsg.text && (
            <ActionItem
              label="Copiar"
              icon="📋"
              onClick={() => copyMessage(pressedMsg)}
            />
          )}
          {/* Unsend (only mine, not deleted) */}
          {isMine && !pressedMsg.deleted && (
            <ActionItem
              label="Cancelar envio"
              icon="🗑"
              danger
              onClick={() => { if (window.confirm('Cancelar envio desta mensagem?')) unsendMessage(pressedMsg); }}
            />
          )}
        </div>
      </div>
    );
  };

  // ── Sticker picker ────────────────────────────────────────────────────────
  const renderStickerPicker = () => (
    <div
      onClick={() => setShowStickerPicker(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#111', width: '100%', maxWidth: 500,
          borderRadius: '20px 20px 0 0',
          border: '1px solid #2a2a2a',
          borderBottom: 'none',
          paddingBottom: 'env(safe-area-inset-bottom, 12px)',
        }}
      >
        {/* Category tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1e1e1e', padding: '8px 12px 0' }}>
          {STICKER_CATEGORIES.map((cat, i) => (
            <button
              key={i}
              onClick={() => setStickerCat(i)}
              style={{
                fontSize: 22, padding: '8px 12px', background: 'transparent',
                border: 'none', cursor: 'pointer',
                borderBottom: stickerCat === i ? '2px solid #F07830' : '2px solid transparent',
                opacity: stickerCat === i ? 1 : 0.5,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Emojis grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)',
          gap: 4, padding: '12px',
          maxHeight: 240, overflowY: 'auto',
        }}>
          {STICKER_CATEGORIES[stickerCat].emojis.map(emoji => (
            <button
              key={emoji}
              onClick={() => send(undefined, emoji)}
              style={{
                fontSize: 30, background: 'transparent', border: 'none',
                cursor: 'pointer', padding: '6px', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.1s',
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#000', position: 'relative' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #1e1e1e',
        flexShrink: 0,
      }}>
        <button onClick={goBack} style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}>
          {Ico.back()}
        </button>
        <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
          <Avatar src={otherUser.photo} name={otherUser.name} size={36} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, color: '#fff', lineHeight: 1.1 }}>
            {otherUser.name}
          </div>
        </div>
        <button style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', opacity: 0.5 }}>
          {Ico.camera('#fff')}
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 8, paddingBottom: 8 }}>
        {renderMessages()}
        <div ref={endRef} />
      </div>

      {/* Reply preview bar */}
      {replyingTo && (
        <div style={{
          background: '#111', borderTop: '1px solid #1e1e1e',
          padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, borderLeft: '2px solid #F07830', paddingLeft: 8 }}>
            <div style={{ fontSize: 11, color: '#F07830', fontFamily: 'Barlow, sans-serif', fontWeight: 700 }}>
              {replyingTo.senderName}
            </div>
            <div style={{ fontSize: 13, color: '#888', fontFamily: 'Barlow, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
              {replyingTo.sticker || replyingTo.text}
            </div>
          </div>
          <button onClick={() => setReplyingTo(null)} style={{ color: '#666', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, padding: 4 }}>
            ×
          </button>
        </div>
      )}

      {/* Edit bar */}
      {editingMsg && !replyingTo && (
        <div style={{
          background: '#111', borderTop: '1px solid #1e1e1e',
          padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, borderLeft: '2px solid #aaa', paddingLeft: 8 }}>
            <div style={{ fontSize: 11, color: '#aaa', fontFamily: 'Barlow, sans-serif', fontWeight: 700 }}>Editando mensagem</div>
            <div style={{ fontSize: 13, color: '#666', fontFamily: 'Barlow, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
              {editingMsg.text}
            </div>
          </div>
          <button onClick={() => { setEditingMsg(null); setText(''); }} style={{ color: '#666', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, padding: 4 }}>
            ×
          </button>
        </div>
      )}

      {/* Input bar */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 8,
        padding: '8px 12px',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
        background: '#000', borderTop: '1px solid #1e1e1e',
        flexShrink: 0,
      }}>
        {/* Sticker button */}
        <button
          onClick={() => { setShowStickerPicker(true); setEditingMsg(null); }}
          style={{
            width: 38, height: 38, borderRadius: '50%', background: '#1c1c1e',
            border: 'none', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            fontSize: 20,
          }}
        >
          🙂
        </button>

        {/* Text input */}
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
          onKeyDown={handleKeyDown}
          placeholder="Mensagem..."
          rows={1}
          style={{
            flex: 1, background: '#1c1c1e', border: '1px solid #2a2a2a',
            borderRadius: 22, padding: '10px 16px',
            color: '#fff', fontFamily: 'Barlow, sans-serif', fontSize: 15,
            resize: 'none', outline: 'none', lineHeight: 1.4,
            overflowY: 'hidden',
          }}
        />

        {/* Send button */}
        <button
          onClick={() => send()}
          disabled={!text.trim() && !editingMsg}
          style={{
            width: 38, height: 38, borderRadius: '50%',
            background: text.trim() || editingMsg ? '#F07830' : '#1c1c1e',
            border: 'none', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            transition: 'background 0.2s',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>

      {/* Overlays */}
      {renderContextMenu()}
      {showStickerPicker && renderStickerPicker()}
    </div>
  );
}

// ── Action item component ─────────────────────────────────────────────────────
function ActionItem({ label, icon, onClick, danger }: { label: string; icon: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', padding: '14px 16px',
        background: 'transparent', border: 'none',
        borderBottom: '1px solid #222',
        cursor: 'pointer', color: danger ? '#ff4444' : '#e7e9ea',
        fontFamily: 'Barlow, sans-serif', fontSize: 15,
        textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      {label}
    </button>
  );
}
