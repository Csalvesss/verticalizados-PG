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
import { s } from '../styles';
import { Ico } from '../icons';
import type { Post, CurrentUser, Screen } from '../types';
import { Composer } from '../components/Composer';
import { PostCard } from '../components/PostCard';

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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#000' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #2f3336', display: 'flex', alignItems: 'center' }}>
        <button
          onClick={() => goTo('home')}
          style={{ padding: '12px 16px', color: '#F07830' }}
          className="back-icon-hover"
        >
          {Ico.back()}
        </button>

        <div
          onClick={() => setTab('para-voce')}
          style={{ flex: 1, padding: '16px', textAlign: 'center', cursor: 'pointer', position: 'relative', fontWeight: tab === 'para-voce' ? 700 : 500, color: tab === 'para-voce' ? '#fff' : '#71767b' }}
        >
          Para você
          {tab === 'para-voce' && (
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 56, height: 4, background: '#F07830', borderRadius: 99 }} />
          )}
        </div>
        <div
          onClick={() => setTab('seguindo')}
          style={{ flex: 1, padding: '16px', textAlign: 'center', cursor: 'pointer', position: 'relative', fontWeight: tab === 'seguindo' ? 700 : 500, color: tab === 'seguindo' ? '#fff' : '#71767b' }}
        >
          Seguindo
          {tab === 'seguindo' && (
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 56, height: 4, background: '#F07830', borderRadius: 99 }} />
          )}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ flex: 1 }}>
        <Composer userPhoto={currentUser.photo} onPost={postar} />

        {loading && <div style={s.empty}>Carregando...</div>}
        {!loading && posts.length === 0 && (
          <div style={s.empty}>Nenhum post ainda. Seja o primeiro 🙌</div>
        )}

        <div className="timeline-content">
          {posts.map((post) => (
            <div key={post.id}>
              <PostCard
                post={post}
                uid={uid}
                isAdmin={isAdmin}
                onLike={() => curtir(post)}
                onComment={() => setCommentingOn(commentingOn === post.id ? null : post.id)}
                onRepost={() => setRepostingOn(post)}
                onDelete={() => deletar(post.id)}
              />

              {commentingOn === post.id && (
                <div style={{ padding: '0 16px 16px 68px', borderBottom: '1px solid #2f3336' }}>
                  <Composer
                    userPhoto={currentUser.photo}
                    placeholder="Poste sua resposta"
                    submitLabel="Responder"
                    autoFocus
                    onPost={(t) => comentar(post.id, t)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Repost Modal */}
      {repostingOn && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(91, 112, 131, 0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setRepostingOn(null)}
        >
          <div
            style={{ background: '#000', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #2f3336' }}>
              <button onClick={() => setRepostingOn(null)} style={{ color: '#fff', fontSize: 24, padding: '0 8px' }}>×</button>
              <div style={{ flex: 1, textAlign: 'center', fontWeight: 700, color: '#fff', fontSize: 16 }}>Repostar</div>
              <div style={{ width: 40 }} />
            </div>

            <Composer
              userPhoto={currentUser.photo}
              placeholder="Adicione um comentário..."
              submitLabel="Repostar"
              autoFocus
              onPost={(t) => repostar(repostingOn, t)}
            />

            <div style={{ padding: 16 }}>
              <div style={{ border: '1px solid #2f3336', borderRadius: 16, padding: 12 }}>
                <div style={{ fontWeight: 700, color: '#fff', marginBottom: 4 }}>{repostingOn.user}</div>
                <div style={{ color: '#e7e9ea', fontSize: 14 }}>{repostingOn.text}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .back-icon-hover:hover {
          background: rgba(240, 120, 48, 0.1);
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}
