import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { Ico } from '../icons';
import { Avatar } from '../components/Avatar';
import type { Screen, UserProfile } from '../types';

function toUsername(name: string): string {
  return '@' + (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '');
}

export function BuscarScreen({
  uid,
  goTo,
  onOpenProfile,
}: {
  uid: string;
  goTo: (sc: Screen) => void;
  onOpenProfile?: (userId: string, userName: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<string[]>([]);

  useEffect(() => {
    const uns = onSnapshot(collection(db, 'users'), snap => {
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
    });
    return () => uns();
  }, []);

  useEffect(() => {
    getDoc(doc(db, 'follows', uid)).then(snap => {
      if (snap.exists()) setFollowing(snap.data().following || []);
    });
  }, [uid]);

  const follow = async (targetId: string) => {
    const ref = doc(db, 'follows', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { following: arrayUnion(targetId) });
    } else {
      await setDoc(ref, { following: [targetId] });
    }
    setFollowing(prev => [...prev, targetId]);
  };

  const unfollow = async (targetId: string) => {
    await updateDoc(doc(db, 'follows', uid), { following: arrayRemove(targetId) });
    setFollowing(prev => prev.filter(id => id !== targetId));
  };

  const term = search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filtered = users
    .filter(u => u.uid !== uid)
    .filter(u => {
      if (!term) return true;
      const name = (u.fullName || u.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return name.includes(term);
    });

  return (
    <div className="fade" style={{ background: '#000', minHeight: '100vh' }}>
      <div style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px',
        borderBottom: '1px solid #1a1a1a', position: 'sticky', top: 0,
        zIndex: 50, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)',
      }}>
        <button onClick={() => goTo('feed')} style={{
          padding: 6, borderRadius: '50%', background: 'transparent',
          border: 'none', cursor: 'pointer', display: 'flex', marginRight: 8,
        }}>{Ico.back()}</button>
        <span style={{
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
          fontSize: 18, color: '#fff', letterSpacing: 0.5,
        }}>BUSCAR MEMBROS</span>
      </div>

      {/* Search input */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#1a1a1a', border: '1px solid #2f3336',
          borderRadius: 12, padding: '10px 14px',
        }}>
          {Ico.search('#555')}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            autoFocus
            style={{
              flex: 1, background: 'transparent', border: 'none',
              fontFamily: 'Barlow', fontSize: 15, color: '#fff',
              outline: 'none',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              background: 'transparent', border: 'none', color: '#555',
              cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1,
            }}>×</button>
          )}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '40px 16px', gap: 8,
        }}>
          <div style={{ fontSize: 36 }}>🔍</div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: 700, color: '#555' }}>
            {search ? 'Nenhum membro encontrado' : 'Busque membros do PG'}
          </div>
        </div>
      ) : (
        <div>
          {filtered.map(u => {
            const isFollowing = following.includes(u.uid);
            const displayName = u.fullName || u.name || 'Membro';
            return (
              <div key={u.uid} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderBottom: '1px solid #111',
                cursor: onOpenProfile ? 'pointer' : 'default',
              }}
                onClick={() => onOpenProfile?.(u.uid, displayName)}
              >
                <Avatar src={u.photo} name={displayName} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 15, color: '#fff' }}>
                    {displayName}
                  </div>
                  <div style={{ fontFamily: 'Barlow', fontSize: 12, color: '#555' }}>
                    {u.username ? '@' + u.username : toUsername(displayName)}
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); isFollowing ? unfollow(u.uid) : follow(u.uid); }}
                  style={{
                    padding: '6px 16px', borderRadius: 50, flexShrink: 0,
                    fontFamily: 'Barlow Condensed', fontWeight: 700,
                    fontSize: 12, letterSpacing: 0.5, cursor: 'pointer',
                    background: isFollowing ? 'transparent' : '#F07830',
                    border: isFollowing ? '1px solid #333' : 'none',
                    color: isFollowing ? '#888' : '#fff',
                  }}
                >
                  {isFollowing ? 'SEGUINDO' : 'SEGUIR'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
