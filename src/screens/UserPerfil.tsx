import { useState, useEffect } from 'react';
import {
  doc, getDoc, getDocs, collection,
  updateDoc, setDoc, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Ico } from '../icons';
import { Avatar } from '../components/Avatar';
import type { Post } from '../types';

function toUsername(name: string): string {
  return '@' + (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '');
}

const verifiedBadge = (
  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: '#F07830', flexShrink: 0 }}>
    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.35-6.2 6.78z" />
  </svg>
);

const IcoPin = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
  </svg>
);

const IcoLink = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
  </svg>
);

interface Props {
  targetUserId: string;
  currentUid: string;
  posts: Post[];
  adminEmails: string[];
  goBack: () => void;
  onOpenProfile?: (userId: string, userName: string) => void;
}

interface FollowUser {
  uid: string;
  name?: string;
  fullName?: string;
  photo?: string;
  photoData?: string;
  username?: string;
}

export function UserPerfilScreen({ targetUserId, currentUid, posts, adminEmails, goBack, onOpenProfile }: Props) {
  const [profile, setProfile] = useState<{
    name: string;
    fullName: string;
    photo: string;
    email: string;
    username?: string;
    bio?: string;
    link?: string;
    pinnedPostId?: string;
  } | null>(null);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followListModal, setFollowListModal] = useState<'seguindo' | 'seguidores' | null>(null);
  const [followListUsers, setFollowListUsers] = useState<FollowUser[]>([]);
  const [followListLoading, setFollowListLoading] = useState(false);

  const userPosts = posts.filter((p) => p.userId === targetUserId);
  const isOwnProfile = targetUserId === currentUid;

  // Sort posts with pinned first
  const pinnedPostId = profile?.pinnedPostId || '';
  const pinnedPost = pinnedPostId ? userPosts.find(p => p.id === pinnedPostId) : undefined;
  const otherPosts = userPosts.filter(p => p.id !== pinnedPostId);
  const sortedPosts = pinnedPost ? [pinnedPost, ...otherPosts] : userPosts;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getDoc(doc(db, 'users', targetUserId)),
      getDoc(doc(db, 'follows', targetUserId)),
      getDocs(collection(db, 'follows')),
      getDoc(doc(db, 'follows', currentUid)),
    ]).then(([profileSnap, followingSnap, allFollowsSnap, myFollowsSnap]) => {
      if (profileSnap.exists()) {
        const d = profileSnap.data();
        setProfile({
          name: d.name || (d.fullName || 'Membro').split(' ')[0],
          fullName: d.fullName || d.name || 'Membro',
          photo: d.photoData || d.photo || '',
          email: d.email || '',
          username: d.username || '',
          bio: d.bio || '',
          link: d.link || '',
          pinnedPostId: d.pinnedPostId || '',
        });
      }
      if (followingSnap.exists()) {
        setFollowingCount((followingSnap.data().following || []).length);
      }
      let count = 0;
      allFollowsSnap.docs.forEach((d) => {
        if ((d.data().following || []).includes(targetUserId)) count++;
      });
      setFollowersCount(count);
      if (myFollowsSnap.exists()) {
        setIsFollowing((myFollowsSnap.data().following || []).includes(targetUserId));
      }
      setLoading(false);
    });
  }, [targetUserId, currentUid]);

  const toggleFollow = async () => {
    const ref = doc(db, 'follows', currentUid);
    const snap = await getDoc(ref);
    if (isFollowing) {
      await updateDoc(ref, { following: arrayRemove(targetUserId) });
      setIsFollowing(false);
      setFollowersCount((c) => c - 1);
    } else {
      if (snap.exists()) {
        await updateDoc(ref, { following: arrayUnion(targetUserId) });
      } else {
        await setDoc(ref, { following: [targetUserId] });
      }
      setIsFollowing(true);
      setFollowersCount((c) => c + 1);
    }
  };

  async function openFollowList(type: 'seguindo' | 'seguidores') {
    setFollowListModal(type);
    setFollowListLoading(true);
    setFollowListUsers([]);
    try {
      let uids: string[] = [];
      if (type === 'seguindo') {
        const snap = await getDoc(doc(db, 'follows', targetUserId));
        uids = snap.exists() ? (snap.data().following || []) : [];
      } else {
        const snap = await getDocs(collection(db, 'follows'));
        snap.docs.forEach(d => {
          if ((d.data().following || []).includes(targetUserId)) uids.push(d.id);
        });
      }
      const snaps = await Promise.all(uids.map(id => getDoc(doc(db, 'users', id))));
      const profiles: FollowUser[] = snaps
        .map((p, i) => p.exists() ? ({ uid: uids[i], ...p.data() } as FollowUser) : null)
        .filter(Boolean) as FollowUser[];
      setFollowListUsers(profiles);
    } finally {
      setFollowListLoading(false);
    }
  }

  function normalizeLink(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return 'https://' + trimmed;
  }

  const isVerified = profile ? adminEmails.includes(profile.email) : false;
  const displayUsername = profile?.username
    ? '@' + profile.username
    : toUsername(profile?.fullName || profile?.name || '');

  if (loading) {
    return (
      <div style={{ background: '#000', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'Barlow', fontSize: 14, color: '#555' }}>Carregando...</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#000', minHeight: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px',
        borderBottom: '1px solid #1a1a1a', position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(14px)',
      }}>
        <button onClick={goBack} style={{
          padding: 6, borderRadius: '50%', background: 'transparent',
          border: 'none', cursor: 'pointer', display: 'flex', marginRight: 10,
        }}>{Ico.back()}</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: '#fff', letterSpacing: 0.3, lineHeight: 1.1 }}>
            {profile?.fullName || 'Perfil'}
          </div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#555' }}>
            {userPosts.length} post{userPosts.length !== 1 ? 's' : ''}
          </div>
        </div>
        {isVerified && verifiedBadge}
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        {/* Name + avatar row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ flex: 1, paddingRight: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 22, color: '#fff', letterSpacing: 0.2 }}>
                {profile?.fullName || profile?.name || 'Membro'}
              </span>
              {isVerified && verifiedBadge}
            </div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#F07830', marginBottom: profile?.bio ? 8 : 10 }}>
              {displayUsername}
            </div>

            {/* Bio */}
            {profile?.bio && (
              <div style={{
                fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#e7e9ea',
                lineHeight: 1.5, marginBottom: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {profile.bio}
              </div>
            )}

            {/* Link */}
            {profile?.link && (
              <a
                href={normalizeLink(profile.link)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#F07830',
                  textDecoration: 'none', marginBottom: 10,
                }}
              >
                <IcoLink />
                <span style={{ textDecoration: 'underline', textDecorationColor: 'rgba(240,120,48,0.4)' }}>
                  {profile.link.replace(/^https?:\/\//i, '').replace(/\/$/, '')}
                </span>
              </a>
            )}

            {!profile?.bio && !profile?.link && (
              <div style={{ marginBottom: 10 }} />
            )}

            {/* Group badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(240,120,48,0.1)', border: '1px solid rgba(240,120,48,0.2)',
              borderRadius: 20, padding: '3px 10px', marginBottom: 14,
            }}>
              <div style={{ width: 7, height: 7, background: '#F07830', borderRadius: '50%', flexShrink: 0 }} />
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: 1.2, color: '#F07830' }}>
                VERTICALIZADOS · MJA ESPLANADA
              </span>
            </div>
          </div>
          {/* Avatar */}
          <div style={{
            width: 76, height: 76, borderRadius: '50%', padding: 3, flexShrink: 0,
            background: 'linear-gradient(135deg, #F07830 0%, #D4621A 60%, #ff9a55 100%)',
          }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '2.5px solid #000' }}>
              <Avatar src={profile?.photo || ''} name={profile?.name || '?'} size={70} />
            </div>
          </div>
        </div>

        {/* Followers stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center' }}>
          <button
            onClick={() => openFollowList('seguidores')}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
          >
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: '#fff' }}>{followersCount} </span>
            <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#71767b' }}>seguidores</span>
          </button>
          <span style={{ color: '#2f3336', fontSize: 14 }}>·</span>
          <button
            onClick={() => openFollowList('seguindo')}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
          >
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: '#fff' }}>{followingCount} </span>
            <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#71767b' }}>seguindo</span>
          </button>
        </div>

        {/* Action buttons */}
        {!isOwnProfile && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <button
              onClick={toggleFollow}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 10,
                border: isFollowing ? '1px solid #333' : 'none',
                background: isFollowing ? 'transparent' : '#F07830',
                color: isFollowing ? '#e7e9ea' : '#fff',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700, fontSize: 14, letterSpacing: 0.5,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {isFollowing ? 'Seguindo' : 'Seguir'}
            </button>
            <button style={{
              flex: 1, padding: '10px 16px', borderRadius: 10,
              border: '1px solid #333', background: 'transparent',
              color: '#e7e9ea', fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700, fontSize: 14, letterSpacing: 0.5, cursor: 'default',
            }}>
              Mencionar
            </button>
          </div>
        )}
      </div>

      {/* Posts tab */}
      <div style={{
        display: 'flex', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a',
        position: 'sticky', top: 49, background: '#000', zIndex: 40,
      }}>
        <div style={{
          flex: 1, padding: '13px 0', textAlign: 'center',
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
          fontSize: 13, letterSpacing: 1, color: '#fff', position: 'relative',
        }}>
          Posts
          <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 36, height: 2.5, background: '#F07830', display: 'block', borderRadius: 99 }} />
        </div>
      </div>

      {/* Posts feed (Threads-style list) */}
      {sortedPosts.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 16px', gap: 10 }}>
          <div style={{ fontSize: 36 }}>📷</div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 700, color: '#444', letterSpacing: 0.5 }}>
            Nenhum post ainda
          </div>
        </div>
      ) : (
        <div>
          {sortedPosts.map((post) => {
            const isPinned = post.id === pinnedPostId;
            return (
              <div key={post.id} style={{ borderBottom: '1px solid #111', padding: '14px 16px' }}>

                {/* Pin indicator */}
                {isPinned && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    paddingBottom: 8, paddingLeft: 46,
                    fontSize: 12, fontWeight: 600, color: '#555', fontFamily: 'Barlow, sans-serif',
                  }}>
                    <IcoPin />
                    <span>Post fixado</span>
                  </div>
                )}

                {/* Post header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0, padding: 2,
                    background: 'linear-gradient(135deg, #F07830, #D4621A)',
                  }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '2px solid #000' }}>
                      <Avatar src={profile?.photo || ''} name={profile?.name || '?'} size={32} />
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: '#fff' }}>
                        {profile?.fullName || profile?.name || 'Membro'}
                      </span>
                      {isVerified && verifiedBadge}
                    </div>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#555' }}>
                      {post.createdAt ? (() => {
                        const d = post.createdAt.toDate ? post.createdAt.toDate() : new Date(post.createdAt as any);
                        return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
                      })() : ''}
                    </div>
                  </div>
                </div>

                {/* Post text */}
                {post.text && (
                  <div style={{
                    fontFamily: 'Barlow, sans-serif', fontSize: 15, color: '#e7e9ea',
                    lineHeight: 1.55, marginBottom: post.imageUrl ? 10 : 0,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {post.text}
                  </div>
                )}

                {/* Post image */}
                {post.imageUrl && !post.repostOf && (
                  <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #1a1a1a' }}>
                    <img src={post.imageUrl} alt="" style={{ width: '100%', maxHeight: 380, objectFit: 'cover', display: 'block' }} />
                  </div>
                )}

                {/* Stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
                  {(post.likes?.length ?? 0) > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#555' }}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="#F07830"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                      <span style={{ color: '#F07830' }}>{post.likes!.length}</span>
                    </div>
                  )}
                  {(post.comments?.length ?? 0) > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#555' }}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="#555"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01z"/></svg>
                      {post.comments!.length}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ height: 80 }} />

      {/* Follow list modal */}
      {followListModal && (
        <div onClick={() => setFollowListModal(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#0d0d0d', borderRadius: '20px 20px 0 0',
            width: '100%', maxWidth: 600, maxHeight: '70vh',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            border: '1px solid #222', borderBottom: 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px 12px', borderBottom: '1px solid #1a1a1a' }}>
              <button onClick={() => setFollowListModal(null)} style={{ color: '#666', fontSize: 22, background: 'transparent', border: 'none', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
              <span style={{ flex: 1, textAlign: 'center', fontWeight: 700, color: '#e7e9ea', fontSize: 14, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: 1 }}>
                {followListModal === 'seguindo' ? 'SEGUINDO' : 'SEGUIDORES'}
              </span>
              <div style={{ width: 28 }} />
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {followListLoading && (
                <div style={{ padding: 32, textAlign: 'center', color: '#555', fontFamily: 'Barlow', fontSize: 14 }}>Carregando...</div>
              )}
              {!followListLoading && followListUsers.length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', color: '#555', fontFamily: 'Barlow', fontSize: 14 }}>
                  {followListModal === 'seguindo' ? 'Não segue ninguém ainda.' : 'Ninguém segue ainda.'}
                </div>
              )}
              {followListUsers.map(u => {
                const displayName = u.fullName || u.name || 'Membro';
                return (
                  <div key={u.uid}
                    onClick={() => { setFollowListModal(null); onOpenProfile?.(u.uid, displayName); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #111', cursor: onOpenProfile ? 'pointer' : 'default' }}
                  >
                    <Avatar src={u.photoData || u.photo || ''} name={displayName} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 15, color: '#fff' }}>{displayName}</div>
                      <div style={{ fontFamily: 'Barlow', fontSize: 12, color: '#555' }}>
                        {u.username ? '@' + u.username : toUsername(displayName)}
                      </div>
                    </div>
                    {onOpenProfile && (
                      <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: '#444' }}>
                        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
