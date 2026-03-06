import { Ico } from '../icons';
import { tempoRelativo, ADMIN_EMAIL } from '../constants';
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
  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: '#F07830', flexShrink: 0 }}>
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
  const isOwner = post.userId === uid;
  const liked = post.likes?.includes(uid);
  const isVerified = post.userEmail === ADMIN_EMAIL;

  return (
    <div className="post-card" style={{
      padding: '12px 16px',
      borderBottom: '1px solid #2f3336',
      background: '#000',
      cursor: 'default',
      transition: 'background 0.15s ease',
    }}>
      {/* Repost indicator */}
      {post.repostOf && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
          paddingLeft: 52,
          fontSize: 13,
          fontWeight: 600,
          color: '#71767b',
          fontFamily: 'Barlow, sans-serif',
        }}>
          {Ico.repost('#71767b')}
          <span>{post.user} repostou</span>
        </div>
      )}

      {/* Main row: avatar + content */}
      <div style={{ display: 'flex', gap: 12 }}>
        {/* Avatar */}
        <div style={{ flexShrink: 0, paddingTop: 2 }}>
          <Avatar src={post.photo} size={40} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 4,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              flexWrap: 'wrap',
              minWidth: 0,
              flex: 1,
              lineHeight: 1.3,
            }}>
              <span style={{
                fontWeight: 700,
                color: '#e7e9ea',
                fontSize: 15,
                fontFamily: 'Barlow, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}>
                {post.user}
                {isVerified && verifiedBadge}
              </span>
              <span style={{
                color: '#71767b',
                fontSize: 14,
                fontFamily: 'Barlow, sans-serif',
                whiteSpace: 'nowrap',
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
                  color: '#555',
                  padding: 6,
                  cursor: 'pointer',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                  marginTop: -2,
                  marginRight: -6,
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
              lineHeight: 1.55,
              margin: 0,
              marginBottom: (post.imageUrl || post.repostOf) ? 10 : 12,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              fontFamily: 'Barlow, sans-serif',
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
              marginBottom: 12,
            }}>
              <img
                src={post.imageUrl}
                alt=""
                style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }}
              />
            </div>
          )}

          {/* Repost block */}
          {post.repostOf && <RepostBlock repostOf={post.repostOf} />}

          {/* Actions */}
          <PostActions
            liked={!!liked}
            likesCount={post.likes?.length || 0}
            commentsCount={post.comments?.length || 0}
            repostsCount={0}
            onLike={onLike}
            onComment={onComment}
            onRepost={onRepost}
          />

          {/* Comments */}
          {post.comments?.length > 0 && (
            <div style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid #1e1e1e',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              {post.comments.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 10 }}>
                  <Avatar src={c.photo} size={28} />
                  <div style={{
                    flex: 1,
                    minWidth: 0,
                    background: '#0d0d0d',
                    borderRadius: 12,
                    padding: '8px 12px',
                    border: '1px solid #1e1e1e',
                  }}>
                    <span style={{
                      fontWeight: 700,
                      color: '#e7e9ea',
                      fontSize: 13,
                      fontFamily: 'Barlow, sans-serif',
                    }}>
                      {c.user}
                    </span>
                    <p style={{
                      fontSize: 13,
                      color: '#ccc',
                      lineHeight: 1.45,
                      margin: '2px 0 0',
                      wordBreak: 'break-word',
                      fontFamily: 'Barlow, sans-serif',
                    }}>
                      {c.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .post-card:hover {
          background: rgba(255, 255, 255, 0.03) !important;
        }
        .postcard-del-btn:hover {
          background: rgba(249, 24, 128, 0.12) !important;
          color: #f91880 !important;
        }
      `}</style>
    </div>
  );
}
