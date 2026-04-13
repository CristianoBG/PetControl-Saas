
CREATE TABLE public.produtos_catalogo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  codigo_barras text NOT NULL,
  nome_produto text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, codigo_barras)
);

ALTER TABLE public.produtos_catalogo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own catalog" ON public.produtos_catalogo
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own catalog" ON public.produtos_catalogo
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own catalog" ON public.produtos_catalogo
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
