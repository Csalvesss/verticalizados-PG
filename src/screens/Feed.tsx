import { useState, useRef, useEffect } from 'react';
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
import { s } from '../styles';
import { tempoRelativo, ADMIN_EMAIL } from '../constants';
import type { Post, CurrentUser, Screen } from '../types';

interface Props {
  posts: Post[];
  loading: boolean;
  currentUser: CurrentUser;
  isAdmin: boolean;
  uid: string;
  goTo: (sc: Screen) => void;
}

function AutoTextarea({
  value,
  onChange,
  placeholder,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      style={{
        resize: 'none',
        overflow: 'hidden',
        ...style,
      }}
    />
  );
}

export function FeedScreen({
  posts,
  loading,
  currentUser,
  isAdmin,
  uid,
  goTo,
}: Props) {
  const [text, setText] = useState('');
  const [img, setImg] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [repostingOn, setRepostingOn] = useState<Post | null>(null);
  const [repostText, setRepostText] = useState('');
  const [tab, setTab] = useState<'para-voce' | 'seguindo'>('para-voce');
  const imgRef = useRef<HTMLInputElement>(null);

  const postar = async () => {
    if ((!text.trim() && !img) || posting) return;

    setPosting(true);

    try {
      const t = text.trim();
      const i = img;

      setText('');
      setImg(null);

      await addDoc(collection(db, 'posts'), {
        user: currentUser.name,
        userId: uid,
        photo: currentUser.photo,
        text: t,
        imageUrl: i || null,
        likes: [],
        comments: [],
        createdAt: serverTimestamp(),
        userEmail: currentUser.email, // Store email to check for verified badge later
      });
    } finally {
      setPosting(false);
    }
  };

  const curtir = async (p: Post) => {
    await updateDoc(doc(db, 'posts', p.id), {
      likes: p.likes?.includes(uid) ? arrayRemove(uid) : arrayUnion(uid),
    });
  };

  const comentar = async (id: string) => {
    if (!commentText.trim()) return;

    await updateDoc(doc(db, 'posts', id), {
      comments: arrayUnion({
        user: currentUser.name,
        userId: uid,
        photo: currentUser.photo,
        text: commentText.trim(),
        time: new Date().toISOString(),
      }),
    });

    setCommentText('');
    setCommentingOn(null);
  };

  const repostar = async () => {
    if (!repostingOn) return;

    await addDoc(collection(db, 'posts'), {
      user: currentUser.name,
      userId: uid,
      photo: currentUser.photo,
      text: repostText.trim(),
      imageUrl: null,
      likes: [],
      comments: [],
      createdAt: serverTimestamp(),
      userEmail: currentUser.email,
      repostOf: {
        user: repostingOn.user,
        text: repostingOn.text,
        imageUrl: repostingOn.imageUrl || null,
        userEmail: repostingOn.userEmail || '',
      },
    });

    setRepostText('');
    setRepostingOn(null);
  };

  const deletar = async (id: string) => {
    if (!window.confirm('Apagar post?')) return;
    await deleteDoc(doc(db, 'posts', id));
  };

  const handleImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const r = new FileReader();
    r.onload = (ev) => {
      if (ev.target?.result) {
        setImg(ev.target.result as string);
      }
    };
    r.readAsDataURL(f);
  };

  const canPost = text.trim().length > 0 || !!img;

  const iconBtnStyle = (
    activeColor: string,
    active: boolean
  ): React.CSSProperties => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: active ? activeColor : '#71767b',
    fontFamily: 'Barlow',
    fontSize: 13,
    padding: '8px 0',
    transition: '0.2s ease',
  });

  const VerifiedBadge = () => (
    <svg viewBox="0 0 24 24" aria-label="Conta verificada" style={{ width: 15, height: 15, fill: '#F07830', marginLeft: 2 }}>
      <g><path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.35-6.2 6.78z"></path></g>
    </svg>
  );

  const backBtnOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    left: 8,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 60,
  };

  return (
    <div
      className="fade"
      style={{
        background: '#000',
        minHeight: '100%',
        color: '#fff',
      }}
    >
      {/* Header Tabs */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid #2f3336',
          display: 'flex',
        }}
      >
        <button
          style={{ ...s.backBtn, ...backBtnOverlayStyle }}
          onClick={() => goTo('home')}
          className="post-action-hover"
        >
          {Ico.back()}
        </button>

        <div
          onClick={() => setTab('para-voce')}
          style={{
            flex: 1,
            padding: '16px',
            textAlign: 'center',
            cursor: 'pointer',
            position: 'relative',
            fontFamily: 'Barlow',
            fontWeight: tab === 'para-voce' ? 700 : 500,
            color: tab === 'para-voce' ? '#fff' : '#71767b',
            transition: '0.2s',
          }}
        >
          Para você
          {tab === 'para-voce' && (
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 56, height: 4, background: '#F07830', borderRadius: 99 }} />
          )}
        </div>
        <div
          onClick={() => setTab('seguindo')}
          style={{
            flex: 1,
            padding: '16px',
            textAlign: 'center',
            cursor: 'pointer',
            position: 'relative',
            fontFamily: 'Barlow',
            fontWeight: tab === 'seguindo' ? 700 : 500,
            color: tab === 'seguindo' ? '#fff' : '#71767b',
            transition: '0.2s',
          }}
        >
          Seguindo
          {tab === 'seguindo' && (
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 56, height: 4, background: '#F07830', borderRadius: 99 }} />
          )}
        </div>
      </div>

      {/* Composer */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #2f3336',
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <img
            src={currentUser.photo}
            alt=""
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <AutoTextarea
              value={text}
              onChange={setText}
              placeholder="O que está acontecendo?"
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontFamily: 'Barlow',
                fontSize: 18,
                color: '#fff',
                lineHeight: 1.5,
                padding: '4px 0 12px',
              }}
            />

            {img && (
              <div
                style={{
                  position: 'relative',
                  marginTop: 8,
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1px solid #2f3336',
                }}
              >
                <img
                  src={img}
                  alt=""
                  style={{
                    width: '100%',
                    maxHeight: 400,
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />

                <button
                  onClick={() => setImg(null)}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(15,20,25,0.7)',
                    color: '#fff',
                    fontSize: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </div>
            )}

            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid #2f3336',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => imgRef.current?.click()}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#F07830',
                    transition: '0.2s',
                  }}
                  className="post-action-hover"
                >
                  {Ico.image()}
                </button>

                <input
                  ref={imgRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImg}
                  style={{ display: 'none' }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                {text.length > 0 && (
                  <span
                    style={{
                      fontFamily: 'Barlow',
                      fontSize: 12,
                      color: text.length > 280 ? '#f4212e' : '#71767b',
                    }}
                  >
                    {text.length}/280
                  </span>
                )}

                <button
                  onClick={postar}
                  disabled={!canPost || posting}
                  style={{
                    border: 'none',
                    borderRadius: 999,
                    padding: '8px 16px',
                    fontFamily: 'Barlow',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: canPost && !posting ? 'pointer' : 'default',
                    background: canPost && !posting ? '#F07830' : '#3a2314',
                    color: canPost && !posting ? '#fff' : '#8c6239',
                    transition: '0.2s ease',
                  }}
                >
                  {posting ? 'Postando' : 'Postar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista */}
      {loading && <div style={s.empty}>Carregando...</div>}
      {!loading && posts.length === 0 && (
        <div style={s.empty}>Nenhum post ainda. Seja o primeiro 🙌</div>
      )}

      {posts.map((post) => {
        const liked = post.likes?.includes(uid);
        const podeApagar = post.userId === uid || isAdmin;
        const isVerified = post.userEmail === ADMIN_EMAIL;
        const isRepostVerified = post.repostOf?.userEmail === ADMIN_EMAIL;

        return (
          <div
            key={post.id}
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #2f3336',
              transition: 'background 0.2s ease',
            }}
          >
            {post.repostOf && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 4,
                  paddingLeft: 28,
                  fontFamily: 'Barlow',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#71767b',
                }}
              >
                {Ico.repost('#71767b')}
                <span>{post.user} repostou</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <img
                src={post.photo}
                alt=""
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'Barlow',
                        fontWeight: 700,
                        fontSize: 15,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {post.user}
                      {isVerified && <VerifiedBadge />}
                    </span>

                    <span
                      style={{
                        fontFamily: 'Barlow',
                        fontSize: 14,
                        color: '#71767b',
                      }}
                    >
                      · {tempoRelativo(post.createdAt)}
                    </span>
                  </div>

                  {podeApagar && (
                    <button
                      onClick={() => deletar(post.id)}
                      style={{
                        padding: '8px',
                        color: '#71767b',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '50%',
                      }}
                      className="post-action-hover"
                    >
                      {Ico.trash()}
                    </button>
                  )}
                </div>

                {post.text && (
                  <p
                    style={{
                      fontFamily: 'Barlow',
                      fontSize: 15,
                      color: '#e7e9ea',
                      lineHeight: 1.5,
                      margin: '2px 0 12px',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {post.text}
                  </p>
                )}

                {post.imageUrl && !post.repostOf && (
                  <div
                    style={{
                      overflow: 'hidden',
                      borderRadius: 16,
                      border: '1px solid #2f3336',
                      marginBottom: 12,
                    }}
                  >
                    <img
                      src={post.imageUrl}
                      alt=""
                      style={{
                        width: '100%',
                        maxHeight: 512,
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>
                )}

                {post.repostOf && (
                  <div
                    style={{
                      border: '1px solid #2f3336',
                      borderRadius: 16,
                      padding: '12px',
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'Barlow',
                        fontWeight: 700,
                        fontSize: 15,
                        color: '#fff',
                        marginBottom: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {post.repostOf.user}
                      {isRepostVerified && <VerifiedBadge />}
                    </div>

                    {post.repostOf.text && (
                      <p
                        style={{
                          fontFamily: 'Barlow',
                          fontSize: 15,
                          color: '#e7e9ea',
                          lineHeight: 1.5,
                          margin: '0 0 8px',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {post.repostOf.text}
                      </p>
                    )}

                    {post.repostOf.imageUrl && (
                      <div
                        style={{
                          borderRadius: 12,
                          overflow: 'hidden',
                          border: '1px solid #2f3336',
                        }}
                      >
                        <img
                          src={post.repostOf.imageUrl}
                          alt=""
                          style={{
                            width: '100%',
                            maxHeight: 300,
                            objectFit: 'cover',
                            display: 'block',
                      }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Ações */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    maxWidth: 320,
                    marginTop: 4,
                  }}
                >
                  <button
                    onClick={() =>
                      setCommentingOn(commentingOn === post.id ? null : post.id)
                    }
                    style={{ ...iconBtnStyle('#1d9bf0', commentingOn === post.id), flex: 'none' }}
                  >
                    <div className="action-circle">{Ico.comment()}</div>
                    <span>{post.comments?.length || 0}</span>
                  </button>

                  <button
                    onClick={() =>
                      setRepostingOn(repostingOn?.id === post.id ? null : post)
                    }
                    style={{ ...iconBtnStyle('#00ba7c', repostingOn?.id === post.id), flex: 'none' }}
                  >
                    <div className="action-circle">{Ico.repost(repostingOn?.id === post.id ? '#00ba7c' : '#71767b')}</div>
                    <span>0</span>
                  </button>

                  <button
                    onClick={() => curtir(post)}
                    style={{ ...iconBtnStyle('#f91880', !!liked), flex: 'none' }}
                  >
                    <div className="action-circle">{Ico.heart(!!liked)}</div>
                    <span style={{ color: liked ? '#f91880' : '#71767b' }}>{post.likes?.length || 0}</span>
                  </button>

                  <div style={{ width: 20 }} />
                </div>

                {/* Comentários */}
                {post.comments?.length > 0 && (
                  <div
                    style={{
                      marginTop: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    {post.comments.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          gap: 10,
                          alignItems: 'flex-start',
                        }}
                      >
                        <img
                          src={c.photo}
                          alt=""
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontFamily: 'Barlow', fontWeight: 700, fontSize: 14, color: '#fff' }}>
                              {c.user}
                            </span>
                          </div>
                          <p style={{ fontFamily: 'Barlow', fontSize: 14, color: '#e7e9ea', lineHeight: 1.4 }}>
                            {c.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input comentário */}
                {commentingOn === post.id && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      marginTop: 16,
                      alignItems: 'flex-start',
                    }}
                  >
                    <img
                      src={currentUser.photo}
                      alt=""
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <AutoTextarea
                        value={commentText}
                        onChange={setCommentText}
                        placeholder="Poste sua resposta"
                        style={{
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          fontFamily: 'Barlow',
                          fontSize: 16,
                          color: '#fff',
                          lineHeight: 1.4,
                          padding: '6px 0',
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                        <button
                          onClick={() => comentar(post.id)}
                          disabled={!commentText.trim()}
                          style={{
                            background: '#F07830',
                            border: 'none',
                            borderRadius: 999,
                            padding: '6px 16px',
                            fontFamily: 'Barlow',
                            fontWeight: 700,
                            fontSize: 13,
                            color: '#fff',
                            opacity: commentText.trim() ? 1 : 0.5,
                          }}
                        >
                          Responder
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Modal repost */}
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
              padding: 16,
              width: '100%',
              maxWidth: 600,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <button onClick={() => setRepostingOn(null)} style={{ color: '#fff', fontSize: 24 }}>×</button>
              <button
                onClick={repostar}
                style={{
                  background: '#F07830',
                  border: 'none',
                  color: '#fff',
                  borderRadius: 999,
                  padding: '8px 16px',
                  fontFamily: 'Barlow',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Repostar
              </button>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <img
                src={currentUser.photo}
                alt=""
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <AutoTextarea
                  value={repostText}
                  onChange={setRepostText}
                  placeholder="Adicione um comentário..."
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontFamily: 'Barlow',
                    fontSize: 18,
                    color: '#fff',
                    lineHeight: 1.5,
                    padding: '4px 0 16px',
                  }}
                />

                <div
                  style={{
                    border: '1px solid #2f3336',
                    borderRadius: 16,
                    padding: '12px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'Barlow',
                      fontWeight: 700,
                      fontSize: 15,
                      color: '#fff',
                      marginBottom: 4,
                    }}
                  >
                    {repostingOn.user}
                  </div>

                  {repostingOn.text && (
                    <p
                      style={{
                        fontFamily: 'Barlow',
                        fontSize: 15,
                        color: '#e7e9ea',
                        lineHeight: 1.5,
                        margin: '0 0 8px',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {repostingOn.text}
                    </p>
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
                          maxHeight: 200,
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
        .post-action-hover:hover {
          background: rgba(240, 120, 48, 0.1);
          border-radius: 50%;
        }
        .action-circle {
          width: 34px; height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: 0.2s;
        }
        button:hover .action-circle {
          background: rgba(240, 120, 48, 0.1);
        }
      `}</style>
    </div>
  );
}
