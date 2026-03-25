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
  const postRef = (id: string) => doc(db, 'posts', id);
  const postsCol = () => collection(db, 'posts');
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [repostingOn, setRepostingOn] = useState<Post | null>(null);
  const [following, setFollowing] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pinnedFeedPostId, setPinnedFeedPostId] = useState('');

  // Load following list from Firestore
  useEffect(() => {
    const ref = doc(db, 'follows', uid);
    getDoc(ref).then(snap => {
      if (snap.exists()) {
        setFollowing(snap.data().following || []);
      }
    });
  }, [uid]);

  // Listen for pinned feed post
  useEffect(() => {
    const uns = onSnapshot(doc(db, 'config', 'pinned'), snap => {
      setPinnedFeedPostId(snap.exists() ? (snap.data().postId || '') : '');
    });
    return () => uns();
  }, []);

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
    await addDoc(postsCol(), {
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
    await updateDoc(postRef(p.id), {
      likes: alreadyLiked ? arrayRemove(uid) : arrayUnion(uid),
    });
    if (!alreadyLiked) {
      sendNotification(p.userId, 'like', p.text, p.id, p.imageUrl);
    }
  };

  const comentar = async (id: string, text: string) => {
    const post = posts.find(p => p.id === id);
    await updateDoc(postRef(id), {
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
    const idx = comments.findIndex((c: any) => c.id === commentId || c.time === commentId);
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
    await addDoc(postsCol(), {
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

  const editPost = async (postId: string, newText: string) => {
    if (!newText.trim()) return;
    await updateDoc(postRef(postId), { text: newText.trim() });
  };

  const deleteComment = async (postId: string, commentId: string) => {
    const postRef = doc(db, 'posts', postId);
    const snap = await getDoc(postRef);
    if (!snap.exists()) return;
    const comments = (snap.data().comments || []).filter(
      (c: any) => c.id !== commentId && c.time !== commentId,
    );
    await updateDoc(postRef, { comments });
  };

  const editComment = async (postId: string, commentId: string, newText: string) => {
    const postRef = doc(db, 'posts', postId);
    const snap = await getDoc(postRef);
    if (!snap.exists()) return;
    const comments = [...(snap.data().comments || [])];
    const idx = comments.findIndex((c: any) => c.id === commentId || c.time === commentId);
    if (idx === -1) return;
    comments[idx] = { ...comments[idx], text: newText };
    await updateDoc(postRef, { comments });
  };

  const deleteReply = async (postId: string, commentId: string, replyId: string) => {
    const postRef = doc(db, 'posts', postId);
    const snap = await getDoc(postRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const comments = [...(data.comments || [])];
    const idx = comments.findIndex((c: any) => c.id === commentId || c.time === commentId);
    if (idx === -1) return;
    const replies = (comments[idx].replies || []).filter((r: any) => r.id !== replyId);
    comments[idx] = { ...comments[idx], replies };
    await updateDoc(postRef, { comments });
  };

  const deletar = async (id: string) => {
    if (!window.confirm('Apagar post?')) return;
    await deleteDoc(postRef(id));
  };

  const handleComment = (postId: string) => {
    setCommentingOn(commentingOn === postId ? null : postId);
  };

  const pinFeedPost = async (postId: string) => {
    const newId = pinnedFeedPostId === postId ? '' : postId;
    await setDoc(doc(db, 'config', 'pinned'), { postId: newId });
  };

  // Filter posts for "Seguindo" tab, then put pinned post first
  const basePosts = tab === 'seguindo'
    ? posts.filter(p => following.includes(p.userId))
    : posts;

  const pinnedPost = pinnedFeedPostId ? basePosts.find(p => p.id === pinnedFeedPostId) : undefined;
  const feedPosts = pinnedPost
    ? [pinnedPost, ...basePosts.filter(p => p.id !== pinnedFeedPostId)]
    : basePosts;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0f0f0f',
      width: '100%',
    }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(15,15,15,0.95)',
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

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 900,
              fontSize: 20,
              letterSpacing: -0.5,
              lineHeight: 1,
            }}>
              <span style={{ color: '#BA7517' }}>7</span>
              <span style={{ color: '#e7e9ea' }}>Teen</span>
            </span>
            <span style={{
              fontFamily: 'Barlow, sans-serif',
              fontSize: 9,
              letterSpacing: 1.5,
              color: '#555',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}>
              Toda a APV
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
                <div style={{
                  position: 'absolute', top: 1, right: 1,
                  minWidth: 18, height: 18,
                  background: 'linear-gradient(135deg, #F07830, #BA7517)',
                  color: '#fff',
                  borderRadius: 99,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontFamily: 'Barlow Condensed', fontWeight: 700,
                  border: '2px solid #0f0f0f',
                  boxShadow: '0 2px 8px rgba(240,120,48,0.5)',
                  padding: '0 4px',
                  lineHeight: 1,
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
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
        <div id="feed-composer">
          <Composer userPhoto={currentUser.photo} onPost={postar} />
        </div>
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
            Busque membros da APV e comece a seguir.
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
          pinnedFeedPostId={pinnedFeedPostId}
          onLike={curtir}
          onComment={handleComment}
          onRepost={setRepostingOn}
          onDelete={deletar}
          onEditPost={editPost}
          onSubmitComment={comentar}
          onCommentReply={replyToComment}
          onDeleteReply={deleteReply}
          onDeleteComment={deleteComment}
          onEditComment={editComment}
          onFollow={follow}
          onUnfollow={unfollow}
          onOpenProfile={onOpenProfile}
          onPinFeed={pinFeedPost}
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
