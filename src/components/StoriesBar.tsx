import { Avatar } from './Avatar';
import type { Post, CurrentUser } from '../types';

interface Props {
  posts: Post[];
  currentUser: CurrentUser;
  activeUserId?: string | null;
  onStoryPress?: (userId: string) => void;
  onAddStory?: () => void;
}

export function StoriesBar({ posts, currentUser, activeUserId, onStoryPress, onAddStory }: Props) {
  // Build unique poster list (other users who have posts only)
  const seen = new Set<string>([currentUser.uid]);
  const posters: { userId: string; user: string; photo: string }[] = [];

  for (const p of posts) {
    if (!seen.has(p.userId)) {
      seen.add(p.userId);
      posters.push({ userId: p.userId, user: p.user, photo: p.photo });
    }
    if (posters.length >= 12) break;
  }

  return (
    <div style={{
      display: 'flex',
      overflowX: 'auto',
      gap: 14,
      padding: '12px 14px 14px',
      borderBottom: '1px solid #1a1a1a',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
    }}>
      {/* Current user — "add story" button */}
      <button
        onClick={onAddStory}
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
        <div style={{ position: 'relative', width: 60, height: 60 }}>
          {/* dashed ring (not yet posted) */}
          <div style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            padding: 3,
            background: '#1e1e1e',
            border: '2px dashed #333',
            boxSizing: 'border-box',
          }}>
            <Avatar
              src={currentUser.photo}
              name={currentUser.name}
              size={50}
              style={{ border: '2px solid #0f0f0f', boxSizing: 'border-box' }}
            />
          </div>
          {/* "+" badge */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#F07830',
            border: '2px solid #0f0f0f',
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
        </div>
        <span style={{
          fontSize: 10,
          color: '#888',
          fontFamily: 'Barlow, sans-serif',
          maxWidth: 60,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'block',
        }}>
          Seu feed
        </span>
      </button>

      {/* Other users who posted */}
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
              <Avatar
                src={p.photo}
                name={p.user}
                size={50}
                style={{ border: '3px solid #0f0f0f', boxSizing: 'border-box' }}
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
    </div>
  );
}
