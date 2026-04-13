-- Migração: Criação de RPCs para o Dashboard de Vacinas (Paginação e Performance)

-- 1. RPC para Contadores do Topo do Dashboard
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'aplicadas', count(*) FILTER (WHERE aplicada IS TRUE),
    'atrasadas', count(*) FILTER (WHERE aplicada IS FALSE AND data_proxima_dose < CURRENT_DATE),
    'vencendo',  count(*) FILTER (WHERE aplicada IS FALSE AND data_proxima_dose >= CURRENT_DATE AND data_proxima_dose <= (CURRENT_DATE + interval '7 days')),
    'pendentes', count(*) FILTER (WHERE aplicada IS FALSE AND (data_proxima_dose > (CURRENT_DATE + interval '7 days') OR data_proxima_dose IS NULL))
  ) INTO v_result
  FROM public.vacinas
  WHERE user_id = p_user_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RPC para Gráfico de Vacinas do Ano (Previsão de Receita)
-- Retorna array de contadores por mês do ano em vigência
CREATE OR REPLACE FUNCTION public.get_dashboard_chart(p_user_id UUID, p_year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE))
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH months AS (
    SELECT generate_series(1, 12) AS month
  ),
  counts AS (
    SELECT 
      EXTRACT(MONTH FROM COALESCE(v.data_proxima_dose, v.data_dose))::INT AS month,
      count(*) AS total
    FROM public.vacinas v
    WHERE v.user_id = p_user_id
      AND EXTRACT(YEAR FROM COALESCE(v.data_proxima_dose, v.data_dose)) = p_year
    GROUP BY EXTRACT(MONTH FROM COALESCE(v.data_proxima_dose, v.data_dose))
  )
  SELECT json_agg(
    json_build_object(
      'month', m.month,
      'total', COALESCE(c.total, 0)
    ) ORDER BY m.month
  ) INTO v_result
  FROM months m
  LEFT JOIN counts c ON m.month = c.month;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
