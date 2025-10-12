"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BackgroundTheme = 'default' | 'pattern-1' | 'pattern-2' | 'pattern-3' | 'pattern-4' | 'pattern-5' | 'pattern-6';

interface BackgroundContextType {
  theme: BackgroundTheme;
  setTheme: (theme: BackgroundTheme) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export const BackgroundProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<BackgroundTheme>('default');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('background-theme') as BackgroundTheme | null;
    if (storedTheme && ['default', 'pattern-1', 'pattern-2', 'pattern-3', 'pattern-4', 'pattern-5', 'pattern-6'].includes(storedTheme)) {
      setThemeState(storedTheme);
    }
    setIsMounted(true);
  }, []);
  
  const setTheme = (newTheme: BackgroundTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('background-theme', newTheme);
  };
  
  if (!isMounted) {
    return null; // Avoid rendering until the theme is loaded from localStorage
  }

  return (
    <BackgroundContext.Provider value={{ theme, setTheme }}>
      <div className="relative">
        <div className={cn("fixed inset-0 -z-10 transition-all duration-500", 
            theme === 'pattern-1' && 'bg-pattern-1',
            theme === 'pattern-3' && 'bg-pattern-3',
            theme === 'pattern-6' && 'bg-pattern-6'
          )} 
        />
        {theme === 'pattern-2' && (
           <div className="fixed inset-0 -z-10 transition-all duration-500 bg-pattern-2">
            <div className="jp-matrix">
              {Array.from({ length: 400 }).map((_, i) => <span key={i}>ア</span>)}
            </div>
           </div>
        )}
        {children}
      </div>
    </BackgroundContext.Provider>
  );
};

export const useBackground = (): BackgroundContextType => {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
};
