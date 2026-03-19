import type { Post, CurrentUser } from '../types';

interface Props {
  posts: Post[];
  currentUser: CurrentUser;
  activeUserId?: string | null;
  onStoryPress?: (userId: string) => void;
}

export function StoriesBar({ posts, currentUser, activeUserId, onStoryPress }: Props) {
  // Only show other users who actually have posts (skip current user entirely)
  const seen = new Set<string>([currentUser.uid]);
  const posters: { userId: string; user: string; photo: string }[] = [];

  for (const p of posts) {
    if (!seen.has(p.userId)) {
      seen.add(p.userId);
      posters.push({ userId: p.userId, user: p.user, photo: p.photo });
    }
    if (posters.length >= 12) break;
  }

  if (posters.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      overflowX: 'auto',
      gap: 14,
      padding: '12px 14px 14px',
      borderBottom: '1px solid #1a1a1a',
      scrollbarWidth: 'none',
    }}>
      {posters.map((p) => {
        const isActive = activeUserId === p.userId;

        return (
          <button
            key={p.userId}
            onClick={() => onStoryPress?.(p.userId)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 5,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0,
              padding: 0,
              opacity: activeUserId && !isActive ? 0.45 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {/* Ring + avatar */}
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              padding: 3,
              background: isActive
                ? 'linear-gradient(135deg, #fff 0%, #F07830 100%)'
                : 'linear-gradient(135deg, #F07830 0%, #D4621A 60%, #ff9a55 100%)',
              boxSizing: 'border-box',
            }}>
              <img
                src={p.photo}
                alt={p.user}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #0f0f0f',
                  display: 'block',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <span style={{
              fontSize: 10,
              color: isActive ? '#F07830' : '#888',
              fontFamily: 'Barlow, sans-serif',
              fontWeight: isActive ? 700 : 400,
              maxWidth: 60,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
              transition: 'color 0.2s',
            }}>
              {p.user}
            </span>
          </button>
        );
      })}

      <style>{`
        .stories-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
