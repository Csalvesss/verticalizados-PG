import { useState, useRef, useEffect } from 'react';
import { Ico } from '../icons';
import { Avatar } from './Avatar';

interface Props {
  userPhoto: string;
  placeholder?: string;
  onPost: (text: string, img: string | null) => Promise<void>;
  submitLabel?: string;
  autoFocus?: boolean;
}

export function Composer({
  userPhoto,
  placeholder = "O que está acontecendo?",
  onPost,
  submitLabel = "Postar",
  autoFocus = false,
}: Props) {
  const [text, setText] = useState('');
  const [img, setImg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handlePost = async () => {
    if ((!text.trim() && !img) || loading) return;
    setLoading(true);
    try {
      await onPost(text.trim(), img);
      setText('');
      setImg(null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setImg(ev.target.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div style={{ display: 'flex', gap: 12, padding: '16px', borderBottom: '1px solid #2f3336' }}>
      <Avatar src={userPhoto} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={1}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#fff',
            fontSize: 18,
            fontFamily: 'Barlow, sans-serif',
            resize: 'none',
            padding: '4px 0',
            lineHeight: 1.4,
          }}
        />

        {img && (
          <div style={{ position: 'relative', marginTop: 12, borderRadius: 16, overflow: 'hidden', border: '1px solid #2f3336' }}>
            <img
              src={img}
              alt="Preview"
              style={{ width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block' }}
            />
            <button
              onClick={() => setImg(null)}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(15, 20, 25, 0.75)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              ×
            </button>
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid #2f3336'
        }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="composer-icon-btn"
            style={{
              color: '#F07830',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {Ico.image()}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFile}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {text.length > 0 && (
              <span style={{ fontSize: 12, color: text.length > 280 ? '#f4212e' : '#71767b' }}>
                {text.length}/280
              </span>
            )}
            <button
              onClick={handlePost}
              disabled={(!text.trim() && !img) || loading}
              style={{
                background: (text.trim() || img) ? '#F07830' : '#1a1a1a',
                color: (text.trim() || img) ? '#fff' : '#71767b',
                padding: '8px 16px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 14,
                border: 'none',
                cursor: (text.trim() || img) && !loading ? 'pointer' : 'default',
                opacity: loading ? 0.6 : 1,
                transition: '0.2s',
              }}
            >
              {loading ? '...' : submitLabel}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .composer-icon-btn:hover {
          background: rgba(240, 120, 48, 0.1);
        }
      `}</style>
    </div>
  );
}
