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
    <div style={{ padding: '12px 16px', borderBottom: '1px solid #2f3336', transition: 'background 0.2s' }} className="post-card-container">
      {post.repostOf && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, marginLeft: 28, fontSize: 13, fontWeight: 700, color: '#71767b' }}>
          {Ico.repost('#71767b')}
          <span>{post.user} repostou</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <Avatar src={post.photo} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, color: '#fff', fontSize: 15, display: 'flex', alignItems: 'center', gap: 2 }}>
                {post.user}
                {isVerified && (
                  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: '#F07830' }}>
                    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.35-6.2 6.78z" />
                  </svg>
                )}
              </span>
              <span style={{ color: '#71767b', fontSize: 14 }}>
                · {tempoRelativo(post.createdAt)}
              </span>
            </div>

            {(isOwner || isAdmin) && (
              <button onClick={onDelete} style={{ color: '#71767b', padding: 8 }} className="postcard-icon-hover">
                {Ico.trash()}
              </button>
            )}
          </div>

          {post.text && (
            <p style={{ fontSize: 15, color: '#e7e9ea', lineHeight: 1.5, marginTop: 8, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
              {post.text}
            </p>
          )}

          {post.imageUrl && !post.repostOf && (
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #2f3336', marginTop: 10 }}>
              <img src={post.imageUrl} alt="" style={{ width: '100%', maxHeight: 512, objectFit: 'cover', display: 'block' }} />
            </div>
          )}

          {post.repostOf && (
            <div style={{ borderRadius: 16, border: '1px solid #2f3336', padding: 12, marginTop: 10, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', gap: 2 }}>
                  {post.repostOf.user}
                  {isRepostVerified && (
                    <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: '#F07830' }}>
                      <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.35-6.2 6.78z" />
                    </svg>
                  )}
                </span>
              </div>
              {post.repostOf.text && (
                <p style={{ fontSize: 14, color: '#e7e9ea', lineHeight: 1.4, margin: '4px 0 8px' }}>
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

          <div style={{ marginTop: 12 }}>
            <PostActions
              liked={liked}
              likesCount={post.likes?.length || 0}
              commentsCount={post.comments?.length || 0}
              onLike={onLike}
              onComment={onComment}
              onRepost={onRepost}
            />
          </div>

          {post.comments?.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {post.comments.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 10 }}>
                  <Avatar src={c.photo} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{c.user}</span>
                    </div>
                    <p style={{ fontSize: 14, color: '#e7e9ea', lineHeight: 1.4 }}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`
        .post-card-container:hover {
          background: rgba(255, 255, 255, 0.01);
        }
        .postcard-icon-hover:hover {
          background: rgba(113, 118, 123, 0.1);
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}
