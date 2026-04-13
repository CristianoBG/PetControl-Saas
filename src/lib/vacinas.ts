import { isBefore, startOfDay, differenceInDays, intervalToDuration } from 'date-fns';

export type VacinaStatus = 'atrasado' | 'vencendo' | 'pendente' | 'enviado' | 'aplicada';

export function getVacinaStatus(dataProximaDose: string | null, avisado: boolean, aplicada?: boolean): VacinaStatus {
  if (aplicada) return 'aplicada';
  
  if (dataProximaDose) {
    const today = startOfDay(new Date());
    const target = startOfDay(new Date(dataProximaDose));
    const diff = differenceInDays(target, today);
    
    if (diff < 0) return 'atrasado';
    if (diff <= 7) return 'vencendo';
  }
  
  if (avisado) return 'enviado';
  return 'pendente';
}

export function getVacinaDaysInfo(dataProximaDose: string | null): { days: number; label: string } | null {
  if (!dataProximaDose) return null;
  const today = startOfDay(new Date());
  const target = startOfDay(new Date(dataProximaDose));
  const diff = differenceInDays(target, today);
  if (diff < 0) return { days: Math.abs(diff), label: `Atrasado há ${Math.abs(diff)} dia${Math.abs(diff) > 1 ? 's' : ''}` };
  if (diff === 0) return { days: 0, label: 'Hoje' };
  return { days: diff, label: `Em ${diff} dia${diff > 1 ? 's' : ''}` };
}

export function getRelativeTime(dataProximaDose: string | null): string {
  if (!dataProximaDose) return 'Sem data agendada';
  
  const today = startOfDay(new Date());
  const target = startOfDay(new Date(dataProximaDose));
  
  if (isBefore(target, today)) {
    const diff = differenceInDays(today, target);
    return `Atrasada há ${diff} dia${diff > 1 ? 's' : ''}`;
  }
  
  if (target.getTime() === today.getTime()) {
    return 'Vence hoje!';
  }
  
  const duration = intervalToDuration({ start: today, end: target });
  const parts = [];
  
  if (duration.years) parts.push(`${duration.years} ano${duration.years > 1 ? 's' : ''}`);
  if (duration.months) parts.push(`${duration.months} ${duration.months > 1 ? 'meses' : 'mês'}`);
  if (duration.days) parts.push(`${duration.days} dia${duration.days > 1 ? 's' : ''}`);
  
  if (parts.length === 0) return 'Hoje!';
  
  const text = parts.join(', ').replace(/, ([^,]*)$/, ' e $1');
  return `Falta${parts.join('').match(/\d+/g)?.some(n => parseInt(n) > 1) || parts.length > 1 ? 'm' : ''} ${text}`;
}

export function getVacinaStatusStyles(status: VacinaStatus) {
  switch (status) {
    case 'atrasado':
      return { label: '⚠️ ATRASADO', dot: 'bg-destructive', badge: 'bg-destructive/15 text-destructive border-destructive/30 font-bold' };
    case 'vencendo':
      return { label: '⏳ VENCENDO', dot: 'bg-amber-500', badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold' };
    case 'pendente':
      return { label: 'Agendada', dot: 'bg-primary/40', badge: 'bg-primary/10 text-primary border-primary/20 bg-primary/5' };
    case 'enviado':
      return { label: '✅ Enviado', dot: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-600 border-blue-200' };
    case 'aplicada':
      return { label: '✔ Aplicada', dot: 'bg-emerald-500', badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-bold' };
  }
}

export function buildWhatsAppMessage(
  template: string,
  v: { nome_pet: string; nome_dono: string; tipo_vacina: string; data_proxima_dose: string | null },
  nomePetshop: string,
  formatDate: (d: Date) => string
): string {
  const dataFormatada = v.data_proxima_dose ? formatDate(new Date(v.data_proxima_dose)) : 'em breve';
  return template
    .replace(/{nome_pet}/g, v.nome_pet)
    .replace(/{nome_dono}/g, v.nome_dono)
    .replace(/{tipo_vacina}/g, v.tipo_vacina)
    .replace(/{data}/g, dataFormatada)
    .replace(/{nome_petshop}/g, nomePetshop);
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, '');
  const fullPhone = clean.startsWith('55') ? clean : `55${clean}`;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
}

export const DEFAULT_TEMPLATE = 'Olá {nome_dono}, aqui é do {nome_petshop}! 🐾 Passando para avisar que a vacina {tipo_vacina} do {nome_pet} vence dia {data}. Vamos agendar o reforço?';
