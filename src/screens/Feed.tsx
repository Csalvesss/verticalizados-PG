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
import { tempoRelativo } from '../constants';
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
      repostOf: {
        user: repostingOn.user,
        text: repostingOn.text,
        imageUrl: repostingOn.imageUrl || null,
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

  return (
    <div
      className="fade"
      style={{
        background: '#000',
        minHeight: '100%',
        color: '#fff',
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid #202327',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <button style={s.backBtn} onClick={() => goTo('home')}>
          {Ico.back()}
        </button>

        <div
          style={{
            fontFamily: 'Barlow Condensed',
            fontWeight: 700,
            fontSize: 20,
            color: '#fff',
            letterSpacing: 0.6,
          }}
        >
          Feed
        </div>
      </div>

      {/* Composer */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #202327',
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <img
            src={currentUser.photo}
            alt=""
            style={{
              width: 42,
              height: 42,
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
                padding: '4px 0 8px',
              }}
            />

            {img && (
              <div
                style={{
                  position: 'relative',
                  marginTop: 8,
                  borderRadius: 18,
                  overflow: 'hidden',
                  border: '1px solid #2f3336',
                }}
              >
                <img
                  src={img}
                  alt=""
                  style={{
                    width: '100%',
                    maxHeight: 320,
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />

                <button
                  onClick={() => setImg(null)}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(15,20,25,0.85)',
                    color: '#fff',
                    fontSize: 18,
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
                borderTop: '1px solid #202327',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => imgRef.current?.click()}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#F07830',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: 'Barlow',
                    fontSize: 13,
                    padding: 0,
                  }}
                >
                  {Ico.image()}
                  <span>Foto</span>
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
                    padding: '10px 18px',
                    fontFamily: 'Barlow',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: canPost && !posting ? 'pointer' : 'default',
                    background: canPost && !posting ? '#F07830' : '#3a2314',
                    color: canPost && !posting ? '#fff' : '#8c6239',
                    transition: '0.2s ease',
                  }}
                >
                  {posting ? 'Publicando...' : 'Postar'}
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

        return (
          <div
            key={post.id}
            style={{
              padding: '14px 16px 12px',
              borderBottom: '1px solid #202327',
              transition: 'background 0.2s ease',
            }}
          >
            {post.repostOf && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8,
                  paddingLeft: 54,
                  fontFamily: 'Barlow',
                  fontSize: 12,
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
                  width: 42,
                  height: 42,
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
                    alignItems: 'flex-start',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 6,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'Barlow',
                        fontWeight: 700,
                        fontSize: 15,
                        color: '#fff',
                      }}
                    >
                      {post.user}
                    </span>

                    <span
                      style={{
                        fontFamily: 'Barlow',
                        fontSize: 13,
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
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#71767b',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                      }}
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
                      lineHeight: 1.55,
                      margin: '4px 0 10px',
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
                      borderRadius: 18,
                      border: '1px solid #2f3336',
                      marginBottom: 10,
                    }}
                  >
                    <img
                      src={post.imageUrl}
                      alt=""
                      style={{
                        width: '100%',
                        maxHeight: 360,
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
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'Barlow',
                        fontWeight: 700,
                        fontSize: 14,
                        color: '#fff',
                        marginBottom: 4,
                      }}
                    >
                      {post.repostOf.user}
                    </div>

                    {post.repostOf.text && (
                      <p
                        style={{
                          fontFamily: 'Barlow',
                          fontSize: 14,
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
                            maxHeight: 220,
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
                    gap: 6,
                    marginTop: 2,
                    marginBottom: 4,
                  }}
                >
                  <button
                    onClick={() => curtir(post)}
                    style={iconBtnStyle('#F07830', !!liked)}
                  >
                    {Ico.heart(!!liked)}
                    <span>{post.likes?.length || 0}</span>
                  </button>

                  <button
                    onClick={() =>
                      setCommentingOn(commentingOn === post.id ? null : post.id)
                    }
                    style={iconBtnStyle('#1d9bf0', commentingOn === post.id)}
                  >
                    {Ico.comment()}
                    <span>{post.comments?.length || 0}</span>
                  </button>

                  <button
                    onClick={() =>
                      setRepostingOn(repostingOn?.id === post.id ? null : post)
                    }
                    style={iconBtnStyle('#00ba7c', repostingOn?.id === post.id)}
                  >
                    {Ico.repost(repostingOn?.id === post.id ? '#00ba7c' : '#71767b')}
                  </button>
                </div>

                {/* Comentários */}
                {post.comments?.length > 0 && (
                  <div
                    style={{
                      marginTop: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    {post.comments.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          gap: 8,
                          alignItems: 'flex-start',
                        }}
                      >
                        <img
                          src={c.photo}
                          alt=""
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                        />

                        <div
                          style={{
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'Barlow',
                              fontWeight: 700,
                              fontSize: 13,
                              color: '#fff',
                              marginRight: 6,
                            }}
                          >
                            {c.user}
                          </span>

                          <span
                            style={{
                              fontFamily: 'Barlow',
                              fontSize: 13,
                              color: '#e7e9ea',
                              wordBreak: 'break-word',
                            }}
                          >
                            {c.text}
                          </span>
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
                      gap: 8,
                      marginTop: 10,
                      alignItems: 'center',
                    }}
                  >
                    <img
                      src={currentUser.photo}
                      alt=""
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />

                    <input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && comentar(post.id)}
                      placeholder="Poste sua resposta"
                      autoFocus
                      style={{
                        flex: 1,
                        background: '#16181c',
                        border: '1px solid #2f3336',
                        borderRadius: 999,
                        padding: '10px 14px',
                        fontFamily: 'Barlow',
                        fontSize: 14,
                        color: '#fff',
                        outline: 'none',
                      }}
                    />

                    <button
                      onClick={() => comentar(post.id)}
                      style={{
                        background: '#F07830',
                        border: 'none',
                        borderRadius: '50%',
                        width: 34,
                        height: 34,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
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
            background: 'rgba(0,0,0,0.75)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setRepostingOn(null)}
        >
          <div
            style={{
              background: '#000',
              borderRadius: '22px 22px 0 0',
              padding: '18px 16px 34px',
              width: '100%',
              maxWidth: 520,
              borderTop: '1px solid #202327',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontFamily: 'Barlow',
                fontWeight: 700,
                fontSize: 18,
                color: '#fff',
                marginBottom: 14,
              }}
            >
              Repostar
            </div>

            <div
              style={{
                border: '1px solid #2f3336',
                borderRadius: 16,
                padding: '12px',
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontFamily: 'Barlow',
                  fontWeight: 700,
                  fontSize: 14,
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
                    fontSize: 14,
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
                      maxHeight: 180,
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <img
                src={currentUser.photo}
                alt=""
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />

              <AutoTextarea
                value={repostText}
                onChange={setRepostText}
                placeholder="Adicione um comentário... (opcional)"
                style={{
                  flex: 1,
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'Barlow',
                  fontSize: 16,
                  color: '#fff',
                  lineHeight: 1.5,
                  padding: '4px 0',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-end',
                marginTop: 18,
              }}
            >
              <button
                onClick={() => setRepostingOn(null)}
                style={{
                  background: 'transparent',
                  border: '1px solid #2f3336',
                  color: '#fff',
                  borderRadius: 999,
                  padding: '10px 18px',
                  fontFamily: 'Barlow',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>

              <button
                onClick={repostar}
                style={{
                  background: '#F07830',
                  border: 'none',
                  color: '#fff',
                  borderRadius: 999,
                  padding: '10px 18px',
                  fontFamily: 'Barlow',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Repostar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}