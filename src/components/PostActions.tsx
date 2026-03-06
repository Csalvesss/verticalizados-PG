import { Ico } from '../icons';

interface Props {
  liked: boolean;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  onLike: () => void;
  onComment: () => void;
  onRepost: () => void;
}

export function PostActions({
  liked,
  likesCount,
  commentsCount,
  repostsCount,
  onLike,
  onComment,
  onRepost,
}: Props) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      marginLeft: -8,
      marginTop: 2,
    }}>
      <button onClick={onComment} className="action-btn comment">
        <span className="icon-wrap">{Ico.comment()}</span>
        <span className="count">{commentsCount > 0 ? commentsCount : ''}</span>
      </button>

      <button onClick={onRepost} className="action-btn repost">
        <span className="icon-wrap">{Ico.repost('#71767b')}</span>
        <span className="count">{repostsCount > 0 ? repostsCount : ''}</span>
      </button>

      <button
        onClick={onLike}
        className={`action-btn heart${liked ? ' liked' : ''}`}
        style={{ color: liked ? '#f91880' : undefined }}
      >
        <span className="icon-wrap">{Ico.heart(liked)}</span>
        <span className="count" style={{ color: liked ? '#f91880' : undefined }}>
          {likesCount > 0 ? likesCount : ''}
        </span>
      </button>

      <style>{`
        .action-btn {
          display: flex;
          align-items: center;
          gap: 2px;
          color: #555;
          font-size: 13px;
          font-family: 'Barlow', sans-serif;
          padding: 6px 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          border-radius: 999px;
          transition: color 0.15s ease, background 0.15s ease;
          min-width: 44px;
        }
        .action-btn .icon-wrap {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.15s ease;
          flex-shrink: 0;
        }
        .action-btn .count {
          font-size: 13px;
          min-width: 14px;
          display: inline-block;
        }
        .action-btn.comment:hover { color: #1d9bf0; }
        .action-btn.comment:hover .icon-wrap { background: rgba(29, 155, 240, 0.12); }

        .action-btn.repost:hover { color: #00ba7c; }
        .action-btn.repost:hover .icon-wrap { background: rgba(0, 186, 124, 0.12); }

        .action-btn.heart:hover { color: #f91880; }
        .action-btn.heart:hover .icon-wrap { background: rgba(249, 24, 128, 0.12); }
        .action-btn.heart.liked .icon-wrap { background: rgba(249, 24, 128, 0.08); }

        .action-btn:active { transform: scale(0.92); }
      `}</style>
    </div>
  );
}
