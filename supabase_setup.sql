-- Script de criação das tabelas no Supabase
-- Basta copiar e colar este script no "SQL Editor" do seu painel do Supabase e clicar em "Run"

-- 1. Tabela de Lançamentos Diários
CREATE TABLE IF NOT EXISTS public.entries (
    date TEXT PRIMARY KEY,
    day_name TEXT NOT NULL,
    type TEXT NOT NULL,
    weight NUMERIC NOT NULL DEFAULT 1.0,
    net_earnings NUMERIC,
    meta JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Configurações
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar segurança pública / RLS permissivo para acesso do app
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total aos lançamentos" ON public.entries
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Acesso total às configurações" ON public.settings
    FOR ALL USING (true) WITH CHECK (true);

-- 4. Habilitar Realtime (sincronização em tempo real entre celular e Mac)
ALTER PUBLICATION supabase_realtime ADD TABLE public.entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
