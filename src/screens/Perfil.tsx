import { useState, useRef } from 'react';
import { getAuth, signOut, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { Ico } from '../icons';
import type { CurrentUser, Screen, Post, Sorteio } from '../types';

const auth = getAuth();

interface Props {
  currentUser: CurrentUser;
  isAdmin: boolean;
  posts: Post[];
  uid: string;
  songsCount: number;
  sorteioSemana: Sorteio | null;
  goTo: (sc: Screen) => void;
}

type Tab = 'posts' | 'curtidos';

export function PerfilScreen({
  currentUser,
  isAdmin,
  posts,
  uid,
  songsCount,
  sorteioSemana,
  goTo,
}: Props) {
  const [tab, setTab] = useState<Tab>('posts');
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState(currentUser.fullName);
  const [editPhoto, setEditPhoto] = useState(currentUser.photo);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const meusPosts = posts.filter(p => p.userId === uid);
  const curtidos = posts.filter(p => p.likes?.includes(uid));
  const oracoes = sorteioSemana?.historico?.length || 0;
  const gridPosts = tab === 'posts' ? meusPosts : curtidos;

  async function handlePhotoUpload(file: File) {
    setUploading(true);
    setSaveError('');
    try {
      const storageRef = ref(storage, `profile-photos/${uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setEditPhoto(url);
    } catch (e: any) {
      setSaveError('Erro ao enviar foto: ' + (e?.message || 'tente novamente'));
    } finally {
      setUploading(false);
    }
  }

  async function salvarPerfil() {
    if (!editName.trim()) return;
    setSaving(true);
    setSaveError('');
    try {
      const user = auth.currentUser;
      if (user) {
        await updateProfile(user, {
          displayName: editName.trim(),
          photoURL: editPhoto.trim() || user.photoURL,
        });
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
              { n: meusPosts.length, label: 'Posts' },
              { n: songsCount, label: 'Músicas' },
              { n: oracoes, label: 'Orações' },
            ].map(item => (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 22, color: '#fff', lineHeight: 1.2 }}>{item.n}</div>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#71767b', marginTop: 1 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, color: '#fff' }}>{currentUser.fullName}</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#555' }}>{currentUser.email}</div>
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
            onClick={() => { setEditName(currentUser.fullName); setEditPhoto(currentUser.photo); setSaveError(''); setShowEdit(true); }}
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

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'Barlow', fontSize: 12, color: '#666', marginBottom: 6 }}>Nome</div>
              <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Seu nome" style={{
                width: '100%', background: '#1a1a1a', border: '1px solid #2f3336',
                borderRadius: 10, padding: '10px 14px', fontFamily: 'Barlow',
                fontSize: 15, color: '#fff', outline: 'none', boxSizing: 'border-box',
              }} />
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
