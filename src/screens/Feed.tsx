import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  getDoc,
  setDoc,
  query,
  where,
  onSnapshot,
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
  adminEmails: string[];
  goTo: (sc: Screen) => void;
  onOpenProfile?: (userId: string, userName: string) => void;
}

export function FeedScreen({
  posts,
  loading,
  currentUser,
  isAdmin,
  uid,
  adminEmails,
  goTo,
  onOpenProfile,
}: Props) {
  const [tab, setTab] = useState<'para-voce' | 'seguindo'>('para-voce');
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [repostingOn, setRepostingOn] = useState<Post | null>(null);
  const [following, setFollowing] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load following list from Firestore
  useEffect(() => {
    const ref = doc(db, 'follows', uid);
    getDoc(ref).then(snap => {
      if (snap.exists()) {
        setFollowing(snap.data().following || []);
      }
    });
  }, [uid]);

  // Listen for unread notifications
  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      where('toUserId', '==', uid),
      where('read', '==', false),
    );
    const uns = onSnapshot(q, snap => setUnreadCount(snap.size));
    return () => uns();
  }, [uid]);

  async function sendNotification(
    toUserId: string,
    type: 'like' | 'comment' | 'repost' | 'reply',
    postText: string,
    postId?: string,
    postImageUrl?: string,
  ) {
    if (toUserId === uid) return;
    await addDoc(collection(db, 'notifications'), {
      toUserId,
      fromUserId: uid,
      fromUserName: currentUser.name,
      fromUserPhoto: currentUser.photo,
      type,
      postText: postText.slice(0, 100),
      ...(postId ? { postId } : {}),
      ...(postImageUrl ? { postImageUrl } : {}),
      read: false,
      createdAt: serverTimestamp(),
    });
  }

  const follow = async (targetUserId: string) => {
    const ref = doc(db, 'follows', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { following: arrayUnion(targetUserId) });
    } else {
      await setDoc(ref, { following: [targetUserId] });
    }
    setFollowing(prev => [...prev, targetUserId]);
  };

  const unfollow = async (targetUserId: string) => {
    const ref = doc(db, 'follows', uid);
    await updateDoc(ref, { following: arrayRemove(targetUserId) });
    setFollowing(prev => prev.filter(id => id !== targetUserId));
  };

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
    const alreadyLiked = p.likes?.includes(uid);
    await updateDoc(doc(db, 'posts', p.id), {
      likes: alreadyLiked ? arrayRemove(uid) : arrayUnion(uid),
    });
    if (!alreadyLiked) {
      sendNotification(p.userId, 'like', p.text, p.id, p.imageUrl);
    }
  };

  const comentar = async (id: string, text: string) => {
    const post = posts.find(p => p.id === id);
    await updateDoc(doc(db, 'posts', id), {
      comments: arrayUnion({
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        user: currentUser.name,
        userId: uid,
        photo: currentUser.photo,
        text: text.trim(),
        time: new Date().toISOString(),
        replies: [],
      }),
    });
    if (post) {
      sendNotification(post.userId, 'comment', post.text, post.id, post.imageUrl);
    }
    setCommentingOn(null);
  };

  const replyToComment = async (postId: string, commentId: string, replyText: string) => {
    const postRef = doc(db, 'posts', postId);
    const snap = await getDoc(postRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const comments = [...(data.comments || [])];
    const idx = comments.findIndex((c: any) => c.id === commentId);
    if (idx === -1) return;
    const reply = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      user: currentUser.name,
      userId: uid,
      photo: currentUser.photo,
      text: replyText.trim(),
      time: new Date().toISOString(),
    };
    comments[idx] = { ...comments[idx], replies: [...(comments[idx].replies || []), reply] };
    await updateDoc(postRef, { comments });
    // Notify comment owner (if different from post owner and from self)
    const commentOwner = comments[idx].userId;
    const post = posts.find(p => p.id === postId);
    if (commentOwner !== uid) {
      sendNotification(commentOwner, 'reply', comments[idx].text, postId, post?.imageUrl);
    }
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
    sendNotification(post.userId, 'repost', post.text, post.id, post.imageUrl);
    setRepostingOn(null);
  };

  const deletar = async (id: string) => {
    if (!window.confirm('Apagar post?')) return;
    await deleteDoc(doc(db, 'posts', id));
  };

  const handleComment = (postId: string) => {
    setCommentingOn(commentingOn === postId ? null : postId);
  };

  // Filter posts for "Seguindo" tab
  const feedPosts = tab === 'seguindo'
    ? posts.filter(p => following.includes(p.userId))
    : posts;

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
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid #1e1e1e',
      }}>
        {/* Top row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px 4px',
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, overflow: 'hidden', flexShrink: 0 }}>
              <svg width="28" height="28" viewBox="4 2 34 52" fill="none">
                <rect x="6" y="4" width="30" height="38" rx="3" fill="#F07830" stroke="#fff" strokeWidth="2.5" />
                <rect x="6" y="4" width="6" height="38" rx="2" fill="#D4621A" stroke="#fff" strokeWidth="1.5" />
                <rect x="19" y="13" width="3" height="16" rx="1.5" fill="#fff" />
                <rect x="14" y="18" width="13" height="3" rx="1.5" fill="#fff" />
                <path d="M26 42 L30 42 L30 50 L28 47 L26 50 Z" fill="#fff" />
              </svg>
            </div>
            <span style={{
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: 22,
              letterSpacing: 3,
              color: '#e7e9ea',
              lineHeight: 1,
            }}>
              FEED
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => goTo('buscar')}
              style={{
                padding: 6, background: 'transparent', border: 'none',
                cursor: 'pointer', borderRadius: '50%', display: 'flex',
              }}
            >
              {Ico.search('#71767b')}
            </button>
            <button
              onClick={() => goTo('notificacoes')}
              style={{
                padding: 6, background: 'transparent', border: 'none',
                cursor: 'pointer', borderRadius: '50%', display: 'flex',
                position: 'relative',
              }}
            >
              {Ico.bell(unreadCount > 0 ? '#F07830' : '#71767b')}
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 2, right: 2,
                  background: '#F07830', color: '#fff',
                  borderRadius: 99, minWidth: 16, height: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontFamily: 'Barlow Condensed', fontWeight: 700,
                  border: '2px solid #000',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
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

      {/* Composer (only on Para você tab) */}
      {tab === 'para-voce' && (
        <Composer userPhoto={currentUser.photo} onPost={postar} />
      )}

      {/* Seguindo empty state */}
      {tab === 'seguindo' && following.length === 0 && !loading && (
        <div style={{
          padding: '60px 32px',
          textAlign: 'center',
          color: '#555',
          fontFamily: 'Barlow, sans-serif',
          fontSize: 15,
          lineHeight: 1.6,
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>👥</div>
          <div style={{ fontWeight: 700, color: '#888', marginBottom: 8, fontSize: 17 }}>
            Você ainda não segue ninguém
          </div>
          <div style={{ color: '#444', marginBottom: 16 }}>
            Busque membros do PG e comece a seguir.
          </div>
          <button
            onClick={() => goTo('buscar')}
            style={{
              padding: '10px 24px', borderRadius: 50,
              background: '#F07830', border: 'none', color: '#fff',
              fontFamily: 'Barlow Condensed', fontWeight: 700,
              fontSize: 13, letterSpacing: 1, cursor: 'pointer',
            }}
          >
            BUSCAR MEMBROS
          </button>
        </div>
      )}

      {/* Seguindo: posts from followed users but none yet */}
      {tab === 'seguindo' && following.length > 0 && feedPosts.length === 0 && !loading && (
        <div style={{
          padding: '60px 32px',
          textAlign: 'center',
          color: '#555',
          fontFamily: 'Barlow, sans-serif',
          fontSize: 15,
          lineHeight: 1.6,
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
          <div style={{ fontWeight: 700, color: '#888', marginBottom: 8, fontSize: 17 }}>
            Nenhum post ainda
          </div>
          <div style={{ color: '#444' }}>
            As pessoas que você segue ainda não postaram nada.
          </div>
        </div>
      )}

      {/* Timeline */}
      {(tab === 'para-voce' || (tab === 'seguindo' && following.length > 0)) && (
        <Timeline
          posts={feedPosts}
          loading={loading}
          uid={uid}
          isAdmin={isAdmin}
          currentUser={currentUser}
          following={following}
          adminEmails={adminEmails}
          commentingOn={commentingOn}
          onLike={curtir}
          onComment={handleComment}
          onRepost={setRepostingOn}
          onDelete={deletar}
          onSubmitComment={comentar}
          onCommentReply={replyToComment}
          onFollow={follow}
          onUnfollow={unfollow}
          onOpenProfile={onOpenProfile}
        />
      )}

      {/* Repost modal */}
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
              }}>
                Repostar
              </span>
              <div style={{ width: 28 }} />
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              <Composer
                userPhoto={currentUser.photo}
                placeholder="Adicione um comentário..."
                submitLabel="Repostar"
                autoFocus
                allowEmpty
                onPost={(t) => repostar(repostingOn, t)}
              />

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
        .feed-back-btn:hover { background: rgba(240,120,48,0.1) !important; }
      `}</style>
    </div>
  );
}
