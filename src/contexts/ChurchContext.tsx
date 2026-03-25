import React, { createContext, useContext, useState } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface Church {
  id: string;
  name: string;
  district: string;
  directorUid: string | null;
}

interface ChurchContextType {
  selectedChurch: Church | null;
  setSelectedChurch: (church: Church, uid?: string) => void;
  clearChurch: () => void;
  isChurchSelected: boolean;
  loadChurchFromFirestore: (uid: string) => Promise<void>;
}

const ChurchContext = createContext<ChurchContextType | null>(null);

const STORAGE_KEY = 'sete_teen_church';

export function ChurchProvider({ children }: { children: React.ReactNode }) {
  const [selectedChurch, setSelectedChurchState] = useState<Church | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setSelectedChurch = (church: Church, uid?: string) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(church));
    setSelectedChurchState(church);
    // Persist to Firestore if uid provided
    if (uid) {
      setDoc(doc(db, 'users', uid), { churchId: church.id }, { merge: true }).catch(() => {});
    }
  };

  const clearChurch = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSelectedChurchState(null);
  };

  // Load church from Firestore (e.g. after join request is approved)
  const loadChurchFromFirestore = async (uid: string) => {
    try {
      const userSnap = await getDoc(doc(db, 'users', uid));
      const churchId = userSnap.data()?.churchId as string | undefined;
      if (!churchId) return;
      // Only update if different from current
      if (churchId === selectedChurch?.id) return;
      // Load full church doc from Firestore
      const churchSnap = await getDoc(doc(db, 'churches', churchId));
      if (churchSnap.exists()) {
        const data = churchSnap.data();
        const church: Church = {
          id: churchId,
          name: data.name,
          district: data.district,
          directorUid: data.directorUid || null,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(church));
        setSelectedChurchState(church);
      }
    } catch {
      // Silently fail — localStorage stays as fallback
    }
  };

  return (
    <ChurchContext.Provider value={{
      selectedChurch,
      setSelectedChurch,
      clearChurch,
      isChurchSelected: !!selectedChurch,
      loadChurchFromFirestore,
    }}>
      {children}
    </ChurchContext.Provider>
  );
}

export function useChurch() {
  const ctx = useContext(ChurchContext);
  if (!ctx) throw new Error('useChurch must be used inside ChurchProvider');
  return ctx;
}
