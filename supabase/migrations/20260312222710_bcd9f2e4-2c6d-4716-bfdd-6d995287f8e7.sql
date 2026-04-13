
CREATE TABLE public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  produto_nome text NOT NULL,
  codigo_barras text,
  tipo text NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  quantidade integer NOT NULL,
  origem text NOT NULL DEFAULT 'manual' CHECK (origem IN ('scanner', 'manual')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own movements" ON public.inventory_movements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own movements" ON public.inventory_movements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
