-- Migração: Padronização de Telefones para E.164 (+55...)

-- 1. Normalizar Tabela Pets
UPDATE public.pets
SET telefone = CASE 
  -- Caso já tenha +, mantém (apenas remove espaços/traços extras se houver)
  WHEN telefone ~ '^\+' THEN '+' || regexp_replace(telefone, '\D', '', 'g')
  -- Caso brasileiro (10 ou 11 dígitos sem DDI), adiciona +55
  WHEN length(regexp_replace(telefone, '\D', '', 'g')) IN (10, 11) 
    THEN '+55' || regexp_replace(telefone, '\D', '', 'g')
  -- Caso genérico
  ELSE '+' || regexp_replace(telefone, '\D', '', 'g')
END
WHERE telefone IS NOT NULL;

-- 2. Normalizar Tabela Vacinas (Campos legados)
UPDATE public.vacinas
SET whatsapp_dono = CASE 
  WHEN whatsapp_dono ~ '^\+' THEN '+' || regexp_replace(whatsapp_dono, '\D', '', 'g')
  WHEN length(regexp_replace(whatsapp_dono, '\D', '', 'g')) IN (10, 11) 
    THEN '+55' || regexp_replace(whatsapp_dono, '\D', '', 'g')
  ELSE '+' || regexp_replace(whatsapp_dono, '\D', '', 'g')
END
WHERE whatsapp_dono IS NOT NULL;
