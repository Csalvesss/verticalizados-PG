import { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { Ico } from '../icons';
import { tempoRelativo } from '../constants';
import type { Screen, Notificacao } from '../types';

// Ícone de ação sobre o avatar (Instagram style)
function ActionBadge({ type }: { type: Notificacao['type'] }) {
  const map = {
    like: {
      bg: '#ed4956',
      icon: (
        <svg viewBox="0 0 24 24" width="9" height="9" fill="#fff">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      ),
    },
    comment: {
      bg: '#0095f6',
      icon: (
        <svg viewBox="0 0 24 24" width="9" height="9" fill="#fff">
          <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01z"/>
        </svg>
      ),
    },
    reply: {
      bg: '#0095f6',
      icon: (
        <svg viewBox="0 0 24 24" width="9" height="9" fill="#fff">
          <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01z"/>
        </svg>
      ),
    },
    repost: {
      bg: '#F07830',
      icon: (
        <svg viewBox="0 0 24 24" width="9" height="9" fill="#fff">
          <path d="M4.75 3.79l4.603 4.3-1.706 1.82L6 8.38v7.37c0 .97.784 1.75 1.75 1.75H13V19.5H7.75C5.681 19.5 4 17.819 4 15.75V8.38L2.853 9.91.603 8.09l4.147-4.3zm11.5 2.71H11V4h5.25c2.069 0 3.75 1.681 3.75 3.75v7.37l1.147-1.53 2.25 1.82-4.147 4.3-4.603-4.3 1.706-1.82L17.5 15l.003-7.37c0-.97-.784-1.75-1.753-1.75z"/>
        </svg>
      ),
    },
  };
  const { bg, icon } = map[type] || map.like;
  return (
    <div style={{
      position: 'absolute', bottom: -3, right: -3,
      width: 20, height: 20, borderRadius: '50%',
      background: bg, border: '2.5px solid #000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
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

function groupNotifs(notifs: Notificacao[]) {
  const groups: Map<string, Notificacao[]> = new Map();
  for (const n of notifs) {
    const key = `${n.type}:${n.postId || n.postText?.slice(0, 30)}`;
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

  // IDs que eram "não lidos" quando a tela abriu — persiste durante a sessão
  const newIdsRef = useRef<Set<string>>(new Set());
  const didInitRef = useRef(false);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'notifications'),
      where('toUserId', '==', uid),
      orderBy('createdAt', 'desc'),
    );
    const uns = onSnapshot(
      q,
      snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Notificacao));
        setNotifs(data);
        setLoading(false);

        // Na primeira carga, salva quais eram novos e agenda marcar como lido
        if (!didInitRef.current && data.length > 0) {
          didInitRef.current = true;
          data.filter(n => !n.read).forEach(n => newIdsRef.current.add(n.id));

          // Marca como lido após 2s (badge some, mas label NOVO fica na sessão)
          setTimeout(() => {
            const unread = data.filter(n => !n.read);
            if (unread.length === 0) return;
            const batch = writeBatch(db);
            unread.forEach(n => batch.update(doc(db, 'notifications', n.id), { read: true }));
            batch.commit().catch(() => {});
          }, 2000);
        }
      },
      () => setLoading(false),
    );
    return () => uns();
  }, [uid]);

  const grouped = groupNotifs(notifs);

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7);

  const novo    = grouped.filter(g => newIdsRef.current.has(g.latest.id));
  const novoIds = new Set(novo.map(g => g.key));
  const today   = grouped.filter(g => !novoIds.has(g.key) && (() => { const d = g.latest.createdAt?.toDate?.(); return d && d >= todayStart; })());
  const week    = grouped.filter(g => !novoIds.has(g.key) && (() => { const d = g.latest.createdAt?.toDate?.(); return d && d < todayStart && d >= weekStart; })());
  const earlier = grouped.filter(g => !novoIds.has(g.key) && (() => { const d = g.latest.createdAt?.toDate?.(); return !d || d < weekStart; })());

  function renderGroup(g: ReturnType<typeof groupNotifs>[number], showNewLabel = false) {
    const n = g.latest;
    const others = g.notifs.length - 1;
    const text = TYPE_TEXT[n.type] || TYPE_TEXT.like;

    return (
      <div key={g.key} style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 16px',
        transition: 'background 0.15s',
      }}
        onPointerDown={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; }}
        onPointerUp={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
        onPointerLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
      >
        {/* Avatar com badge de ação */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={n.fromUserPhoto}
            alt=""
            style={{
              width: 46, height: 46, borderRadius: '50%',
              objectFit: 'cover', display: 'block',
              border: showNewLabel ? '2px solid #F07830' : '2px solid rgba(255,255,255,0.1)',
            }}
            onError={e => {
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="8" r="5" fill="%23444"/><path d="M2 20c0-4 4.5-7 10-7s10 3 10 7" fill="%23444"/></svg>';
            }}
          />
          <ActionBadge type={n.type} />
        </div>

        {/* Texto */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'Barlow, sans-serif', fontSize: 14,
            color: '#e7e9ea', lineHeight: 1.4,
          }}>
            <span style={{ fontWeight: 700 }}>{n.fromUserName}</span>
            {others > 0 && (
              <span style={{ color: '#888' }}>
                {' '}e{' '}
                <span style={{ fontWeight: 700, color: '#e7e9ea' }}>
                  {others} outro{others > 1 ? 's' : ''}
                </span>
              </span>
            )}
            {' '}
            <span style={{ color: '#999' }}>{text}</span>
          </div>
          {n.postText && !n.postImageUrl && (
            <div style={{
              fontFamily: 'Barlow', fontSize: 12, color: '#555',
              marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {n.postText}
            </div>
          )}
          <div style={{ fontFamily: 'Barlow', fontSize: 11, color: '#444', marginTop: 3 }}>
            {n.createdAt ? tempoRelativo(n.createdAt) : ''}
          </div>
        </div>

        {/* Thumbnail ou badge NOVO */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          {n.postImageUrl ? (
            <img
              src={n.postImageUrl}
              alt=""
              style={{
                width: 44, height: 44, objectFit: 'cover',
                borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
          ) : showNewLabel ? (
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'linear-gradient(135deg, #F07830, #BA7517)',
              boxShadow: '0 0 6px rgba(240,120,48,0.6)',
            }} />
          ) : null}
        </div>
      </div>
    );
  }

  function SectionLabel({ label }: { label: string }) {
    return (
      <div style={{
        padding: '14px 16px 6px',
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 700, fontSize: 13,
        color: '#555', letterSpacing: 1,
        textTransform: 'uppercase',
      }}>
        {label}
      </div>
    );
  }

  return (
    <div className="fade" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <button
          onClick={() => goTo('feed')}
          style={{
            padding: 6, borderRadius: '50%', background: 'transparent',
            border: 'none', cursor: 'pointer', display: 'flex', marginRight: 8,
          }}
        >
          {Ico.back()}
        </button>
        <span style={{
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
          fontSize: 18, color: '#fff', letterSpacing: 0.5, flex: 1,
        }}>
          Atividade
        </span>
        {novo.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #F07830, #BA7517)',
            color: '#fff', fontFamily: 'Barlow Condensed', fontWeight: 700,
            fontSize: 11, borderRadius: 99, padding: '3px 10px',
            boxShadow: '0 2px 8px rgba(240,120,48,0.35)',
          }}>
            {novo.length} novo{novo.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {loading ? (
        /* Skeleton loading */
        <div style={{ paddingTop: 8 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px' }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#1a1a1a', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ height: 13, borderRadius: 6, background: '#1a1a1a', width: '65%' }} />
                <div style={{ height: 11, borderRadius: 6, background: '#111', width: '35%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : notifs.length === 0 ? (
        /* Empty state */
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '80px 32px', gap: 16, textAlign: 'center',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div>
            <div style={{
              fontFamily: 'Barlow Condensed, sans-serif', fontSize: 20,
              fontWeight: 700, color: '#e7e9ea', marginBottom: 8,
            }}>
              Sem atividade ainda
            </div>
            <div style={{
              fontFamily: 'Barlow, sans-serif', fontSize: 13,
              color: '#444', lineHeight: 1.6,
            }}>
              Quando alguém curtir, comentar ou repostar seus posts, você verá aqui.
            </div>
          </div>
        </div>
      ) : (
        <div>
          {novo.length > 0 && (
            <>
              <SectionLabel label="Novo" />
              {novo.map(g => renderGroup(g, true))}
            </>
          )}
          {today.length > 0 && (
            <>
              <SectionLabel label="Hoje" />
              {today.map(g => renderGroup(g))}
            </>
          )}
          {week.length > 0 && (
            <>
              <SectionLabel label="Esta semana" />
              {week.map(g => renderGroup(g))}
            </>
          )}
          {earlier.length > 0 && (
            <>
              <SectionLabel label="Anteriores" />
              {earlier.map(g => renderGroup(g))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
