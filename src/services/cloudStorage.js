/**
 * Serviço de sincronização em nuvem via Vercel KV / Upstash Redis
 * (Idêntico à arquitetura de alta velocidade usada no projeto 'financas')
 */

const STORAGE_KEY_DATA = 'motoristapro_full_data_v1';

export async function fetchFromCloud() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch('/api/data', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      return json.data || null;
    }
  } catch (err) {
    console.warn('Nuvem em espera ou offline:', err);
  }
  return null;
}

export async function saveToCloud(entries, settings) {
  const payload = {
    entries,
    settings,
    lastModified: Date.now(),
  };

  // Salva no localStorage imediatamente
  try {
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(payload));
  } catch (e) {}

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      return json.savedToCloud || false;
    }
  } catch (err) {
    console.error('Falha ao salvar na API /api/data:', err);
  }

  return false;
}
