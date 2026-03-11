import { useState, useRef, useEffect } from 'react';
import { getAuth, signOut, updateProfile, deleteUser } from 'firebase/auth';
import { doc, setDoc, deleteDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { Ico } from '../icons';
import { Avatar } from '../components/Avatar';
import type { CurrentUser, Screen, Post, UserProfile } from '../types';

function toUsername(name: string): string {
  return '@' + (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '');
}

const auth = getAuth();

interface Props {
  currentUser: CurrentUser;
  isAdmin: boolean;
  posts: Post[];
  uid: string;
  goTo: (sc: Screen) => void;
  onOpenProfile?: (userId: string, userName: string) => void;
}

type Tab = 'posts' | 'curtidos';

export function PerfilScreen({
  currentUser,
  isAdmin,
  posts,
  uid,
  goTo,
  onOpenProfile,
}: Props) {
  const [tab, setTab] = useState<Tab>('posts');
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followListModal, setFollowListModal] = useState<'seguindo' | 'seguidores' | null>(null);
  const [followListUsers, setFollowListUsers] = useState<UserProfile[]>([]);
  const [followListLoading, setFollowListLoading] = useState(false);
  const [savedUsername, setSavedUsername] = useState('');

  useEffect(() => {
    getDoc(doc(db, 'follows', uid)).then(snap => {
      if (snap.exists()) setFollowingCount((snap.data().following || []).length);
    });
    getDocs(collection(db, 'follows')).then(snap => {
      let count = 0;
      snap.docs.forEach(d => { if ((d.data().following || []).includes(uid)) count++; });
      setFollowersCount(count);
    });
    // Load custom username
    getDoc(doc(db, 'users', uid)).then(snap => {
      if (snap.exists() && snap.data().username) setSavedUsername(snap.data().username);
    });
  }, [uid]);

  const displayUsername = savedUsername ? '@' + savedUsername : toUsername(currentUser.fullName);

  async function openFollowList(type: 'seguindo' | 'seguidores') {
    setFollowListModal(type);
    setFollowListLoading(true);
    setFollowListUsers([]);
    try {
      let uids: string[] = [];
      if (type === 'seguindo') {
        const snap = await getDoc(doc(db, 'follows', uid));
        uids = snap.exists() ? (snap.data().following || []) : [];
      } else {
        const snap = await getDocs(collection(db, 'follows'));
        snap.docs.forEach(d => {
          if ((d.data().following || []).includes(uid)) uids.push(d.id);
        });
      }
      const profiles: UserProfile[] = [];
      for (const id of uids) {
        const p = await getDoc(doc(db, 'users', id));
        if (p.exists()) profiles.push({ uid: id, ...p.data() } as UserProfile);
      }
      setFollowListUsers(profiles);
    } finally {
      setFollowListLoading(false);
    }
  }
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState(currentUser.fullName);
  const [editUsername, setEditUsername] = useState('');
  const [editPhoto, setEditPhoto] = useState(currentUser.photo);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const meusPosts = posts.filter(p => p.userId === uid);
  const curtidos = posts.filter(p => p.likes?.includes(uid));
  const gridPosts = tab === 'posts' ? meusPosts : curtidos;

  async function handlePhotoUpload(file: File) {
    setUploading(true);
    setSaveError('');
    try {
      // Compress image client-side to avoid Firebase Storage rules issues
      const dataUrl = await compressImage(file, 200, 0.75);
      // Save compressed photo to Firestore (avoids Storage dependency)
      await setDoc(doc(db, 'users', uid), { photoData: dataUrl }, { merge: true });
      setEditPhoto(dataUrl);
    } catch (e: any) {
      setSaveError('Erro ao processar foto: ' + (e?.message || 'tente novamente'));
    } finally {
      setUploading(false);
    }
  }

  function compressImage(file: File, maxSize: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          if (w > h) { h = Math.round(maxSize * h / w); w = maxSize; }
          else { w = Math.round(maxSize * w / h); h = maxSize; }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('Imagem inválida'));
        img.src = ev.target!.result as string;
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  }

  async function salvarPerfil() {
    if (!editName.trim()) return;
    setSaving(true);
    setSaveError('');
    try {
      const user = auth.currentUser;
      if (user) {
        // Only update displayName in Firebase Auth (photoURL has size limit)
        await updateProfile(user, { displayName: editName.trim() });
        // Save photo + name to Firestore (no size limit for photoData)
        const cleanUsername = editUsername.trim().toLowerCase().replace(/[^a-z0-9._]/g, '');
        await setDoc(doc(db, 'users', uid), {
          fullName: editName.trim(),
          name: editName.trim().split(' ')[0],
          ...(editPhoto !== currentUser.photo ? { photoData: editPhoto } : {}),
          ...(cleanUsername ? { username: cleanUsername } : {}),
        }, { merge: true });
      }
      setShowEdit(false);
      window.location.reload();
    } catch (e: any) {
      setSaveError('Erro ao salvar: ' + (e?.message || 'tente novamente'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ background: '#000', minHeight: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px',
        borderBottom: '1px solid #1a1a1a', position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)',
      }}>
        <button onClick={() => goTo('home')} style={{
          padding: 6, borderRadius: '50%', background: 'transparent',
          border: 'none', cursor: 'pointer', display: 'flex', marginRight: 8,
        }}>{Ico.back()}</button>
        <span style={{
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
          fontSize: 18, color: '#fff', letterSpacing: 0.5, flex: 1,
        }}>{currentUser.name}</span>
        {isAdmin && (
          <button onClick={() => goTo('admin')} style={{
            padding: 8, borderRadius: '50%', background: 'transparent',
            border: 'none', cursor: 'pointer', display: 'flex',
          }}>{Ico.admin('#71767b')}</button>
        )}
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 16 }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%', padding: 3, flexShrink: 0,
            background: 'linear-gradient(135deg, #F07830 0%, #D4621A 60%, #ff9a55 100%)',
          }}>
            <img src={currentUser.photo} alt="" style={{
              width: '100%', height: '100%', borderRadius: '50%',
              objectFit: 'cover', border: '2.5px solid #000', display: 'block',
            }} />
          </div>
          <div style={{ display: 'flex', gap: 20, flex: 1, justifyContent: 'center' }}>
            {[
              { n: meusPosts.length, label: 'Posts', clickable: false },
              { n: followingCount, label: 'Seguindo', clickable: true, type: 'seguindo' as const },
              { n: followersCount, label: 'Seguidores', clickable: true, type: 'seguidores' as const },
            ].map(item => (
              <div
                key={item.label}
                style={{ textAlign: 'center', cursor: item.clickable ? 'pointer' : 'default' }}
                onClick={() => item.clickable && openFollowList(item.type!)}
              >
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 22, color: item.clickable ? '#F07830' : '#fff', lineHeight: 1.2 }}>{item.n}</div>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#71767b', marginTop: 1 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, color: '#fff' }}>{currentUser.fullName}</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#555' }}>{displayUsername}</div>
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(240,120,48,0.1)', border: '1px solid rgba(240,120,48,0.25)',
          borderRadius: 8, padding: '5px 10px', marginBottom: 16,
        }}>
          <div style={{ width: 14, height: 14, background: '#F07830', borderRadius: 3, flexShrink: 0 }} />
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: 1, color: '#F07830' }}>
            VERTICALIZADOS · MJA ESPLANADA
          </span>
        </div>

        {isAdmin && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#16181c', border: '1px solid #2f3336',
            borderRadius: 8, padding: '8px 12px', marginBottom: 12,
          }}>
            {Ico.admin('#F07830')}
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: 1, color: '#F07830' }}>
              ADMINISTRADOR
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => { setEditName(currentUser.fullName); setEditUsername(savedUsername); setEditPhoto(currentUser.photo); setSaveError(''); setShowEdit(true); }}
            style={{
              flex: 1, padding: '8px 16px', borderRadius: 8,
              border: '1px solid #2f3336', background: 'transparent',
              color: '#e7e9ea', fontFamily: 'Barlow, sans-serif',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >Editar perfil</button>
          <button onClick={() => signOut(auth)} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #331111',
            background: 'transparent', color: '#f4212e',
            fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>{Ico.logout()} Sair</button>
        </div>

        <button
          onClick={async () => {
            if (!window.confirm('Tem certeza que deseja excluir sua conta? Esta ação é irreversível.')) return;
            if (!window.confirm('ÚLTIMA CHANCE: Todos os seus dados serão apagados permanentemente.')) return;
            try {
              const user = auth.currentUser;
              if (user) {
                await deleteDoc(doc(db, 'users', uid));
                await deleteUser(user);
              }
            } catch (e: any) {
              alert('Erro ao excluir conta: ' + (e?.message || 'Faça login novamente e tente de novo.'));
            }
          }}
          style={{
            width: '100%', padding: '10px', borderRadius: 8,
            border: '1px solid #220000', background: 'transparent',
            color: '#661111', fontFamily: 'Barlow, sans-serif',
            fontWeight: 500, fontSize: 11, cursor: 'pointer', marginBottom: 20,
          }}
        >Excluir minha conta</button>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a',
        position: 'sticky', top: 49, background: '#000', zIndex: 40,
      }}>
        {([
          { id: 'posts' as Tab, label: '⊞  POSTS' },
          { id: 'curtidos' as Tab, label: '♥  CURTIDOS' },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '12px 0', background: 'transparent', border: 'none',
            cursor: 'pointer', position: 'relative',
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
            fontSize: 12, letterSpacing: 1.5,
            color: tab === t.id ? '#F07830' : '#444', transition: 'color 0.2s',
          }}>
            {t.label}
            {tab === t.id && (
              <span style={{
                position: 'absolute', bottom: 0, left: '50%',
                transform: 'translateX(-50%)', width: 40, height: 2,
                background: '#F07830', display: 'block', borderRadius: 99,
              }} />
            )}
          </button>
        ))}
      </div>

      {/* Posts grid */}
      {gridPosts.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 16px', gap: 12 }}>
          <div style={{ fontSize: 40 }}>📷</div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 700, color: '#555', letterSpacing: 0.5 }}>
            {tab === 'posts' ? 'Nenhum post ainda' : 'Nenhuma curtida ainda'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, padding: 2 }}>
          {gridPosts.map(post => (
            <div key={post.id} style={{
              aspectRatio: '1', overflow: 'hidden', position: 'relative',
              background: post.imageUrl ? '#111' : 'rgba(240,120,48,0.08)',
            }}>
              {post.imageUrl ? (
                <img src={post.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                  <span style={{
                    fontFamily: 'Barlow, sans-serif', fontSize: 10, color: '#777',
                    textAlign: 'center', lineHeight: 1.4, overflow: 'hidden',
                    display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' as never,
                  }}>{post.text}</span>
                </div>
              )}
              {(post.likes?.length ?? 0) > 0 && (
                <div style={{ position: 'absolute', bottom: 4, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
                  <div style={{ background: 'rgba(0,0,0,0.65)', borderRadius: 99, padding: '1px 7px', fontSize: 10, color: '#fff', fontFamily: 'Barlow, sans-serif' }}>
                    ♥ {post.likes!.length}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ height: 80 }} />

      {/* Modal Seguindo / Seguidores */}
      {followListModal && (
        <div onClick={() => setFollowListModal(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#0d0d0d', borderRadius: '20px 20px 0 0',
            width: '100%', maxWidth: 600, maxHeight: '70vh',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            border: '1px solid #2f3336', borderBottom: 'none',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', padding: '14px 16px 12px',
              borderBottom: '1px solid #1e1e1e',
            }}>
              <button onClick={() => setFollowListModal(null)} style={{
                color: '#888', fontSize: 22, background: 'transparent',
                border: 'none', cursor: 'pointer', lineHeight: 1, padding: '0 4px',
              }}>×</button>
              <span style={{
                flex: 1, textAlign: 'center', fontWeight: 700, color: '#e7e9ea',
                fontSize: 15, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: 0.5,
              }}>
                {followListModal === 'seguindo' ? 'SEGUINDO' : 'SEGUIDORES'}
              </span>
              <div style={{ width: 28 }} />
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {followListLoading && (
                <div style={{ padding: 32, textAlign: 'center', color: '#555', fontFamily: 'Barlow', fontSize: 14 }}>
                  Carregando...
                </div>
              )}
              {!followListLoading && followListUsers.length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', color: '#555', fontFamily: 'Barlow', fontSize: 14 }}>
                  {followListModal === 'seguindo' ? 'Você não segue ninguém ainda.' : 'Ninguém te segue ainda.'}
                </div>
              )}
              {followListUsers.map(u => {
                const displayName = u.fullName || u.name || 'Membro';
                return (
                  <div key={u.uid}
                    onClick={() => {
                      setFollowListModal(null);
                      onOpenProfile?.(u.uid, displayName);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', borderBottom: '1px solid #111',
                      cursor: onOpenProfile ? 'pointer' : 'default',
                    }}
                  >
                    <Avatar src={u.photo} name={displayName} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 15, color: '#fff' }}>
                        {displayName}
                      </div>
                      <div style={{ fontFamily: 'Barlow', fontSize: 12, color: '#555' }}>
                        {toUsername(displayName)}
                      </div>
                    </div>
                    {onOpenProfile && (
                      <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: '#555' }}>
                        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Perfil */}
      {showEdit && (
        <div onClick={() => setShowEdit(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#111', borderRadius: '20px 20px 0 0',
            padding: '24px 20px 40px', width: '100%', maxWidth: 480,
            borderTop: '1px solid #2f3336',
          }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#F07830', marginBottom: 24 }}>
              EDITAR PERFIL
            </div>

            {/* Clickable photo avatar */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 72, height: 72, borderRadius: '50%', padding: 3,
                  background: 'linear-gradient(135deg, #F07830, #D4621A)',
                  cursor: 'pointer', position: 'relative',
                }}
              >
                <img
                  src={editPhoto || currentUser.photo} alt=""
                  onError={e => { (e.target as HTMLImageElement).src = currentUser.photo; }}
                  style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    objectFit: 'cover', border: '2px solid #111', display: 'block',
                    opacity: uploading ? 0.5 : 1,
                  }}
                />
                <div style={{
                  position: 'absolute', bottom: -2, right: -2,
                  background: '#F07830', borderRadius: '50%',
                  width: 24, height: 24, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  border: '2px solid #111',
                }}>
                  {Ico.camera('#fff')}
                </div>
                {uploading && (
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.5)',
                  }}>
                    <span style={{ fontFamily: 'Barlow', fontSize: 10, color: '#fff' }}>...</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file);
                }}
              />
            </div>
            <div style={{ fontFamily: 'Barlow', fontSize: 11, color: '#444', textAlign: 'center', marginBottom: 16 }}>
              Toque na foto para alterar
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'Barlow', fontSize: 12, color: '#666', marginBottom: 6 }}>Nome</div>
              <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Seu nome" style={{
                width: '100%', background: '#1a1a1a', border: '1px solid #2f3336',
                borderRadius: 10, padding: '10px 14px', fontFamily: 'Barlow',
                fontSize: 15, color: '#fff', outline: 'none', boxSizing: 'border-box',
              }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'Barlow', fontSize: 12, color: '#666', marginBottom: 6 }}>Nome de usuário</div>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  fontFamily: 'Barlow', fontSize: 15, color: '#555', pointerEvents: 'none',
                }}>@</span>
                <input
                  value={editUsername}
                  onChange={e => {
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 24);
                    setEditUsername(val);
                  }}
                  placeholder={toUsername(editName).slice(1) || 'nomedousuario'}
                  style={{
                    width: '100%', background: '#1a1a1a', border: '1px solid #2f3336',
                    borderRadius: 10, padding: '10px 14px 10px 28px', fontFamily: 'Barlow',
                    fontSize: 15, color: '#fff', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ fontFamily: 'Barlow', fontSize: 11, color: '#444', marginTop: 5 }}>
                Letras minúsculas, números, pontos e underscores. Máx. 24 caracteres.
              </div>
            </div>

            {saveError && <div style={{ fontFamily: 'Barlow', fontSize: 12, color: '#f4212e', marginBottom: 12 }}>{saveError}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowEdit(false)} style={{
                flex: 1, background: 'transparent', border: '1px solid #333', color: '#888',
                borderRadius: 50, padding: '12px', fontFamily: 'Barlow Condensed',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 1,
              }}>CANCELAR</button>
              <button onClick={salvarPerfil} disabled={saving || uploading || !editName.trim()} style={{
                flex: 2, background: editName.trim() && !uploading ? '#F07830' : '#2a1a0a',
                border: 'none', color: editName.trim() && !uploading ? '#fff' : '#7a5a3a',
                borderRadius: 50, padding: '12px', fontFamily: 'Barlow Condensed',
                fontWeight: 700, fontSize: 13, cursor: saving ? 'default' : 'pointer', letterSpacing: 1,
              }}>{saving ? 'SALVANDO...' : uploading ? 'ENVIANDO FOTO...' : 'SALVAR'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
