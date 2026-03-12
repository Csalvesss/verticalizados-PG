import { useState, useRef, useEffect } from 'react';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { updateProfile, type User } from 'firebase/auth';
import { db } from '../firebase';

interface Props {
  user: User;
  onDone: () => void;
}

async function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 400;
      const ratio = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.src = dataUrl;
  });
}

export function SetupPerfil({ user, onDone }: Props) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameOk, setUsernameOk] = useState(false);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const name = user.displayName || 'Membro';
  const initial = name.charAt(0).toUpperCase();

  // Debounced username uniqueness check
  useEffect(() => {
    if (username.length < 3) {
      setUsernameOk(false);
      return;
    }
    setChecking(true);
    setUsernameError('');
    const timer = setTimeout(async () => {
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('username', '==', username)));
        if (!snap.empty) {
          setUsernameError('Este nome já está em uso');
          setUsernameOk(false);
        } else {
          setUsernameOk(true);
        }
      } catch {
        setUsernameError('Erro ao verificar');
      } finally {
        setChecking(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const compressed = await compressImage(ev.target!.result as string);
      setPhoto(compressed);
    };
    reader.readAsDataURL(file);
  };

  const canSave = usernameOk && !checking && !saving;

  const salvar = async () => {
    if (!canSave) return;
    setSaving(true);
    const uid = user.uid;
    const baseName = name.split(' ')[0];
    await setDoc(doc(db, 'users', uid), {
      fullName: name,
      name: baseName,
      email: user.email || '',
      username,
      ...(photo ? { photoData: photo } : {}),
      ...(user.photoURL && !photo ? { photo: user.photoURL } : {}),
      setupComplete: true,
    }, { merge: true });
    if (photo) {
      await updateProfile(user, { photoURL: null }).catch(() => {});
    }
    onDone();
  };

  return (
    <div style={{
      background: '#000',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{
          fontFamily: 'Bebas Neue',
          fontSize: 28,
          color: '#F07830',
          letterSpacing: 4,
          marginBottom: 6,
        }}>
          VERTICALIZADOS
        </div>
        <div style={{ color: '#71767b', fontFamily: 'Barlow, sans-serif', fontSize: 14 }}>
          Conta criada! Configure seu perfil.
        </div>
      </div>

      <div style={{
        background: '#16181c',
        borderRadius: 24,
        padding: '32px 24px',
        width: '100%',
        maxWidth: 360,
        border: '1px solid #2f3336',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
      }}>
        {/* Photo picker */}
        <div style={{ textAlign: 'center' }}>
          <div
            onClick={() => inputRef.current?.click()}
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: photo ? 'transparent' : '#1a1a2e',
              border: '2px dashed #F07830',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              margin: '0 auto 12px',
              position: 'relative',
            }}
          >
            {photo ? (
              <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : user.photoURL ? (
              <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{
                fontFamily: 'Barlow, sans-serif',
                fontSize: 42,
                fontWeight: 700,
                color: '#F07830',
                lineHeight: 1,
              }}>
                {initial}
              </span>
            )}
            {/* camera overlay */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: '#F07830',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #16181c',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </div>

          <div style={{
            color: '#F07830',
            fontFamily: 'Barlow, sans-serif',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }} onClick={() => inputRef.current?.click()}>
            {photo ? 'Trocar foto' : 'Adicionar foto de perfil'}
          </div>
          <input ref={inputRef} type="file" accept="image/*" onChange={pickPhoto} style={{ display: 'none' }} />
        </div>

        {/* Name display */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            color: '#e7e9ea',
            fontFamily: 'Barlow, sans-serif',
            fontWeight: 700,
            fontSize: 18,
          }}>
            {name}
          </div>
          <div style={{
            color: '#555',
            fontFamily: 'Barlow, sans-serif',
            fontSize: 13,
            marginTop: 2,
          }}>
            {user.email}
          </div>
        </div>

        {/* Username input */}
        <div style={{ width: '100%' }}>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: '#555', marginBottom: 6, letterSpacing: 0.5 }}>
            NOME DE USUÁRIO <span style={{ color: '#F07830' }}>*</span>
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%',
              transform: 'translateY(-50%)',
              fontFamily: 'Barlow, sans-serif', fontSize: 15, color: '#555',
              pointerEvents: 'none',
            }}>@</span>
            <input
              value={username}
              onChange={e => {
                const clean = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 24);
                setUsername(clean);
                setUsernameOk(false);
                setUsernameError('');
              }}
              placeholder="nomedousuario"
              style={{
                width: '100%',
                background: '#1a1a1a',
                border: `1px solid ${usernameOk ? '#2ea043' : usernameError ? '#f4212e' : '#2a2a2a'}`,
                borderRadius: 10,
                padding: '11px 40px 11px 28px',
                fontFamily: 'Barlow, sans-serif',
                fontSize: 15,
                color: '#fff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
              {checking && <span style={{ color: '#555', fontSize: 11, fontFamily: 'Barlow' }}>...</span>}
              {!checking && usernameOk && (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#2ea043"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              )}
              {!checking && usernameError && (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#f4212e"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              )}
            </div>
          </div>
          {usernameError && (
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#f4212e', marginTop: 4 }}>
              {usernameError}
            </div>
          )}
          {!usernameError && username.length > 0 && username.length < 3 && (
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#555', marginTop: 4 }}>
              Mínimo 3 caracteres
            </div>
          )}
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: '#333', marginTop: 4 }}>
            Letras minúsculas, números, pontos e underscores. Máx. 24 caracteres.
          </div>
        </div>

        {/* Button */}
        <div style={{ width: '100%' }}>
          <button
            onClick={salvar}
            disabled={!canSave}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 999,
              background: canSave ? '#F07830' : '#2a1a0a',
              color: canSave ? '#fff' : '#7a5a3a',
              fontFamily: 'Barlow, sans-serif',
              fontWeight: 700,
              fontSize: 15,
              border: 'none',
              cursor: canSave ? 'pointer' : 'default',
            }}
          >
            {saving ? 'Salvando...' : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}
