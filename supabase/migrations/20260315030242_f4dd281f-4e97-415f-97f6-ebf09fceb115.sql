
ALTER TABLE public.vacinas
ADD COLUMN aplicada boolean NOT NULL DEFAULT false,
ADD COLUMN data_aplicacao date,
ADD COLUMN lote_aplicacao text,
ADD COLUMN observacao_aplicacao text;
