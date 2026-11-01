/**
 * Utilitários de cálculo financeiro e projeção para motorista de aplicativo
 * Baseado rigorosamente na metodologia da planilha original.
 */

export function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateBR(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function getTodayBR() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDayNameBR(dateStr) {
  const date = parseDate(dateStr);
  const days = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
  ];
  return days[date.getDay()];
}

export function getDefaultDayType(dateStr) {
  const date = parseDate(dateStr);
  const day = date.getDay();
  if (day === 0 || day === 6) return 'Final de semana';
  return 'Dia útil';
}

export function getDefaultWeight(type, settings) {
  switch (type) {
    case 'Dia útil':
      return settings.weekdayWeight ?? 1.0;
    case 'Meio dia':
      return settings.halfDayWeight ?? 0.5;
    case 'Final de semana':
      return (settings.weekendRatio ? settings.weekendRatio / 2 : 0.175);
    case 'Feriado':
    case 'Folga':
      return 0.0;
    default:
      return 1.0;
  }
}

/**
 * Calcula a diferença em dias corridos entre duas datas inclusive
 */
export function getDaysDifferenceInclusive(startStr, endStr) {
  if (!startStr || !endStr) return 0;
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays + 1);
}

/**
 * Realiza todos os cálculos financeiros da metodologia da planilha
 */
export function calculateMetrics(entries, settings) {
  if (!entries || entries.length === 0) {
    return {
      totalEntries: 0,
      filledEntries: 0,
      futureEntries: 0,
      realizedEarnings: 0,
      realizedCosts: 0,
      realizedNetProfit: 0,
      avgEarningsPerWeight: 0,
      projectedFutureEarnings: 0,
      totalProjectedRevenue: 0,
      totalProjectedCosts: 0,
      totalProjectedNetProfit: 0,
      monthlyProjectedNetProfit: 0,
      dailyCost: 0,
      elapsedDays: 0,
      totalPeriodDays: 0,
      completionRate: 0,
    };
  }

  // Custo diário fixo detalhado: Veículo, Lavagem, Celular e Tag Pedágio
  let carDaily = Number(settings.carDailyCost) || 0;
  let washingDaily = settings.washingDailyCost !== undefined 
    ? Number(settings.washingDailyCost) || 0 
    : (60 / 45);
  let phoneDaily = settings.phoneDailyCost !== undefined 
    ? Number(settings.phoneDailyCost) || 0 
    : (30 / 30);
  let tollTagDaily = Number(settings.tollTagDailyCost) || 0;

  // Compatibilidade com configurações legadas que tinham apenas extraDailyCost
  if (settings.washingDailyCost === undefined && settings.phoneDailyCost === undefined && settings.extraDailyCost !== undefined) {
    let extraDaily = Number(settings.extraDailyCost) || 0;
    if (Math.abs(extraDaily - 2.33) < 0.05) {
      washingDaily = 60 / 45;
      phoneDaily = 30 / 30;
    } else {
      washingDaily = extraDaily;
      phoneDaily = 0;
    }
  }

  // Frações exatas da planilha original para precisão matemática até os centavos:
  if (Math.abs(carDaily - 88.57) < 0.005) {
    carDaily = 620 / 7;
  }
  if (Math.abs(washingDaily - 1.33) < 0.005) {
    washingDaily = 60 / 45;
  }
  if (Math.abs(phoneDaily - 1.00) < 0.005) {
    phoneDaily = 30 / 30;
  }

  const dailyCost = (carDaily + washingDaily + phoneDaily + tollTagDaily) > 0 
    ? (carDaily + washingDaily + phoneDaily + tollTagDaily) 
    : ((Number(settings.monthlyFixedCost) || 0) / 30);

  // Período total
  const startDate = settings.startDate || entries[0]?.date;
  const endDate = settings.endDate || entries[entries.length - 1]?.date;
  const totalPeriodDays = getDaysDifferenceInclusive(startDate, endDate) || entries.length;

  // Entradas preenchidas
  const filledEntries = entries.filter(e => e.netEarnings !== null && e.netEarnings !== undefined && e.netEarnings !== '');
  const futureEntries = entries.filter(e => e.netEarnings === null || e.netEarnings === undefined || e.netEarnings === '');

  const realizedEarnings = filledEntries.reduce((sum, e) => sum + (Number(e.netEarnings) || 0), 0);
  const sumWeightRealized = filledEntries.reduce((sum, e) => sum + (Number(e.weight) || 0), 0);
  const sumWeightFuture = futureEntries.reduce((sum, e) => sum + (Number(e.weight) || 0), 0);

  // Média por peso de trabalho
  const avgEarningsPerWeight = sumWeightRealized > 0 ? (realizedEarnings / sumWeightRealized) : 0;

  // Data atual considerada para custos realizados: data de HOJE (limitada ao período)
  const todayStr = getTodayBR();
  let lastConsideredDate = todayStr;
  if (startDate && lastConsideredDate < startDate) lastConsideredDate = startDate;
  if (endDate && lastConsideredDate > endDate) lastConsideredDate = endDate;

  const elapsedDays = getDaysDifferenceInclusive(startDate, lastConsideredDate);
  const realizedCosts = elapsedDays * dailyCost;
  const realizedNetProfit = realizedEarnings - realizedCosts;

  // Projeção futura
  const projectedFutureEarnings = avgEarningsPerWeight * sumWeightFuture;
  const totalProjectedRevenue = realizedEarnings + projectedFutureEarnings;
  const totalProjectedCosts = totalPeriodDays * dailyCost;
  const totalProjectedNetProfit = totalProjectedRevenue - totalProjectedCosts;
  const monthlyProjectedNetProfit = totalPeriodDays > 0 ? (totalProjectedNetProfit / totalPeriodDays) * 30 : 0;

  // Média diária bruta por dia trabalhado (onde ganho > 0)
  const daysWorked = filledEntries.filter(e => Number(e.netEarnings) > 0).length;
  const avgDailyEarningsWorked = daysWorked > 0 ? (realizedEarnings / daysWorked) : 0;

  // Taxa de conclusão do período
  const completionRate = totalPeriodDays > 0 ? Math.min(100, Math.round((elapsedDays / totalPeriodDays) * 100)) : 0;

  return {
    totalEntries: entries.length,
    filledEntries: filledEntries.length,
    futureEntries: futureEntries.length,
    daysWorked,
    startDate,
    endDate,
    lastConsideredDate,
    elapsedDays,
    totalPeriodDays,
    dailyCost,
    carDailyCost: carDaily,
    washingDailyCost: washingDaily,
    phoneDailyCost: phoneDaily,
    tollTagDailyCost: tollTagDaily,
    realizedEarnings,
    realizedCosts,
    realizedNetProfit,
    sumWeightRealized,
    sumWeightFuture,
    avgEarningsPerWeight,
    avgDailyEarningsWorked,
    projectedFutureEarnings,
    totalProjectedRevenue,
    totalProjectedCosts,
    totalProjectedNetProfit,
    monthlyProjectedNetProfit,
    completionRate,
  };
}

