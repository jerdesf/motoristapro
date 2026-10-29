import React from 'react';
import { 
  TrendingUp, Calendar, ListFilter, Settings, 
  PlusCircle, Sun, Moon 
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import AppLogo from './AppLogo';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  onOpenNewEntry
}) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0a0d14]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none" onClick={() => setActiveTab('dashboard')}>
            <AppLogo className="w-10 h-10 sm:w-11 sm:h-11 transition-transform active:scale-95" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-900 dark:text-white text-base sm:text-lg tracking-tight">Motorista<span className="text-emerald-500">PRO</span></span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  AUTO
                </span>
              </div>
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
