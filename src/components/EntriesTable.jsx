import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Download, Edit3, Trash2, 
  Calendar, CheckCircle, Clock, PlusCircle,
  ArrowUpDown, SlidersHorizontal
} from 'lucide-react';
import { formatCurrency, formatDateBR } from '../utils/calculations';

export default function EntriesTable({ entries, onEditEntry, onOpenNewEntry }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'filled', 'pending'
  const [monthFilter, setMonthFilter] = useState('all'); // 'all', '08', '09', '10', '11', '12'
  const [sortBy, setSortBy] = useState('filled_desc'); // 'filled_desc' (padrão)

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredAndSortedEntries = useMemo(() => {
    // 1. Filtragem
    const filtered = entries.filter(entry => {
      // Filtro de texto (data ou dia da semana ou tipo)
      const matchesSearch = 
        entry.date.includes(searchTerm) || 
        entry.dayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.type.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Filtro de status: Realizado considera preenchidos até o dia de hoje
      const isPastFilled = entry.netEarnings !== null && entry.netEarnings !== undefined && entry.date <= todayStr;
      if (statusFilter === 'filled' && !isPastFilled) return false;
      if (statusFilter === 'pending' && isPastFilled) return false;

      // Filtro de mês
      if (monthFilter !== 'all') {
        const month = entry.date.split('-')[1];
        if (month !== monthFilter) return false;
      }

      return true;
    });

    // 2. Ordenação
    return [...filtered].sort((a, b) => {
      const isPastFilled = (e) => e.netEarnings !== null && e.netEarnings !== undefined && e.date <= todayStr;
      const aPast = isPastFilled(a);
      const bPast = isPastFilled(b);
      const aVal = Number(a.netEarnings) || 0;
      const bVal = Number(b.netEarnings) || 0;

      switch (sortBy) {
        case 'filled_desc':
          // Padrão: Dias preenchidos até hoje primeiro (do mais novo para o mais antigo), seguidos pelos dias futuros
          if (aPast && !bPast) return -1;
          if (!aPast && bPast) return 1;
          if (aPast && bPast) return b.date.localeCompare(a.date);
          return a.date.localeCompare(b.date);

        case 'date_desc':
          // Data mais recente primeiro (mais nova para mais antiga)
          return b.date.localeCompare(a.date);

        case 'date_asc':
          // Data mais antiga primeiro (mais antiga para mais nova)
          return a.date.localeCompare(b.date);

        case 'earnings_desc':
          // Maior ganho primeiro
          if (aPast && !bPast) return -1;
          if (!aPast && bPast) return 1;
          return bVal - aVal;

        case 'earnings_asc':
          // Menor ganho primeiro
          if (aPast && !bPast) return -1;
          if (!aPast && bPast) return 1;
          return aVal - bVal;

        default:
          return b.date.localeCompare(a.date);
      }
    });
  }, [entries, searchTerm, statusFilter, monthFilter, sortBy, todayStr]);

  // Total acumulado dos filtrados
  const sumFiltered = filteredAndSortedEntries
    .filter(e => e.netEarnings !== null && e.netEarnings !== undefined)
    .reduce((acc, e) => acc + (Number(e.netEarnings) || 0), 0);

  // Função para exportar para CSV
  const handleExportCSV = () => {
    const headers = ['Data', 'Dia', 'Tipo', 'Peso de trabalho', 'Realizado apos combustivel'];
    const rows = filteredAndSortedEntries.map(e => [
      e.date,
      e.dayName,
      e.type,
      e.weight,
      e.netEarnings !== null && e.netEarnings !== undefined ? e.netEarnings : ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `controle_ganhos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header com Ações e Busca */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">Histórico de Lançamentos</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {filteredAndSortedEntries.length} dias exibidos • Total realizado no filtro: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(sumFiltered)}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={onOpenNewEntry}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Novo Lançamento
            </button>
          </div>
        </div>

        {/* Barra de Filtros e Organização */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Campo de Busca */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por data, dia ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#161e31] border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Botão de Organização / Ordenação */}
          <div className="sm:col-span-3 relative">
            <div className="relative flex items-center">
              <span className="absolute left-3 pointer-events-none text-emerald-600 dark:text-emerald-400">
                <ArrowUpDown className="w-3.5 h-3.5" />
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#161e31] border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
              >
                <option value="filled_desc">Últimos Preenchidos até Hoje (Padrão)</option>
                <option value="date_desc">Data Mais Recente (Nova → Antiga)</option>
                <option value="date_asc">Data Mais Antiga (Cronológica)</option>
                <option value="earnings_desc">Maior Ganho Líquido (R$)</option>
                <option value="earnings_asc">Menor Ganho Líquido (R$)</option>
              </select>
            </div>
          </div>

          {/* Filtro de Status */}
          <div className="sm:col-span-3 flex items-center p-1 bg-slate-100 dark:bg-[#161e31] border border-slate-200 dark:border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-colors ${
                statusFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('filled')}
              className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-colors ${
                statusFilter === 'filled' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Realizados
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-colors ${
                statusFilter === 'pending' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Pendentes
            </button>
          </div>

          {/* Filtro de Mês */}
          <div className="sm:col-span-2">
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#161e31] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Todos os Meses</option>
              <option value="08">Agosto</option>
              <option value="09">Setembro</option>
              <option value="10">Outubro</option>
              <option value="11">Novembro</option>
              <option value="12">Dezembro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Lançamentos */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#161e31] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-3 sm:px-4">Data & Dia</th>
                <th className="py-3 px-2 sm:px-3">Tipo</th>
                <th className="py-3 px-2 sm:px-3 text-center">Peso</th>
                <th className="py-3 px-3 sm:px-4 text-right">Líquido</th>
                <th className="py-3 px-2 sm:px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAndSortedEntries.map((entry) => {
                const isFilled = entry.netEarnings !== null && entry.netEarnings !== undefined;
                const isZero = isFilled && Number(entry.netEarnings) === 0;

                return (
                  <tr 
                    key={entry.date} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onEditEntry(entry)}
                  >
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                      <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                        {formatDateBR(entry.date)}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                        {entry.dayName}
                      </div>
                    </td>

                    <td className="py-2.5 sm:py-3 px-2 sm:px-3">
                      <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold ${
                        entry.type === 'Final de semana'
                          ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20'
                          : entry.type === 'Feriado'
                            ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                            : entry.type === 'Meio dia'
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {entry.type === 'Final de semana' ? 'FDS' : entry.type === 'Meio dia' ? '1/2' : entry.type === 'Feriado' ? 'FER' : 'Útil'}
                      </span>
                    </td>

                    <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center font-semibold text-slate-700 dark:text-slate-300 mono-numbers text-xs">
                      {entry.weight}
                    </td>

                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right">
                      {isFilled ? (
                        <div>
                          <span className={`font-bold text-xs sm:text-sm mono-numbers ${
                            isZero ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {isZero ? 'R$ 0,00' : formatCurrency(entry.netEarnings)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-[10px] sm:text-[11px] italic flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          Pendente
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 sm:py-3 px-2 sm:px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditEntry(entry);
                        }}
                        className="p-1 sm:p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
                        title="Editar lançamento"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredAndSortedEntries.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    Nenhum lançamento encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
