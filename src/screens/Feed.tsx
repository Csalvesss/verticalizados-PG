import { useState } from 'react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Ico } from '../icons';
import type { Post, CurrentUser, Screen } from '../types';
import { Composer } from '../components/Composer';
import { Timeline } from '../components/Timeline';

interface Props {
  posts: Post[];
  loading: boolean;
  currentUser: CurrentUser;
  isAdmin: boolean;
  uid: string;
  goTo: (sc: Screen) => void;
}

export function FeedScreen({
  posts,
  loading,
  currentUser,
  isAdmin,
  uid,
  goTo,
}: Props) {
  const [tab, setTab] = useState<'para-voce' | 'seguindo'>('para-voce');
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [repostingOn, setRepostingOn] = useState<Post | null>(null);

  const postar = async (text: string, img: string | null) => {
    await addDoc(collection(db, 'posts'), {
      user: currentUser.name,
      userId: uid,
      photo: currentUser.photo,
      text: text.trim(),
      imageUrl: img,
      likes: [],
      comments: [],
      createdAt: serverTimestamp(),
      userEmail: currentUser.email,
    });
  };

  const curtir = async (p: Post) => {
    await updateDoc(doc(db, 'posts', p.id), {
      likes: p.likes?.includes(uid) ? arrayRemove(uid) : arrayUnion(uid),
    });
  };

  const comentar = async (id: string, text: string) => {
    await updateDoc(doc(db, 'posts', id), {
      comments: arrayUnion({
        user: currentUser.name,
        userId: uid,
        photo: currentUser.photo,
        text: text.trim(),
        time: new Date().toISOString(),
      }),
    });
    setCommentingOn(null);
  };

  const repostar = async (post: Post, text: string) => {
    await addDoc(collection(db, 'posts'), {
      user: currentUser.name,
      userId: uid,
      photo: currentUser.photo,
      text: text.trim(),
      imageUrl: null,
      likes: [],
      comments: [],
      createdAt: serverTimestamp(),
      userEmail: currentUser.email,
      repostOf: {
        user: post.user,
        text: post.text,
        imageUrl: post.imageUrl || null,
        userEmail: post.userEmail || '',
      },
    });
    setRepostingOn(null);
  };

  const deletar = async (id: string) => {
    if (!window.confirm('Apagar post?')) return;
    await deleteDoc(doc(db, 'posts', id));
  };

  const handleComment = (postId: string) => {
    setCommentingOn(commentingOn === postId ? null : postId);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#000',
      width: '100%',
    }}>
      {/* ── Sticky header ───────────────────────────────────── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid #1e1e1e',
      }}>
        {/* Top row: back | logo | spacer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px 4px',
        }}>
          <button
            onClick={() => goTo('home')}
            className="feed-back-btn"
            style={{
              padding: '6px',
              color: '#F07830',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {Ico.back()}
          </button>

          {/* Centered PG logo + brand */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{
              width: 28,
              height: 28,
              background: '#F07830',
              borderRadius: 7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="17" height="19" viewBox="0 0 48 52" fill="none">
                <rect x="6" y="4" width="30" height="38" rx="3" fill="#F07830" stroke="#fff" strokeWidth="2.5" />
                <rect x="6" y="4" width="6" height="38" rx="2" fill="#D4621A" stroke="#fff" strokeWidth="1.5" />
                <rect x="19" y="13" width="3" height="16" rx="1.5" fill="#fff" />
                <rect x="14" y="18" width="13" height="3" rx="1.5" fill="#fff" />
                <path d="M26 42 L30 42 L30 50 L28 47 L26 50 Z" fill="#fff" />
              </svg>
            </div>
            <span style={{
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: 18,
              letterSpacing: 2,
              color: '#e7e9ea',
              lineHeight: 1,
            }}>
              PG VERTICALIZADOS
            </span>
          </div>

          <div style={{ width: 34 }} />
        </div>

        {/* Tabs row */}
        <div style={{ display: 'flex' }}>
          {(['para-voce', 'seguindo'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: '12px 0',
                textAlign: 'center',
                cursor: 'pointer',
                position: 'relative',
                fontWeight: tab === t ? 700 : 400,
                color: tab === t ? '#e7e9ea' : '#555',
                fontSize: 15,
                fontFamily: 'Barlow, sans-serif',
                background: 'transparent',
                border: 'none',
                transition: 'color 0.15s',
              }}
            >
              {t === 'para-voce' ? 'Para você' : 'Seguindo'}
              {tab === t && (
                <span style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 52,
                  height: 3,
                  background: '#F07830',
                  borderRadius: 99,
                  display: 'block',
                }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Composer ──────────────────────────────────────── */}
      <Composer userPhoto={currentUser.photo} onPost={postar} />

      {/* ── Timeline ──────────────────────────────────────── */}
      <Timeline
        posts={posts}
        loading={loading}
        uid={uid}
        isAdmin={isAdmin}
        currentUser={currentUser}
        commentingOn={commentingOn}
        onLike={curtir}
        onComment={handleComment}
        onRepost={setRepostingOn}
        onDelete={deletar}
        onSubmitComment={comentar}
      />

      {/* ── Repost modal ──────────────────────────────────── */}
      {repostingOn && (
        <div
          onClick={() => setRepostingOn(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0d0d0d',
              borderRadius: '20px 20px 0 0',
              width: '100%',
              maxWidth: 600,
              maxHeight: '88vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #2f3336',
              borderBottom: 'none',
            }}
          >
            {/* Modal header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 16px 12px',
              borderBottom: '1px solid #1e1e1e',
            }}>
              <button
                onClick={() => setRepostingOn(null)}
                style={{
                  color: '#888',
                  fontSize: 22,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  lineHeight: 1,
                  padding: '0 4px',
                }}
              >
                ×
              </button>
              <span style={{
                flex: 1,
                textAlign: 'center',
                fontWeight: 700,
                color: '#e7e9ea',
                fontSize: 16,
                fontFamily: 'Barlow, sans-serif',
                letterSpacing: 0.2,
              }}>
                Repostar
              </span>
              <div style={{ width: 28 }} />
            </div>

            {/* Scrollable body */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <Composer
                userPhoto={currentUser.photo}
                placeholder="Adicione um comentário..."
                submitLabel="Repostar"
                autoFocus
                allowEmpty
                onPost={(t) => repostar(repostingOn, t)}
              />

              {/* Original post preview */}
              <div style={{ padding: '0 16px 20px' }}>
                <div style={{
                  border: '1px solid #2f3336',
                  borderRadius: 16,
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.02)',
                }}>
                  <div style={{
                    fontWeight: 700,
                    color: '#e7e9ea',
                    marginBottom: 6,
                    fontSize: 14,
                    fontFamily: 'Barlow, sans-serif',
                  }}>
                    {repostingOn.user}
                  </div>
                  {repostingOn.text && (
                    <div style={{
                      color: '#ccc',
                      fontSize: 14,
                      lineHeight: 1.5,
                      fontFamily: 'Barlow, sans-serif',
                      marginBottom: repostingOn.imageUrl ? 8 : 0,
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {repostingOn.text}
                    </div>
                  )}
                  {repostingOn.imageUrl && (
                    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #2f3336' }}>
                      <img
                        src={repostingOn.imageUrl}
                        alt=""
                        style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .feed-back-btn:hover {
          background: rgba(240, 120, 48, 0.1) !important;
        }
      `}</style>
    </div>
  );
}
