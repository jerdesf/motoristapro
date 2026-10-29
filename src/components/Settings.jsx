import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Save, RotateCcw, 
  Download, Upload, Check, AlertTriangle, ShieldCheck, 
  Fuel, Calendar, Car
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

function parseFlexibleNumber(val) {
  if (val === null || val === undefined) return 0;
  const str = String(val).trim().replace(/\s/g, '');
  if (!str) return 0;
  const normalized = str.replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

export default function Settings({ 
  settings, 
  onSaveSettings, 
  onResetToDefault,
  allEntries,
  onImportBackup 
}) {
  const [formData, setFormData] = useState({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (field, value) => {
    // Permite digitar dígitos, vírgula e ponto
    const cleaned = value.replace(/[^0-9.,]/g, '');
    setFormData(prev => ({
      ...prev,
      [field]: cleaned
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSaveSettings({
      ...formData,
      carDailyCost: parseFlexibleNumber(formData.carDailyCost),
      extraDailyCost: parseFlexibleNumber(formData.extraDailyCost),
      weekendRatio: parseFlexibleNumber(formData.weekendRatio),
      fuelPrice: parseFlexibleNumber(formData.fuelPrice),
      fuelEfficiency: parseFlexibleNumber(formData.fuelEfficiency),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Exportar backup JSON completo
  const handleExportJSON = () => {
    const backupData = {
      version: 1,
      exportDate: new Date().toISOString(),
      settings: formData,
      entries: allEntries,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_motoristapro_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Importar backup JSON
  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.entries && Array.isArray(data.entries)) {
          if (confirm(`Deseja restaurar este backup com ${data.entries.length} lançamentos?`)) {
            onImportBackup(data);
            alert('Backup restaurado com sucesso!');
          }
        } else {
          alert('Arquivo de backup inválido.');
        }
      } catch (err) {
        alert('Erro ao ler o arquivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  // Custo por 30 dias calculado em tempo real
  const dailyTotal = parseFlexibleNumber(formData.carDailyCost) + parseFlexibleNumber(formData.extraDailyCost);
  const cost30Days = dailyTotal * 30;

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-[#111726] border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-lg">Configurações & Parâmetros</h2>
            <p className="text-xs text-slate-400">Ajuste seus custos diários, metas e combustível padrão</p>
          </div>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold animate-fadeIn">
            <Check className="w-4 h-4" />
            Salvo com Sucesso!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Bloco 1: Custos Fixos do Veículo */}
        <div className="bg-[#111726] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Car className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Custos Fixos do Veículo</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Custo Diário do Carro (R$/dia)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-bold">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.carDailyCost}
                  onChange={(e) => handleChange('carDailyCost', e.target.value)}
                  className="w-full bg-[#161e31] border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white font-semibold text-sm mono-numbers focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Equivale a R$ 620,00/semana de aluguel ou parcela
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Lavagem + Celular Diário (R$/dia)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-bold">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.extraDailyCost}
                  onChange={(e) => handleChange('extraDailyCost', e.target.value)}
                  className="w-full bg-[#161e31] border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white font-semibold text-sm mono-numbers focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Equivale a R$ 70,00 por mês (R$ 2,33/dia)
              </p>
            </div>
          </div>

          {/* Resumo do custo fixo por 30 dias */}
          <div className="p-3.5 bg-[#161e31] rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs text-slate-400">Total de custos fixos por 30 dias:</span>
            <div className="text-base font-bold text-rose-400 mono-numbers">
              {formatCurrency(cost30Days)} <span className="text-xs font-normal text-slate-400">({formatCurrency(dailyTotal)}/dia)</span>
            </div>
          </div>
        </div>

        {/* Bloco 2: Combustível Padrão */}
        <div className="bg-[#111726] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Fuel className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Parâmetros de Combustível Padrão</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Preço Padrão do Combustível (R$/litro)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-bold">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.fuelPrice}
                  onChange={(e) => handleChange('fuelPrice', e.target.value)}
                  className="w-full bg-[#161e31] border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white font-semibold text-sm mono-numbers focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Consumo Médio do Carro (km/litro)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400">km/l</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.fuelEfficiency}
                  onChange={(e) => handleChange('fuelEfficiency', e.target.value)}
                  className="w-full bg-[#161e31] border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold text-sm mono-numbers focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 3: Calendário e Pesos de Trabalho */}
        <div className="bg-[#111726] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Calendar className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white text-base">Período da Projeção & Pesos</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Início da Projeção
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full bg-[#161e31] border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Fim da Projeção
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="w-full bg-[#161e31] border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Fim de Semana (% do dia útil)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={formData.weekendRatio}
                onChange={(e) => handleChange('weekendRatio', e.target.value)}
                className="w-full bg-[#161e31] border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold mono-numbers focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                0,35 ou 0.35 (0,175 sáb e 0,175 dom)
              </p>
            </div>
          </div>
        </div>

        {/* Botão de Salvar Alterações */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            Salvar Configurações
          </button>
        </div>
      </form>

      {/* Bloco 4: Backup, Exportação e Restauração */}
      <div className="bg-[#111726] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <ShieldCheck className="w-5 h-5 text-teal-400" />
          <h3 className="font-bold text-white text-base">Segurança dos Seus Dados & Backup</h3>
        </div>

        <p className="text-xs text-slate-400">
          Todos os seus lançamentos e configurações ficam salvos no armazenamento local deste navegador. Para não perder nada ao trocar de celular ou computador, baixe uma cópia de segurança.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportJSON}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Baixar Backup Completo (.JSON)
          </button>

          <label className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-blue-400" />
            Restaurar de Backup
            <input
              type="file"
              accept=".json"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              if (confirm('Deseja recarregar os 71 dias originais da sua planilha? Todas as alterações manuais serão resetadas.')) {
                onResetToDefault();
                alert('Planilha original restaurada com sucesso!');
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 text-xs font-semibold flex items-center gap-2 border border-rose-800/40 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Restaurar Planilha Original
          </button>
        </div>
      </div>
    </div>
  );
}
