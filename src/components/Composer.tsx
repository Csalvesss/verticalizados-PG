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
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const hasContent = !!(text.trim() || img);
  const canPost = allowEmpty ? !loading : (!loading && hasContent);
  const isActive = allowEmpty ? true : hasContent;
  const over280 = text.length > 280;
  const near280 = text.length > 240 && !over280;

  const handlePost = async () => {
    if (!canPost) return;
    setLoading(true);
    try {
      await onPost(text.trim(), img);
      setText('');
      setImg(null);
      setFocused(false);
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

  return (
    <div style={{
      display: 'flex',
      gap: 12,
      padding: '12px 14px',
      borderBottom: '1px solid #1a1a1a',
      background: '#000',
      alignItems: 'flex-start',
    }}>
      {/* Avatar with subtle gradient ring */}
      <div style={{
        flexShrink: 0,
        padding: 1.5,
        borderRadius: '50%',
        background: focused || hasContent
          ? 'linear-gradient(135deg, #F07830, #D4621A)'
          : 'transparent',
        transition: 'background 0.2s',
      }}>
        <div style={{ borderRadius: '50%', border: '1.5px solid #000' }}>
          <Avatar src={userPhoto} size={36} />
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => !hasContent && setFocused(false)}
          placeholder={placeholder}
          rows={1}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#e7e9ea',
            fontSize: 15,
            fontFamily: 'Barlow, sans-serif',
            resize: 'none',
            padding: '8px 0 4px',
            lineHeight: 1.5,
            minHeight: 38,
          }}
        />

        {/* Image preview */}
        {img && (
          <div style={{
            position: 'relative',
            marginTop: 8,
            borderRadius: 14,
            overflow: 'hidden',
          }}>
            <img
              src={img}
              alt="Preview"
              style={{ width: '100%', maxHeight: 300, objectFit: 'cover', display: 'block' }}
            />
            <button
              onClick={() => setImg(null)}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.75)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Actions row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 6,
        }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="composer-ico-btn"
            style={{
              color: '#F07830',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {text.length > 0 && (
              <span style={{
                fontSize: 11,
                color: over280 ? '#f4212e' : near280 ? '#FFD700' : '#444',
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
                background: isActive ? '#F07830' : '#111',
                color: isActive ? '#fff' : '#333',
                padding: '6px 16px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 13,
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
        .composer-ico-btn:hover {
          background: rgba(240, 120, 48, 0.12) !important;
        }
        textarea::placeholder {
          color: #333;
        }
      `}</style>
    </div>
  );
}
