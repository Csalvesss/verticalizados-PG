import { useState, useRef, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { CurrentUser } from '../types';

async function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX_W = 1080;
      const ratio = Math.min(1, MAX_W / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.80));
    };
    img.src = dataUrl;
  });
}

interface Props {
  currentUser: CurrentUser;
  onClose: () => void;
}

export function StoryCreator({ currentUser, onClose }: Props) {
  const [img, setImg] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const fileSelectedRef = useRef(false);

  // Open the gallery picker immediately on mount
  useEffect(() => {
    const t = setTimeout(() => fileRef.current?.click(), 60);
    return () => clearTimeout(t);
  }, []);

  // Detect "cancel" — window regains focus without a file being selected
  useEffect(() => {
    const handleFocus = () => {
      setTimeout(() => {
        if (!fileSelectedRef.current) onClose();
      }, 400);
    };
    window.addEventListener('focus', handleFocus, { once: true });
    return () => window.removeEventListener('focus', handleFocus);
  }, [onClose]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    fileSelectedRef.current = true;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      if (ev.target?.result) {
        const compressed = await compressImage(ev.target.result as string);
        setImg(compressed);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePost = async () => {
    if (!img || loading) return;
    setLoading(true);
    try {
      const expiresAt = Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000);
      await addDoc(collection(db, 'stories'), {
        userId: currentUser.uid,
        userName: currentUser.name,
        userPhoto: currentUser.photo,
        mediaUrl: img,
        caption: caption.trim() || null,
        createdAt: serverTimestamp(),
        expiresAt,
        seenBy: [],
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Hidden file input — always mounted so the picker can open immediately
  const fileInput = (
    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
  );

  // No image yet — render nothing visible while the gallery is open
  if (!img) {
    return fileInput;
  }

  // Image chosen — show confirmation sheet
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      {fileInput}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#161616', borderRadius: '20px 20px 0 0',
          padding: '16px 16px 32px', width: '100%', maxWidth: 480,
        }}
      >
        {/* Handle bar */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#333', margin: '0 auto 14px' }} />

        {/* Preview */}
        <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
          <img src={img} alt="" style={{ width: '100%', maxHeight: 340, objectFit: 'cover', display: 'block' }} />
          {/* Swap photo button */}
          <button
            onClick={() => { fileSelectedRef.current = false; setImg(null); setTimeout(() => fileRef.current?.click(), 30); }}
            style={{
              position: 'absolute', top: 8, left: 8,
              background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: 20,
              padding: '5px 12px', color: '#fff', fontSize: 12,
              fontFamily: 'Barlow, sans-serif', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: 5,
            }}
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
              <path d="M4 16v-4a8 8 0 0116 0v4M8 20h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 14l2 2 2-2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Trocar
          </button>
        </div>

        {/* Caption */}
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Legenda (opcional)"
          maxLength={150}
          style={{
            width: '100%', background: '#1e1e1e', border: '1px solid #2a2a2a',
            borderRadius: 10, padding: '12px 14px', color: '#e7e9ea',
            fontSize: 15, fontFamily: 'Barlow, sans-serif', outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '13px 0', borderRadius: 12,
              background: '#1e1e1e', border: 'none', color: '#888',
              fontFamily: 'Barlow, sans-serif', fontSize: 15, cursor: 'pointer',
            }}
          >Cancelar</button>
          <button
            onClick={handlePost}
            disabled={loading}
            style={{
              flex: 2, padding: '13px 0', borderRadius: 12,
              background: loading ? '#2a2a2a' : '#F07830',
              border: 'none', color: loading ? '#555' : '#fff',
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
              fontSize: 16, cursor: loading ? 'default' : 'pointer',
              transition: 'background 0.2s',
            }}
          >{loading ? 'Publicando…' : 'Publicar story'}</button>
        </div>
      </div>
    </div>
  );
}
