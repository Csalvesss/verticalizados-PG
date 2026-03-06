import { Ico } from '../icons';
import { tempoRelativo, ADMIN_EMAIL } from '../constants';
import type { Post } from '../types';
import { Avatar } from './Avatar';
import { PostActions } from './PostActions';

interface Props {
  post: Post;
  uid: string;
  isAdmin: boolean;
  onLike: () => void;
  onComment: () => void;
  onRepost: () => void;
  onDelete: () => void;
}

export function PostCard({
  post,
  uid,
  isAdmin,
  onLike,
  onComment,
  onRepost,
  onDelete,
}: Props) {
  const isOwner = post.userId === uid;
  const liked = post.likes?.includes(uid);
  const isVerified = post.userEmail === ADMIN_EMAIL;
  const isRepostVerified = post.repostOf?.userEmail === ADMIN_EMAIL;

  return (
    <div style={{
      padding: '12px 16px',
      borderBottom: '1px solid #2f3336',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Repost Indicator */}
      {post.repostOf && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 4,
          paddingLeft: 28, // Align with content start
          fontSize: 13,
          fontWeight: 700,
          color: '#71767b',
          fontFamily: 'Barlow, sans-serif'
        }}>
          {Ico.repost('#71767b')}
          <span>{post.user} repostou</span>
        </div>
      )}

      {/* Main Body */}
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar src={post.photo} size={40} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 2
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', minWidth: 0 }}>
              <span style={{
                fontWeight: 700,
                color: '#fff',
                fontSize: 15,
                fontFamily: 'Barlow, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {post.user}
                {isVerified && (
                  <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, fill: '#F07830', flexShrink: 0 }}>
                    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.35-6.2 6.78z" />
                  </svg>
                )}
              </span>
              <span style={{
                color: '#71767b',
                fontSize: 15,
                fontFamily: 'Barlow, sans-serif'
              }}>
                · {tempoRelativo(post.createdAt)}
              </span>
            </div>

            {(isOwner || isAdmin) && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="postcard-del-btn"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#71767b',
                  padding: 8,
                  cursor: 'pointer',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: '0.2s'
                }}
              >
                {Ico.trash()}
              </button>
            )}
          </div>

          {/* Post text */}
          {post.text && (
            <p style={{
              fontSize: 15,
              color: '#e7e9ea',
              lineHeight: 1.5,
              marginBottom: 10,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              fontFamily: 'Barlow, sans-serif'
            }}>
              {post.text}
            </p>
          )}

          {/* Primary image */}
          {post.imageUrl && !post.repostOf && (
            <div style={{
              borderRadius: 16,
              overflow: 'hidden',
              border: '1px solid #2f3336',
              marginBottom: 10,
              marginTop: post.text ? 0 : 4
            }}>
              <img src={post.imageUrl} alt="" style={{ width: '100%', maxHeight: 512, objectFit: 'cover', display: 'block' }} />
            </div>
          )}

          {/* Repost block */}
          {post.repostOf && (
            <div style={{
              borderRadius: 16,
              border: '1px solid #2f3336',
              padding: 12,
              marginBottom: 10,
              marginTop: 4,
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{
                  fontWeight: 700,
                  color: '#fff',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  fontFamily: 'Barlow, sans-serif'
                }}>
                  {post.repostOf.user}
                  {isRepostVerified && (
                    <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: '#F07830' }}>
                      <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.35-6.2 6.78z" />
                    </svg>
                  )}
                </span>
              </div>
              {post.repostOf.text && (
                <p style={{
                  fontSize: 14,
                  color: '#e7e9ea',
                  lineHeight: 1.4,
                  marginTop: 0,
                  marginBottom: post.repostOf.imageUrl ? 8 : 0,
                  fontFamily: 'Barlow, sans-serif'
                }}>
                  {post.repostOf.text}
                </p>
              )}
              {post.repostOf.imageUrl && (
                <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #2f3336' }}>
                  <img src={post.repostOf.imageUrl} alt="" style={{ width: '100%', maxHeight: 300, objectFit: 'cover', display: 'block' }} />
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <PostActions
            liked={liked}
            likesCount={post.likes?.length || 0}
            commentsCount={post.comments?.length || 0}
            onLike={onLike}
            onComment={onComment}
            onRepost={onRepost}
          />

          {/* Comments List */}
          {post.comments?.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {post.comments.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 12 }}>
                  <Avatar src={c.photo} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: 14, fontFamily: 'Barlow, sans-serif' }}>{c.user}</span>
                    </div>
                    <p style={{ fontSize: 14, color: '#e7e9ea', lineHeight: 1.4, fontFamily: 'Barlow, sans-serif' }}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`
        .postcard-del-btn:hover {
          background: rgba(29, 155, 240, 0.1);
          color: #1d9bf0 !important;
        }
      `}</style>
    </div>
  );
}
