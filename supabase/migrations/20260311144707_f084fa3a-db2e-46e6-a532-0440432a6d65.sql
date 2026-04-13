-- Validation trigger for data_proxima_dose on vacinas
CREATE OR REPLACE FUNCTION public.validate_vacina_proxima_dose()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.data_proxima_dose IS NOT NULL AND NEW.data_proxima_dose < CURRENT_DATE THEN
    RAISE EXCEPTION 'data_proxima_dose must be today or a future date';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_vacina_proxima_dose
BEFORE INSERT OR UPDATE ON public.vacinas
FOR EACH ROW
EXECUTE FUNCTION public.validate_vacina_proxima_dose();

-- Validation trigger for data_validade on estoque
CREATE OR REPLACE FUNCTION public.validate_estoque_data_validade()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.data_validade < CURRENT_DATE THEN
    RAISE EXCEPTION 'data_validade must be today or a future date';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_estoque_data_validade
BEFORE INSERT OR UPDATE ON public.estoque
FOR EACH ROW
EXECUTE FUNCTION public.validate_estoque_data_validade();