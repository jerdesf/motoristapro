import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import EntriesTable from './components/EntriesTable';
import Settings from './components/Settings';
import EntryModal from './components/EntryModal';
import { INITIAL_ENTRIES, INITIAL_SETTINGS } from './data/initialData';
import { calculateMetrics, getDayNameBR } from './utils/calculations';
import { fetchFromCloud, saveToCloud } from './services/cloudStorage';

const STORAGE_KEY_ENTRIES = 'motoristapro_entries_v1';
const STORAGE_KEY_SETTINGS = 'motoristapro_settings_v1';
const STORAGE_KEY_TIMESTAMP = 'motoristapro_last_modified';

export default function App() {
  // Inicialização com localStorage ou dados importados da planilha
  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ENTRIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(e => e.type === 'Feriado' && e.netEarnings === null ? { ...e, netEarnings: 0 } : e);
        }
      }
    } catch (e) {
      console.error('Erro ao ler entradas do localStorage:', e);
    }
    return INITIAL_ENTRIES;
  });

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        return { ...INITIAL_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Erro ao ler configurações do localStorage:', e);
    }
    return INITIAL_SETTINGS;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  // Refs para controle do gesto Voltar no Android (History API)
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const isEntryModalOpenRef = useRef(isEntryModalOpen);
  isEntryModalOpenRef.current = isEntryModalOpen;

  const modalPushedRef = useRef(false);
  const subviewPushedRef = useRef(false);
  const isProgrammaticBackRef = useRef(false);
  
  // Status de sincronização com a nuvem Vercel KV / Redis: 'synced' | 'syncing' | 'local' | 'offline'
  const [cloudStatus, setCloudStatus] = useState('synced');

  // Sincronização ultra-rápida via API /api/data (Vercel KV / Upstash Redis)
  const syncWithCloud = useCallback(async () => {
    try {
      setCloudStatus('syncing');
      const cloudData = await fetchFromCloud();

      if (cloudData && cloudData.entries && Array.isArray(cloudData.entries)) {
        const localTime = Number(localStorage.getItem(STORAGE_KEY_TIMESTAMP) || 0);
        const cloudTime = cloudData.lastModified || 0;

        // Se a nuvem tiver dados mais recentes ou equivalentes
        if (cloudTime >= localTime) {
          setEntries(cloudData.entries);
          if (cloudData.settings) setSettings(cloudData.settings);
          localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(cloudData.entries));
          if (cloudData.settings) localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(cloudData.settings));
          localStorage.setItem(STORAGE_KEY_TIMESTAMP, String(cloudTime));
        } else {
          // Se o dispositivo local tiver alterações offline mais recentes, envia para a nuvem
          await saveToCloud(entries, settings);
        }
        setCloudStatus('synced');
        return true;
      } else {
        // Se a nuvem estiver vazia, popula imediatamente com os dados locais
        const saved = await saveToCloud(entries, settings);
        setCloudStatus(saved ? 'synced' : 'local');
        return saved;
      }
    } catch (e) {
      console.warn('Sincronização em background indisponível:', e);
      setCloudStatus('local');
      return false;
    }
  }, [entries, settings]);

  // Executa na carga inicial
  useEffect(() => {
    syncWithCloud();
  }, []);

  // Listener de sincronização periódica a cada 20s
  useEffect(() => {
    const handleFocus = () => syncWithCloud();
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(syncWithCloud, 20000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [syncWithCloud]);

  // Navegação nativa Android com gesto Voltar (History API)
  useEffect(() => {
    // Garante que o estado base inicial no histórico seja o dashboard
    if (typeof window !== 'undefined') {
      window.history.replaceState({ view: 'dashboard' }, '');
    }

    const handlePopState = () => {
      // Se foi disparado programaticamente por nós (ex: ao fechar modal ou mudar de aba via botão), ignora
      if (isProgrammaticBackRef.current) {
        isProgrammaticBackRef.current = false;
        return;
      }

      // REGRA 1: Se tiver algum card/modal aberto, o gesto de voltar fecha ele
      if (isEntryModalOpenRef.current) {
        modalPushedRef.current = false;
        setIsEntryModalOpen(false);
        setEditingEntry(null);
        return;
      }

      // REGRA 2: Se estiver em outra view que não a primeira (dashboard), volta pra primeira
      if (activeTabRef.current !== 'dashboard') {
        subviewPushedRef.current = false;
        setActiveTab('dashboard');
        return;
      }

      // REGRA 3: Se estiver na primeira view (dashboard) e sem modal, o navegador sai do app naturalmente
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Transição de abas sincronizada com o histórico do Android
  const handleTabChange = useCallback((newTab) => {
    if (newTab === activeTabRef.current) return;

    if (newTab === 'dashboard') {
      if (subviewPushedRef.current) {
        subviewPushedRef.current = false;
        isProgrammaticBackRef.current = true;
        window.history.back();
      }
      setActiveTab('dashboard');
    } else {
      if (!subviewPushedRef.current) {
        window.history.pushState({ view: newTab }, '');
        subviewPushedRef.current = true;
      } else {
        window.history.replaceState({ view: newTab }, '');
      }
      setActiveTab(newTab);
    }
  }, []);

  // Salvar no localStorage sempre que entries ou settings mudarem
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
    } catch (e) {
      console.error('Erro ao salvar entradas:', e);
    }
  }, [entries]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Erro ao salvar configurações:', e);
    }
  }, [settings]);

  // Recalcular métricas automaticamente
  const metrics = useMemo(() => {
    return calculateMetrics(entries, settings);
  }, [entries, settings]);

  // Abertura do modal para novo lançamento (hoje por padrão)
  const handleOpenNewEntry = useCallback(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const existing = entries.find(e => e.date === todayStr);
    setEditingEntry(existing || null);
    setIsEntryModalOpen(true);

    if (!modalPushedRef.current) {
      window.history.pushState({ modal: 'entry' }, '');
      modalPushedRef.current = true;
    }
  }, [entries]);

  // Abertura do modal para editar dia específico
  const handleEditEntry = useCallback((entry) => {
    setEditingEntry(entry);
    setIsEntryModalOpen(true);

    if (!modalPushedRef.current) {
      window.history.pushState({ modal: 'entry' }, '');
      modalPushedRef.current = true;
    }
  }, []);

  // Fechamento seguro do modal (via botão X, Cancelar ou salvar)
  const handleCloseModal = useCallback(() => {
    if (modalPushedRef.current) {
      modalPushedRef.current = false;
      isProgrammaticBackRef.current = true;
      window.history.back();
    }
    setIsEntryModalOpen(false);
    setEditingEntry(null);
  }, []);

  // Salvar ou atualizar lançamento (local + nuvem)
  const handleSaveEntry = (entryData) => {
    let updatedEntries;
    setEntries(prevEntries => {
      const index = prevEntries.findIndex(e => e.date === entryData.date);
      if (index >= 0) {
        updatedEntries = [...prevEntries];
        updatedEntries[index] = {
          ...updatedEntries[index],
          ...entryData,
        };
      } else {
        updatedEntries = [...prevEntries, entryData].sort((a, b) => a.date.localeCompare(b.date));
      }
      return updatedEntries;
    });

    // Envia assincronamente para a nuvem Vercel KV / Redis
    if (updatedEntries) {
      saveToCloud(updatedEntries, settings);
    }

    handleCloseModal();
  };

  // Salvar configurações (local + nuvem)
  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    saveToCloud(entries, newSettings);
  };

  // Restaurar dados originais da planilha
  const handleResetToDefault = () => {
    setEntries(INITIAL_ENTRIES);
    setSettings(INITIAL_SETTINGS);
    localStorage.removeItem(STORAGE_KEY_ENTRIES);
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
  };

  // Importar backup
  const handleImportBackup = (backup) => {
    if (backup.entries) setEntries(backup.entries);
    if (backup.settings) setSettings(backup.settings);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0d14] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* Header superior */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenNewEntry={handleOpenNewEntry}
      />

      {/* Conteúdo Principal com base na aba ativa */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-20 md:pb-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            metrics={metrics}
            entries={entries}
            settings={settings}
            onOpenNewEntry={handleOpenNewEntry}
            onEditEntry={handleEditEntry}
            setActiveTab={handleTabChange}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            entries={entries}
            onEditEntry={handleEditEntry}
            metrics={metrics}
          />
        )}

        {activeTab === 'entries' && (
          <EntriesTable
            entries={entries}
            onEditEntry={handleEditEntry}
            onOpenNewEntry={handleOpenNewEntry}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onResetToDefault={handleResetToDefault}
            allEntries={entries}
            onImportBackup={handleImportBackup}
            isCloudConnected={cloudStatus === 'synced'}
            onRefreshCloudConnection={syncWithCloud}
          />
        )}
      </main>

      {/* Navegação fixa inferior para mobile */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={handleTabChange}
      />

      {/* Modal de Lançamento / Edição */}
      <EntryModal
        isOpen={isEntryModalOpen}
        onClose={handleCloseModal}
        initialEntry={editingEntry}
        allEntries={entries}
        onSave={handleSaveEntry}
        settings={settings}
        avgEarningsPerWeight={metrics.avgEarningsPerWeight}
      />
    </div>
  );
}
