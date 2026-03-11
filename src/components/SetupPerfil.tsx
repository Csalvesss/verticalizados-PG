import { useState, useRef } from 'react';
import { doc, setDoc } from 'firebase/firestore';
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
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const name = user.displayName || 'Membro';
  const initial = name.charAt(0).toUpperCase();

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

  const salvar = async () => {
    setSaving(true);
    const uid = user.uid;
    const baseName = name.split(' ')[0];
    await setDoc(doc(db, 'users', uid), {
      fullName: name,
      name: baseName,
      email: user.email || '',
      ...(photo ? { photoData: photo } : {}),
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
        gap: 24,
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

        {/* Buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={salvar}
            disabled={saving}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 999,
              background: saving ? '#333' : '#F07830',
              color: '#fff',
              fontFamily: 'Barlow, sans-serif',
              fontWeight: 700,
              fontSize: 15,
              border: 'none',
              cursor: saving ? 'default' : 'pointer',
            }}
          >
            {saving ? 'Salvando...' : 'Continuar'}
          </button>

          {!photo && (
            <button
              onClick={salvar}
              disabled={saving}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 999,
                background: 'transparent',
                color: '#555',
                fontFamily: 'Barlow, sans-serif',
                fontWeight: 600,
                fontSize: 14,
                border: 'none',
                cursor: saving ? 'default' : 'pointer',
              }}
            >
              Pular por agora
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
