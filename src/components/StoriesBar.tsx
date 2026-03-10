import type { Post, CurrentUser } from '../types';

interface Props {
  posts: Post[];
  currentUser: CurrentUser;
  onStoryPress?: (userId: string) => void;
}

export function StoriesBar({ posts, currentUser, onStoryPress }: Props) {
  // Deduplicate posters (keep first occurrence = most recent)
  const seen = new Set<string>();
  const posters: { userId: string; user: string; photo: string; hasPost: boolean }[] = [];

  // Current user first
  seen.add(currentUser.uid);
  posters.push({
    userId: currentUser.uid,
    user: currentUser.name,
    photo: currentUser.photo,
    hasPost: posts.some(p => p.userId === currentUser.uid),
  });

  // Then recent posters
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
      WebkitOverflowScrolling: 'touch' as never,
    }}>
      {posters.map((p) => {
        const isMe = p.userId === currentUser.uid;
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
            }}
          >
            {/* Ring + avatar */}
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              padding: 2.5,
              background: p.hasPost
                ? 'linear-gradient(135deg, #F07830 0%, #D4621A 50%, #ff9a55 100%)'
                : '#2a2a2a',
              position: 'relative',
            }}>
              <img
                src={p.photo}
                alt={p.user}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #000',
                  display: 'block',
                }}
              />

              {/* + badge for current user */}
              {isMe && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
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
                }}>
                  +
                </div>
              )}
            </div>

            {/* Name label */}
            <span style={{
              fontSize: 10,
              color: '#aaa',
              fontFamily: 'Barlow, sans-serif',
              maxWidth: 60,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
            }}>
              {isMe ? 'Seu feed' : p.user}
            </span>
          </button>
        );
      })}

      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
