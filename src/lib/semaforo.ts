import { differenceInDays, differenceInMonths } from 'date-fns';

export type SemaforoColor = 'red' | 'orange' | 'green';

export function getSemaforoColor(dataValidade: string): SemaforoColor {
  const hoje = new Date();
  const validade = new Date(dataValidade);
  const dias = differenceInDays(validade, hoje);
  const meses = differenceInMonths(validade, hoje);

  if (dias < 30) return 'red';
  if (meses < 3) return 'orange';
  return 'green';
}

export function getSemaforoStyles(color: SemaforoColor) {
  const map = {
    red: {
      bg: 'bg-destructive/10',
      border: 'border-destructive/30',
      text: 'text-destructive',
      dot: 'bg-destructive',
      paw: 'text-destructive',
      label: 'Crítico',
    },
    orange: {
      bg: 'bg-warning/10',
      border: 'border-warning/30',
      text: 'text-warning',
      dot: 'bg-warning',
      paw: 'text-warning',
      label: 'Atenção',
    },
    green: {
      bg: 'bg-primary/10',
      border: 'border-primary/30',
      text: 'text-primary',
      dot: 'bg-primary',
      paw: 'text-primary',
      label: 'Seguro',
    },
  };
  return map[color];
}
