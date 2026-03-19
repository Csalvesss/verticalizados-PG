import { useState } from 'react';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { CurrentUser } from '../types';

interface Props {
  currentUser: CurrentUser;
  initialImage: string;
  onClose: () => void;
}

export function StoryCreator({ currentUser, initialImage, onClose }: Props) {
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const expiresAt = Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000);
      await addDoc(collection(db, 'stories'), {
        userId: currentUser.uid,
        userName: currentUser.name,
        userPhoto: currentUser.photo,
        mediaUrl: initialImage,
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
          padding: '16px 16px 32px', width: '100%', maxWidth: 480,
        }}
      >
        {/* Handle bar */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#333', margin: '0 auto 14px' }} />

        {/* Preview */}
        <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
          <img
            src={initialImage}
            alt=""
            style={{ width: '100%', maxHeight: 340, objectFit: 'cover', display: 'block' }}
          />
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
