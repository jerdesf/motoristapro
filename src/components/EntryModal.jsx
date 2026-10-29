import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Fuel, DollarSign, Check, 
  Sparkles, Gauge, ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  formatCurrency, formatNumber, calculateFuelDetail, 
  getDayNameBR, getDefaultDayType, getDefaultWeight 
} from '../utils/calculations';

// Função auxiliar flexível para aceitar tanto ponto quanto vírgula
function parseFlexibleNumber(val) {
  if (val === null || val === undefined) return 0;
  const str = String(val).trim().replace(/\s/g, '');
  if (!str) return 0;
  const normalized = str.replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

export default function EntryModal({ 
  isOpen, 
  onClose, 
  initialEntry, 
  allEntries = [],
  onSave, 
  settings,
  avgEarningsPerWeight = 338 
}) {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(initialEntry?.date || todayStr);
  const [dayType, setDayType] = useState('Dia útil');
  const [weight, setWeight] = useState(1.0);

  // Campos de cálculo de combustível
  const [grossRevenue, setGrossRevenue] = useState('');
  const [kmDriven, setKmDriven] = useState('');
  const [fuelEfficiency, setFuelEfficiency] = useState(
    String(settings.fuelEfficiency || 8.5)
  );
  const [fuelPrice, setFuelPrice] = useState(
    String(settings.fuelPrice || 3.69)
  );

  // Função auxiliar para obter tipo e peso da planilha/calendário
  const getDayInfoFromCalendar = (targetDate) => {
    const matched = allEntries.find(e => e.date === targetDate);
    if (matched) {
      return {
        type: matched.type,
        weight: matched.weight,
        matched: true
      };
    }
    const defType = getDefaultDayType(targetDate);
    return {
      type: defType,
      weight: getDefaultWeight(defType, settings),
      matched: false
    };
  };

  // Inicialização ao abrir o modal ou mudar initialEntry
  useEffect(() => {
    if (!isOpen) return;

    const targetDate = initialEntry?.date || todayStr;
    setDate(targetDate);

    // Seleciona automaticamente o tipo e o peso com base na planilha
    const info = getDayInfoFromCalendar(targetDate);
    setDayType(initialEntry?.type || info.type);
    setWeight(initialEntry?.weight !== undefined ? initialEntry.weight : info.weight);

    // Faturamento e dados anteriores se existirem
    if (initialEntry?.meta?.grossRevenue) {
      setGrossRevenue(String(initialEntry.meta.grossRevenue).replace('.', ','));
    } else if (initialEntry?.netEarnings !== null && initialEntry?.netEarnings !== undefined) {
      setGrossRevenue(String(initialEntry.netEarnings).replace('.', ','));
    } else {
      setGrossRevenue('');
    }

    setKmDriven(initialEntry?.meta?.kmDriven ? String(initialEntry.meta.kmDriven).replace('.', ',') : '');
    setFuelEfficiency(String(initialEntry?.meta?.fuelEfficiency || settings.fuelEfficiency || 8.5).replace('.', ','));
    setFuelPrice(String(initialEntry?.meta?.fuelPrice || settings.fuelPrice || 3.69).replace('.', ','));
  }, [isOpen, initialEntry]);

  // Quando o usuário muda a data no input ou nos botões rápidos
  const handleDateChange = (newDate) => {
    setDate(newDate);
    const info = getDayInfoFromCalendar(newDate);
    setDayType(info.type);
    setWeight(info.weight);
  };

  const handleQuickDay = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const dateStr = d.toISOString().split('T')[0];
    handleDateChange(dateStr);
  };

  // Se trocar o tipo de dia manualmente
  const handleTypeChange = (newType) => {
    setDayType(newType);
    setWeight(getDefaultWeight(newType, settings));
  };

  // Permite digitar dígitos, ponto ou vírgula
  const handleCleanInput = (setter) => (e) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/[^0-9.,]/g, '');
    setter(cleaned);
  };

  // Cálculo detalhado do combustível com suporte a ponto e vírgula
  const kmNum = parseFlexibleNumber(kmDriven);
  const effNum = parseFlexibleNumber(fuelEfficiency);
  const priceNum = parseFlexibleNumber(fuelPrice);
  const grossNum = parseFlexibleNumber(grossRevenue);

  // Gasto com combustível calculado imediatamente se houver KM, Consumo e Preço
  const hasFuelData = kmNum > 0 && effNum > 0 && priceNum > 0;
  const fuelLiters = hasFuelData ? (kmNum / effNum) : 0;
  const fuelCost = hasFuelData ? (fuelLiters * priceNum) : 0;
  const costPerKm = (hasFuelData && kmNum > 0) ? (fuelCost / kmNum) : 0;

  // Ganho líquido final
  const hasGross = grossRevenue.trim() !== '';
  let finalNetEarnings = null;
  if (hasGross) {
    finalNetEarnings = hasFuelData ? (grossNum - fuelCost) : grossNum;
  } else if (initialEntry?.netEarnings !== null && initialEntry?.netEarnings !== undefined && !kmDriven) {
    finalNetEarnings = Number(initialEntry.netEarnings);
  }

  const fuelPercentage = (hasGross && grossNum > 0 && hasFuelData) 
    ? (fuelCost / grossNum) * 100 
    : 0;

  const handleSave = (e) => {
    e?.preventDefault();

    if (finalNetEarnings && finalNetEarnings >= avgEarningsPerWeight) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (err) {}
    }

    onSave({
      date,
      dayName: getDayNameBR(date),
      type: dayType,
      weight: Number(weight),
      netEarnings: finalNetEarnings !== null ? Number(finalNetEarnings) : null,
      meta: {
        grossRevenue: grossNum,
        kmDriven: kmNum,
        fuelEfficiency: effNum,
        fuelPrice: priceNum,
        fuelCost: fuelCost,
      }
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#161e31]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                {initialEntry?.netEarnings !== null && initialEntry?.netEarnings !== undefined 
                  ? 'Editar Lançamento' 
                  : 'Lançar Faturamento do Dia'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {getDayNameBR(date)} • Peso de trabalho: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{weight}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          {/* Data e Atalhos */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Data
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleQuickDay(-1)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  Ontem
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDay(0)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold transition-colors"
                >
                  Hoje
                </button>
              </div>
            </div>
            <input 
              type="date" 
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#161e31] border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
            />
          </div>

          {/* Tipo de Jornada (Selecionado automaticamente da planilha) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Tipo de Jornada
              </label>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-3 h-3" />
                Definido automaticamente
              </span>
            </div>

            {dayType === 'Feriado' && (
              <div className="mb-2 p-2.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <span>🎉</span>
                <span>Feriado / Folga já considerado como concluído (peso 0,0).</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'Dia útil', label: 'Dia Útil', icon: '💼', sub: 'Peso 1,0' },
                { type: 'Meio dia', label: 'Meio Dia', icon: '⏱️', sub: 'Peso 0,5' },
                { type: 'Final de semana', label: 'Fim de Sem.', icon: '🏖️', sub: 'Peso 0,175' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleTypeChange(item.type)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    dayType === item.type 
                      ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-slate-900 dark:text-white shadow-sm' 
                      : 'bg-slate-50 dark:bg-[#161e31] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-base mb-1">
                    <span>{item.icon}</span>
                    {dayType === item.type && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white leading-tight">{item.label}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{item.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Entradas do Dia: Faturamento, KM, Consumo e Preço */}
          <div className="bg-slate-50 dark:bg-[#161e31] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            {/* Faturamento Bruto */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                Faturamento Bruto (Apps)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-base">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={grossRevenue}
                  onChange={handleCleanInput(setGrossRevenue)}
                  autoFocus
                  className="w-full bg-white dark:bg-[#0a0d14] border border-slate-300 dark:border-slate-700 rounded-xl pl-11 pr-4 py-3 text-slate-900 dark:text-white text-xl font-bold mono-numbers focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Parâmetros do Veículo e Combustível */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                  KM Rodado
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400">km</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={kmDriven}
                    onChange={handleCleanInput(setKmDriven)}
                    className="w-full bg-white dark:bg-[#0a0d14] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-semibold text-sm mono-numbers focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                  Consumo (km/l)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="8,5"
                  value={fuelEfficiency}
                  onChange={handleCleanInput(setFuelEfficiency)}
                  className="w-full bg-white dark:bg-[#0a0d14] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-semibold text-sm mono-numbers focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                  Preço do Litro
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-bold">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="3,69"
                    value={fuelPrice}
                    onChange={handleCleanInput(setFuelPrice)}
                    className="w-full bg-white dark:bg-[#0a0d14] border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 dark:text-white font-semibold text-sm mono-numbers focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Gasto com Combustível Imediato */}
            {hasFuelData && (
              <div className="p-3.5 bg-white dark:bg-[#0a0d14] rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs shadow-sm dark:shadow-none animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Fuel className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    Gasto com Combustível:
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold text-sm mono-numbers">
                    - {formatCurrency(fuelCost)} <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">({formatNumber(fuelLiters, 1)} L)</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <span>Custo por KM rodado:</span>
                  <span className="text-slate-800 dark:text-slate-300 font-semibold mono-numbers">
                    {formatCurrency(costPerKm)}/km
                  </span>
                </div>

                {hasGross && (
                  <>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      <span>% Gasto com Combustível:</span>
                      <span className="text-amber-600 dark:text-amber-400 font-semibold mono-numbers">
                        {formatNumber(fuelPercentage, 1)}% do faturamento
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">Ganho Líquido a Salvar:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg mono-numbers">
                        {formatCurrency(finalNetEarnings)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#161e31] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 font-medium text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            Salvar Lançamento
          </button>
        </div>
      </div>
    </div>
  );
}
