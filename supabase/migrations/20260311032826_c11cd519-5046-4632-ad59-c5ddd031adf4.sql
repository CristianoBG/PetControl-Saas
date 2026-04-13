
-- Histórico de mensagens enviadas
CREATE TABLE public.historico_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  vacina_id uuid REFERENCES public.vacinas(id) ON DELETE SET NULL,
  nome_pet text NOT NULL,
  nome_dono text NOT NULL,
  tipo_vacina text NOT NULL,
  mensagem_enviada text NOT NULL,
  enviado_em timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.historico_mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own message history"
  ON public.historico_mensagens FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own message history"
  ON public.historico_mensagens FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Add template and aviso antecipado to configuracoes
ALTER TABLE public.configuracoes
  ADD COLUMN IF NOT EXISTS template_mensagem text DEFAULT 'Olá {nome_dono}, aqui é do {nome_petshop}! 🐾 Passando para avisar que a vacina {tipo_vacina} do {nome_pet} vence dia {data}. Vamos agendar o reforço?',
  ADD COLUMN IF NOT EXISTS dias_aviso_antecipado integer NOT NULL DEFAULT 7;
