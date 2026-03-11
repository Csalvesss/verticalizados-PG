import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import type { Post } from '../types';

interface Props {
  post: Post;
  authorName: string;
  authorPhoto: string;
  onClose: () => void;
}

function formatDate(ts: any): string {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function ShareCard({ post, authorName, authorPhoto, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  async function generate() {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });
      setImageUrl(canvas.toDataURL('image/png'));
    } catch {
      // fallback: still allow sharing text
    } finally {
      setGenerating(false);
    }
  }

  async function shareImage() {
    if (!imageUrl) return;
    try {
      const blob = await (await fetch(imageUrl)).blob();
      const file = new File([blob], 'verticalizados.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Verticalizados' });
      } else {
        // fallback: download
        downloadImage();
      }
    } catch { /* user cancelled */ }
  }

  function downloadImage() {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = 'verticalizados-post.png';
    a.click();
  }

  // Auto-generate on mount
  if (!imageUrl && !generating) {
    setTimeout(generate, 80);
  }

  const hasImage = !!post.imageUrl && !post.repostOf;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '20px 16px',
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>

        {/* Label */}
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: 3, color: '#F07830' }}>
          COMPARTILHAR POST
        </div>

        {/* Preview / loading */}
        {generating && (
          <div style={{ width: '100%', aspectRatio: '4/5', maxHeight: 480, background: '#111', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: 'Barlow', fontSize: 13, color: '#555' }}>Gerando imagem...</div>
          </div>
        )}
        {imageUrl && !generating && (
          <img src={imageUrl} alt="card" style={{ width: '100%', borderRadius: 20, boxShadow: '0 8px 40px rgba(240,120,48,0.2)', display: 'block' }} />
        )}

        {/* Off-screen card to render */}
        <div style={{ position: 'fixed', left: -9999, top: -9999 }}>
          <div ref={cardRef} style={{
            width: 420,
            background: 'linear-gradient(160deg, #0a0a0a 0%, #0f0a06 60%, #140e06 100%)',
            borderRadius: 24,
            padding: 28,
            fontFamily: 'Barlow, sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Subtle top gradient accent */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 3,
              background: 'linear-gradient(90deg, #F07830, #ff9a55, #F07830)',
            }} />

            {/* Author row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 46, height: 46, borderRadius: '50%', padding: 2.5, flexShrink: 0,
                background: 'linear-gradient(135deg, #F07830, #D4621A)',
              }}>
                <img
                  src={authorPhoto}
                  alt=""
                  crossOrigin="anonymous"
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid #0a0a0a', display: 'block' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: 0.2, fontFamily: 'Barlow Condensed, sans-serif' }}>
                  {authorName}
                </div>
                <div style={{ fontSize: 12, color: '#F07830', fontFamily: 'Barlow, sans-serif' }}>
                  Verticalizados · MJA Esplanada
                </div>
              </div>
            </div>

            {/* Post text */}
            {post.text && (
              <div style={{
                fontSize: hasImage ? 14 : 18,
                color: '#e7e9ea',
                lineHeight: 1.6,
                marginBottom: hasImage ? 14 : 20,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'Barlow, sans-serif',
              }}>
                {post.text}
              </div>
            )}

            {/* Post image */}
            {hasImage && (
              <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
                <img
                  src={post.imageUrl}
                  alt=""
                  crossOrigin="anonymous"
                  style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block' }}
                />
              </div>
            )}

            {/* Stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              {(post.likes?.length ?? 0) > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#F07830', fontSize: 13, fontFamily: 'Barlow, sans-serif' }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="#F07830"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  {post.likes!.length} {post.likes!.length === 1 ? 'curtida' : 'curtidas'}
                </div>
              )}
              {(post.comments?.length ?? 0) > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#71767b', fontSize: 13, fontFamily: 'Barlow, sans-serif' }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="#71767b"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01z"/></svg>
                  {post.comments!.length} {post.comments!.length === 1 ? 'resposta' : 'respostas'}
                </div>
              )}
              {post.createdAt && (
                <div style={{ fontSize: 12, color: '#444', fontFamily: 'Barlow, sans-serif', marginLeft: 'auto' }}>
                  {formatDate(post.createdAt)}
                </div>
              )}
            </div>

            {/* Branding footer */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 10, height: 10, background: '#F07830', borderRadius: 3 }} />
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: 1.5, color: '#F07830' }}>
                  VERTICALIZADOS
                </span>
              </div>
              <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: '#333' }}>
                MJA Esplanada
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {imageUrl && (
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <button
              onClick={downloadImage}
              style={{
                flex: 1, padding: '12px', borderRadius: 12, cursor: 'pointer',
                border: '1px solid #333', background: 'transparent',
                color: '#e7e9ea', fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700, fontSize: 13, letterSpacing: 0.5,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#e7e9ea"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
              Baixar
            </button>
            <button
              onClick={shareImage}
              style={{
                flex: 2, padding: '12px', borderRadius: 12, cursor: 'pointer',
                border: 'none', background: '#F07830',
                color: '#fff', fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700, fontSize: 13, letterSpacing: 0.5,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
              Compartilhar
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            background: 'transparent', border: 'none', color: '#555',
            fontFamily: 'Barlow, sans-serif', fontSize: 13, cursor: 'pointer', padding: '4px 0',
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
