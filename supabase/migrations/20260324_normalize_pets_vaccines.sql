-- Migração: Normalização de Pets e Vacinas (2026-03-24)

-- 1. Criar a nova tabela de Pets
CREATE TABLE IF NOT EXISTS public.pets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  dono_nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  foto_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela pets
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pets" ON public.pets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pets" ON public.pets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pets" ON public.pets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pets" ON public.pets FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON public.pets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Injetar Pets únicos da tabela vacinas antiga na nova tabela
INSERT INTO public.pets (user_id, nome, dono_nome, telefone, foto_url)
SELECT DISTINCT user_id, nome_pet, nome_dono, whatsapp_dono, foto_pet_url
FROM public.vacinas
WHERE NOT EXISTS (
    SELECT 1 FROM public.pets
    WHERE pets.user_id = vacinas.user_id 
      AND pets.nome = vacinas.nome_pet 
      AND pets.telefone = vacinas.whatsapp_dono
);

-- 3. Adicionar campo pet_id na tabela vacinas
ALTER TABLE public.vacinas ADD COLUMN IF NOT EXISTS pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE;

-- 4. Popular o pet_id nas vacinas antigas
UPDATE public.vacinas v
SET pet_id = p.id
FROM public.pets p
WHERE v.user_id = p.user_id 
  AND v.nome_pet = p.nome 
  AND v.whatsapp_dono = p.telefone;

-- Importante: Para garantir que toda vacina precise de um pet a partir de agora! (remova o comentario se quiser forcar)
-- ALTER TABLE public.vacinas ALTER COLUMN pet_id SET NOT NULL;

-- 5. Função RPC para registrar aplicação e auto-agendar (Loop de Receita)
CREATE OR REPLACE FUNCTION public.apply_vaccine_and_schedule(
  p_vacina_id UUID,
  p_data_aplicacao DATE,
  p_lote TEXT DEFAULT NULL,
  p_observacao TEXT DEFAULT NULL,
  p_agendar_dias INT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_vacina RECORD;
  v_nova_vacina_id UUID;
BEGIN
  -- Buscar dados da vacina atual (Usando FOR UPDATE para lock concorrente)
  SELECT * INTO v_vacina FROM public.vacinas WHERE id = p_vacina_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vacina não encontrada';
  END IF;

  -- Bloqueio contra Double Clicks e Race Conditions
  IF v_vacina.aplicada IS TRUE THEN
    RAISE EXCEPTION 'Esta vacina já foi marcada como aplicada e o ciclo foi processado.';
  END IF;

  -- 1. Marcar a atual como aplicada
  UPDATE public.vacinas
  SET 
    aplicada = true,
    data_aplicacao = p_data_aplicacao,
    lote_aplicacao = p_lote,
    observacao_aplicacao = p_observacao,
    updated_at = now()
  WHERE id = p_vacina_id;

  -- 2. Agendar a próxima se solicitado
  IF p_agendar_dias IS NOT NULL AND p_agendar_dias > 0 THEN
    INSERT INTO public.vacinas (
      user_id,
      pet_id,
      nome_pet,      -- manter para retrocompatibilidade
      nome_dono,     -- manter para retrocompatibilidade
      whatsapp_dono, -- manter para retrocompatibilidade
      tipo_vacina,
      data_dose,
      data_proxima_dose,
      foto_pet_url,  -- manter para retrocompatibilidade
      aplicada,
      avisado
    ) VALUES (
      v_vacina.user_id,
      v_vacina.pet_id,
      v_vacina.nome_pet,
      v_vacina.nome_dono,
      v_vacina.whatsapp_dono,
      v_vacina.tipo_vacina,
      p_data_aplicacao,
      (p_data_aplicacao + p_agendar_dias * interval '1 day')::DATE,
      v_vacina.foto_pet_url,
      false,
      false
    ) RETURNING id INTO v_nova_vacina_id;
    
    RETURN v_nova_vacina_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
