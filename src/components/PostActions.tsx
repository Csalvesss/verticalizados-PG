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
  onLike,
  onComment,
  onRepost,
}: Props) {
  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px 4px',
      }}>
        {/* Left: heart, comment, send */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={onLike}
            className={`insta-action-btn heart${liked ? ' liked' : ''}`}
            style={{ color: liked ? '#F07830' : undefined }}
          >
            {Ico.heart(liked)}
          </button>

          <button onClick={onComment} className="insta-action-btn comment">
            {Ico.comment()}
          </button>

          <button onClick={onRepost} className="insta-action-btn send">
            {Ico.send()}
          </button>
        </div>

        {/* Right: bookmark */}
        <button className="insta-action-btn bookmark">
          {Ico.bookmark(false)}
        </button>
      </div>

      <style>{`
        .insta-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border-radius: 50%;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: transform 0.15s ease, opacity 0.15s ease;
          color: #888;
        }
        .insta-action-btn:hover {
          opacity: 0.7;
        }
        .insta-action-btn:active {
          transform: scale(0.85);
        }
        .insta-action-btn.heart.liked svg {
          fill: #F07830;
          stroke: #F07830;
        }
        .insta-action-btn.heart:hover svg {
          stroke: #F07830;
        }
        .insta-action-btn.comment:hover svg {
          stroke: #e7e9ea;
        }
        .insta-action-btn.send:hover svg {
          stroke: #e7e9ea;
        }
        .insta-action-btn.bookmark:hover svg {
          stroke: #e7e9ea;
        }
      `}</style>
    </>
  );
}
