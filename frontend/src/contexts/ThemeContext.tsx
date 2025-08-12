'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  // Get system theme preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Apply theme to document
  const applyTheme = (actualTheme: 'light' | 'dark') => {
    if (typeof window === 'undefined') return;
    
    const html = document.documentElement;
    
    if (actualTheme === 'dark') {
      html.setAttribute('data-theme', 'dark');
    } else {
      html.removeAttribute('data-theme');
    }
  };

  // Set theme and persist to localStorage
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
    
    // Calculate actual theme based on theme setting
    const newActualTheme = newTheme === 'system' ? getSystemTheme() : newTheme;
    setActualTheme(newActualTheme);
    applyTheme(newActualTheme);
  };

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const initialTheme = savedTheme || 'dark';
    
    setThemeState(initialTheme);
    
    // Calculate actual theme based on theme setting
    const initialActualTheme = initialTheme === 'system' ? getSystemTheme() : initialTheme;
    setActualTheme(initialActualTheme);
    applyTheme(initialActualTheme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (initialTheme === 'system') {
        const newActualTheme = getSystemTheme();
        setActualTheme(newActualTheme);
        applyTheme(newActualTheme);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  // Handle theme changes after initial mount
  useEffect(() => {
    if (theme !== 'system') {
      const newActualTheme = theme;
      setActualTheme(newActualTheme);
      applyTheme(newActualTheme);
    } else {
      const systemTheme = getSystemTheme();
      setActualTheme(systemTheme);
      applyTheme(systemTheme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}