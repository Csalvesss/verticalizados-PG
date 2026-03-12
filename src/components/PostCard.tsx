import { useState } from 'react';
import { Ico } from '../icons';
import { tempoRelativo, ADMIN_EMAIL } from '../constants';
import type { Post, Comment, Reply } from '../types';
import { Avatar } from './Avatar';
import { RepostBlock } from './RepostBlock';
import { useUserPhoto, useUserName } from '../contexts/UserPhotos';
import { ShareCard } from './ShareCard';
import { ActionSheet } from './ActionSheet';

// ─── SVG icons for the action sheet ──────────────────────────────────────────
const IcoEdit = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IcoTranslate = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
  </svg>
);
const IcoSave = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
);
const IcoPin = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
  </svg>
);
const IcoTrashRed = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
);
const IcoFollow = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="19" y1="8" x2="19" y2="14"/>
    <line x1="22" y1="11" x2="16" y2="11"/>
  </svg>
);
const IcoUnfollow = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="22" y1="11" x2="16" y2="11"/>
  </svg>
);

// ─── Reply row ────────────────────────────────────────────────────────────────
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const canModify = r.userId === uid || isAdmin;
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingLeft: 36, alignItems: 'flex-start' }}>
      <Avatar src={resolvedPhoto} name={resolvedName} size={22} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: '#e7e9ea', fontFamily: 'Barlow, sans-serif' }}>{resolvedName} </span>
        <span style={{ fontSize: 13, color: '#aaa', fontFamily: 'Barlow, sans-serif', lineHeight: 1.5, wordBreak: 'break-word' }}>
          {r.text}
        </span>
      </div>
      {canModify && (
        <button
          onClick={() => setSheetOpen(true)}
          style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: '#444', display: 'flex' }}
        >
          {Ico.dots()}
        </button>
      )}
      {sheetOpen && (
        <ActionSheet
          onClose={() => setSheetOpen(false)}
          items={[
            { label: 'Excluir resposta', icon: <IcoTrashRed />, onClick: onDelete, destructive: true },
          ]}
        />
      )}
    </div>
  );
}

// ─── Comment row ──────────────────────────────────────────────────────────────
function CommentRow({
  c,
  currentUserPhoto,
  uid,
  isAdmin,
  onReply,
  onDeleteComment,
  onEditComment,
  onDeleteReply,
}: {
  c: Comment;
  currentUserPhoto: string;
  uid: string;
  isAdmin: boolean;
  onReply: (commentId: string, text: string) => void;
  onDeleteComment: (commentId: string) => void;
  onEditComment: (commentId: string, newText: string) => void;
  onDeleteReply: (commentId: string, replyId: string) => void;
}) {
  const resolvedPhoto = useUserPhoto(c.userId, c.photo);
  const resolvedName = useUserName(c.userId, c.user);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(c.text);

  const commentId = c.id || c.time;
  const canModify = c.userId === uid || isAdmin;

  function submitReply() {
    if (!replyText.trim() || !commentId) return;
    onReply(commentId, replyText.trim());
    setReplyText('');
    setReplyOpen(false);
  }

  function submitEdit() {
    if (!editText.trim() || !commentId) return;
    onEditComment(commentId, editText.trim());
    setEditing(false);
  }

  const sheetItems = [
    ...(canModify ? [
      {
        label: 'Editar comentário',
        icon: <IcoEdit />,
        onClick: () => { setEditText(c.text); setEditing(true); },
      },
    ] : []),
    {
      label: 'Traduzir',
      icon: <IcoTranslate />,
      onClick: () => window.open(`https://translate.google.com/?sl=auto&tl=pt&text=${encodeURIComponent(c.text)}`, '_blank'),
    },
    {
      label: 'Salvar',
      icon: <IcoSave />,
      onClick: () => {},
    },
    ...(canModify ? [
      { label: 'Excluir comentário', icon: <IcoTrashRed />, onClick: () => commentId && onDeleteComment(commentId), destructive: true },
    ] : []),
  ];

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <Avatar src={resolvedPhoto} name={resolvedName} size={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#e7e9ea', fontFamily: 'Barlow, sans-serif' }}>{resolvedName} </span>
              {editing ? (
                <div style={{ marginTop: 4 }}>
                  <textarea
                    autoFocus
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    style={{
                      width: '100%', background: '#111', border: '1px solid #333',
                      borderRadius: 8, padding: '6px 10px', color: '#e7e9ea',
                      fontFamily: 'Barlow, sans-serif', fontSize: 14, resize: 'none',
                      outline: 'none', boxSizing: 'border-box', lineHeight: 1.4,
                    }}
                    rows={2}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                      onClick={() => setEditing(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Barlow', fontSize: 12, color: '#555', padding: 0 }}
                    >Cancelar</button>
                    <button
                      onClick={submitEdit}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 12, color: '#F07830', padding: 0 }}
                    >Salvar</button>
                  </div>
                </div>
              ) : (
                <span style={{ fontSize: 14, color: '#ccc', fontFamily: 'Barlow, sans-serif', lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {c.text}
                </span>
              )}
            </div>
            <button
              onClick={() => setSheetOpen(true)}
              style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: '#444', display: 'flex', alignItems: 'center' }}
            >
              {Ico.dots()}
            </button>
          </div>
          {!editing && (
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
          )}
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

      {sheetOpen && (
        <ActionSheet items={sheetItems} onClose={() => setSheetOpen(false)} />
      )}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
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
  onEditPost: (newText: string) => void;
  onCommentReply: (commentId: string, text: string) => void;
  onDeleteReply: (commentId: string, replyId: string) => void;
  onDeleteComment: (commentId: string) => void;
  onEditComment: (commentId: string, newText: string) => void;
  onFollow: (userId: string) => void;
  onUnfollow: (userId: string) => void;
  onOpenProfile?: (userId: string, userName: string) => void;
}

const verifiedBadge = (
  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: '#F07830', flexShrink: 0, marginLeft: 2 }}>
    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.35-6.2 6.78z" />
  </svg>
);

