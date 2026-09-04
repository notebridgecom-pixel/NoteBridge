import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  variant?: 'compact' | 'full' | 'icon-only';
  id?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  variant = 'icon-only',
  id = 'global-theme-toggle',
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  if (variant === 'full') {
    return (
      <button
        id={id}
        onClick={toggleTheme}
        type="button"
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          isDark
            ? 'bg-slate-800 text-amber-400 hover:bg-slate-700'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        } ${className}`}
        title={`Switch to ${isDark ? 'Light' : 'Night/Dark'} Mode`}
        aria-label="Toggle dark mode theme"
      >
        <div className="flex items-center gap-2.5">
          {isDark ? (
            <Moon className="w-4 h-4 text-amber-400 fill-amber-400/20" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20" />
          )}
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {isDark ? 'Dark Study Mode (Active)' : 'Night Study Mode'}
          </span>
        </div>
        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
          {isDark ? 'Dark' : 'Light'}
        </span>
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        id={id}
        onClick={toggleTheme}
        type="button"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
          isDark
            ? 'bg-slate-900/90 text-amber-300 border-slate-700 hover:bg-slate-800 shadow-xs'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-xs'
        } ${className}`}
        title={`Toggle ${isDark ? 'Light' : 'Night/Dark'} Mode`}
        aria-label="Toggle theme"
      >
        {isDark ? (
          <>
            <Moon className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
            <span>Dark</span>
          </>
        ) : (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30" />
            <span>Light</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      id={id}
      onClick={toggleTheme}
      type="button"
      className={`relative p-2.5 rounded-2xl transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 ${
        isDark
          ? 'bg-slate-800/90 text-amber-300 hover:bg-slate-700 border border-slate-700/80 shadow-inner'
          : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/90 border border-slate-200/80 shadow-xs'
      } ${className}`}
      title={`Switch to ${isDark ? 'Light Mode' : 'Dark Mode (Night Study)'}`}
      aria-label="Toggle color theme"
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Moon className="w-4 h-4 text-amber-300 fill-amber-400/20 transition-transform transform rotate-0 scale-100" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20 transition-transform transform rotate-0 scale-100" />
        )}
      </div>
    </button>
  );
};
