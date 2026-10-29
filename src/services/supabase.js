import { createClient } from '@supabase/supabase-js';

const STORAGE_KEY_SUPABASE_URL = 'motoristapro_supabase_url';
const STORAGE_KEY_SUPABASE_KEY = 'motoristapro_supabase_key';

// Pega das variáveis de ambiente (Vercel/.env) ou do localStorage (configurado no app)
export function getSupabaseCredentials() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    return { url: envUrl, key: envKey, isFromEnv: true };
  }

  try {
    const savedUrl = localStorage.getItem(STORAGE_KEY_SUPABASE_URL);
    const savedKey = localStorage.getItem(STORAGE_KEY_SUPABASE_KEY);
    if (savedUrl && savedKey) {
      return { url: savedUrl, key: savedKey, isFromEnv: false };
    }
  } catch (e) {}

  return { url: '', key: '', isFromEnv: false };
}

export function saveSupabaseCredentials(url, key) {
  try {
    if (url && key) {
      localStorage.setItem(STORAGE_KEY_SUPABASE_URL, url.trim());
      localStorage.setItem(STORAGE_KEY_SUPABASE_KEY, key.trim());
      supabaseClientInstance = null; // reseta cliente
      return true;
    } else {
      localStorage.removeItem(STORAGE_KEY_SUPABASE_URL);
      localStorage.removeItem(STORAGE_KEY_SUPABASE_KEY);
      supabaseClientInstance = null;
      return false;
    }
  } catch (e) {
    return false;
  }
}

let supabaseClientInstance = null;

export function getSupabaseClient() {
  if (supabaseClientInstance) return supabaseClientInstance;

  const { url, key } = getSupabaseCredentials();
  if (url && key) {
    try {
      supabaseClientInstance = createClient(url, key);
      return supabaseClientInstance;
    } catch (e) {
      console.error('Erro ao inicializar Supabase:', e);
      return null;
    }
  }
  return null;
}
