import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { Ico } from '../icons';
import { tempoRelativo } from '../constants';
import type { Screen, Notificacao } from '../types';

const TYPE_LABELS: Record<string, { emoji: string; text: string }> = {
  like: { emoji: '❤️', text: 'curtiu seu post' },
  comment: { emoji: '💬', text: 'comentou no seu post' },
  repost: { emoji: '🔁', text: 'repostou seu post' },
};

export function NotificacoesScreen({
  uid,
  goTo,
}: {
  uid: string;
  goTo: (sc: Screen) => void;
}) {
  const [notifs, setNotifs] = useState<Notificacao[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      where('toUserId', '==', uid),
      orderBy('createdAt', 'desc'),
    );
    const uns = onSnapshot(q, snap => {
      setNotifs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notificacao)));
    });
    return () => uns();
  }, [uid]);

  // Mark all as read on mount
  useEffect(() => {
    const unread = notifs.filter(n => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach(n => batch.update(doc(db, 'notifications', n.id), { read: true }));
    batch.commit();
  }, [notifs]);

  return (
    <div className="fade" style={{ background: '#000', minHeight: '100vh' }}>
      <div style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px',
        borderBottom: '1px solid #1a1a1a', position: 'sticky', top: 0,
        zIndex: 50, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)',
      }}>
        <button onClick={() => goTo('feed')} style={{
          padding: 6, borderRadius: '50%', background: 'transparent',
          border: 'none', cursor: 'pointer', display: 'flex', marginRight: 8,
        }}>{Ico.back()}</button>
        <span style={{
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
          fontSize: 18, color: '#fff', letterSpacing: 0.5,
        }}>NOTIFICAÇÕES</span>
      </div>

      {notifs.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '60px 16px', gap: 12,
        }}>
          <div style={{ fontSize: 40 }}>🔔</div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 18, fontWeight: 700, color: '#555' }}>
            Nenhuma notificação
          </div>
          <div style={{ fontFamily: 'Barlow', fontSize: 13, color: '#444', textAlign: 'center' }}>
            Quando alguém curtir, comentar ou repostar seus posts, você verá aqui.
          </div>
        </div>
      ) : (
        <div>
          {notifs.map(n => {
            const info = TYPE_LABELS[n.type] || TYPE_LABELS.like;
            return (
              <div key={n.id} style={{
                display: 'flex', gap: 12, padding: '14px 16px',
                borderBottom: '1px solid #111',
                background: n.read ? 'transparent' : 'rgba(240,120,48,0.04)',
              }}>
                <img src={n.fromUserPhoto} alt="" style={{
                  width: 40, height: 40, borderRadius: '50%',
                  objectFit: 'cover', flexShrink: 0, border: '2px solid #222',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Barlow', fontSize: 14, color: '#e7e9ea', lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 700 }}>{n.fromUserName}</span>{' '}
                    <span style={{ color: '#888' }}>{info.text}</span>
                  </div>
                  {n.postText && (
                    <div style={{
                      fontFamily: 'Barlow', fontSize: 13, color: '#555',
                      marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      "{n.postText}"
                    </div>
                  )}
                  <div style={{ fontFamily: 'Barlow', fontSize: 11, color: '#444', marginTop: 4 }}>
                    {n.createdAt ? tempoRelativo(n.createdAt) : ''}
                  </div>
                </div>
                <div style={{ fontSize: 18, flexShrink: 0, marginTop: 4 }}>{info.emoji}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
