import type { MouseEvent } from 'react';
import { Avatar } from './Avatar';
import type { Story, CurrentUser } from '../types';

// Group stories by userId, return one entry per user
function groupByUser(stories: Story[]): {
  userId: string;
  userName: string;
  userPhoto: string;
  stories: Story[];
}[] {
  const map = new Map<string, { userId: string; userName: string; userPhoto: string; stories: Story[] }>();
  for (const s of stories) {
    if (!map.has(s.userId)) {
      map.set(s.userId, { userId: s.userId, userName: s.userName, userPhoto: s.userPhoto, stories: [] });
    }
    map.get(s.userId)!.stories.push(s);
  }
  return Array.from(map.values());
}

interface Props {
  stories: Story[];
  currentUser: CurrentUser;
  activeUserId?: string | null;
  onStoryPress?: (userId: string) => void;
  onAddStory?: () => void;
}

export function StoriesBar({ stories, currentUser, activeUserId, onStoryPress, onAddStory }: Props) {
  const ownStories = stories.filter(s => s.userId === currentUser.uid);
  const hasOwnStory = ownStories.length > 0;
  const groups = groupByUser(stories.filter(s => s.userId !== currentUser.uid));
  const isOwnActive = activeUserId === currentUser.uid;

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
      {/* Current user — div wrapper avoids invalid nested <button> */}
      <div
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 5, flexShrink: 0,
        }}
      >
        {/* Avatar ring area — clickable to view own story or open picker */}
        <div
          role="button"
          tabIndex={0}
          onClick={(e: MouseEvent) => {
            e.stopPropagation();
            if (hasOwnStory) onStoryPress?.(currentUser.uid);
            else onAddStory?.();
          }}
          style={{ position: 'relative', width: 60, height: 60, cursor: 'pointer' }}
        >
          {hasOwnStory ? (
            <div style={{
              width: 60, height: 60, borderRadius: '50%', padding: 3,
              background: isOwnActive
                ? 'linear-gradient(135deg, #fff 0%, #F07830 100%)'
                : 'linear-gradient(135deg, #F07830 0%, #D4621A 60%, #ff9a55 100%)',
              boxSizing: 'border-box',
            }}>
              <Avatar src={currentUser.photo} name={currentUser.name} size={50}
                style={{ border: '3px solid #0f0f0f', boxSizing: 'border-box' }} />
            </div>
          ) : (
            <div style={{
              width: 60, height: 60, borderRadius: '50%', padding: 3,
              background: '#1e1e1e', border: '2px dashed #333', boxSizing: 'border-box',
            }}>
              <Avatar src={currentUser.photo} name={currentUser.name} size={50}
                style={{ border: '2px solid #0f0f0f', boxSizing: 'border-box' }} />
            </div>
          )}
          {/* "+" badge — separate clickable zone, calls onAddStory directly */}
          <div
            role="button"
            tabIndex={-1}
            onClick={(e: MouseEvent) => { e.stopPropagation(); onAddStory?.(); }}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 20, height: 20, borderRadius: '50%',
              background: '#F07830', border: '2px solid #0f0f0f',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: '#fff', fontWeight: 700, lineHeight: 1,
              boxSizing: 'border-box', cursor: 'pointer',
            }}
          >+</div>
        </div>
        <span style={{
          fontSize: 10, color: isOwnActive ? '#F07830' : '#888',
          fontFamily: 'Barlow, sans-serif', fontWeight: isOwnActive ? 700 : 400,
          maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap', display: 'block',
        }}>Seu story</span>
      </div>

      {/* Other users with active stories */}
      {groups.map((g) => {
        const isActive = activeUserId === g.userId;
        return (
          <button
            key={g.userId}
            onClick={() => onStoryPress?.(g.userId)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 5, background: 'transparent', border: 'none',
              cursor: 'pointer', flexShrink: 0, padding: 0, margin: 0,
              opacity: activeUserId && !isActive ? 0.45 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            <div style={{
              width: 60, height: 60, borderRadius: '50%', padding: 3,
              background: isActive
                ? 'linear-gradient(135deg, #fff 0%, #F07830 100%)'
                : 'linear-gradient(135deg, #F07830 0%, #D4621A 60%, #ff9a55 100%)',
              boxSizing: 'border-box', transition: 'background 0.3s',
            }}>
              <Avatar src={g.userPhoto} name={g.userName} size={50}
                style={{ border: '3px solid #0f0f0f', boxSizing: 'border-box' }} />
            </div>
            <span style={{
              fontSize: 10, color: isActive ? '#F07830' : '#888',
              fontFamily: 'Barlow, sans-serif', fontWeight: isActive ? 700 : 400,
              maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap', display: 'block', transition: 'color 0.2s',
            }}>
              {g.userName}
            </span>
          </button>
        );
      })}
    </div>
  );
}
