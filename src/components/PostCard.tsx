import { Ico } from '../icons';
import { tempoRelativo, tempoRelativoStr, toHandle, ADMIN_EMAIL } from '../constants';
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
  const hasComments = (post.comments?.length ?? 0) > 0;

  return (
    <div className="post-card" style={{
      padding: '12px 16px 0',
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
          gap: 6,
          marginBottom: 6,
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

      {/* Main tweet row */}
      <div style={{ display: 'flex', gap: 12 }}>

        {/* Left column: avatar + thread line */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <Avatar src={post.photo} size={40} />
          {hasComments && (
            <div style={{
              flex: 1,
              width: 2,
              background: '#2f3336',
              marginTop: 4,
              borderRadius: 1,
              minHeight: 16,
            }} />
          )}
        </div>

        {/* Right column: content */}
        <div style={{ flex: 1, minWidth: 0, paddingBottom: hasComments ? 6 : 12 }}>

          {/* Header: name @handle · time | delete */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 3,
          }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 4,
              flex: 1,
              minWidth: 0,
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
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {toHandle(post.user)} · {tempoRelativo(post.createdAt)}
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
              marginBottom: (post.imageUrl || post.repostOf) ? 10 : 2,
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
              marginBottom: 10,
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
        </div>
      </div>

      {/* Comments as tweet replies */}
      {hasComments && post.comments.map((c, i) => {
        const isLast = i === post.comments.length - 1;
        return (
          <div key={i} style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
            {/* Left column: reply avatar + optional thread line */}
            <div style={{
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <Avatar src={c.photo} size={32} />
              {!isLast && (
                <div style={{
                  flex: 1,
                  width: 2,
                  background: '#2f3336',
                  marginTop: 4,
                  borderRadius: 1,
                  minHeight: 16,
                }} />
              )}
            </div>

            {/* Reply content */}
            <div style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? 12 : 4 }}>
              <div style={{
                color: '#71767b',
                fontSize: 12,
                fontFamily: 'Barlow, sans-serif',
                marginBottom: 1,
              }}>
                Respondendo a {toHandle(post.user)}
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 4,
                marginBottom: 3,
              }}>
                <span style={{
                  fontWeight: 700,
                  color: '#e7e9ea',
                  fontSize: 14,
                  fontFamily: 'Barlow, sans-serif',
                }}>
                  {c.user}
                </span>
                <span style={{
                  color: '#71767b',
                  fontSize: 13,
                  fontFamily: 'Barlow, sans-serif',
                  whiteSpace: 'nowrap',
                }}>
                  {toHandle(c.user)} · {tempoRelativoStr(c.time)}
                </span>
              </div>
              <p style={{
                fontSize: 14,
                color: '#e7e9ea',
                lineHeight: 1.5,
                margin: 0,
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                fontFamily: 'Barlow, sans-serif',
              }}>
                {c.text}
              </p>
            </div>
          </div>
        );
      })}

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
