import { useState, useRef, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
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

function AutoTextarea({ value, onChange, placeholder, style }: { value: string; onChange: (v: string) => void; placeholder: string; style?: React.CSSProperties }) {
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
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      style={{ resize: 'none', overflow: 'hidden', ...style }}
    />
  );
}

export function FeedScreen({ posts, loading, currentUser, isAdmin, uid, goTo }: Props) {
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
    const t = text, i = img;
    setText(''); setImg(null);
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
    setPosting(false);
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
        text: commentText,
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
      text: repostText,
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
    r.onload = ev => { if (ev.target?.result) setImg(ev.target.result as string); };
    r.readAsDataURL(f);
  };

  const canPost = text.trim().length > 0 || !!img;

  return (
    <div className="fade" style={{ background: '#111', minHeight: '100%' }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(17,17,17,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #2f2f2f', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button style={s.backBtn} onClick={() => goTo('home')}>{Ico.back()}</button>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, color: '#fff', letterSpacing: 2 }}>FEED DO PG</div>
      </div>

      {/* Caixa de post */}
      <div style={{ borderBottom: '1px solid #2f2f2f', padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <img src={currentUser.photo} style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, border: '2px solid #F07830', objectFit: 'cover' }} alt="" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <AutoTextarea
              value={text}
              onChange={setText}
              placeholder="Compartilhe algo com o PG..."
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Barlow', fontSize: 16, color: '#fff', lineHeight: 1.5, padding: '4px 0', marginBottom: 4 }}
            />
            {img && (
              <div style={{ position: 'relative', marginTop: 8, borderRadius: 16, overflow: 'hidden' }}>
                <img src={img} style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block' }} alt="" />
                <button onClick={() => setImg(null)} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid #2f2f2f' }}>
              <button onClick={() => imgRef.current?.click()} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#F07830', fontFamily: 'Barlow', fontSize: 13 }}>
                {Ico.image()} <span style={{ color: '#F07830' }}>Foto</span>
              </button>
              <input ref={imgRef} type="file" accept="image/*" onChange={handleImg} style={{ display: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {text.length > 0 && (
                  <span style={{ fontFamily: 'Barlow', fontSize: 12, color: text.length > 280 ? '#e53935' : '#555' }}>{text.length}/280</span>
                )}
                <button onClick={postar} disabled={!canPost || posting} style={{ background: canPost ? '#F07830' : '#2a1a0a', color: canPost ? '#fff' : '#7a5a3a', border: 'none', borderRadius: 50, padding: '8px 22px', fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 14, letterSpacing: 1, cursor: canPost ? 'pointer' : 'default', transition: 'all 0.2s' }}>
                  {posting ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de posts */}
      {loading && <div style={s.empty}>Carregando...</div>}
      {!loading && posts.length === 0 && <div style={s.empty}>Nenhum post ainda. Seja o primeiro! 🙌</div>}

      {posts.map(post => {
        const liked = post.likes?.includes(uid);
        const podeApagar = post.userId === uid || isAdmin;

        return (
          <div key={post.id} style={{ borderBottom: '1px solid #2f2f2f', padding: '14px 16px' }}>

            {post.repostOf && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, paddingLeft: 54, fontFamily: 'Barlow', fontSize: 12, color: '#555' }}>
                {Ico.repost('#555')} <span>{post.user} repostou</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <img src={post.photo} style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, objectFit: 'cover', border: '1.5px solid #2a2a2a' }} alt="" />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' as const }}>
                    <span style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 15, color: '#fff' }}>{post.user}</span>
                    <span style={{ fontFamily: 'Barlow', fontSize: 13, color: '#555' }}>· {tempoRelativo(post.createdAt)}</span>
                  </div>
                  {podeApagar && (
                    <button onClick={() => deletar(post.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#444', padding: '2px 4px', display: 'flex', alignItems: 'center' }}>{Ico.trash()}</button>
                  )}
                </div>

                {post.text && (
                  <p style={{ fontFamily: 'Barlow', fontSize: 15, color: '#e8e8e8', lineHeight: 1.65, margin: '4px 0 8px', wordBreak: 'break-word' as const }}>{post.text}</p>
                )}

                {post.imageUrl && !post.repostOf && (
                  <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 10, border: '1px solid #2f2f2f' }}>
                    <img src={post.imageUrl} style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }} alt="" />
                  </div>
                )}

                {post.repostOf && (
                  <div style={{ border: '1px solid #2f2f2f', borderRadius: 14, padding: '12px 14px', marginBottom: 10, background: '#181818' }}>
                    <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 13, color: '#777', marginBottom: 4 }}>{post.repostOf.user}</div>
                    {post.repostOf.text && (
                      <p style={{ fontFamily: 'Barlow', fontSize: 14, color: '#ccc', lineHeight: 1.6, margin: '0 0 8px', wordBreak: 'break-word' as const }}>{post.repostOf.text}</p>
                    )}
                    {(post.repostOf as any).imageUrl && (
                      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #2f2f2f' }}>
                        <img src={(post.repostOf as any).imageUrl} style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} alt="" />
                      </div>
                    )}
                  </div>
                )}

                {/* Ações */}
                <div style={{ display: 'flex', marginTop: 8 }}>
                  <button onClick={() => curtir(post)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', cursor: 'pointer', color: liked ? '#F07830' : '#555', fontFamily: 'Barlow', fontSize: 13, padding: '6px 0' }}>
                    {Ico.heart(!!liked)} <span>{post.likes?.length || 0}</span>
                  </button>
                  <button onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', cursor: 'pointer', color: commentingOn === post.id ? '#F07830' : '#555', fontFamily: 'Barlow', fontSize: 13, padding: '6px 0' }}>
                    {Ico.comment()} <span>{post.comments?.length || 0}</span>
                  </button>
                  <button onClick={() => setRepostingOn(repostingOn?.id === post.id ? null : post)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', cursor: 'pointer', color: repostingOn?.id === post.id ? '#1DB954' : '#555', fontFamily: 'Barlow', fontSize: 13, padding: '6px 0' }}>
                    {Ico.repost(repostingOn?.id === post.id ? '#1DB954' : '#555')}
                  </button>
                </div>

                {/* Comentários */}
                {post.comments?.length > 0 && (
                  <div style={{ marginTop: 8, borderTop: '1px solid #222', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {post.comments.map((c, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <img src={c.photo} style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0 }} alt="" />
                        <div style={{ background: '#1a1a1a', borderRadius: 12, padding: '6px 12px', flex: 1, minWidth: 0 }}>
                          <span style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 12, color: '#666' }}>{c.user} </span>
                          <span style={{ fontFamily: 'Barlow', fontSize: 13, color: '#ccc', wordBreak: 'break-word' as const }}>{c.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input comentar */}
                {commentingOn === post.id && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                    <img src={currentUser.photo} style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} alt="" />
                    <input
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && comentar(post.id)}
                      placeholder="Responder..."
                      autoFocus
                      style={{ flex: 1, background: '#1a1a1a', border: '1px solid #333', borderRadius: 50, padding: '8px 16px', fontFamily: 'Barlow', fontSize: 14, color: '#fff', outline: 'none' }}
                    />
                    <button onClick={() => comentar(post.id)} style={{ background: '#F07830', border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setRepostingOn(null)}>
          <div style={{ background: '#111', borderRadius: '20px 20px 0 0', padding: '20px 16px 36px', width: '100%', maxWidth: 480, borderTop: '1px solid #2f2f2f' }} onClick={e => e.stopPropagation()}>

            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#F07830', marginBottom: 14 }}>REPOSTAR</div>

            <div style={{ border: '1px solid #2f2f2f', borderRadius: 14, padding: '12px 14px', marginBottom: 14, background: '#1a1a1a' }}>
              <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 13, color: '#777', marginBottom: 4 }}>{repostingOn.user}</div>
              {repostingOn.text && <p style={{ fontFamily: 'Barlow', fontSize: 14, color: '#ccc', lineHeight: 1.5, margin: '0 0 6px' }}>{repostingOn.text}</p>}
              {repostingOn.imageUrl && (
                <div style={{ borderRadius: 10, overflow: 'hidden' }}>
                  <img src={repostingOn.imageUrl} style={{ width: '100%', maxHeight: 160, objectFit: 'cover', display: 'block' }} alt="" />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <img src={currentUser.photo} style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} alt="" />
              <AutoTextarea
                value={repostText}
                onChange={setRepostText}
                placeholder="Adicione um comentário... (opcional)"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Barlow', fontSize: 15, color: '#fff', lineHeight: 1.5, padding: '4px 0', width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setRepostingOn(null)} style={{ background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: 50, padding: '9px 22px', fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={repostar} style={{ background: '#F07830', border: 'none', color: '#fff', borderRadius: 50, padding: '9px 22px', fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Repostar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