// ─── Main PostCard ────────────────────────────────────────────────────────────
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
  onEditPost,
  onCommentReply,
  onDeleteReply,
  onDeleteComment,
  onEditComment,
  onFollow,
  onUnfollow,
  onOpenProfile,
}: Props) {
  const [showComments, setShowComments] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [editPostText, setEditPostText] = useState(post.text);
  const resolvedPhoto = useUserPhoto(post.userId, post.photo);
  const resolvedName = useUserName(post.userId, post.user);

  const isOwner = post.userId === uid;
  const liked = post.likes?.includes(uid);
  const isVerified = adminEmails.includes(post.userEmail || '') || post.userEmail === ADMIN_EMAIL;
  const likesCount = post.likes?.length || 0;
  const commentsCount = post.comments?.length || 0;
  const hasComments = commentsCount > 0;
  const isFollowing = following.includes(post.userId);

  const postSheetItems = [
    ...(isOwner || isAdmin ? [
      {
        label: 'Editar',
        icon: <IcoEdit />,
        onClick: () => { setEditPostText(post.text); setEditingPost(true); },
      },
    ] : []),
    {
      label: 'Traduzir',
      icon: <IcoTranslate />,
      onClick: () => window.open(`https://translate.google.com/?sl=auto&tl=pt&text=${encodeURIComponent(post.text)}`, '_blank'),
    },
    {
      label: 'Salvar',
      icon: <IcoSave />,
      onClick: () => {},
    },
    ...(isOwner || isAdmin ? [
      { label: 'Fixar no perfil', icon: <IcoPin />, onClick: () => {} },
    ] : []),
    ...(!isOwner ? [
      {
        label: isFollowing ? `Deixar de seguir` : `Seguir @${resolvedName}`,
        icon: isFollowing ? <IcoUnfollow /> : <IcoFollow />,
        onClick: () => isFollowing ? onUnfollow(post.userId) : onFollow(post.userId),
        destructive: isFollowing,
      },
    ] : []),
    ...(isOwner || isAdmin ? [
      { label: 'Excluir', icon: <IcoTrashRed />, onClick: onDelete, destructive: true },
    ] : []),
  ];

  return (
    <div style={{
      borderBottom: '1px solid #1a1a1a',
      background: '#000',
      padding: '12px 16px',
    }}>
      {/* Repost indicator */}
      {post.repostOf && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          paddingBottom: 8, paddingLeft: 52,
          fontSize: 12, fontWeight: 600, color: '#71767b', fontFamily: 'Barlow, sans-serif',
        }}>
          {Ico.repost('#71767b')}
          <span>{resolvedName} repostou</span>
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div
          style={{ flexShrink: 0, cursor: onOpenProfile ? 'pointer' : 'default' }}
          onClick={() => onOpenProfile?.(post.userId, resolvedName)}
        >
          <Avatar src={resolvedPhoto} name={resolvedName} size={40} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
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
              <span style={{ color: '#555', fontSize: 13, fontFamily: 'Barlow, sans-serif' }}>
                · {tempoRelativo(post.createdAt)}
              </span>
            </div>

            {/* Always dots button → ActionSheet */}
            <button
              onClick={(e) => { e.stopPropagation(); setSheetOpen(true); }}
              style={{
                background: 'transparent', border: 'none', color: '#555',
                padding: 6, cursor: 'pointer', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {Ico.dots()}
            </button>
          </div>

          {/* Text or edit mode */}
          {editingPost ? (
            <div style={{ marginBottom: 8 }}>
              <textarea
                autoFocus
                value={editPostText}
                onChange={e => setEditPostText(e.target.value)}
                style={{
                  width: '100%', background: '#111', border: '1px solid #333',
                  borderRadius: 10, padding: '8px 12px', color: '#e7e9ea',
                  fontFamily: 'Barlow, sans-serif', fontSize: 15, resize: 'none',
                  outline: 'none', boxSizing: 'border-box', lineHeight: 1.5,
                }}
                rows={3}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button
                  onClick={() => setEditingPost(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Barlow', fontSize: 13, color: '#555', padding: 0 }}
                >Cancelar</button>
                <button
                  onClick={() => { onEditPost(editPostText.trim()); setEditingPost(false); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 13, color: '#F07830', padding: 0 }}
                >Salvar</button>
              </div>
            </div>
          ) : post.text ? (
            <div style={{
              fontSize: 15, color: '#e7e9ea', lineHeight: 1.55,
              fontFamily: 'Barlow, sans-serif', wordBreak: 'break-word', whiteSpace: 'pre-wrap',
              marginBottom: (post.imageUrl || post.repostOf) ? 10 : 6,
            }}>
              {post.text}
            </div>
          ) : null}

          {/* Image */}
          {post.imageUrl && !post.repostOf && (
            <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #2f3336', marginBottom: 10 }}>
              <img src={post.imageUrl} alt="" style={{ width: '100%', maxHeight: 440, objectFit: 'cover', display: 'block' }} />
            </div>
          )}

          {/* Repost block */}
          {post.repostOf && <RepostBlock repostOf={post.repostOf} />}

          {/* Actions row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 4 }}>
            <button onClick={onLike} className={`threads-action-btn${liked ? ' liked' : ''}`}>
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
            <button className="threads-action-btn" onClick={() => setShowShare(true)}>
              {Ico.send()}
            </button>
          </div>

          {/* Comments toggle */}
          {hasComments && (
            <button
              onClick={() => setShowComments(!showComments)}
              style={{
                display: 'block', marginTop: 4, fontSize: 13, color: '#555',
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: 'Barlow, sans-serif', padding: '2px 0', textAlign: 'left',
              }}
            >
              {showComments ? 'Ocultar respostas' : `Ver ${commentsCount} resposta${commentsCount !== 1 ? 's' : ''}`}
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
                  onDeleteComment={onDeleteComment}
                  onEditComment={onEditComment}
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

      {sheetOpen && (
        <ActionSheet items={postSheetItems} onClose={() => setSheetOpen(false)} />
      )}

      <style>{`
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
          font-size: 13px; font-family: 'Barlow', sans-serif; color: #888; line-height: 1;
        }
        .threads-action-btn.liked .action-count { color: #F07830; }
      `}</style>
    </div>
  );
}
