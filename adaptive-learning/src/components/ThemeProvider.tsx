'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

const ThemeContext = createContext<{
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // In-course choice (localStorage) wins; otherwise fall back to the theme
    // the dashboard passed via SSO (cookie set by /auth/sso).
    const isTheme = (v: string | undefined): v is Theme =>
      v === 'light' || v === 'dark' || v === 'system';
    const stored = localStorage.getItem('theme') ?? undefined;
    const fromSSO = document.cookie.match(/(?:^|; )theme=([^;]+)/)?.[1];
    const initial = [stored, fromSSO].find(isTheme);
    if (initial) {
      // Mount-only hydration from localStorage / SSO cookie — a lazy useState
      // initializer can't read these during SSR without a hydration flash.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThemeState(initial);
    }
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const resolve = () => {
      const isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
      setResolvedTheme(isDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', isDark);
    };

    resolve();
    mediaQuery.addEventListener('change', resolve);
    return () => mediaQuery.removeEventListener('change', resolve);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
