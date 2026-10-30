import React from 'react';
import { 
  TrendingUp, DollarSign, Calendar, ShieldCheck, 
  Zap, Award, ChevronRight, Edit3, PlusCircle
} from 'lucide-react';
import { formatCurrency, formatDateBR, getTodayBR } from '../utils/calculations';

export default function Dashboard({ 
  metrics, 
  entries, 
  settings, 
  onOpenNewEntry, 
  onEditEntry,
  setActiveTab 
}) {
  const todayStr = getTodayBR();
  // Pegar os últimos 7 dias realizados estritamente até a data atual de hoje
  const filledEntries = entries.filter(e => 
    e.netEarnings !== null && 
    e.netEarnings !== undefined && 
    e.netEarnings !== '' &&
    e.date <= todayStr
  );
  const recentEntries = [...filledEntries].slice(-7).reverse();

  return (
    <div className="space-y-5 sm:space-y-6 pb-12">
      {/* Hero Card - Projeção Mensal Principal */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/30 dark:from-[#161e31] dark:via-[#111726] dark:to-[#0d131f] border border-emerald-300/80 dark:border-emerald-500/30 p-5 sm:p-8 shadow-md dark:shadow-2xl transition-colors duration-200">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Projeção Baseada no Seu Histórico Real
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Período:</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                {formatDateBR(metrics.startDate)} até {formatDateBR(metrics.endDate)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-end">
            <div className="lg:col-span-7">
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium mb-1">
                Lucro Líquido Mensal Projetado (Base 30 dias)
              </p>
              <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-200 mono-numbers tracking-tight">
                  {formatCurrency(metrics.monthlyProjectedNetProfit)}
                </h1>
                <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">/ mês livre no bolso</span>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white/90 dark:bg-[#0a0d14]/70 backdrop-blur-md rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Progresso do Período</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mono-numbers">
                  {metrics.elapsedDays} de {metrics.totalPeriodDays} dias ({metrics.completionRate}%)
                </span>
              </div>
              
              <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
                  style={{ width: `${metrics.completionRate}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                <span>{formatDateBR(metrics.startDate)}</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Hoje: {formatDateBR(metrics.lastConsideredDate)}</span>
                <span>{formatDateBR(metrics.endDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Cards: 1. Total Faturamento | 2. Custos | 3. Lucro Líquido Atual */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: Total Faturamento */}
        <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 p-4 sm:p-5 rounded-2xl transition-all shadow-sm dark:shadow-lg group">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Faturamento</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mono-numbers">
            {formatCurrency(metrics.realizedEarnings)}
          </div>
        </div>

        {/* Card 2: Custos Decorridos */}
        <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 p-4 sm:p-5 rounded-2xl transition-all shadow-sm dark:shadow-lg group">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Custos</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-300 mono-numbers">
            {formatCurrency(metrics.realizedCosts)}
          </div>
        </div>

        {/* Card 3: Lucro Líquido Atual */}
        <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 p-4 sm:p-5 rounded-2xl transition-all shadow-sm dark:shadow-lg group">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lucro Líquido Atual</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-white mono-numbers">
            {formatCurrency(metrics.realizedNetProfit)}
          </div>
        </div>
      </div>

      {/* Seção Inferior: Últimos Lançamentos & Estrutura de Custos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Histórico Recente */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              Últimos Dias Registrados
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('entries')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1 transition-colors"
            >
              Ver todos ({filledEntries.length})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentEntries.map((entry) => (
              <div 
                key={entry.date} 
                onClick={() => onEditEntry(entry)}
                className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    entry.type === 'Final de semana' 
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' 
                      : entry.type === 'Feriado' 
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' 
                        : entry.type === 'Meio dia'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {entry.type === 'Final de semana' ? 'FDS' : entry.type === 'Meio dia' ? '1/2' : entry.type === 'Feriado' ? 'FER' : 'Útil'}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {formatDateBR(entry.date)} • {entry.dayName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Peso {entry.weight}
                    </div>
                  </div>
                </div>

                <div className="text-right flex items-center gap-2">
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mono-numbers">
                      {entry.netEarnings !== null ? formatCurrency(entry.netEarnings) : '—'}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Líquido</div>
                  </div>
                  <Edit3 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo da Estrutura de Custos */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              Sua Estrutura de Custos
            </h3>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-[#161e31] border border-slate-100 dark:border-transparent">
                <span className="text-slate-600 dark:text-slate-400">Custo diário do veículo:</span>
                <span className="font-semibold text-slate-900 dark:text-white mono-numbers">{formatCurrency(settings.carDailyCost)}/dia</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-[#161e31] border border-slate-100 dark:border-transparent">
                <span className="text-slate-600 dark:text-slate-400">Lavagem + Celular diário:</span>
                <span className="font-semibold text-slate-900 dark:text-white mono-numbers">{formatCurrency(settings.extraDailyCost)}/dia</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Total Fixo a cada 30 dias:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 mono-numbers">{formatCurrency(metrics.dailyCost * 30)}</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenNewEntry}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Lançar Faturamento de Hoje
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
