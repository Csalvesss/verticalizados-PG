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
  const iconBtnStyle = (activeColor: string, active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: active ? activeColor : '#71767b',
    fontSize: 13,
    fontFamily: 'Barlow',
    padding: '8px 0',
    minWidth: 60,
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: 340,
        marginTop: 4,
      }}
    >
      <button onClick={onComment} style={iconBtnStyle('#1d9bf0', false)} className="action-btn-hover">
        <div className="action-circle">{Ico.comment()}</div>
        <span>{commentsCount}</span>
      </button>

      <button onClick={onRepost} style={iconBtnStyle('#00ba7c', false)} className="action-btn-hover">
        <div className="action-circle">{Ico.repost('#71767b')}</div>
        <span>0</span>
      </button>

      <button onClick={onLike} style={iconBtnStyle('#f91880', liked)} className="action-btn-hover">
        <div className="action-circle">{Ico.heart(liked)}</div>
        <span style={{ color: liked ? '#f91880' : '#71767b' }}>{likesCount}</span>
      </button>

      <div style={{ width: 20 }} />

      <style>{`
        .action-btn-hover:hover .action-circle {
          background: rgba(113, 118, 123, 0.1);
        }
        .action-btn-hover:hover span {
          text-decoration: none;
        }
        .action-circle {
          width: 34px;
          height: 34px;
          display: flex;
          alignItems: center;
          justifyContent: center;
          border-radius: 50%;
          transition: 0.2s;
        }
      `}</style>
    </div>
  );
}
