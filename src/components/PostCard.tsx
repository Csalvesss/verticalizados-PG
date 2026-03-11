import { useState } from 'react';
import { Ico } from '../icons';
import { tempoRelativo, ADMIN_EMAIL } from '../constants';
import type { Post, Comment, Reply } from '../types';
import { Avatar } from './Avatar';
import { RepostBlock } from './RepostBlock';
import { useUserPhoto, useUserName } from '../contexts/UserPhotos';
import { ShareCard } from './ShareCard';

function ReplyRow({
  r,
  uid,
  isAdmin,
  onDelete,
}: {
  r: Reply;
  uid: string;
  isAdmin: boolean;
  onDelete: () => void;
}) {
  const resolvedPhoto = useUserPhoto(r.userId, r.photo);
  const resolvedName = useUserName(r.userId, r.user);
  const canDelete = r.userId === uid || isAdmin;
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingLeft: 36, alignItems: 'flex-start' }}>
      <Avatar src={resolvedPhoto} name={resolvedName} size={22} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: '#e7e9ea', fontFamily: 'Barlow, sans-serif' }}>{resolvedName} </span>
        <span style={{ fontSize: 13, color: '#aaa', fontFamily: 'Barlow, sans-serif', lineHeight: 1.5, wordBreak: 'break-word' }}>
          {r.text}
        </span>
      </div>
      {canDelete && (
        <button
          onClick={onDelete}
          style={{
            flexShrink: 0, background: 'none', border: 'none',
            cursor: 'pointer', padding: '2px 4px', color: '#333',
          }}
        >
          {Ico.trash()}
        </button>
      )}
    </div>
  );
}

