import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";

const BackNavigationContext = createContext(null);

export function useBackNavigation() {
  const ctx = useContext(BackNavigationContext);
  if (!ctx) {
    throw new Error("useBackNavigation must be used within a BackNavigationProvider");
  }
  return ctx;
}

/**
 * Hook para registrar um card, modal ou formulário expansível na navegação por gesto de voltar.
 * Sempre que isOpen for true, o gesto de voltar do Android fechará este card/modal.
 */
export function useRegisterOverlay(isOpen, onClose, id) {
  const { registerOverlay } = useBackNavigation();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const idRef = useRef(id || `overlay-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    if (!isOpen) return;

    const overlayId = idRef.current;
    const cleanup = registerOverlay(overlayId, () => {
      onCloseRef.current();
    });

    return () => {
      cleanup();
    };
  }, [isOpen, registerOverlay]);
}

export const BackNavigationProvider = ({
  activeTab,
  onTabChange,
  children,
}) => {
  const overlayStackRef = useRef([]);
  const ignorePopStateCountRef = useRef(0);
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const onTabChangeRef = useRef(onTabChange);
  onTabChangeRef.current = onTabChange;

  const pushHistory = useCallback((state) => {
    if (typeof window === "undefined") return;
    const current = window.history.state || {};
    window.history.pushState({ ...current, _motoristapro: state }, "");
  }, []);

  const replaceHistory = useCallback((state) => {
    if (typeof window === "undefined") return;
    const current = window.history.state || {};
    window.history.replaceState({ ...current, _motoristapro: state }, "");
  }, []);

  // Define a entrada raiz inicial no carregamento da aplicação
  useEffect(() => {
    if (typeof window === "undefined") return;
    replaceHistory({ type: "root", tab: "dashboard" });
  }, [replaceHistory]);

  const changeTab = useCallback(
    (newTab) => {
      if (newTab === activeTabRef.current) return;

      // Se havia algum card ou modal aberto e o usuário clicou diretamente em outra aba
      if (overlayStackRef.current.length > 0) {
        const count = overlayStackRef.current.length;
        overlayStackRef.current = [];
        ignorePopStateCountRef.current += count;
        window.history.go(-count);
      }

      const prevTab = activeTabRef.current;
      activeTabRef.current = newTab;

      if (newTab === "dashboard") {
        if (prevTab !== "dashboard") {
          ignorePopStateCountRef.current++;
          window.history.back();
        }
        onTabChangeRef.current("dashboard");
      } else {
        if (prevTab === "dashboard") {
          pushHistory({ type: "sub_tab", tab: newTab });
        } else {
          replaceHistory({ type: "sub_tab", tab: newTab });
        }
        onTabChangeRef.current(newTab);
      }
    },
    [pushHistory, replaceHistory]
  );

  const registerOverlay = useCallback(
    (id, close) => {
      pushHistory({ type: "overlay", id });
      const entry = { id, close };
      overlayStackRef.current.push(entry);

      return () => {
        const index = overlayStackRef.current.findIndex((o) => o.id === id);
        if (index !== -1) {
          // O card/modal foi fechado por clique em botão/código (não pelo gesto voltar)
          overlayStackRef.current.splice(index, 1);
          ignorePopStateCountRef.current++;
          window.history.back();
        }
      };
    },
    [pushHistory]
  );

  useEffect(() => {
    const handlePopState = () => {
      // Se este popstate foi disparado por chamada programática do history.back()
      if (ignorePopStateCountRef.current > 0) {
        ignorePopStateCountRef.current--;
        return;
      }

      // Regra 1: Se tiver algum card/modal aberto, o gesto de voltar fecha ele
      if (overlayStackRef.current.length > 0) {
        const top = overlayStackRef.current.pop();
        if (top) {
          top.close();
          return;
        }
      }

      // Regra 2: Se estiver em outra view que não a primeira, volta vai pra primeira
      if (activeTabRef.current !== "dashboard") {
        activeTabRef.current = "dashboard";
        onTabChangeRef.current("dashboard");
        return;
      }

      // Regra 3: Se estiver na primeira view e voltar, sai do app definitivamente
      try {
        window.close();
      } catch (e) {}

      // Em navegadores / PWAs no Android que possuem uma página em branco inicial (about:blank),
      // aciona o retorno subsequente para sair imediatamente sem travar na tela preta
      try {
        window.history.back();
      } catch (e) {}

      setTimeout(() => {
        try {
          window.close();
        } catch (e) {}
      }, 50);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return (
    <BackNavigationContext.Provider
      value={{
        activeTab,
        changeTab,
        registerOverlay,
      }}
    >
      {children}
    </BackNavigationContext.Provider>
  );
};
