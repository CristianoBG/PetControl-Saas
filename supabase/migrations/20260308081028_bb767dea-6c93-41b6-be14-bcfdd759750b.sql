CREATE TABLE public.atividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo text NOT NULL,
  descricao text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities" ON public.atividades FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON public.atividades FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own activities" ON public.atividades FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.perdas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome_produto text NOT NULL,
  lote text,
  data_validade date NOT NULL,
  removido_em timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.perdas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own losses" ON public.perdas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own losses" ON public.perdas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);