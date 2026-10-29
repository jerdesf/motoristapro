import React from 'react';
import { TrendingUp, Calendar, ListFilter, Settings } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab }) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#111726]/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1 safe-area-pb">
      <div className="grid grid-cols-4 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
            activeTab === 'dashboard'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
            activeTab === 'calendar'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Calendário</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('entries')}
          className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
            activeTab === 'entries'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListFilter className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Lançamentos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
            activeTab === 'settings'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Ajustes</span>
        </button>
      </div>
    </div>
  );
}
