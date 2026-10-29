import React, { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'motoristapro_theme';

const ThemeContext = createContext({
  theme: 'system',
  resolvedTheme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const getSystemDark = () => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  };

  const [theme, setThemeState] = useState(() => {
    try {
      localStorage.removeItem('theme'); // Limpa chave antiga
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch (e) {}
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark') return 'dark';
      if (saved === 'light') return 'light';
    } catch (e) {}
    return getSystemDark() ? 'dark' : 'light';
  });

  const applyThemeToDOM = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Aplica o tema correto na montagem e quando o theme muda
  useEffect(() => {
    const isDark = theme === 'dark' || (theme === 'system' && getSystemDark());
    setResolvedTheme(isDark ? 'dark' : 'light');
    applyThemeToDOM(isDark);
  }, [theme]);

  // Listener em tempo real para sincronização instantânea entre abas abertas no mesmo navegador
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY) {
        const newTheme = e.newValue || 'system';
        setThemeState(newTheme);
        const isDark = newTheme === 'dark' || (newTheme === 'system' && getSystemDark());
        setResolvedTheme(isDark ? 'dark' : 'light');
        applyThemeToDOM(isDark);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listener em tempo real para mudanças no tema do sistema operacional (Mac / Android / iOS)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      if (theme === 'system') {
        const isDark = e.matches;
        setResolvedTheme(isDark ? 'dark' : 'light');
        applyThemeToDOM(isDark);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    try {
      if (newTheme === 'system') {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, newTheme);
      }
    } catch (e) {}

    const isDark = newTheme === 'dark' || (newTheme === 'system' && getSystemDark());
    setResolvedTheme(isDark ? 'dark' : 'light');
    applyThemeToDOM(isDark);
  };

  const toggleTheme = () => {
    // Alterna diretamente entre claro e escuro
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