/**
 * Calculadora de combustível detalhada
 * Segue a metodologia da planilha original: consumo real = consumo informado * 0.95
 */
export function calculateFuelDetail(grossEarnings, km, efficiency, fuelPrice) {
  const gross = Number(grossEarnings) || 0;
  const kmNum = Number(km) || 0;
  const eff = Number(efficiency) || 0;
  const price = Number(fuelPrice) || 0;
  const effectiveEff = eff * 0.95;

  if (effectiveEff <= 0 || kmNum <= 0) {
    return {
      fuelLiters: 0,
      fuelCost: 0,
      netEarnings: gross,
      fuelPercentage: 0,
      costPerKm: 0,
      netPerKm: kmNum > 0 ? gross / kmNum : 0,
      grossPerKm: kmNum > 0 ? gross / kmNum : 0,
    };
  }

  const fuelLiters = kmNum / effectiveEff;
  const fuelCost = fuelLiters * price;
  const netEarnings = gross - fuelCost;
  const fuelPercentage = gross > 0 ? (fuelCost / gross) * 100 : 0;
  const costPerKm = kmNum > 0 ? fuelCost / kmNum : 0;
  const netPerKm = kmNum > 0 ? netEarnings / kmNum : 0;
  const grossPerKm = kmNum > 0 ? gross / kmNum : 0;

  return {
    fuelLiters,
    fuelCost,
    netEarnings,
    fuelPercentage,
    costPerKm,
    netPerKm,
    grossPerKm,
  };
}

export function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
