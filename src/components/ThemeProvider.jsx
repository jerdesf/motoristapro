import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

const SESSION_KEY = 'motoristapro_session_theme';
const BROADCAST_CHANNEL_NAME = 'motoristapro_theme_channel';

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
      // Limpa chaves permanentes de versões anteriores
      localStorage.removeItem('theme');
      localStorage.removeItem('motoristapro_theme');
      
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch (e) {}
    // Quando todas as abas foram fechadas e uma nova sessão abre: PADRÃO É SISTEMA
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved === 'dark') return 'dark';
      if (saved === 'light') return 'light';
    } catch (e) {}
    return getSystemDark() ? 'dark' : 'light';
  });

  const applyThemeToDOM = (isDark) => {
    const color = isDark ? '#0a0d14' : '#ffffff';

    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }

    // Sincroniza a barra de status e a barra de navegação do sistema no Android e PWA
    const metas = document.querySelectorAll('meta[name="theme-color"]');
    if (metas.length > 0) {
      metas.forEach((m) => {
        m.removeAttribute('media');
        m.setAttribute('content', color);
      });
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = color;
      document.head.appendChild(meta);
    }

    // Barra de status no iOS / Safari PWA
    const appleStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (appleStatus) {
      appleStatus.setAttribute('content', isDark ? 'black-translucent' : 'default');
    }
  };

  const themeRef = useRef(theme);
  themeRef.current = theme;

  // Atualiza DOM sempre que theme muda
  useEffect(() => {
    const isDark = theme === 'dark' || (theme === 'system' && getSystemDark());
    setResolvedTheme(isDark ? 'dark' : 'light');
    applyThemeToDOM(isDark);
  }, [theme]);

  // Sincronização em tempo real entre abas abertas da mesma sessão via BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

    // Quando uma nova aba abre, pergunta se já existe uma aba aberta com tema definido nesta sessão
    if (themeRef.current === 'system') {
      channel.postMessage({ type: 'REQUEST_THEME' });
    }

    channel.onmessage = (event) => {
      const data = event.data;
      if (!data) return;

      if (data.type === 'THEME_CHANGED') {
        // Outra aba alterou o tema durante a sessão
        const newTheme = data.theme;
        setThemeState(newTheme);
        try {
          if (newTheme === 'system') sessionStorage.removeItem(SESSION_KEY);
          else sessionStorage.setItem(SESSION_KEY, newTheme);
        } catch (e) {}
      } else if (data.type === 'REQUEST_THEME') {
        // Uma nova aba abriu e perguntou se temos um tema de sessão ativo
        if (themeRef.current !== 'system') {
          channel.postMessage({ type: 'SYNC_THEME', theme: themeRef.current });
        }
      } else if (data.type === 'SYNC_THEME') {
        // Resposta de uma aba já aberta com o tema ativo da sessão
        const newTheme = data.theme;
        setThemeState(newTheme);
        try {
          sessionStorage.setItem(SESSION_KEY, newTheme);
        } catch (e) {}
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  // Listener para mudanças no tema do sistema operacional (Mac / Android / iOS) quando no modo sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      if (themeRef.current === 'system') {
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
  }, []);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    try {
      if (newTheme === 'system') {
        sessionStorage.removeItem(SESSION_KEY);
      } else {
        sessionStorage.setItem(SESSION_KEY, newTheme);
      }
    } catch (e) {}

    // Notifica todas as outras abas abertas no navegador
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channel.postMessage({ type: 'THEME_CHANGED', theme: newTheme });
        channel.close();
      }
    } catch (e) {}

    const isDark = newTheme === 'dark' || (newTheme === 'system' && getSystemDark());
    setResolvedTheme(isDark ? 'dark' : 'light');
    applyThemeToDOM(isDark);
  };

  const toggleTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
