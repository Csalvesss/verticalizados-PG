import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { Ico } from '../icons';
import { tempoRelativo } from '../constants';
import type { Screen, Notificacao } from '../types';

// Action icon badges, Instagram-style
function ActionBadge({ type }: { type: Notificacao['type'] }) {
  const map = {
    like: { bg: '#ed4956', icon: (
      <svg viewBox="0 0 24 24" width="10" height="10" fill="#fff">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    )},
    comment: { bg: '#0095f6', icon: (
      <svg viewBox="0 0 24 24" width="10" height="10" fill="#fff">
        <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01z"/>
      </svg>
    )},
    reply: { bg: '#0095f6', icon: (
      <svg viewBox="0 0 24 24" width="10" height="10" fill="#fff">
        <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01z"/>
      </svg>
    )},
    repost: { bg: '#F07830', icon: (
      <svg viewBox="0 0 24 24" width="10" height="10" fill="#fff">
        <path d="M4.75 3.79l4.603 4.3-1.706 1.82L6 8.38v7.37c0 .97.784 1.75 1.75 1.75H13V19.5H7.75C5.681 19.5 4 17.819 4 15.75V8.38L2.853 9.91.603 8.09l4.147-4.3zm11.5 2.71H11V4h5.25c2.069 0 3.75 1.681 3.75 3.75v7.37l1.147-1.53 2.25 1.82-4.147 4.3-4.603-4.3 1.706-1.82L17.5 15l.003-7.37c0-.97-.784-1.75-1.753-1.75z"/>
      </svg>
    )},
  };
  const { bg, icon } = map[type] || map.like;
  return (
    <div style={{
      position: 'absolute', bottom: -2, right: -2,
      width: 18, height: 18, borderRadius: '50%',
      background: bg, border: '2px solid #000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {icon}
    </div>
  );
}

const TYPE_TEXT: Record<string, string> = {
  like: 'curtiu sua publicação.',
  comment: 'comentou na sua publicação.',
  reply: 'respondeu ao seu comentário.',
  repost: 'repostou sua publicação.',
};

// Group notifications that are the same type + same post, like Instagram does
function groupNotifs(notifs: Notificacao[]): Array<{ key: string; notifs: Notificacao[]; latest: Notificacao }> {
  const groups: Map<string, Notificacao[]> = new Map();
  for (const n of notifs) {
    const key = `${n.type}:${n.postId || n.postText.slice(0, 30)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(n);
  }
  return Array.from(groups.entries()).map(([key, ns]) => ({
    key,
    notifs: ns,
    latest: ns[0],
  }));
}

export function NotificacoesScreen({ uid, goTo }: { uid: string; goTo: (sc: Screen) => void }) {
  const [notifs, setNotifs] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'notifications'),
      where('toUserId', '==', uid),
      orderBy('createdAt', 'desc'),
    );
    const uns = onSnapshot(q, snap => {
      setNotifs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notificacao)));
      setLoading(false);
    });
    return () => uns();
  }, [uid]);

  // Mark all as read
  useEffect(() => {
    const unread = notifs.filter(n => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach(n => batch.update(doc(db, 'notifications', n.id), { read: true }));
    batch.commit();
  }, [notifs]);

  const grouped = groupNotifs(notifs);

  // Separate today vs earlier
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7);

  const today = grouped.filter(g => {
    const d = g.latest.createdAt?.toDate?.();
    return d && d >= todayStart;
  });
  const thisWeek = grouped.filter(g => {
    const d = g.latest.createdAt?.toDate?.();
    return d && d < todayStart && d >= weekStart;
  });
  const earlier = grouped.filter(g => {
    const d = g.latest.createdAt?.toDate?.();
    return !d || d < weekStart;
  });

  function renderGroup(g: ReturnType<typeof groupNotifs>[number]) {
    const n = g.latest;
    const others = g.notifs.length - 1;
    const isUnread = g.notifs.some(x => !x.read);
    const text = TYPE_TEXT[n.type] || TYPE_TEXT.like;

    return (
      <div key={g.key} style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
        background: isUnread ? 'rgba(240,120,48,0.05)' : 'transparent',
        borderBottom: '1px solid #0f0f0f',
      }}>
        {/* Avatar with action badge */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={n.fromUserPhoto}
            alt=""
            style={{
              width: 44, height: 44, borderRadius: '50%',
              objectFit: 'cover', display: 'block',
              border: isUnread ? '2px solid #F07830' : '2px solid #222',
            }}
            onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="8" r="5" fill="%23444"/><path d="M2 20c0-4 4.5-7 10-7s10 3 10 7" fill="%23444"/></svg>'; }}
          />
          <ActionBadge type={n.type} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#e7e9ea', lineHeight: 1.4 }}>
            <span style={{ fontWeight: 700 }}>{n.fromUserName}</span>
            {others > 0 && (
              <span style={{ color: '#888' }}> e <span style={{ fontWeight: 700, color: '#e7e9ea' }}>{others} outro{others > 1 ? 's' : ''}</span></span>
            )}
            {' '}
            <span style={{ color: '#aaa' }}>{text}</span>
          </div>
          {n.postText && !n.postImageUrl && (
            <div style={{ fontFamily: 'Barlow', fontSize: 12, color: '#555', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {n.postText}
            </div>
          )}
          <div style={{ fontFamily: 'Barlow', fontSize: 11, color: '#444', marginTop: 3 }}>
            {n.createdAt ? tempoRelativo(n.createdAt) : ''}
          </div>
        </div>

        {/* Post thumbnail OR unread dot */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          {n.postImageUrl ? (
            <img
              src={n.postImageUrl}
              alt=""
              style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid #222' }}
            />
          ) : isUnread ? (
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F07830' }} />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="fade" style={{ background: '#000', minHeight: '100vh' }}>
      {/* Header */}
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
        }}>Atividade</span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, paddingTop: 8 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#1a1a1a', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ height: 13, borderRadius: 6, background: '#1a1a1a', width: '60%' }} />
                <div style={{ height: 11, borderRadius: 6, background: '#111', width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : notifs.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 16px', gap: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="#333">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
          </div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 18, fontWeight: 700, color: '#555' }}>
            Sem atividade ainda
          </div>
          <div style={{ fontFamily: 'Barlow', fontSize: 13, color: '#444', textAlign: 'center' }}>
            Quando alguém curtir, comentar ou repostar seus posts, você verá aqui.
          </div>
        </div>
      ) : (
        <div>
          {today.length > 0 && (
            <>
              <div style={{ padding: '12px 16px 4px', fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 13, color: '#555', letterSpacing: 0.5 }}>
                HOJE
              </div>
              {today.map(renderGroup)}
            </>
          )}
          {thisWeek.length > 0 && (
            <>
              <div style={{ padding: '12px 16px 4px', fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 13, color: '#555', letterSpacing: 0.5 }}>
                ESTA SEMANA
              </div>
              {thisWeek.map(renderGroup)}
            </>
          )}
          {earlier.length > 0 && (
            <>
              <div style={{ padding: '12px 16px 4px', fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 13, color: '#555', letterSpacing: 0.5 }}>
                ANTERIORES
              </div>
              {earlier.map(renderGroup)}
            </>
          )}
        </div>
      )}
    </div>
  );
}
