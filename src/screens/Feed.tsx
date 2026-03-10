import { useState } from 'react';
import { Ico } from '../icons';
import type { Post, CurrentUser, Screen } from '../types';
import { Composer } from '../components/Composer';
import { Timeline } from '../components/Timeline';
import { StoriesBar } from '../components/StoriesBar';
import {
  addPostComment,
  createFeedPost,
  removePost,
  togglePostLike,
} from '../services/postService';

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
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [repostingOn, setRepostingOn] = useState<Post | null>(null);
  const [filterUserId, setFilterUserId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const visiblePosts = filterUserId
    ? posts.filter((post) => post.userId === filterUserId)
    : posts;

  const postar = async (text: string, img: string | null) => {
    try {
      setErrorMsg('');
      await createFeedPost({
        user: currentUser.name,
        userId: uid,
        photo: currentUser.photo,
        text,
        imageUrl: img,
        userEmail: currentUser.email,
      });
    } catch (error) {
      console.error(error);
      setErrorMsg('Não foi possível publicar agora. Tente novamente.');
      throw error;
    }
  };

  const curtir = async (p: Post) => {
    try {
      setErrorMsg('');
      await togglePostLike(p.id, p.likes?.includes(uid), uid);
    } catch (error) {
      console.error(error);
      setErrorMsg('Falha ao curtir/descurtir o post.');
    }
  };

  const comentar = async (id: string, text: string) => {
    try {
      setErrorMsg('');
      await addPostComment(id, {
        user: currentUser.name,
        userId: uid,
        photo: currentUser.photo,
        text,
        time: new Date().toISOString(),
      });
      setCommentingOn(null);
    } catch (error) {
      console.error(error);
      setErrorMsg('Falha ao enviar comentário.');
    }
  };

  const repostar = async (post: Post, text: string) => {
    try {
      setErrorMsg('');
      await createFeedPost({
        user: currentUser.name,
        userId: uid,
        photo: currentUser.photo,
        text,
        imageUrl: null,
        userEmail: currentUser.email,
        repostOf: {
          user: post.user,
          text: post.text,
          imageUrl: post.imageUrl || undefined,
          ...(post.userEmail ? { userEmail: post.userEmail } : {}),
        },
      });
      setRepostingOn(null);
    } catch (error) {
      console.error(error);
      setErrorMsg('Falha ao repostar.');
      throw error;
    }
  };

  const deletar = async (id: string) => {
    if (!window.confirm('Apagar post?')) return;
    try {
      setErrorMsg('');
      await removePost(id);
    } catch (error) {
      console.error(error);
      setErrorMsg('Falha ao apagar o post.');
    }
  };

  const handleComment = (postId: string) => {
    setCommentingOn(commentingOn === postId ? null : postId);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#000',
        width: '100%',
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(0,0,0,0.9)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid #1e1e1e',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
          }}
        >
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

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                fontFamily: 'Barlow, sans-serif',
                fontSize: 18,
                fontWeight: 800,
                color: '#e7e9ea',
                lineHeight: 1,
              }}
            >
              Feed
            </span>
          </div>

          <div style={{ width: 30 }} />
        </div>

        <StoriesBar
          posts={posts}
          currentUser={currentUser}
          activeUserId={filterUserId}
          onStoryPress={(userId) =>
            setFilterUserId(filterUserId === userId ? null : userId)
          }
        />

        <div
          style={{
            padding: '0 16px 10px',
            borderTop: '1px solid #111',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              fontFamily: 'Barlow, sans-serif',
              color: '#e7e9ea',
              fontWeight: 700,
              fontSize: 15,
              position: 'relative',
              paddingTop: 8,
            }}
          >
            {filterUserId ? 'Posts do usuário' : 'Para você'}
            <span
              style={{
                position: 'absolute',
                left: 0,
                bottom: -10,
                width: '100%',
                height: 3,
                borderRadius: 99,
                background: '#1d9bf0',
              }}
            />
          </span>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            margin: '8px 16px 0',
            padding: '10px 12px',
            borderRadius: 10,
            background: 'rgba(244, 33, 46, 0.12)',
            border: '1px solid rgba(244, 33, 46, 0.35)',
            color: '#ff8f98',
            fontFamily: 'Barlow, sans-serif',
            fontSize: 13,
          }}
        >
          {errorMsg}
        </div>
      )}

      <Composer userPhoto={currentUser.photo} onPost={postar} />

      <Timeline
        posts={visiblePosts}
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 16px 12px',
                borderBottom: '1px solid #1e1e1e',
              }}
            >
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
              <span
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontWeight: 700,
                  color: '#e7e9ea',
                  fontSize: 16,
                  fontFamily: 'Barlow, sans-serif',
                  letterSpacing: 0.2,
                }}
              >
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
                <div
                  style={{
                    border: '1px solid #2f3336',
                    borderRadius: 16,
                    padding: '12px 14px',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      color: '#e7e9ea',
                      marginBottom: 6,
                      fontSize: 14,
                      fontFamily: 'Barlow, sans-serif',
                    }}
                  >
                    {repostingOn.user}
                  </div>
                  {repostingOn.text && (
                    <div
                      style={{
                        color: '#ccc',
                        fontSize: 14,
                        lineHeight: 1.5,
                        fontFamily: 'Barlow, sans-serif',
                        marginBottom: repostingOn.imageUrl ? 8 : 0,
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {repostingOn.text}
                    </div>
                  )}
                  {repostingOn.imageUrl && (
                    <div
                      style={{
                        borderRadius: 12,
                        overflow: 'hidden',
                        border: '1px solid #2f3336',
                      }}
                    >
                      <img
                        src={repostingOn.imageUrl}
                        alt=""
                        style={{
                          width: '100%',
                          maxHeight: 280,
                          objectFit: 'cover',
                          display: 'block',
                        }}
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