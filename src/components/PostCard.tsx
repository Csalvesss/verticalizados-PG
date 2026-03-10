import { useState } from 'react';
import { Ico } from '../icons';
import { tempoRelativo, tempoRelativoStr, ADMIN_EMAIL } from '../constants';
import type { Post } from '../types';
import { Avatar } from './Avatar';
import { PostActions } from './PostActions';
import { RepostBlock } from './RepostBlock';

interface Props {
  post: Post;
  uid: string;
  isAdmin: boolean;
  onLike: () => void;
  onComment: () => void;
  onRepost: () => void;
  onDelete: () => void;
}

const verifiedBadge = (
  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: '#F07830', flexShrink: 0, marginLeft: 2 }}>
    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.35-6.2 6.78z" />
  </svg>
);

export function PostCard({
  post,
  uid,
  isAdmin,
  onLike,
  onComment,
  onRepost,
  onDelete,
}: Props) {
  const [showComments, setShowComments] = useState(false);

  const isOwner = post.userId === uid;
  const liked = post.likes?.includes(uid);
  const isVerified = post.userEmail === ADMIN_EMAIL;
  const handle = post.userEmail?.split('@')[0] || post.user.toLowerCase().replace(/\s+/g, '');
  const likesCount = post.likes?.length || 0;
  const commentsCount = post.comments?.length || 0;
  const hasComments = commentsCount > 0;
  const lastComment = hasComments ? post.comments[post.comments.length - 1] : null;

  return (
    <div style={{
      borderBottom: '1px solid #1a1a1a',
      background: '#000',
    }}>
      {/* Repost indicator */}
      {post.repostOf && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px 0',
          fontSize: 12,
          fontWeight: 600,
          color: '#71767b',
          fontFamily: 'Barlow, sans-serif',
        }}>
          {Ico.repost('#71767b')}
          <span>{post.user} repostou</span>
        </div>
      )}

      {/* ── Header: avatar + name + time + delete ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px 8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar src={post.photo} size={38} />
          <div style={{ minWidth: 0 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: '#e7e9ea',
              fontSize: 14,
              fontFamily: 'Barlow, sans-serif',
              lineHeight: 1.3,
              minWidth: 0,
            }}>
              <span style={{ fontWeight: 700 }}>{post.user}</span>
              {isVerified && verifiedBadge}
              <span style={{ color: '#6e767d', fontWeight: 400 }}>@{handle}</span>
              <span style={{ color: '#6e767d' }}>·</span>
              <span style={{ color: '#6e767d', whiteSpace: 'nowrap' }}>{tempoRelativo(post.createdAt)}</span>
            </div>
          </div>
        </div>

        {(isOwner || isAdmin) ? (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="postcard-del-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#555',
              padding: 8,
              cursor: 'pointer',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {Ico.trash()}
          </button>
        ) : (
          <button
            className="postcard-dots-btn"
            style={{
              background: 'transparent',
              border: 'none',
              padding: 8,
              cursor: 'pointer',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {Ico.dots()}
          </button>
        )}
      </div>

      {/* ── Image (full-width, before caption) ── */}
      {post.imageUrl && !post.repostOf && (
        <div style={{ width: '100%', overflow: 'hidden' }}>
          <img
            src={post.imageUrl}
            alt=""
            style={{
              width: '100%',
              maxHeight: 420,
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>
      )}

      {/* ── Repost block ── */}
      {post.repostOf && (
        <div style={{ padding: '0 16px 8px' }}>
          <RepostBlock repostOf={post.repostOf} />
        </div>
      )}

      {/* ── Actions: ♥ 💬 ✈️ | 🔖 ── */}
      <PostActions
        liked={!!liked}
        likesCount={likesCount}
        commentsCount={commentsCount}
        repostsCount={0}
        onLike={onLike}
        onComment={onComment}
        onRepost={onRepost}
      />

      {/* ── Likes count ── */}
      {likesCount > 0 && (
        <div style={{
          padding: '0 16px 4px 64px',
          fontSize: 13,
          fontWeight: 700,
          color: '#e7e9ea',
          fontFamily: 'Barlow, sans-serif',
        }}>
          {likesCount} curtida{likesCount !== 1 ? 's' : ''}
        </div>
      )}

      {/* ── Caption: Name bold + text ── */}
      {post.text && (
        <div style={{
          padding: '2px 16px 8px 64px',
          fontSize: 15,
          color: '#e7e9ea',
          lineHeight: 1.55,
          fontFamily: 'Barlow, sans-serif',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}>
          {post.text}
        </div>
      )}

      {/* ── Ver todos os comentários ── */}
      {hasComments && (
        <button
          onClick={() => setShowComments(!showComments)}
          style={{
            display: 'block',
            padding: '0 16px 4px 64px',
            fontSize: 13,
            color: '#555',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Barlow, sans-serif',
            textAlign: 'left',
          }}
        >
          {showComments
            ? 'Ocultar comentários'
            : `Ver todos os ${commentsCount} comentário${commentsCount !== 1 ? 's' : ''}`}
        </button>
      )}

      {/* ── Expanded comments ── */}
      {showComments && hasComments && (
        <div style={{ padding: '4px 16px 8px 64px' }}>
          {post.comments.map((c, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: 8,
              marginBottom: 8,
            }}>
              <Avatar src={c.photo} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13,
                  color: '#e7e9ea',
                  fontFamily: 'Barlow, sans-serif',
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                }}>
                  <span style={{ fontWeight: 700 }}>{c.user}</span>
                  {' '}{c.text}
                </div>
                <div style={{
                  fontSize: 11,
                  color: '#555',
                  fontFamily: 'Barlow, sans-serif',
                  marginTop: 2,
                }}>
                  {tempoRelativoStr(c.time)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Last comment preview (when collapsed) ── */}
      {!showComments && lastComment && (
        <div style={{
          padding: '0 16px 12px 64px',
          fontSize: 13,
          color: '#e7e9ea',
          fontFamily: 'Barlow, sans-serif',
          lineHeight: 1.5,
          wordBreak: 'break-word',
        }}>
          <span style={{ fontWeight: 700 }}>{lastComment.user}</span>
          {' '}<span style={{ color: '#aaa' }}>{lastComment.text}</span>
        </div>
      )}

      {/* ── Add comment shortcut ── */}
      <button
        onClick={onComment}
        style={{
          display: 'block',
          width: '100%',
          padding: '4px 16px 14px 64px',
          textAlign: 'left',
          fontSize: 13,
          color: '#444',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'Barlow, sans-serif',
        }}
      >
        Adicione um comentário...
      </button>

      <style>{`
        .postcard-del-btn:hover {
          background: rgba(249, 24, 128, 0.12) !important;
          color: #f91880 !important;
        }
        .postcard-dots-btn:hover {
          background: rgba(255,255,255,0.06) !important;
        }
      `}</style>
    </div>
  );
}
