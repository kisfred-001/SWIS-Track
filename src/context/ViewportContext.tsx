import React, { createContext, useContext, useState, useEffect } from 'react';

export type ViewportMode = 'auto' | 'mobile';

interface ViewportContextType {
  viewportMode: ViewportMode;
  setViewportMode: (mode: ViewportMode) => void;
  toggleViewportMode: () => void;
  isForcedMobile: boolean;
  isMobile: boolean;
}

const ViewportContext = createContext<ViewportContextType | undefined>(undefined);

const STORAGE_KEY = 'swis_viewport_mode_preference';

export const ViewportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewportMode, setViewportModeState] = useState<ViewportMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'auto' || saved === 'mobile') {
        return saved;
      }
    }
    return 'auto';
  });

  const [windowWidth, setWindowWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
    return 1024;
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const setViewportMode = (mode: ViewportMode) => {
    setViewportModeState(mode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, mode);
      } catch {
        // ignore localStorage errors
      }
    }
  };

  const toggleViewportMode = () => {
    setViewportMode(viewportMode === 'auto' ? 'mobile' : 'auto');
  };

  const isForcedMobile = viewportMode === 'mobile';
  const isMobile = isForcedMobile || windowWidth < 768;

  return (
    <ViewportContext.Provider
      value={{
        viewportMode,
        setViewportMode,
        toggleViewportMode,
        isForcedMobile,
        isMobile,
      }}
    >
      {children}
    </ViewportContext.Provider>
  );
};

export const useViewport = (): ViewportContextType => {
  const context = useContext(ViewportContext);
  if (!context) {
    throw new Error('useViewport must be used within a ViewportProvider');
  }
  return context;
};
