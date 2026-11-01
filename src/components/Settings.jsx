import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Save, RotateCcw, 
  Download, Upload, Check, AlertTriangle, ShieldCheck, 
  Fuel, Calendar, Car, Cloud, CloudOff, RefreshCw, Database,
  Sun, Moon, Laptop, Smartphone, Sparkles, Tag
} from 'lucide-react';
import { formatCurrency, evaluateMathExpression } from '../utils/calculations';
import { useTheme } from './ThemeProvider';

function parseFlexibleNumber(val) {
  return evaluateMathExpression(val).exact;
}

export default function Settings({ 
  settings, 
  onSaveSettings, 
  onResetToDefault,
  allEntries,
  onImportBackup,
  isCloudConnected,
  onRefreshCloudConnection
}) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  // Fórmulas ativas (para lembrar o que foi digitado com '= x/y')
  const [formulas, setFormulas] = useState(() => ({
    carDailyCost: settings.carDailyCostFormula || (Math.abs(Number(settings.carDailyCost) - 620 / 7) < 0.001 ? '= 620/7' : ''),
    washingDailyCost: settings.washingDailyCostFormula || (Math.abs(Number(settings.washingDailyCost) - 60 / 45) < 0.001 ? '= 60/45' : ''),
    phoneDailyCost: settings.phoneDailyCostFormula || (Math.abs(Number(settings.phoneDailyCost) - 1) < 0.001 ? '= 30/30' : ''),
    tollTagDailyCost: settings.tollTagDailyCostFormula || '',
  }));

  const [formData, setFormData] = useState(() => {
    let washing = settings.washingDailyCost;
    let phone = settings.phoneDailyCost;
    let tollTag = settings.tollTagDailyCost ?? 0;

    if (washing === undefined && phone === undefined) {
      if (settings.extraDailyCost !== undefined) {
        const extraNum = Number(settings.extraDailyCost) || 0;
        if (Math.abs(extraNum - (60 / 45 + 1)) < 0.05 || Math.abs(extraNum - 2.33) < 0.05) {
          washing = '1,33';
          phone = '1,00';
        } else {
          washing = String(extraNum).replace('.', ',');
          phone = '0,00';
        }
      } else {
        washing = '1,33';
        phone = '1,00';
      }
    } else {
      washing = typeof washing === 'number' 
        ? (Math.abs(washing - 60 / 45) < 0.001 ? '1,33' : evaluateMathExpression(washing).display) 
        : (washing || '1,33');
      phone = typeof phone === 'number' 
        ? (Math.abs(phone - 1) < 0.001 ? '1,00' : evaluateMathExpression(phone).display) 
        : (phone || '1,00');
    }

    tollTag = typeof tollTag === 'number' 
      ? (tollTag === 0 ? '0,00' : evaluateMathExpression(tollTag).display) 
      : (tollTag || '0,00');

    let carDisplay = typeof settings.carDailyCost === 'number' 
      ? (Math.abs(settings.carDailyCost - 620 / 7) < 0.0001 ? '88,57' : evaluateMathExpression(settings.carDailyCost).display) 
      : (settings.carDailyCost || '88,57');

    return {
      ...settings,
      carDailyCost: carDisplay,
      washingDailyCost: washing,
      phoneDailyCost: phone,
      tollTagDailyCost: tollTag,
      fuelPrice: settings.fuelPrice !== undefined ? String(settings.fuelPrice).replace('.', ',') : '3,54',
      fuelEfficiency: settings.fuelEfficiency !== undefined ? String(settings.fuelEfficiency).replace('.', ',') : '8,5',
    };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [syncingNow, setSyncingNow] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState('');

  const handleChange = (field, value) => {
    // Permite dígitos, vírgula, ponto, barra, sinal de igual, mais, menos, asterisco e espaços
    const cleaned = value.replace(/[^0-9.,/=+\-\*\s]/g, '');
    setFormData(prev => ({
      ...prev,
      [field]: cleaned
    }));

    if (cleaned.includes('/') || cleaned.includes('+') || cleaned.includes('*') || cleaned.startsWith('=')) {
      setFormulas(prev => ({
        ...prev,
        [field]: cleaned.startsWith('=') ? cleaned : `= ${cleaned}`
      }));
    } else {
      setFormulas(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const applyFormula = (field, formulaStr) => {
    const evaluated = evaluateMathExpression(formulaStr);
    setFormulas(prev => ({
      ...prev,
      [field]: formulaStr
    }));
    setFormData(prev => ({
      ...prev,
      [field]: evaluated.display
    }));
  };

  const handleFocus = (field) => {
    // Se o campo tem uma fórmula associada, carrega a fórmula para edição fácil
    if (formulas[field]) {
      setFormData(prev => ({
        ...prev,
        [field]: formulas[field]
      }));
    }
  };

  const handleBlur = (field) => {
    const raw = formData[field];
    const evaluated = evaluateMathExpression(raw);
    if (evaluated.formula) {
      setFormulas(prev => ({
        ...prev,
        [field]: evaluated.formula
      }));
      setFormData(prev => ({
        ...prev,
        [field]: evaluated.display
      }));
    } else if (raw && !isNaN(parseFloat(String(raw).replace(',', '.')))) {
      setFormulas(prev => ({
        ...prev,
        [field]: ''
      }));
      setFormData(prev => ({
        ...prev,
        [field]: evaluated.display
      }));
    }
  };

  const getFieldValues = (field) => {
    const rawInput = formData[field];
    const savedFormula = formulas[field];

    // Se o valor digitado atualmente contém fórmula ou operador
    if (typeof rawInput === 'string' && (rawInput.includes('/') || rawInput.includes('+') || rawInput.includes('*') || rawInput.trim().startsWith('='))) {
      return evaluateMathExpression(rawInput);
    }

    // Se o campo está exibindo o valor arredondado mas tem uma fórmula guardada
    if (savedFormula) {
      const evalFormula = evaluateMathExpression(savedFormula);
      return {
        exact: evalFormula.exact,
        rounded: evalFormula.rounded,
        formula: savedFormula,
        display: evalFormula.display,
      };
    }

    // Caso seja apenas um número direto
    return evaluateMathExpression(rawInput);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const evalCar = getFieldValues('carDailyCost');
    const evalWashing = getFieldValues('washingDailyCost');
    const evalPhone = getFieldValues('phoneDailyCost');
    const evalToll = getFieldValues('tollTagDailyCost');

    const extraExact = evalWashing.exact + evalPhone.exact + evalToll.exact;

    onSaveSettings({
      ...formData,
      // Valores exatos sem arredondamento para todos os cálculos matemáticos:
      carDailyCost: evalCar.exact,
      washingDailyCost: evalWashing.exact,
      phoneDailyCost: evalPhone.exact,
      tollTagDailyCost: evalToll.exact,
      extraDailyCost: extraExact,

      // Valores arredondados para exibição:
      carDailyCostDisplay: evalCar.display,
      washingDailyCostDisplay: evalWashing.display,
      phoneDailyCostDisplay: evalPhone.display,
      tollTagDailyCostDisplay: evalToll.display,

      // Fórmulas salvas para edição futura:
      carDailyCostFormula: evalCar.formula,
      washingDailyCostFormula: evalWashing.formula,
      phoneDailyCostFormula: evalPhone.formula,
      tollTagDailyCostFormula: evalToll.formula,

      weekendRatio: parseFlexibleNumber(formData.weekendRatio),
      fuelPrice: parseFlexibleNumber(formData.fuelPrice),
      fuelEfficiency: parseFlexibleNumber(formData.fuelEfficiency),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleManualSync = async () => {
    if (!onRefreshCloudConnection) return;
    setSyncingNow(true);
    setSyncFeedback('Sincronizando com a nuvem...');
    try {
      const ok = await onRefreshCloudConnection();
      if (ok) {
        setSyncFeedback('Conectado e sincronizado com a nuvem Vercel!');
      } else {
        setSyncFeedback('Salvo no dispositivo. Aguarde o deploy da Vercel finalizar.');
      }
    } catch {
      setSyncFeedback('Falha na sincronização.');
    } finally {
      setSyncingNow(false);
      setTimeout(() => setSyncFeedback(''), 5000);
    }
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

  // Custo por 30 dias calculado em tempo real com precisão exata das fórmulas
  const carNum = getFieldValues('carDailyCost').exact;
  const washingNum = getFieldValues('washingDailyCost').exact;
  const phoneNum = getFieldValues('phoneDailyCost').exact;
  const tollNum = getFieldValues('tollTagDailyCost').exact;
  const dailyTotal = carNum + washingNum + phoneNum + tollNum;
  const cost30Days = dailyTotal * 30;

  return (
    <div className="space-y-5 sm:space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-xl flex items-center justify-between transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">Configurações & Parâmetros</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Ajuste seus custos diários e sincronização</p>
          </div>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold animate-fadeIn">
            <Check className="w-4 h-4" />
            Salvo com Sucesso!
          </div>
        )}
      </div>

      {/* Bloco de Aparência / Tema do Sistema */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-xl space-y-3 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Tema & Aparência</h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {theme === 'system' ? 'Acompanhando o Sistema' : theme === 'dark' ? 'Modo Escuro (Fixo)' : 'Modo Claro (Fixo)'}
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Por padrão, o app acompanha automaticamente o tema configurado no seu Mac ou Android.
        </p>
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
              theme === 'system'
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/30'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Laptop className="w-4 h-4" />
            Sistema (Auto)
          </button>
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
              theme === 'light'
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/30'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sun className="w-4 h-4" />
            Claro
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
              theme === 'dark'
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/30'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Moon className="w-4 h-4" />
            Escuro
          </button>
        </div>
      </div>

      {/* Bloco 0: Sincronização em Nuvem (Vercel KV / Upstash Redis) */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Banco de Dados Vercel (KV / Upstash Redis)</h3>
          </div>
          <div className="flex items-center gap-2">
            {isCloudConnected ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Nuvem Ativa & Sincronizada
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-xs font-medium">
                <CloudOff className="w-3 h-3" />
                Modo Local (Offline)
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Sincronização em alta velocidade (milissegundos) direto pelo banco de dados da Vercel (Upstash Redis), idêntica ao projeto de finanças. Seus lançamentos ficam disponíveis no celular e no Mac instantaneamente.
        </p>

        <div className="bg-slate-50 dark:bg-[#161e31] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200 block">
            Como conectar na Vercel (1 clique):
          </span>
          <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400">
            <li>No painel da <strong>Vercel</strong>, clique no seu projeto <strong>motoristapro</strong>.</li>
            <li>Acesse a aba <strong>Storage</strong> no menu superior.</li>
            <li>Clique em <strong>Connect Database</strong> e selecione <strong>KV</strong> (ou Upstash Redis).</li>
            <li>Clique em <strong>Connect</strong> — a Vercel configura as credenciais automaticamente, sem precisar digitar chaves!</li>
          </ol>
        </div>

        {syncFeedback && (
          <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-fadeIn flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            {syncFeedback}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleManualSync}
            disabled={syncingNow}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 active:scale-95 transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingNow ? 'animate-spin' : ''}`} />
            {syncingNow ? 'Sincronizando...' : 'Sincronizar Agora com a Nuvem'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5 sm:space-y-6">
        {/* Bloco 1: Custos Fixos Diários */}
        <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors duration-200">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Car className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Custos Fixos Diários</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Custo do Veículo */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-emerald-500" />
                  Veículo (R$/dia)
                </label>
                {formulas.carDailyCost && !formData.carDailyCost.includes('/') && !formData.carDailyCost.startsWith('=') && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20" title="Fórmula ativa para cálculos">
                    {formulas.carDailyCost}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-bold">R$</span>
                <input
                  type="text"
                  value={formData.carDailyCost}
                  onChange={(e) => handleChange('carDailyCost', e.target.value)}
                  onFocus={() => handleFocus('carDailyCost')}
                  onBlur={() => handleBlur('carDailyCost')}
                  placeholder="ex: = 620/7 ou 88,57"
                  className="w-full bg-slate-50 dark:bg-[#161e31] border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 dark:text-white font-semibold text-sm mono-numbers focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
              {(formData.carDailyCost.includes('/') || formData.carDailyCost.startsWith('=')) ? (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 pt-0.5">
                  <span className="font-bold">Resultado:</span>
                  <span className="font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">R$ {evaluateMathExpression(formData.carDailyCost).display}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">(exato: {evaluateMathExpression(formData.carDailyCost).exact.toFixed(4)}...)</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <span>Aluguel semanal ou parcela</span>
                  <button
                    type="button"
                    onClick={() => applyFormula('carDailyCost', '= 620/7')}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-600 border border-slate-200 dark:border-slate-700 transition-colors"
                    title="Aplicar fórmula = 620/7"
                  >
                    = 620/7
                  </button>
                </div>
              )}
            </div>

            {/* 2. Lavagem */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  Lavagem (R$/dia)
                </label>
                {formulas.washingDailyCost && !formData.washingDailyCost.includes('/') && !formData.washingDailyCost.startsWith('=') && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20" title="Fórmula ativa para cálculos">
                    {formulas.washingDailyCost}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-bold">R$</span>
                <input
                  type="text"
                  value={formData.washingDailyCost}
                  onChange={(e) => handleChange('washingDailyCost', e.target.value)}
                  onFocus={() => handleFocus('washingDailyCost')}
                  onBlur={() => handleBlur('washingDailyCost')}
                  placeholder="ex: = 60/45 ou 1,33"
                  className="w-full bg-slate-50 dark:bg-[#161e31] border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 dark:text-white font-semibold text-sm mono-numbers focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
              {(formData.washingDailyCost.includes('/') || formData.washingDailyCost.startsWith('=')) ? (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 pt-0.5">
                  <span className="font-bold">Resultado:</span>
                  <span className="font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">R$ {evaluateMathExpression(formData.washingDailyCost).display}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">(exato: {evaluateMathExpression(formData.washingDailyCost).exact.toFixed(4)}...)</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <span>R$ 60 a cada 45 dias</span>
                  <button
                    type="button"
                    onClick={() => applyFormula('washingDailyCost', '= 60/45')}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-600 border border-slate-200 dark:border-slate-700 transition-colors"
                    title="Aplicar fórmula = 60/45"
                  >
                    = 60/45
                  </button>
                </div>
              )}
            </div>

            {/* 3. Celular */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-purple-500" />
                  Celular (R$/dia)
                </label>
                {formulas.phoneDailyCost && !formData.phoneDailyCost.includes('/') && !formData.phoneDailyCost.startsWith('=') && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20" title="Fórmula ativa para cálculos">
                    {formulas.phoneDailyCost}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-bold">R$</span>
                <input
                  type="text"
                  value={formData.phoneDailyCost}
                  onChange={(e) => handleChange('phoneDailyCost', e.target.value)}
                  onFocus={() => handleFocus('phoneDailyCost')}
                  onBlur={() => handleBlur('phoneDailyCost')}
                  placeholder="ex: = 30/30 ou 1,00"
                  className="w-full bg-slate-50 dark:bg-[#161e31] border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 dark:text-white font-semibold text-sm mono-numbers focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
              {(formData.phoneDailyCost.includes('/') || formData.phoneDailyCost.startsWith('=')) ? (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 pt-0.5">
                  <span className="font-bold">Resultado:</span>
                  <span className="font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">R$ {evaluateMathExpression(formData.phoneDailyCost).display}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">(exato: {evaluateMathExpression(formData.phoneDailyCost).exact.toFixed(4)}...)</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <span>R$ 30 mensal de plano</span>
                  <button
                    type="button"
                    onClick={() => applyFormula('phoneDailyCost', '= 30/30')}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-600 border border-slate-200 dark:border-slate-700 transition-colors"
                    title="Aplicar fórmula = 30/30"
                  >
                    = 30/30
                  </button>
                </div>
              )}
            </div>

            {/* 4. Tag Pedágio */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
                  Tag Pedágio (R$/dia)
                </label>
                {formulas.tollTagDailyCost && !formData.tollTagDailyCost.includes('/') && !formData.tollTagDailyCost.startsWith('=') && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20" title="Fórmula ativa para cálculos">
                    {formulas.tollTagDailyCost}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-bold">R$</span>
                <input
                  type="text"
                  value={formData.tollTagDailyCost}
                  onChange={(e) => handleChange('tollTagDailyCost', e.target.value)}
                  onFocus={() => handleFocus('tollTagDailyCost')}
                  onBlur={() => handleBlur('tollTagDailyCost')}
                  placeholder="ex: = 15/30 ou 0,50"
                  className="w-full bg-slate-50 dark:bg-[#161e31] border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 dark:text-white font-semibold text-sm mono-numbers focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
              {(formData.tollTagDailyCost.includes('/') || formData.tollTagDailyCost.startsWith('=')) ? (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 pt-0.5">
                  <span className="font-bold">Resultado:</span>
                  <span className="font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">R$ {evaluateMathExpression(formData.tollTagDailyCost).display}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">(exato: {evaluateMathExpression(formData.tollTagDailyCost).exact.toFixed(4)}...)</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <span>Mensalidade ou diário</span>
                  <button
                    type="button"
                    onClick={() => applyFormula('tollTagDailyCost', '= 15/30')}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-600 border border-slate-200 dark:border-slate-700 transition-colors"
                    title="Aplicar fórmula = 15/30"
                  >
                    = 15/30
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Dica de fórmulas e precisão matemática */}
          <div className="px-3.5 py-2.5 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <span className="text-base select-none">💡</span>
            <div className="leading-relaxed">
              <strong>Suporte a fórmulas no estilo Excel:</strong> você pode digitar fórmulas como <code className="font-mono bg-emerald-500/10 dark:bg-emerald-500/20 px-1 py-0.5 rounded">= 620/7</code>, <code className="font-mono bg-emerald-500/10 dark:bg-emerald-500/20 px-1 py-0.5 rounded">= 60/45</code> ou qualquer conta. O app exibe o valor arredondado no campo, mas mantém e realiza todos os cálculos de lucros e custos com o valor exato sem arredondamento, garantindo 100% de fidelidade aos centavos.
            </div>
          </div>

          {/* Resumo do custo fixo por 30 dias */}
          <div className="p-3.5 bg-slate-50 dark:bg-[#161e31] rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs text-slate-600 dark:text-slate-400">Total de custos fixos por 30 dias:</span>
            <div className="text-base font-bold text-rose-600 dark:text-rose-400 mono-numbers">
              {formatCurrency(cost30Days)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({formatCurrency(dailyTotal)}/dia)</span>
            </div>
          </div>
        </div>

        {/* Bloco 2: Combustível Padrão */}
        <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors duration-200">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Fuel className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Parâmetros de Combustível Padrão</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Preço Padrão do Combustível (R$/litro)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-bold">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.fuelPrice}
                  onChange={(e) => handleChange('fuelPrice', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#161e31] border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 dark:text-white font-semibold text-sm mono-numbers focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Consumo Médio do Carro (km/litro)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400">km/l</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.fuelEfficiency}
                  onChange={(e) => handleChange('fuelEfficiency', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#161e31] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-semibold text-sm mono-numbers focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 3: Calendário e Pesos de Trabalho */}
        <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors duration-200">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Período da Projeção & Pesos</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Início da Projeção
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#161e31] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Fim da Projeção
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#161e31] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Fim de Semana (% do dia útil)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={formData.weekendRatio}
                onChange={(e) => handleChange('weekendRatio', e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#161e31] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-semibold mono-numbers focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                0,35 ou 0.35 (0,175 sáb e 0,175 dom)
              </p>
            </div>
          </div>
        </div>

        {/* Botão de Salvar Alterações */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            Salvar Configurações
          </button>
        </div>
      </form>

      {/* Bloco 4: Backup, Exportação e Restauração */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors duration-200">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Backup Manual</h3>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400">
          Você também pode baixar uma cópia de segurança em arquivo JSON para guardar no seu computador.
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportJSON}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Baixar Backup Completo (.JSON)
          </button>

          <label className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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
              if (confirm('Deseja recarregar os dados originais da sua planilha? Todas as alterações manuais serão resetadas.')) {
                onResetToDefault();
                alert('Planilha original restaurada com sucesso!');
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-800/40 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Restaurar Planilha Original
          </button>
        </div>
      </div>
    </div>
  );
}
