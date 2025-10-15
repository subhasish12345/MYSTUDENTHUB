
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type SidebarColor = 'default' | 'light' | 'dark';

interface SidebarColorContextType {
  color: SidebarColor;
  setColor: (color: SidebarColor) => void;
}

const SidebarColorContext = createContext<SidebarColorContextType | undefined>(undefined);

export const SidebarColorProvider = ({ children }: { children: ReactNode }) => {
  const [color, setColorState] = useState<SidebarColor>('default');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const storedColor = localStorage.getItem('sidebar-color') as SidebarColor | null;
    const validColors: SidebarColor[] = ['default', 'light', 'dark'];
    if (storedColor && validColors.includes(storedColor)) {
      setColorState(storedColor);
    }
    setIsMounted(true);
  }, []);
  
  const setColor = (newColor: SidebarColor) => {
    setColorState(newColor);
    localStorage.setItem('sidebar-color', newColor);
  };
  
  if (!isMounted) {
    return <div className="h-screen w-full bg-background">{children}</div>; 
  }

  return (
    <SidebarColorContext.Provider value={{ color, setColor }}>
      {children}
    </SidebarColorContext.Provider>
  );
};

export const useSidebarColor = (): SidebarColorContextType => {
  const context = useContext(SidebarColorContext);
  if (context === undefined) {
    throw new Error('useSidebarColor must be used within a SidebarColorProvider');
  }
  return context;
};
