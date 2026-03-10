import type { Post, CurrentUser } from '../types';

interface Props {
  posts: Post[];
  currentUser: CurrentUser;
  activeUserId?: string | null;
  onStoryPress?: (userId: string) => void;
}

export function StoriesBar({ posts, currentUser, activeUserId, onStoryPress }: Props) {
  const seen = new Set<string>();
  const posters: { userId: string; user: string; photo: string; hasPost: boolean }[] = [];

  seen.add(currentUser.uid);
  posters.push({
    userId: currentUser.uid,
    user: currentUser.name,
    photo: currentUser.photo,
    hasPost: posts.some(p => p.userId === currentUser.uid),
  });

  for (const p of posts) {
    if (!seen.has(p.userId)) {
      seen.add(p.userId);
      posters.push({ userId: p.userId, user: p.user, photo: p.photo, hasPost: true });
    }
    if (posters.length >= 10) break;
  }

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
        const isMe = p.userId === currentUser.uid;
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
                : p.hasPost
                  ? 'linear-gradient(135deg, #F07830 0%, #D4621A 60%, #ff9a55 100%)'
                  : '#2a2a2a',
              position: 'relative',
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
                  border: '3px solid #000',
                  display: 'block',
                  boxSizing: 'border-box',
                }}
              />

              {isMe && (
                <div style={{
                  position: 'absolute',
                  bottom: 1,
                  right: 1,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#F07830',
                  border: '2px solid #000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  color: '#fff',
                  fontWeight: 700,
                  lineHeight: 1,
                  boxSizing: 'border-box',
                }}>
                  +
                </div>
              )}
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
              {isMe ? 'Seu feed' : p.user}
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
