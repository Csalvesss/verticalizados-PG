import { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const Ctx = createContext<Record<string, string>>({});

export function UserPhotosProvider({ children }: { children: React.ReactNode }) {
  const [photos, setPhotos] = useState<Record<string, string>>({});

  useEffect(() => {
    const uns = onSnapshot(collection(db, 'users'), snap => {
      const map: Record<string, string> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.photoData) map[d.id] = data.photoData;
      });
      setPhotos(map);
    });
    return () => uns();
  }, []);

  return <Ctx.Provider value={photos}>{children}</Ctx.Provider>;
}

export function useUserPhoto(userId: string | undefined, fallback: string): string {
  const photos = useContext(Ctx);
  return (userId && photos[userId]) || fallback;
}
