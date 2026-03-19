import { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { CurrentUser } from '../types';

async function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Story images: 9:16 crop, max 1080px wide
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

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      await addDoc(collection(db, 'stories'), {
        userId: currentUser.uid,
        userName: currentUser.name,
        userPhoto: currentUser.photo,
        mediaUrl: img,
        caption: caption.trim() || null,
        createdAt: serverTimestamp(),
        seenBy: [],
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#161616', borderRadius: '20px 20px 0 0',
          padding: '20px 20px 32px', width: '100%', maxWidth: 480,
        }}
      >
        {/* Handle bar */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#333', margin: '0 auto 20px' }} />

        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 18 }}>
          Novo story
        </div>

        {/* Image picker */}
        {!img ? (
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              width: '100%', height: 220, borderRadius: 16,
              background: '#1e1e1e', border: '2px dashed #333',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 10, cursor: 'pointer',
              color: '#555', fontSize: 14, fontFamily: 'Barlow, sans-serif',
            }}
          >
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="#555" strokeWidth="1.5" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="#555" />
              <path d="M3 15l5-5 4 4 3-3 6 6" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Toque para escolher uma foto
          </button>
        ) : (
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
            <img src={img} alt="" style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }} />
            <button
              onClick={() => setImg(null)}
              style={{
                position: 'absolute', top: 8, right: 8,
                background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                width: 30, height: 30, cursor: 'pointer', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              }}
            >✕</button>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

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
            boxSizing: 'border-box', marginTop: img ? 0 : 14,
          }}
        />

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
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
            disabled={!img || loading}
            style={{
              flex: 2, padding: '13px 0', borderRadius: 12,
              background: img && !loading ? '#F07830' : '#2a2a2a',
              border: 'none', color: img && !loading ? '#fff' : '#555',
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
              fontSize: 16, cursor: img && !loading ? 'pointer' : 'default',
              transition: 'background 0.2s',
            }}
          >{loading ? 'Publicando…' : 'Publicar story'}</button>
        </div>
      </div>
    </div>
  );
}
