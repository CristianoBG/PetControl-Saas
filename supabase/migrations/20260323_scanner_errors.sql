-- Tabela para persistir erros do scanner em produção.
-- Permite debug sem depender apenas do console.
CREATE TABLE public.scanner_errors (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid,                          -- nullable: erros podem ocorrer antes do login
  barcode     text,                          -- código que causou o erro (já normalizado)
  error_message text NOT NULL,
  created_at  timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.scanner_errors ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados inserem apenas seus próprios erros
CREATE POLICY "Users can insert own scanner errors"
  ON public.scanner_errors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Usuários vêem apenas seus próprios erros
CREATE POLICY "Users can view own scanner errors"
  ON public.scanner_errors FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Index para queries por usuário + período
CREATE INDEX idx_scanner_errors_user_date
  ON public.scanner_errors (user_id, created_at DESC);
