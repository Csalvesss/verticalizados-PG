import { useState, useRef, useEffect } from 'react';
import { Ico } from '../icons';
import { Avatar } from './Avatar';

interface Props {
  userPhoto: string;
  placeholder?: string;
  onPost: (text: string, img: string | null) => Promise<void>;
  submitLabel?: string;
  autoFocus?: boolean;
  allowEmpty?: boolean;
}

export function Composer({
  userPhoto,
  placeholder = "O que está acontecendo?",
  onPost,
  submitLabel = "Postar",
  autoFocus = false,
  allowEmpty = false,
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

  const hasContent = !!(text.trim() || img);
  const canPost = allowEmpty ? !loading : (!loading && hasContent);
  const isActive = allowEmpty ? true : hasContent;

  const handlePost = async () => {
    if (!canPost) return;
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
    e.target.value = '';
  };

  const over280 = text.length > 280;
  const near280 = text.length > 240 && !over280;

  return (
    <div style={{
      display: 'flex',
      gap: 12,
      padding: '14px 16px',
      borderBottom: '1px solid #2f3336',
      background: '#000',
    }}>
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
            color: '#e7e9ea',
            fontSize: 17,
            fontFamily: 'Barlow, sans-serif',
            resize: 'none',
            padding: '6px 0',
            lineHeight: 1.45,
            minHeight: 42,
          }}
        />

        {img && (
          <div style={{
            position: 'relative',
            marginTop: 10,
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid #2f3336',
          }}>
            <img
              src={img}
              alt="Preview"
              style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }}
            />
            <button
              onClick={() => setImg(null)}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'rgba(15,20,25,0.8)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 700,
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
          marginTop: 10,
          paddingTop: 10,
          borderTop: '1px solid #1e1e1e',
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
              cursor: 'pointer',
              transition: 'background 0.15s',
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
              <span style={{
                fontSize: 12,
                color: over280 ? '#f4212e' : near280 ? '#FFD700' : '#555',
                fontFamily: 'Barlow, sans-serif',
                transition: 'color 0.2s',
              }}>
                {text.length}/280
              </span>
            )}
            <button
              onClick={handlePost}
              disabled={!canPost}
              style={{
                background: isActive ? '#F07830' : '#1a1a1a',
                color: isActive ? '#fff' : '#444',
                padding: '7px 18px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 14,
                fontFamily: 'Barlow, sans-serif',
                border: 'none',
                cursor: canPost ? 'pointer' : 'default',
                opacity: loading ? 0.5 : 1,
                transition: 'all 0.2s',
                letterSpacing: 0.2,
              }}
            >
              {loading ? '...' : submitLabel}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .composer-icon-btn:hover {
          background: rgba(240, 120, 48, 0.12) !important;
        }
        textarea::placeholder {
          color: #444;
        }
      `}</style>
    </div>
  );
}
