
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BackgroundTheme = 'default' | 'pattern-1' | 'pattern-2' | 'pattern-3' | 'pattern-lamp-scene' | 'pattern-synthwave' | 'pattern-rain' | 'pastel-aurora' | 'blue-squares' | 'quantum-grid' | 'bw-future' | 'seigaiha' | 'fiery-texture' | 'mandala' | 'island-backdrop';

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
    const validThemes: BackgroundTheme[] = ['default', 'pattern-1', 'pattern-2', 'pattern-3', 'pattern-lamp-scene', 'pattern-synthwave', 'pattern-rain', 'pastel-aurora', 'blue-squares', 'quantum-grid', 'bw-future', 'seigaiha', 'fiery-texture', 'mandala', 'island-backdrop'];
    if (storedTheme && validThemes.includes(storedTheme)) {
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
            theme === 'pattern-2' && 'bg-pattern-2',
            theme === 'pattern-3' && 'bg-pattern-3',
            theme === 'pattern-lamp-scene' && 'bg-pattern-lamp-scene',
            theme === 'pattern-synthwave' && 'bg-pattern-synthwave',
            theme === 'pattern-rain' && 'bg-pattern-rain',
            theme === 'pastel-aurora' && 'bg-pastel-aurora',
            theme === 'blue-squares' && 'bg-blue-squares',
            theme === 'quantum-grid' && 'bg-quantum-grid',
            theme === 'bw-future' && 'bg-bw-future',
            theme === 'seigaiha' && 'bg-seigaiha',
            theme === 'fiery-texture' && 'bg-fiery-texture',
            theme === 'mandala' && 'bg-mandala',
            theme === 'island-backdrop' && 'bg-island-backdrop'
          )} 
        />
        {theme === 'fiery-texture' && (
             <svg height={0} width={0}>
                <filter id="advanced-texture">
                    <feTurbulence result="noise" numOctaves={3} baseFrequency="0.8" type="fractalNoise" />
                    <feSpecularLighting result="specular" lightingColor="#ffffff" specularExponent={30} specularConstant={1} surfaceScale={4} in="noise">
                    <fePointLight z={100} y={100} x={200} />
                    </feSpecularLighting>
                    <feComposite result="litNoise" operator="in" in2="SourceGraphic" in="specular" />
                    <feBlend mode="soft-light" in2="litNoise" in="SourceGraphic" />
                </filter>
            </svg>
        )}
        {theme === 'island-backdrop' && (
             <svg height={0} width={0}>
                <filter id="handDrawnNoise">
                    <feTurbulence result="noise" numOctaves={5} baseFrequency="0.0065" type="fractalNoise" />
                    <feDisplacementMap yChannelSelector="G" xChannelSelector="R" scale={900} in2="noise" in="SourceGraphic" />
                </filter>
            </svg>
        )}
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
