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
      {/* Sticky header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #2f3336',
        display: 'flex',
        alignItems: 'center',
      }}>
        <button
          onClick={() => goTo('home')}
          className="header-back-btn"
          style={{
            padding: '12px 16px',
            color: '#F07830',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: '0.2s',
            marginLeft: 4,
          }}
        >
          {Ico.back()}
        </button>

        <div style={{ flex: 1, display: 'flex' }}>
          {(['para-voce', 'seguindo'] as const).map((t) => (
            <div
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: '16px 0',
                textAlign: 'center',
                cursor: 'pointer',
                position: 'relative',
                fontWeight: tab === t ? 700 : 500,
                color: tab === t ? '#fff' : '#71767b',
                fontSize: 15,
                fontFamily: 'Barlow, sans-serif',
              }}
            >
              {t === 'para-voce' ? 'Para você' : 'Seguindo'}
              {tab === t && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 56,
                  height: 4,
                  background: '#F07830',
                  borderRadius: 99,
                }} />
              )}
            </div>
          ))}
        </div>

        <div style={{ width: 44 }} />
      </div>

      {/* Composer */}
      <Composer userPhoto={currentUser.photo} onPost={postar} />

      {/* Timeline */}
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

      {/* Repost modal */}
      {repostingOn && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(91, 112, 131, 0.4)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setRepostingOn(null)}
        >
          <div
            style={{
              background: '#000',
              borderRadius: 16,
              width: '100%',
              maxWidth: 600,
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 0 24px rgba(255,255,255,0.08)',
              border: '1px solid #2f3336',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid #2f3336',
            }}>
              <button
                onClick={() => setRepostingOn(null)}
                style={{
                  color: '#fff',
                  fontSize: 24,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0 8px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
              <div style={{
                flex: 1,
                textAlign: 'center',
                fontWeight: 700,
                color: '#fff',
                fontSize: 16,
                fontFamily: 'Barlow, sans-serif',
              }}>
                Repostar
              </div>
              <div style={{ width: 40 }} />
            </div>

            {/* Modal body */}
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
              <div style={{ padding: '0 16px 16px' }}>
                <div style={{
                  border: '1px solid #2f3336',
                  borderRadius: 16,
                  padding: 12,
                  background: 'rgba(255,255,255,0.02)',
                }}>
                  <div style={{
                    fontWeight: 700,
                    color: '#fff',
                    marginBottom: 6,
                    fontSize: 14,
                    fontFamily: 'Barlow, sans-serif',
                  }}>
                    {repostingOn.user}
                  </div>
                  {repostingOn.text && (
                    <div style={{
                      color: '#e7e9ea',
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
                    <div style={{
                      borderRadius: 12,
                      overflow: 'hidden',
                      border: '1px solid #2f3336',
                    }}>
                      <img
                        src={repostingOn.imageUrl}
                        alt=""
                        style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }}
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
        .header-back-btn:hover {
          background: rgba(240, 120, 48, 0.1) !important;
        }
      `}</style>
    </div>
  );
}
