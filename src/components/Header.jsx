import React from 'react';
import { 
  TrendingUp, Calendar, ListFilter, Settings, 
  PlusCircle, Sun, Moon, CloudCheck, CloudSync, CloudOff 
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import AppLogo from './AppLogo';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  onOpenNewEntry,
  cloudStatus = 'synced'
}) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0a0d14]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand (Sem clique para dashboard, sem rótulo AUTO, com status da nuvem idêntico ao financas) */}
          <div className="flex items-center gap-2.5 sm:gap-3 select-none">
            <AppLogo className="w-10 h-10 sm:w-11 sm:h-11" />
            <div>
              <h1 className="font-black text-slate-900 dark:text-white text-base sm:text-lg tracking-tight flex items-center gap-2">
                <span>Motorista<span className="text-emerald-500">PRO</span></span>

                {cloudStatus === 'syncing' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20" title="Sincronizando com a nuvem...">
                    <CloudSync size={12} className="animate-spin" />
                    <span className="hidden sm:inline">Nuvem...</span>
                  </span>
                )}

                {cloudStatus === 'synced' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20" title="Sincronizado na nuvem em tempo real">
                    <CloudCheck size={12} />
                    <span className="hidden sm:inline">Nuvem ativa</span>
                  </span>
                )}

                {cloudStatus === 'offline' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded-full border border-slate-500/20" title="Modo local (salvo no dispositivo)">
                    <CloudOff size={12} />
                    <span className="hidden sm:inline">Local</span>
                  </span>
                )}
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">Controle de Ganhos & Projeções</p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-[#111726] p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Dashboard
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'calendar'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Calendário
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('entries')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'entries'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              Lançamentos
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              Configurações
            </button>
          </nav>

          {/* Theme Toggle & Action Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Botão de Alternar Modo Claro / Escuro */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#161e31] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 transition-all active:scale-90 flex items-center justify-center cursor-pointer shadow-sm"
              title={resolvedTheme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
              aria-label="Alternar tema claro/escuro"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400 animate-fadeIn" />
              ) : (
                <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-700 animate-fadeIn" />
              )}
            </button>

            <button
              type="button"
              onClick={onOpenNewEntry}
              className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/25 flex items-center gap-1.5 sm:gap-2 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Lançar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
