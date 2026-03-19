import React, { createContext, useContext, useState } from 'react';

export interface Church {
  id: string;
  name: string;
  district: string;
  directorUid: string | null;
}

interface ChurchContextType {
  selectedChurch: Church | null;
  setSelectedChurch: (church: Church) => void;
  clearChurch: () => void;
  isChurchSelected: boolean;
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

  const setSelectedChurch = (church: Church) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(church));
    setSelectedChurchState(church);
  };

  const clearChurch = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSelectedChurchState(null);
  };

  return (
    <ChurchContext.Provider value={{
      selectedChurch,
      setSelectedChurch,
      clearChurch,
      isChurchSelected: !!selectedChurch,
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
