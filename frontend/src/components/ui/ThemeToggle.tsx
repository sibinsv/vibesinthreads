'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useState } from 'react';

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown';
  showLabel?: boolean;
}

export function ThemeToggle({ variant = 'button', showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'button') {
    const handleClick = () => {
      if (theme === 'light') {
        setTheme('dark');
      } else if (theme === 'dark') {
        setTheme('system');
      } else {
        setTheme('light');
      }
    };

    const getIcon = () => {
      switch (theme) {
        case 'light':
          return <Sun className="h-4 w-4" />;
        case 'dark':
          return <Moon className="h-4 w-4" />;
        case 'system':
          return <Monitor className="h-4 w-4" />;
      }
    };

    const getLabel = () => {
      switch (theme) {
        case 'light':
          return 'Light';
        case 'dark':
          return 'Dark';
        case 'system':
          return 'System';
      }
    };

    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-secondary"
        title={`Theme: ${getLabel()}`}
      >
        {getIcon()}
        {showLabel && <span>{getLabel()}</span>}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-secondary"
        title="Toggle theme"
      >
        {theme === 'light' && <Sun className="h-4 w-4" />}
        {theme === 'dark' && <Moon className="h-4 w-4" />}
        {theme === 'system' && <Monitor className="h-4 w-4" />}
        {showLabel && (
          <span className="capitalize">{theme}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-2 min-w-[120px] rounded-lg border bg-card p-2 shadow-lg">
            <button
              onClick={() => {
                setTheme('light');
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent ${
                theme === 'light' ? 'bg-accent' : ''
              }`}
            >
              <Sun className="h-4 w-4" />
              Light
            </button>
            <button
              onClick={() => {
                setTheme('dark');
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent ${
                theme === 'dark' ? 'bg-accent' : ''
              }`}
            >
              <Moon className="h-4 w-4" />
              Dark
            </button>
            <button
              onClick={() => {
                setTheme('system');
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent ${
                theme === 'system' ? 'bg-accent' : ''
              }`}
            >
              <Monitor className="h-4 w-4" />
              System
            </button>
          </div>
        </>
      )}
    </div>
  );
}