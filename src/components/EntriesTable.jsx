import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Download, Edit3, Trash2, 
  Calendar, CheckCircle, Clock, PlusCircle
} from 'lucide-react';
import { formatCurrency, formatDateBR } from '../utils/calculations';

export default function EntriesTable({ entries, onEditEntry, onOpenNewEntry }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'filled', 'pending'
  const [monthFilter, setMonthFilter] = useState('all'); // 'all', '08', '09', '10', '11', '12'

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // Filtro de texto (data ou dia da semana ou tipo)
      const matchesSearch = 
        entry.date.includes(searchTerm) || 
        entry.dayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.type.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Filtro de status
      const isFilled = entry.netEarnings !== null && entry.netEarnings !== undefined;
      if (statusFilter === 'filled' && !isFilled) return false;
      if (statusFilter === 'pending' && isFilled) return false;

      // Filtro de mês
      if (monthFilter !== 'all') {
        const month = entry.date.split('-')[1];
        if (month !== monthFilter) return false;
      }

      return true;
    });
  }, [entries, searchTerm, statusFilter, monthFilter]);

  // Total acumulado dos filtrados
  const sumFiltered = filteredEntries
    .filter(e => e.netEarnings !== null)
    .reduce((acc, e) => acc + (Number(e.netEarnings) || 0), 0);

  // Função para exportar para CSV
  const handleExportCSV = () => {
    const headers = ['Data', 'Dia', 'Tipo', 'Peso de trabalho', 'Realizado apos combustivel'];
    const rows = entries.map(e => [
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
      <div className="bg-[#111726] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-white text-lg">Histórico de Lançamentos</h2>
            <p className="text-xs text-slate-400">
              {filteredEntries.length} dias exibidos • Total realizado no filtro: <strong className="text-emerald-400">{formatCurrency(sumFiltered)}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={onOpenNewEntry}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Novo Lançamento
            </button>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-slate-800">
          {/* Campo de Busca */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por data, dia ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#161e31] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Filtro de Status */}
          <div className="sm:col-span-4 flex items-center p-1 bg-[#161e31] border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-colors ${
                statusFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('filled')}
              className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-colors ${
                statusFilter === 'filled' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Realizados
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-colors ${
                statusFilter === 'pending' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pendentes
            </button>
          </div>

          {/* Filtro de Mês */}
          <div className="sm:col-span-3">
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full bg-[#161e31] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
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
      <div className="bg-[#111726] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161e31] border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Data & Dia</th>
                <th className="py-3 px-3">Tipo de Jornada</th>
                <th className="py-3 px-3 text-center">Peso</th>
                <th className="py-3 px-4 text-right">Líquido (pós-comb.)</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredEntries.map((entry) => {
                const isFilled = entry.netEarnings !== null && entry.netEarnings !== undefined;
                const isZero = isFilled && Number(entry.netEarnings) === 0;

                return (
                  <tr 
                    key={entry.date} 
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onEditEntry(entry)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">
                        {formatDateBR(entry.date)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {entry.dayName}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        entry.type === 'Final de semana'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : entry.type === 'Feriado'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : entry.type === 'Meio dia'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {entry.type}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-semibold text-slate-300 mono-numbers">
                      {entry.weight}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isFilled ? (
                        <div>
                          <span className={`font-bold text-sm mono-numbers ${
                            isZero ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {isZero ? 'R$ 0,00 (Folga)' : formatCurrency(entry.netEarnings)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          Pendente
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditEntry(entry);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Editar lançamento"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
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
