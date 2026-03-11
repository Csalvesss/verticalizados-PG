import { useState, useEffect } from 'react';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Ico } from '../icons';
import { Avatar } from '../components/Avatar';
import type { Post } from '../types';

const verifiedBadge = (
  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: '#F07830', flexShrink: 0, marginLeft: 2 }}>
    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.35-6.2 6.78z" />
  </svg>
);

interface Props {
  targetUserId: string;
  currentUid: string;
  posts: Post[];
  adminEmails: string[];
  goBack: () => void;
}

export function UserPerfilScreen({ targetUserId, currentUid, posts, adminEmails, goBack }: Props) {
  const [profile, setProfile] = useState<{
    name: string;
    fullName: string;
    photo: string;
    email: string;
  } | null>(null);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const userPosts = posts.filter((p) => p.userId === targetUserId);
  const isOwnProfile = targetUserId === currentUid;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      // Load user profile
      getDoc(doc(db, 'users', targetUserId)),
      // Load following count (how many targetUser follows)
      getDoc(doc(db, 'follows', targetUserId)),
      // Load followers count (query all follows docs)
      getDocs(collection(db, 'follows')),
      // Check if current user follows targetUser
      getDoc(doc(db, 'follows', currentUid)),
    ]).then(([profileSnap, followingSnap, allFollowsSnap, myFollowsSnap]) => {
      if (profileSnap.exists()) {
        const d = profileSnap.data();
        setProfile({
          name: d.name || (d.fullName || 'Membro').split(' ')[0],
          fullName: d.fullName || d.name || 'Membro',
          photo: d.photoData || d.photo || '',
          email: d.email || '',
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

  const isVerified = profile ? adminEmails.includes(profile.email) : false;

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
        background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)',
      }}>
        <button onClick={goBack} style={{
          padding: 6, borderRadius: '50%', background: 'transparent',
          border: 'none', cursor: 'pointer', display: 'flex', marginRight: 8,
        }}>{Ico.back()}</button>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
            fontSize: 18, color: '#fff', letterSpacing: 0.5, lineHeight: 1.2,
          }}>
            {profile?.name || 'Perfil'}
          </div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#555' }}>
            {userPosts.length} post{userPosts.length !== 1 ? 's' : ''}
          </div>
        </div>
        {isVerified && (
          <div style={{ marginLeft: 8 }}>
            {verifiedBadge}
          </div>
        )}
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        {/* Avatar + stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 16 }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%', padding: 3, flexShrink: 0,
            background: 'linear-gradient(135deg, #F07830 0%, #D4621A 60%, #ff9a55 100%)',
          }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '2.5px solid #000' }}>
              <Avatar src={profile?.photo || ''} name={profile?.name || '?'} size={82} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, flex: 1, justifyContent: 'center' }}>
            {[
              { n: userPosts.length, label: 'Posts' },
              { n: followingCount, label: 'Seguindo' },
              { n: followersCount, label: 'Seguidores' },
            ].map((item) => (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 22, color: '#fff', lineHeight: 1.2 }}>
                  {item.n}
                </div>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#71767b', marginTop: 1 }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Name + email */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, color: '#fff' }}>
              {profile?.fullName || profile?.name || 'Membro'}
            </div>
            {isVerified && verifiedBadge}
          </div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#555' }}>
            {profile?.email}
          </div>
        </div>

        {/* Membership badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(240,120,48,0.1)', border: '1px solid rgba(240,120,48,0.25)',
          borderRadius: 8, padding: '5px 10px', marginBottom: 16,
        }}>
          <div style={{ width: 14, height: 14, background: '#F07830', borderRadius: 3, flexShrink: 0 }} />
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: 1, color: '#F07830' }}>
            VERTICALIZADOS · MJA ESPLANADA
          </span>
        </div>

        {/* Follow button (only for other users) */}
        {!isOwnProfile && (
          <div style={{ marginBottom: 20 }}>
            <button
              onClick={toggleFollow}
              style={{
                width: '100%', padding: '9px 16px', borderRadius: 8,
                border: isFollowing ? '1px solid #2f3336' : 'none',
                background: isFollowing ? 'transparent' : '#F07830',
                color: isFollowing ? '#e7e9ea' : '#fff',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700, fontSize: 14, letterSpacing: 0.5,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {isFollowing ? 'Seguindo' : 'Seguir'}
            </button>
          </div>
        )}
      </div>

      {/* Posts grid tab header */}
      <div style={{
        display: 'flex', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a',
        position: 'sticky', top: 49, background: '#000', zIndex: 40,
      }}>
        <div style={{
          flex: 1, padding: '12px 0', textAlign: 'center',
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
          fontSize: 12, letterSpacing: 1.5, color: '#F07830', position: 'relative',
        }}>
          ⊞  POSTS
          <span style={{
            position: 'absolute', bottom: 0, left: '50%',
            transform: 'translateX(-50%)', width: 40, height: 2,
            background: '#F07830', display: 'block', borderRadius: 99,
          }} />
        </div>
      </div>

      {/* Posts grid */}
      {userPosts.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 16px', gap: 12 }}>
          <div style={{ fontSize: 40 }}>📷</div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 700, color: '#555', letterSpacing: 0.5 }}>
            Nenhum post ainda
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, padding: 2 }}>
          {userPosts.map((post) => (
            <div key={post.id} style={{
              aspectRatio: '1', overflow: 'hidden', position: 'relative',
              background: post.imageUrl ? '#111' : 'rgba(240,120,48,0.08)',
            }}>
              {post.imageUrl ? (
                <img src={post.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                  <span style={{
                    fontFamily: 'Barlow, sans-serif', fontSize: 10, color: '#777',
                    textAlign: 'center', lineHeight: 1.4, overflow: 'hidden',
                    display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' as never,
                  }}>{post.text}</span>
                </div>
              )}
              {(post.likes?.length ?? 0) > 0 && (
                <div style={{ position: 'absolute', bottom: 4, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
                  <div style={{ background: 'rgba(0,0,0,0.65)', borderRadius: 99, padding: '1px 7px', fontSize: 10, color: '#fff', fontFamily: 'Barlow, sans-serif' }}>
                    ♥ {post.likes!.length}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ height: 80 }} />
    </div>
  );
}
