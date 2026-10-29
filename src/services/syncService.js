import { getSupabaseClient } from './supabase';

/**
 * Carrega todos os lançamentos do Supabase
 */
export async function fetchCloudEntries() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar lançamentos na nuvem:', error);
      return null;
    }

    if (data) {
      return data.map(item => ({
        date: item.date,
        dayName: item.day_name,
        type: item.type,
        weight: Number(item.weight),
        netEarnings: item.net_earnings !== null ? Number(item.net_earnings) : null,
        meta: item.meta || undefined
      }));
    }
  } catch (e) {
    console.error('Falha de conexão com Supabase:', e);
  }
  return null;
}

/**
 * Salva ou atualiza um lançamento na nuvem
 */
export async function syncEntryToCloud(entry) {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const payload = {
      date: entry.date,
      day_name: entry.dayName,
      type: entry.type,
      weight: entry.weight,
      net_earnings: entry.netEarnings !== null && entry.netEarnings !== undefined ? Number(entry.netEarnings) : null,
      meta: entry.meta || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('entries')
      .upsert(payload, { onConflict: 'date' });

    if (error) {
      console.error('Erro ao sincronizar lançamento com a nuvem:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Falha ao enviar para Supabase:', e);
    return false;
  }
}

/**
 * Carrega as configurações da nuvem
 */
export async function fetchCloudSettings() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('data')
      .eq('id', 'default')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Erro ao buscar configurações na nuvem:', error);
      return null;
    }

    return data ? data.data : null;
  } catch (e) {
    console.error('Falha de conexão com Supabase:', e);
    return null;
  }
}

/**
 * Salva as configurações na nuvem
 */
export async function syncSettingsToCloud(settings) {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('settings')
      .upsert({
        id: 'default',
        data: settings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.error('Erro ao sincronizar configurações:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Falha ao enviar configurações para Supabase:', e);
    return false;
  }
}

/**
 * Inicializa a nuvem se as tabelas estiverem vazias
 */
export async function seedCloudDataIfEmpty(entries, settings) {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { count, error } = await supabase
      .from('entries')
      .select('*', { count: 'exact', head: true });

    if (error) return false;

    // Se a tabela estiver vazia, sobe todos os lançamentos
    if (count === 0 && entries.length > 0) {
      const payloads = entries.map(entry => ({
        date: entry.date,
        day_name: entry.dayName,
        type: entry.type,
        weight: entry.weight,
        net_earnings: entry.netEarnings !== null && entry.netEarnings !== undefined ? Number(entry.netEarnings) : null,
        meta: entry.meta || null,
        updated_at: new Date().toISOString()
      }));

      // Inserção em lotes de 50
      for (let i = 0; i < payloads.length; i += 50) {
        const batch = payloads.slice(i, i + 50);
        await supabase.from('entries').insert(batch);
      }

      await syncSettingsToCloud(settings);
      return true;
    }
  } catch (e) {
    console.error('Erro ao popular dados iniciais na nuvem:', e);
  }
  return false;
}

/**
 * Escuta alterações em tempo real do Supabase
 */
export function subscribeToRealtime(onEntryChange, onSettingsChange) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const channel = supabase
      .channel('motoristapro_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entries' },
        (payload) => {
          if (payload.new) {
            onEntryChange({
              date: payload.new.date,
              dayName: payload.new.day_name,
              type: payload.new.type,
              weight: Number(payload.new.weight),
              netEarnings: payload.new.net_earnings !== null ? Number(payload.new.net_earnings) : null,
              meta: payload.new.meta || undefined
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings' },
        (payload) => {
          if (payload.new && payload.new.data) {
            onSettingsChange(payload.new.data);
          }
        }
      )
      .subscribe();

    return channel;
  } catch (e) {
    console.error('Erro ao subscrever realtime:', e);
    return null;
  }
}
