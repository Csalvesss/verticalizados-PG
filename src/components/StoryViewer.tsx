import { useState, useEffect, useCallback } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import type { Story } from '../types';
import { Avatar } from './Avatar';

const STORY_DURATION = 5000; // ms per story

interface Props {
  stories: Story[];        // all active stories (all users)
  startUserId: string;     // which user to start viewing
  currentUid: string;
  onClose: () => void;
}

function formatTime(ts: Story['createdAt']): string {
  if (!ts) return '';
  const diff = Date.now() - ts.toMillis();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// Group stories by userId preserving insertion order
function groupByUser(stories: Story[]): { userId: string; userName: string; userPhoto: string; items: Story[] }[] {
  const map = new Map<string, { userId: string; userName: string; userPhoto: string; items: Story[] }>();
  for (const s of stories) {
    if (!map.has(s.userId)) map.set(s.userId, { userId: s.userId, userName: s.userName, userPhoto: s.userPhoto, items: [] });
    map.get(s.userId)!.items.push(s);
  }
  return Array.from(map.values());
}

export function StoryViewer({ stories, startUserId, currentUid, onClose }: Props) {
  const groups = groupByUser(stories);
  const [userIdx, setUserIdx] = useState(() => Math.max(0, groups.findIndex(g => g.userId === startUserId)));
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const group = groups[userIdx];
  const story = group?.items[storyIdx];

  // Mark as seen
  useEffect(() => {
    if (!story || story.seenBy.includes(currentUid)) return;
    updateDoc(doc(db, 'stories', story.id), { seenBy: arrayUnion(currentUid) }).catch(() => {});
  }, [story?.id]);

  const goNext = useCallback(() => {
    if (!group) return;
    if (storyIdx < group.items.length - 1) {
      setStoryIdx(i => i + 1);
      setProgress(0);
    } else if (userIdx < groups.length - 1) {
      setUserIdx(i => i + 1);
      setStoryIdx(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [group, storyIdx, userIdx, groups.length, onClose]);

  const goPrev = useCallback(() => {
    if (storyIdx > 0) {
      setStoryIdx(i => i - 1);
      setProgress(0);
    } else if (userIdx > 0) {
      const prevGroup = groups[userIdx - 1];
      setUserIdx(i => i - 1);
      setStoryIdx(prevGroup.items.length - 1);
      setProgress(0);
    }
  }, [storyIdx, userIdx, groups]);

  // Progress ticker
  useEffect(() => {
    if (paused) return;
    setProgress(0);
    const interval = 100;
    const steps = STORY_DURATION / interval;
    let tick = 0;
    const id = setInterval(() => {
      tick++;
      setProgress(tick / steps);
      if (tick >= steps) {
        clearInterval(id);
        goNext();
      }
    }, interval);
    return () => clearInterval(id);
  }, [story?.id, paused, goNext]);

  if (!group || !story) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onPointerDown={() => setPaused(true)}
      onPointerUp={() => setPaused(false)}
    >
      {/* Story image */}
      <img
        src={story.mediaUrl}
        alt=""
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'contain',
          pointerEvents: 'none',
        }}
      />

      {/* Dark gradient top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 140,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
        pointerEvents: 'none',
      }} />

      {/* Progress bars */}
      <div style={{
        position: 'absolute', top: 12, left: 10, right: 10,
        display: 'flex', gap: 4, zIndex: 10,
      }}>
        {group.items.map((s, i) => (
          <div key={s.id} style={{ flex: 1, height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.3)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: '#fff',
              width: i < storyIdx ? '100%' : i === storyIdx ? `${progress * 100}%` : '0%',
              transition: i === storyIdx ? 'none' : undefined,
            }} />
          </div>
        ))}
      </div>

      {/* User info */}
      <div style={{
        position: 'absolute', top: 24, left: 14,
        display: 'flex', alignItems: 'center', gap: 10, zIndex: 10,
      }}>
        <div style={{
          padding: 2, borderRadius: '50%',
          background: 'linear-gradient(135deg, #F07830, #D4621A)',
        }}>
          <Avatar src={group.userPhoto} name={group.userName} size={36}
            style={{ border: '2px solid #000', boxSizing: 'border-box' }} />
        </div>
        <span style={{ color: '#fff', fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 14 }}>
          {group.userName}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'Barlow, sans-serif', fontSize: 12 }}>
          {formatTime(story.createdAt)}
        </span>
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 20, right: 14, zIndex: 10,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: '#fff', fontSize: 22, lineHeight: 1,
        }}
      >✕</button>

      {/* Caption */}
      {story.caption && (
        <div style={{
          position: 'absolute', bottom: 40, left: 16, right: 16, zIndex: 10,
          background: 'rgba(0,0,0,0.5)', borderRadius: 10,
          padding: '10px 14px', color: '#fff',
          fontFamily: 'Barlow, sans-serif', fontSize: 15,
        }}>
          {story.caption}
        </div>
      )}

      {/* Tap zones */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', zIndex: 5 }}>
        <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); goPrev(); }} />
        <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); goNext(); }} />
      </div>
    </div>
  );
}
