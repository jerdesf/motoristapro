import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  DollarSign, CheckCircle2, Clock, Sparkles
} from 'lucide-react';
import { formatCurrency, formatDateBR, parseDate } from '../utils/calculations';

export default function CalendarView({ entries, onEditEntry, metrics }) {
  // Meses disponíveis com base nas datas da projeção (2026-08 até 2026-12)
  const availableMonths = [
    { year: 2026, month: 7, label: 'Agosto 2026' },    // month is 0-indexed (7 = Aug)
    { year: 2026, month: 8, label: 'Setembro 2026' },  // 8 = Sep
    { year: 2026, month: 9, label: 'Outubro 2026' },   // 9 = Oct
    { year: 2026, month: 10, label: 'Novembro 2026' }, // 10 = Nov
    { year: 2026, month: 11, label: 'Dezembro 2026' }, // 11 = Dec
  ];

  // Default para Outubro 2026 (ou mês atual)
  const [currentMonthIndex, setCurrentMonthIndex] = useState(2); // Outubro
  const currentMonth = availableMonths[currentMonthIndex];

  // Filtrar lançamentos daquele mês
  const monthEntries = entries.filter(e => {
    const d = parseDate(e.date);
    return d.getFullYear() === currentMonth.year && d.getMonth() === currentMonth.month;
  });

  // Mapa de datas para busca rápida
  const entryMap = new Map();
  monthEntries.forEach(e => entryMap.set(e.date, e));

  // Estatísticas do mês
  const filledInMonth = monthEntries.filter(e => e.netEarnings !== null && e.netEarnings !== undefined);
  const totalEarnedInMonth = filledInMonth.reduce((sum, e) => sum + (Number(e.netEarnings) || 0), 0);
  const daysWorkedInMonth = filledInMonth.filter(e => Number(e.netEarnings) > 0).length;

  // Dias corridos decorridos no mês para cálculo dos custos fixos
  const workDatesInMonth = monthEntries
    .filter(e => e.netEarnings !== null && e.netEarnings !== undefined && (e.type !== 'Feriado' || Number(e.netEarnings) > 0))
    .map(e => e.date)
    .sort();

  let elapsedDaysInMonth = 0;
  if (workDatesInMonth.length > 0) {
    const firstDateInMonth = monthEntries[0].date;
    const lastDateInMonth = workDatesInMonth[workDatesInMonth.length - 1];
    // Dias entre o primeiro dia registrado do mês e o último considerado
    const startD = new Date(firstDateInMonth);
    const endD = new Date(lastDateInMonth);
    const diff = Math.round((endD - startD) / (1000 * 60 * 60 * 24)) + 1;
    elapsedDaysInMonth = Math.max(0, diff);
  }

  const costInMonth = elapsedDaysInMonth * (metrics.dailyCost || 0);
  const netProfitInMonth = totalEarnedInMonth - costInMonth;

  // Gerar grid do mês (incluindo dias em branco no início)
  const firstDayOfMonth = new Date(currentMonth.year, currentMonth.month, 1).getDay(); // 0 = Dom, 1 = Seg...
  const daysInMonth = new Date(currentMonth.year, currentMonth.month + 1, 0).getDate();

  const calendarDays = [];
  // Células vazias antes do dia 1
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push({ isEmpty: true, id: `empty-${i}` });
  }

  // Dias reais do mês
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(currentMonth.month + 1).padStart(2, '0');
    const dateStr = `${currentMonth.year}-${monthStr}-${dayStr}`;
    const entry = entryMap.get(dateStr);
    calendarDays.push({
      isEmpty: false,
      day,
      date: dateStr,
      entry,
    });
  }

  return (
    <div className="space-y-5 pb-12">
      {/* Header do Mês com Navegação */}
      <div className="bg-[#111726] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-lg sm:text-xl">{currentMonth.label}</h2>
            <p className="text-xs text-slate-400">Toque em qualquer dia para ver ou registrar o faturamento</p>
          </div>
        </div>

        {/* Controles de Navegação */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            disabled={currentMonthIndex === 0}
            onClick={() => setCurrentMonthIndex(i => Math.max(0, i - 1))}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700">
            {currentMonthIndex + 1} de {availableMonths.length}
          </div>

          <button
            type="button"
            disabled={currentMonthIndex === availableMonths.length - 1}
            onClick={() => setCurrentMonthIndex(i => Math.min(availableMonths.length - 1, i + 1))}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-300 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mini Resumo do Mês Selecionado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#111726] border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Ganhos no Mês</span>
          <span className="text-xl font-bold text-white mono-numbers">
            {formatCurrency(totalEarnedInMonth)}
          </span>
        </div>

        <div className="bg-[#111726] border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Dias Trabalhados</span>
          <span className="text-xl font-bold text-white mono-numbers">
            {daysWorkedInMonth} <span className="text-xs font-normal text-slate-400">dias rodados</span>
          </span>
        </div>

        <div className="bg-[#111726] border border-slate-800 p-4 rounded-xl">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">Lucro Líquido do Mês</span>
          <span className={`text-xl font-bold mono-numbers ${
            netProfitInMonth >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {formatCurrency(netProfitInMonth)}
          </span>
        </div>
      </div>

      {/* Grade do Calendário */}
      <div className="bg-[#111726] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-3 sm:p-5">
        {/* Dias da Semana (Header) */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, idx) => (
            <div 
              key={dia} 
              className={`text-xs font-bold py-2 ${
                idx === 0 || idx === 6 ? 'text-purple-400' : 'text-slate-400'
              }`}
            >
              {dia}
            </div>
          ))}
        </div>

        {/* Grade dos Dias */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays.map((item, idx) => {
            if (item.isEmpty) {
              return (
                <div 
                  key={item.id} 
                  className="min-h-[70px] sm:min-h-[95px] rounded-xl bg-slate-900/30 border border-transparent"
                />
              );
            }

            const { day, date, entry } = item;
            const hasValue = entry && entry.netEarnings !== null && entry.netEarnings !== undefined;
            const isZero = hasValue && Number(entry.netEarnings) === 0;
            const isPositive = hasValue && Number(entry.netEarnings) > 0;
            const isFuture = !hasValue;
            const isWeekend = entry?.type === 'Final de semana';
            const isHoliday = entry?.type === 'Feriado';

            return (
              <div
                key={date}
                onClick={() => onEditEntry(entry || { date, type: 'Dia útil', weight: 1.0, netEarnings: null })}
                className={`min-h-[70px] sm:min-h-[95px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                  isPositive
                    ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-950/30'
                    : isZero
                      ? 'bg-amber-950/15 border-amber-500/20 hover:border-amber-500/50'
                      : isHoliday
                        ? 'bg-blue-950/15 border-blue-500/20 hover:border-blue-500/50'
                        : 'bg-[#161e31]/60 border-slate-800/80 hover:border-slate-700 hover:bg-[#161e31]'
                }`}
              >
                {/* Linha superior: Número do dia + Tipo */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${
                    isPositive ? 'text-emerald-300' : isWeekend ? 'text-purple-300' : 'text-slate-300'
                  }`}>
                    {day}
                  </span>

                  {entry && (
                    <span className={`text-[9px] px-1 py-0.5 rounded font-semibold ${
                      isHoliday
                        ? 'bg-blue-500/20 text-blue-300'
                        : isWeekend
                          ? 'bg-purple-500/20 text-purple-300'
                          : entry.type === 'Meio dia'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'text-slate-500'
                    }`}>
                      {isHoliday ? 'FER' : isWeekend ? 'FDS' : entry.type === 'Meio dia' ? '1/2' : ''}
                    </span>
                  )}
                </div>

                {/* Valor ou Status */}
                <div className="mt-1">
                  {isPositive && (
                    <div className="text-xs sm:text-sm font-bold text-emerald-400 mono-numbers leading-tight">
                      {formatCurrency(entry.netEarnings)}
                    </div>
                  )}

                  {isZero && (
                    <div className="text-[10px] sm:text-xs font-semibold text-amber-400">
                      Folga / R$ 0
                    </div>
                  )}

                  {isFuture && (
                    <div className="text-[10px] text-slate-500 group-hover:text-slate-400 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span className="hidden sm:inline">Pendente</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
