import { Ico } from '../icons';

interface Props {
  liked: boolean;
  likesCount: number;
  commentsCount: number;
  onLike: () => void;
  onComment: () => void;
  onRepost: () => void;
}

export function PostActions({
  liked,
  likesCount,
  commentsCount,
  onLike,
  onComment,
  onRepost,
}: Props) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      maxWidth: 320,
      marginTop: 4,
      marginLeft: -8, // Align icons with text start
    }}>
      <button onClick={onComment} className="action-btn comment">
        <div className="icon-wrap">{Ico.comment()}</div>
        <span>{commentsCount}</span>
      </button>

      <button onClick={onRepost} className="action-btn repost">
        <div className="icon-wrap">{Ico.repost('#71767b')}</div>
        <span>0</span>
      </button>

      <button onClick={onLike} className="action-btn heart" style={{ color: liked ? '#f91880' : '#71767b' }}>
        <div className="icon-wrap">{Ico.heart(liked)}</div>
        <span style={{ color: liked ? '#f91880' : '#71767b' }}>{likesCount}</span>
      </button>

      <div style={{ width: 20 }} />

      <style>{`
        .action-btn {
          display: flex;
          alignItems: center;
          gap: 4px;
          color: #71767b;
          font-size: 13px;
          font-family: 'Barlow', sans-serif;
          padding: 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: 0.2s;
        }
        .icon-wrap {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: 0.2s;
        }
        .action-btn.comment:hover { color: #1d9bf0; }
        .action-btn.comment:hover .icon-wrap { background: rgba(29, 155, 240, 0.1); }

        .action-btn.repost:hover { color: #00ba7c; }
        .action-btn.repost:hover .icon-wrap { background: rgba(0, 186, 124, 0.1); }

        .action-btn.heart:hover { color: #f91880; }
        .action-btn.heart:hover .icon-wrap { background: rgba(249, 24, 128, 0.1); }

        .action-btn:active { transform: scale(0.95); }
      `}</style>
    </div>
  );
}
