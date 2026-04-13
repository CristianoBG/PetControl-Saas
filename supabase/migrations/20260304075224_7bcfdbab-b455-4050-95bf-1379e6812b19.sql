
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.estoque (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_produto TEXT NOT NULL,
  codigo_barras TEXT,
  data_validade DATE NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  lote TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own estoque" ON public.estoque FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own estoque" ON public.estoque FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own estoque" ON public.estoque FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own estoque" ON public.estoque FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_estoque_updated_at BEFORE UPDATE ON public.estoque FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_estoque_user_id ON public.estoque(user_id);
CREATE INDEX idx_estoque_codigo_barras ON public.estoque(codigo_barras);
CREATE INDEX idx_estoque_data_validade ON public.estoque(data_validade);

CREATE TABLE public.vacinas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_pet TEXT NOT NULL,
  nome_dono TEXT NOT NULL,
  whatsapp_dono TEXT NOT NULL,
  tipo_vacina TEXT NOT NULL,
  data_dose DATE NOT NULL,
  data_proxima_dose DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vacinas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own vacinas" ON public.vacinas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vacinas" ON public.vacinas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vacinas" ON public.vacinas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vacinas" ON public.vacinas FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_vacinas_updated_at BEFORE UPDATE ON public.vacinas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_vacinas_user_id ON public.vacinas(user_id);
CREATE INDEX idx_vacinas_data_proxima_dose ON public.vacinas(data_proxima_dose);

CREATE TABLE public.configuracoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_petshop TEXT NOT NULL DEFAULT 'Meu Pet Shop',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own config" ON public.configuracoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own config" ON public.configuracoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own config" ON public.configuracoes FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON public.configuracoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
