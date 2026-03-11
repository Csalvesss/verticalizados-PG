import { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface UserData {
  photo: string;
  fullName: string;
  username: string;
}

const Ctx = createContext<Record<string, UserData>>({});

export function UserPhotosProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<Record<string, UserData>>({});

  useEffect(() => {
    const uns = onSnapshot(collection(db, 'users'), snap => {
      const map: Record<string, UserData> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        map[d.id] = {
          photo: data.photoData || data.photo || '',
          fullName: data.fullName || data.name || '',
          username: data.username || '',
        };
      });
      setUsers(map);
    });
    return () => uns();
  }, []);

  return <Ctx.Provider value={users}>{children}</Ctx.Provider>;
}

export function useUserPhoto(userId: string | undefined, fallback: string): string {
  const users = useContext(Ctx);
  return (userId && users[userId]?.photo) || fallback;
}

export function useUserName(userId: string | undefined, fallback: string): string {
  const users = useContext(Ctx);
  return (userId && users[userId]?.fullName) || fallback;
}
