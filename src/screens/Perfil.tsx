import { useState, useRef, useEffect } from 'react';
import { getAuth, signOut, updateProfile, deleteUser } from 'firebase/auth';
import { doc, setDoc, deleteDoc, getDoc, getDocs, collection, query, where, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Ico } from '../icons';
import { Avatar } from '../components/Avatar';
import { useChurch } from '../contexts/ChurchContext';
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

const IcoPin = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
  </svg>
);

const IcoLink = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
  </svg>
);

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
  const { selectedChurch } = useChurch();
  const [followListModal, setFollowListModal] = useState<'seguindo' | 'seguidores' | null>(null);
  const [followListUsers, setFollowListUsers] = useState<UserProfile[]>([]);
  const [followListLoading, setFollowListLoading] = useState(false);
  const [savedUsername, setSavedUsername] = useState('');
  const [bio, setBio] = useState('');
  const [link, setLink] = useState('');
  const [pinnedPostId, setPinnedPostId] = useState('');

  useEffect(() => {
    getDoc(doc(db, 'follows', uid)).then(snap => {
      if (snap.exists()) setFollowingCount((snap.data().following || []).length);
    });
    getDocs(collection(db, 'follows')).then(snap => {
      let count = 0;
      snap.docs.forEach(d => { if ((d.data().following || []).includes(uid)) count++; });
      setFollowersCount(count);
    });
    getDoc(doc(db, 'users', uid)).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.username) setSavedUsername(d.username);
        if (d.bio) setBio(d.bio);
        if (d.link) setLink(d.link);
        if (d.pinnedPostId) setPinnedPostId(d.pinnedPostId);
      }
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
      const snaps = await Promise.all(uids.map(id => getDoc(doc(db, 'users', id))));
      const profiles: UserProfile[] = snaps
        .map((p, i) => p.exists() ? ({ uid: uids[i], ...p.data() } as UserProfile) : null)
        .filter(Boolean) as UserProfile[];
      setFollowListUsers(profiles);
    } finally {
      setFollowListLoading(false);
    }
  }

  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editName, setEditName] = useState(currentUser.fullName);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editPhoto, setEditPhoto] = useState(currentUser.photo);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const meusPosts = posts.filter(p => p.userId === uid);
  const curtidos = posts.filter(p => p.likes?.includes(uid));

  const pinnedPost = pinnedPostId ? meusPosts.find(p => p.id === pinnedPostId) : undefined;
  const otherPosts = meusPosts.filter(p => p.id !== pinnedPostId);
  const sortedMyPosts = pinnedPost ? [pinnedPost, ...otherPosts] : meusPosts;
  const gridPosts = tab === 'posts' ? sortedMyPosts : curtidos;

  async function handlePhotoUpload(file: File) {
    setUploading(true);
    setSaveError('');
    try {
      const dataUrl = await compressImage(file, 200, 0.75);
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
          canvas.width = w; canvas.height = h;
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
        await updateProfile(user, { displayName: editName.trim() });
        const cleanUsername = editUsername.trim().toLowerCase().replace(/[^a-z0-9._]/g, '');
        await setDoc(doc(db, 'users', uid), {
          fullName: editName.trim(),
          name: editName.trim().split(' ')[0],
          ...(editPhoto !== currentUser.photo ? { photoData: editPhoto } : {}),
          ...(cleanUsername ? { username: cleanUsername } : {}),
          bio: editBio.trim(),
          link: editLink.trim(),
        }, { merge: true });
      }
      setBio(editBio.trim());
      setLink(editLink.trim());
      if (editUsername.trim()) setSavedUsername(editUsername.trim().toLowerCase().replace(/[^a-z0-9._]/g, ''));
      setShowEdit(false);
      window.location.reload();
    } catch (e: any) {
      setSaveError('Erro ao salvar: ' + (e?.message || 'tente novamente'));
    } finally {
      setSaving(false);
    }
  }

  async function togglePin(postId: string) {
    const newPinned = pinnedPostId === postId ? '' : postId;
    await updateDoc(doc(db, 'users', uid), { pinnedPostId: newPinned });
    setPinnedPostId(newPinned);
  }

  function normalizeLink(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return 'https://' + trimmed;
  }

  return (
    <div style={{ background: '#000', minHeight: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px',
        borderBottom: '1px solid #1a1a1a', position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(14px)',
      }}>
        <button onClick={() => goTo('home')} style={{
          padding: 6, borderRadius: '50%', background: 'transparent',
          border: 'none', cursor: 'pointer', display: 'flex', marginRight: 10,
        }}>{Ico.back()}</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: '#fff', letterSpacing: 0.3 }}>
            {currentUser.fullName}
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => goTo('admin')} style={{
            padding: 8, borderRadius: '50%', background: 'transparent',
            border: 'none', cursor: 'pointer', display: 'flex',
          }}>{Ico.admin('#71767b')}</button>
        )}
        <button onClick={() => signOut(auth)} title="Sair" style={{
          padding: 8, borderRadius: '50%', background: 'transparent',
          border: 'none', cursor: 'pointer', display: 'flex', color: '#555',
        }}>{Ico.logout()}</button>
      </div>

      {/* ── Profile Card ── */}
      <div style={{ padding: '24px 20px 0' }}>

        {/* Row: info left + avatar right */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>

          {/* Left: name, username, bio, link, badge */}
          <div style={{ flex: 1, paddingRight: 20 }}>
            {/* Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
              <span style={{
                fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
                fontSize: 24, color: '#fff', letterSpacing: 0.2, lineHeight: 1.1,
              }}>
                {currentUser.fullName}
              </span>
              {isAdmin && (
                <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: '#F07830', flexShrink: 0 }}>
                  <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.35-6.2 6.78z" />
                </svg>
              )}
            </div>

            {/* Username */}
            <div style={{
              fontFamily: 'Barlow, sans-serif', fontSize: 14,
              color: '#71767b', marginBottom: bio ? 12 : 12,
            }}>
              {displayUsername}
            </div>

            {/* Bio */}
            {bio && (
              <div style={{
                fontFamily: 'Barlow, sans-serif', fontSize: 14.5, color: '#e7e9ea',
                lineHeight: 1.55, marginBottom: 10,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {bio}
              </div>
            )}

            {/* Link */}
            {link && (
              <a
                href={normalizeLink(link)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontFamily: 'Barlow, sans-serif', fontSize: 13.5, color: '#F07830',
                  textDecoration: 'none', marginBottom: 12,
                }}
              >
                <IcoLink />
                <span style={{ textDecoration: 'underline', textDecorationColor: 'rgba(240,120,48,0.5)' }}>
                  {link.replace(/^https?:\/\//i, '').replace(/\/$/, '')}
                </span>
              </a>
            )}

            {/* Group badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(186,117,23,0.08)', border: '1px solid rgba(186,117,23,0.18)',
              borderRadius: 20, padding: '4px 10px',
            }}>
              <div style={{ width: 6, height: 6, background: '#BA7517', borderRadius: '50%', flexShrink: 0 }} />
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: 1.2, color: '#BA7517' }}>
                7TEEN · ASSOCIAÇÃO PAULISTA DO VALE
              </span>
            </div>

          </div>

          {/* Right: Avatar */}
          <div style={{
            width: 84, height: 84, borderRadius: '50%', padding: 3, flexShrink: 0,
            background: 'linear-gradient(135deg, #F07830 0%, #D4621A 60%, #ff9a55 100%)',
          }}>
            <img src={currentUser.photo} alt="" style={{
              width: '100%', height: '100%', borderRadius: '50%',
              objectFit: 'cover', border: '3px solid #000', display: 'block',
            }} />
          </div>
        </div>

        {/* Followers / Following row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
          <button
            onClick={() => openFollowList('seguidores')}
            style={{ background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'baseline', gap: 5 }}
          >
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, color: '#fff' }}>
              {followersCount}
            </span>
            <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#555' }}>
              seguidores
            </span>
          </button>

          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#2f3336' }} />

          <button
            onClick={() => openFollowList('seguindo')}
            style={{ background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'baseline', gap: 5 }}
          >
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, color: '#fff' }}>
              {followingCount}
            </span>
            <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#555' }}>
              seguindo
            </span>
          </button>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => {
              setEditName(currentUser.fullName);
              setEditUsername(savedUsername);
              setEditBio(bio);
              setEditLink(link);
              setEditPhoto(currentUser.photo);
              setSaveError('');
              setShowEdit(true);
            }}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 12,
              border: '1px solid #2f2f2f', background: 'transparent',
              color: '#e7e9ea', fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700, fontSize: 14, letterSpacing: 0.5, cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            Editar perfil
          </button>
          {isAdmin && (
            <button
              onClick={() => goTo('admin')}
              title="Painel Admin"
              style={{
                padding: '10px 14px', borderRadius: 12,
                border: '1px solid rgba(240,120,48,0.25)',
                background: 'rgba(240,120,48,0.06)',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
              }}
            >
              {Ico.admin('#F07830')}
            </button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #1a1a1a',
        position: 'sticky', top: 49, background: '#000', zIndex: 40,
      }}>
        {([
          { id: 'posts' as Tab, label: 'Posts' },
          { id: 'curtidos' as Tab, label: 'Curtidos' },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '14px 0', background: 'transparent', border: 'none',
            cursor: 'pointer', position: 'relative',
            fontFamily: 'Barlow, sans-serif', fontWeight: tab === t.id ? 700 : 400,
            fontSize: 15,
            color: tab === t.id ? '#fff' : '#555', transition: 'color 0.2s',
          }}>
            {t.label}
            {tab === t.id && (
              <span style={{
                position: 'absolute', bottom: 0, left: '50%',
                transform: 'translateX(-50%)', width: 40, height: 2.5,
                background: '#F07830', display: 'block', borderRadius: 99,
              }} />
            )}
          </button>
        ))}
      </div>

      {/* Posts list */}
      {gridPosts.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 16px', gap: 10 }}>
          <div style={{ fontSize: 36 }}>📷</div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 700, color: '#444', letterSpacing: 0.5 }}>
            {tab === 'posts' ? 'Nenhum post ainda' : 'Nenhuma curtida ainda'}
          </div>
        </div>
      ) : (
        <div>
          {gridPosts.map(post => {
            const isPinned = post.id === pinnedPostId;
            const isMyPost = post.userId === uid;
            return (
              <div key={post.id} style={{ borderBottom: '1px solid #111', padding: '14px 16px' }}>

                {isPinned && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    paddingBottom: 8, paddingLeft: 46,
                    fontSize: 12, color: '#555', fontFamily: 'Barlow, sans-serif',
                  }}>
                    <IcoPin />
                    <span>Post fixado</span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0, padding: 2,
                    background: 'linear-gradient(135deg, #F07830, #D4621A)',
                  }}>
                    <img src={currentUser.photo} alt="" style={{
                      width: '100%', height: '100%', borderRadius: '50%',
                      objectFit: 'cover', border: '2px solid #000', display: 'block',
                    }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: '#fff' }}>
                      {currentUser.fullName}
                    </div>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#555' }}>
                      {post.createdAt ? (() => {
                        const d = post.createdAt.toDate ? post.createdAt.toDate() : new Date(post.createdAt as any);
                        return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
                      })() : ''}
                    </div>
                  </div>

                  {tab === 'posts' && isMyPost && (
                    <button
                      onClick={() => togglePin(post.id)}
                      title={isPinned ? 'Desafixar' : 'Fixar no perfil'}
                      style={{
                        background: isPinned ? 'rgba(240,120,48,0.12)' : 'transparent',
                        border: `1px solid ${isPinned ? 'rgba(240,120,48,0.35)' : '#2a2a2a'}`,
                        borderRadius: 20, padding: '5px 11px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5,
                        color: isPinned ? '#F07830' : '#555',
                        fontFamily: 'Barlow, sans-serif', fontSize: 12, flexShrink: 0,
                      }}
                    >
                      <IcoPin />
                      <span style={{ fontWeight: isPinned ? 700 : 400 }}>
                        {isPinned ? 'Fixado' : 'Fixar'}
                      </span>
                    </button>
                  )}
                </div>

                {post.text && (
                  <div style={{
                    fontFamily: 'Barlow, sans-serif', fontSize: 15, color: '#e7e9ea',
                    lineHeight: 1.55, marginBottom: post.imageUrl ? 10 : 0,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {post.text}
                  </div>
                )}

                {post.imageUrl && !post.repostOf && (
                  <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #1a1a1a' }}>
                    <img src={post.imageUrl} alt="" style={{ width: '100%', maxHeight: 380, objectFit: 'cover', display: 'block' }} />
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
                  {(post.likes?.length ?? 0) > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#555' }}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="#F07830"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                      <span style={{ color: '#F07830' }}>{post.likes!.length}</span>
                    </div>
                  )}
                  {(post.comments?.length ?? 0) > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#555' }}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="#555"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01z"/></svg>
                      {post.comments!.length}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ height: 80 }} />

      {/* Modal Seguindo / Seguidores */}
      {followListModal && (
        <div onClick={() => setFollowListModal(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#0d0d0d', borderRadius: '20px 20px 0 0',
            width: '100%', maxWidth: 600, maxHeight: '70vh',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            border: '1px solid #222', borderBottom: 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px 12px', borderBottom: '1px solid #1a1a1a' }}>
              <button onClick={() => setFollowListModal(null)} style={{
                color: '#666', fontSize: 22, background: 'transparent',
                border: 'none', cursor: 'pointer', lineHeight: 1, padding: '0 4px',
              }}>×</button>
              <span style={{
                flex: 1, textAlign: 'center', fontWeight: 700, color: '#e7e9ea',
                fontSize: 14, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: 1,
              }}>
                {followListModal === 'seguindo' ? 'SEGUINDO' : 'SEGUIDORES'}
              </span>
              <div style={{ width: 28 }} />
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {followListLoading && (
                <div style={{ padding: 32, textAlign: 'center', color: '#555', fontFamily: 'Barlow', fontSize: 14 }}>Carregando...</div>
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
                    onClick={() => { setFollowListModal(null); onOpenProfile?.(u.uid, displayName); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', borderBottom: '1px solid #111',
                      cursor: onOpenProfile ? 'pointer' : 'default',
                    }}
                  >
                    <Avatar src={(u as any).photoData || u.photo || ''} name={displayName} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 15, color: '#fff' }}>{displayName}</div>
                      <div style={{ fontFamily: 'Barlow', fontSize: 12, color: '#555' }}>
                        {u.username ? '@' + u.username : toUsername(displayName)}
                      </div>
                    </div>
                    {onOpenProfile && (
                      <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: '#444' }}>
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
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#0f0f0f', borderRadius: '20px 20px 0 0',
            padding: '20px 20px 0', width: '100%', maxWidth: 480,
            border: '1px solid #222', borderBottom: 'none',
            maxHeight: '94vh', overflowY: 'auto', paddingBottom: 40,
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 22 }}>
              <button onClick={() => setShowEdit(false)} style={{
                color: '#888', fontSize: 22, background: 'transparent',
                border: 'none', cursor: 'pointer', lineHeight: 1, padding: '0 4px', marginRight: 8,
              }}>×</button>
              <span style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: 700, letterSpacing: 1, color: '#fff' }}>
                EDITAR PERFIL
              </span>
            </div>

            {/* Photo */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ width: 80, height: 80, borderRadius: '50%', padding: 3, background: 'linear-gradient(135deg, #F07830, #D4621A)', cursor: 'pointer', position: 'relative' }}
              >
                <img
                  src={editPhoto || currentUser.photo} alt=""
                  onError={e => { (e.target as HTMLImageElement).src = currentUser.photo; }}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid #0f0f0f', display: 'block', opacity: uploading ? 0.5 : 1 }}
                />
                <div style={{ position: 'absolute', bottom: -2, right: -2, background: '#F07830', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0f0f0f' }}>
                  {Ico.camera('#fff')}
                </div>
                {uploading && (
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
                    <span style={{ fontFamily: 'Barlow', fontSize: 10, color: '#fff' }}>...</span>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const file = e.target.files?.[0]; if (file) handlePhotoUpload(file); }}
              />
            </div>
            <div style={{ fontFamily: 'Barlow', fontSize: 11, color: '#444', textAlign: 'center', marginBottom: 20 }}>
              Toque para alterar a foto
            </div>

            {/* Name */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: 'Barlow', fontSize: 11, color: '#555', marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase' }}>Nome</div>
              <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Seu nome" style={{
                width: '100%', background: '#161616', border: '1px solid #2a2a2a',
                borderRadius: 12, padding: '12px 14px', fontFamily: 'Barlow',
                fontSize: 15, color: '#fff', outline: 'none', boxSizing: 'border-box',
              }} />
            </div>

            {/* Username */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: 'Barlow', fontSize: 11, color: '#555', marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase' }}>Nome de usuário</div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'Barlow', fontSize: 15, color: '#555', pointerEvents: 'none' }}>@</span>
                <input
                  value={editUsername}
                  onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 24))}
                  placeholder={toUsername(editName).slice(1) || 'nomedousuario'}
                  style={{ width: '100%', background: '#161616', border: '1px solid #2a2a2a', borderRadius: 12, padding: '12px 14px 12px 28px', fontFamily: 'Barlow', fontSize: 15, color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Bio */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: 'Barlow', fontSize: 11, color: '#555', marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase' }}>Bio</div>
              <textarea
                value={editBio}
                onChange={e => setEditBio(e.target.value.slice(0, 160))}
                placeholder="Escreva algo sobre você..."
                rows={3}
                style={{
                  width: '100%', background: '#161616', border: '1px solid #2a2a2a',
                  borderRadius: 12, padding: '12px 14px', fontFamily: 'Barlow',
                  fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box',
                  resize: 'none', lineHeight: 1.5,
                }}
              />
              <div style={{ fontFamily: 'Barlow', fontSize: 11, color: '#333', marginTop: 3, textAlign: 'right' }}>
                {editBio.length}/160
              </div>
            </div>

            {/* Link */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontFamily: 'Barlow', fontSize: 11, color: '#555', marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase' }}>Link</div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', display: 'flex', color: '#555', pointerEvents: 'none' }}>
                  <IcoLink />
                </span>
                <input
                  value={editLink}
                  onChange={e => setEditLink(e.target.value.slice(0, 100))}
                  placeholder="seusite.com"
                  style={{
                    width: '100%', background: '#161616', border: '1px solid #2a2a2a',
                    borderRadius: 12, padding: '12px 14px 12px 34px', fontFamily: 'Barlow',
                    fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {saveError && <div style={{ fontFamily: 'Barlow', fontSize: 12, color: '#f4212e', marginBottom: 14 }}>{saveError}</div>}

            {/* Save */}
            <button
              onClick={salvarPerfil}
              disabled={saving || uploading || !editName.trim()}
              style={{
                width: '100%', background: editName.trim() && !uploading ? '#F07830' : '#2a1a0a',
                border: 'none', color: editName.trim() && !uploading ? '#fff' : '#7a5a3a',
                borderRadius: 50, padding: '14px', fontFamily: 'Barlow Condensed',
                fontWeight: 700, fontSize: 14, cursor: saving ? 'default' : 'pointer',
                letterSpacing: 1, marginBottom: 12,
              }}
            >
              {saving ? 'SALVANDO...' : uploading ? 'ENVIANDO FOTO...' : 'SALVAR'}
            </button>

            {/* Danger zone */}
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  width: '100%', padding: '12px', borderRadius: 50,
                  border: '1px solid #2a0000', background: 'transparent',
                  color: '#5a1a1a', fontFamily: 'Barlow', fontSize: 12,
                  cursor: 'pointer', marginBottom: 4,
                }}
              >
                Excluir minha conta
              </button>
            ) : (
              <div style={{
                border: '1px solid #3a0000', borderRadius: 12, padding: '14px',
                marginBottom: 4, background: 'rgba(200,0,0,0.04)',
              }}>
                <div style={{ fontFamily: 'Barlow', fontSize: 13, color: '#cc3333', marginBottom: 12, textAlign: 'center' }}>
                  Esta ação é permanente e irreversível.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{ flex: 1, padding: '10px', borderRadius: 50, border: '1px solid #333', background: 'transparent', color: '#888', fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 12, cursor: 'pointer', letterSpacing: 1 }}
                  >CANCELAR</button>
                  <button
                    onClick={async () => {
                      try {
                        const user = auth.currentUser;
                        if (user) {
                          if (selectedChurch) {
                            const postsSnap = await getDocs(query(collection(db, 'churches', selectedChurch.id, 'posts'), where('userId', '==', uid)));
                            await Promise.all(postsSnap.docs.map(d => deleteDoc(d.ref)));
                          }
                          await deleteDoc(doc(db, 'follows', uid)).catch(() => {});
                          await deleteDoc(doc(db, 'users', uid));
                          localStorage.removeItem(`pg_setup_${uid}`);
                          await deleteUser(user);
                        }
                      } catch (e: any) {
                        alert('Erro ao excluir conta: ' + (e?.message || 'Faça login novamente e tente de novo.'));
                      }
                    }}
                    style={{ flex: 1, padding: '10px', borderRadius: 50, border: 'none', background: '#cc2200', color: '#fff', fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 12, cursor: 'pointer', letterSpacing: 1 }}
                  >EXCLUIR CONTA</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