function CommentRow({
  c,
  currentUserPhoto,
  uid,
  isAdmin,
  onReply,
  onDeleteReply,
}: {
  c: Comment;
  currentUserPhoto: string;
  uid: string;
  isAdmin: boolean;
  onReply: (commentId: string, text: string) => void;
  onDeleteReply: (commentId: string, replyId: string) => void;
}) {
  const resolvedPhoto = useUserPhoto(c.userId, c.photo);
  const resolvedName = useUserName(c.userId, c.user);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  const commentId = c.id || c.time;

  function submitReply() {
    if (!replyText.trim() || !commentId) return;
    onReply(commentId, replyText.trim());
    setReplyText('');
    setReplyOpen(false);
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <Avatar src={resolvedPhoto} name={resolvedName} size={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#e7e9ea', fontFamily: 'Barlow, sans-serif' }}>{resolvedName} </span>
          <span style={{ fontSize: 14, color: '#ccc', fontFamily: 'Barlow, sans-serif', lineHeight: 1.5, wordBreak: 'break-word' }}>
            {c.text}
          </span>
          <div>
            <button
              onClick={() => setReplyOpen(v => !v)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'Barlow, sans-serif', fontSize: 12,
                color: replyOpen ? '#F07830' : '#555', padding: '4px 0', marginTop: 2,
              }}
            >
              Responder
            </button>
          </div>
        </div>
      </div>

      {/* Existing replies */}
      {(c.replies || []).map((r, i) => (
        <ReplyRow
          key={r.id || i}
          r={r}
          uid={uid}
          isAdmin={isAdmin}
          onDelete={() => onDeleteReply(c.id || c.time, r.id)}
        />
      ))}

      {/* Inline reply input */}
      {replyOpen && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingLeft: 36 }}>
          <Avatar src={currentUserPhoto} name="" size={22} />
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 6,
            background: '#111', borderRadius: 20, padding: '6px 12px',
            border: '1px solid #2a2a2a',
          }}>
            <input
              autoFocus
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReply(); } }}
              placeholder="Responder..."
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontFamily: 'Barlow, sans-serif', fontSize: 16, color: '#e7e9ea',
              }}
            />
            <button
              onClick={submitReply}
              disabled={!replyText.trim()}
              style={{
                background: 'none', border: 'none', cursor: replyText.trim() ? 'pointer' : 'default',
                fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 12,
                color: replyText.trim() ? '#F07830' : '#333', padding: 0,
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  post: Post;
  uid: string;
  isAdmin: boolean;
  following: string[];
  adminEmails: string[];
  onLike: () => void;
  onComment: () => void;
  onRepost: () => void;
  onDelete: () => void;
  onCommentReply: (commentId: string, text: string) => void;
  onDeleteReply: (commentId: string, replyId: string) => void;
  onFollow: (userId: string) => void;
  onUnfollow: (userId: string) => void;
  onOpenProfile?: (userId: string, userName: string) => void;
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
  following,
  adminEmails,
  onLike,
  onComment,
  onRepost,
  onDelete,
  onCommentReply,
  onDeleteReply,
  onFollow,
  onUnfollow,
  onOpenProfile,
}: Props) {
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const resolvedPhoto = useUserPhoto(post.userId, post.photo);
  const resolvedName = useUserName(post.userId, post.user);

  const isOwner = post.userId === uid;
  const liked = post.likes?.includes(uid);
  const isVerified = adminEmails.includes(post.userEmail || '') || post.userEmail === ADMIN_EMAIL;
  const likesCount = post.likes?.length || 0;
  const commentsCount = post.comments?.length || 0;
  const hasComments = commentsCount > 0;
  const isFollowing = following.includes(post.userId);

  return (
    <div style={{
      borderBottom: '1px solid #1a1a1a',
      background: '#000',
      padding: '12px 16px',
    }}>
      {/* Repost indicator */}
      {post.repostOf && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          paddingBottom: 8,
          paddingLeft: 52,
          fontSize: 12,
          fontWeight: 600,
          color: '#71767b',
          fontFamily: 'Barlow, sans-serif',
        }}>
          {Ico.repost('#71767b')}
          <span>{resolvedName} repostou</span>
        </div>
      )}

      {/* Two-column layout: avatar | content */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Left: avatar */}
        <div
          style={{ flexShrink: 0, cursor: onOpenProfile ? 'pointer' : 'default' }}
          onClick={() => onOpenProfile?.(post.userId, resolvedName)}
        >
          <Avatar src={resolvedPhoto} name={resolvedName} size={40} />
        </div>

        {/* Right: all content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header: name + time + action button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <button
                onClick={() => onOpenProfile?.(post.userId, resolvedName)}
                style={{
                  fontWeight: 700, color: '#e7e9ea', fontSize: 14,
                  fontFamily: 'Barlow, sans-serif', lineHeight: 1.3,
                  background: 'none', border: 'none', padding: 0,
                  cursor: onOpenProfile ? 'pointer' : 'default',
                }}
              >
                {resolvedName}
              </button>
              {isVerified && verifiedBadge}
              <span style={{
                color: '#555',
                fontSize: 13,
                fontFamily: 'Barlow, sans-serif',
              }}>
                · {tempoRelativo(post.createdAt)}
              </span>
            </div>

            {/* Dots / delete button */}
            <div style={{ position: 'relative' }}>
              {(isOwner || isAdmin) ? (
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
                  }}
                >
                  {Ico.trash()}
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
                  className="postcard-dots-btn"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 6,
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

              {/* Follow/unfollow dropdown */}
              {menuOpen && (
                <>
                  <div
                    onClick={() => setMenuOpen(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                  />
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    zIndex: 20,
                    background: '#1a1a1a',
                    border: '1px solid #2f3336',
                    borderRadius: 12,
                    minWidth: 180,
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        isFollowing ? onUnfollow(post.userId) : onFollow(post.userId);
                        setMenuOpen(false);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '12px 16px',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        color: isFollowing ? '#f4212e' : '#e7e9ea',
                        fontSize: 14,
                        fontFamily: 'Barlow, sans-serif',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {isFollowing ? `Deixar de seguir` : `Seguir @${resolvedName}`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Text content - ABOVE image, Threads style */}
          {post.text && (
            <div style={{
              fontSize: 15,
              color: '#e7e9ea',
              lineHeight: 1.55,
              fontFamily: 'Barlow, sans-serif',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              marginBottom: (post.imageUrl || post.repostOf) ? 10 : 6,
            }}>
              {post.text}
            </div>
          )}

          {/* Image - with rounded corners, Threads style */}
          {post.imageUrl && !post.repostOf && (
            <div style={{
              borderRadius: 14,
              overflow: 'hidden',
              border: '1px solid #2f3336',
              marginBottom: 10,
            }}>
              <img
                src={post.imageUrl}
                alt=""
                style={{ width: '100%', maxHeight: 440, objectFit: 'cover', display: 'block' }}
              />
            </div>
          )}

          {/* Repost block */}
          {post.repostOf && <RepostBlock repostOf={post.repostOf} />}

          {/* Actions row with counts - Threads style */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            marginTop: 4,
          }}>
            <button
              onClick={onLike}
              className={`threads-action-btn${liked ? ' liked' : ''}`}
            >
              {Ico.heart(!!liked)}
              {likesCount > 0 && <span className="action-count">{likesCount}</span>}
            </button>

            <button onClick={onComment} className="threads-action-btn">
              {Ico.comment()}
              {commentsCount > 0 && <span className="action-count">{commentsCount}</span>}
            </button>

            <button onClick={onRepost} className="threads-action-btn">
              {Ico.repost()}
            </button>

            <button
              className="threads-action-btn"
              onClick={() => setShowShare(true)}
            >
              {Ico.send()}
            </button>
          </div>

          {/* Comments toggle */}
          {hasComments && (
            <button
              onClick={() => setShowComments(!showComments)}
              style={{
                display: 'block',
                marginTop: 4,
                fontSize: 13,
                color: '#555',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Barlow, sans-serif',
                padding: '2px 0',
                textAlign: 'left',
              }}
            >
              {showComments
                ? 'Ocultar respostas'
                : `Ver ${commentsCount} resposta${commentsCount !== 1 ? 's' : ''}`}
            </button>
          )}

          {/* Expanded comments */}
          {showComments && hasComments && (
            <div style={{ marginTop: 10 }}>
              {post.comments.map((c, i) => (
                <CommentRow
                  key={c.id || i}
                  c={c}
                  currentUserPhoto={resolvedPhoto}
                  uid={uid}
                  isAdmin={isAdmin}
                  onReply={onCommentReply}
                  onDeleteReply={onDeleteReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showShare && (
        <ShareCard
          post={post}
          authorName={resolvedName}
          authorPhoto={resolvedPhoto}
          onClose={() => setShowShare(false)}
        />
      )}

      <style>{`
        .postcard-del-btn:hover { background: rgba(249,24,128,0.12) !important; color: #f91880 !important; }
        .postcard-dots-btn:hover { background: rgba(255,255,255,0.06) !important; }
        .threads-action-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 6px 8px; border-radius: 20px;
          background: transparent; border: none; cursor: pointer;
          transition: background 0.15s; color: #888;
        }
        .threads-action-btn:hover { background: rgba(255,255,255,0.06); }
        .threads-action-btn:active { transform: scale(0.88); }
        .threads-action-btn.liked svg { fill: #F07830; stroke: #F07830; }
        .action-count {
          font-size: 13px; font-family: 'Barlow', sans-serif;
          color: #888; line-height: 1;
        }
        .threads-action-btn.liked .action-count { color: #F07830; }
      `}</style>
    </div>
  );
}
