import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useConfig } from '@/hooks/useConfig';
import AppLayout from '@/components/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Share2, Copy, Syringe, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getVacinaStatus, getVacinaDaysInfo, getVacinaStatusStyles, buildWhatsAppUrl } from '@/lib/vacinas';
import { toast } from 'sonner';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function PetProfilePage() {
  const { petKey } = useParams<{ petKey: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { config } = useConfig();
  const [activeTab, setActiveTab] = useState('resumo');

  const decodedKey = petKey ? decodeURIComponent(petKey) : '';

  const { data: allVacinas = [] } = useQuery({
    queryKey: ['vacinas', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vacinas').select('*').eq('user_id', user!.id)
        .order('data_dose', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Filter vacinas for this pet
  const petVacinas = useMemo(() => {
    return allVacinas.filter((v) => `${v.nome_pet}--${v.whatsapp_dono}` === decodedKey);
  }, [allVacinas, decodedKey]);

  const petInfo = petVacinas[0];

  const appliedVacinas = useMemo(() => {
    return petVacinas
      .filter((v) => v.aplicada)
      .sort((a, b) => new Date(b.data_aplicacao || b.data_dose).getTime() - new Date(a.data_aplicacao || a.data_dose).getTime());
  }, [petVacinas]);

  // Group by tipo_vacina for carteira
  const vacinasByType = useMemo(() => {
    const map = new Map<string, typeof petVacinas>();
    petVacinas.forEach((v) => {
      const existing = map.get(v.tipo_vacina) || [];
      existing.push(v);
      map.set(v.tipo_vacina, existing);
    });
    // For each type, get the latest record
    const result: { tipo: string; latest: (typeof petVacinas)[0]; applied: (typeof petVacinas)[0] | null }[] = [];
    map.forEach((records, tipo) => {
      const sorted = records.sort((a, b) => new Date(b.data_dose).getTime() - new Date(a.data_dose).getTime());
      const latest = sorted[0];
      const applied = sorted.find((r) => r.aplicada) || null;
      result.push({ tipo, latest, applied });
    });
    return result;
  }, [petVacinas]);

  // Timeline items sorted by date desc
  const timelineItems = useMemo(() => {
    return petVacinas
      .filter((v) => v.aplicada || v.data_dose)
      .sort((a, b) => {
        const dateA = a.data_aplicacao || a.data_dose;
        const dateB = b.data_aplicacao || b.data_dose;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
  }, [petVacinas]);

  const generateComprovante = () => {
    if (!petInfo) return '';
    const petshopName = config?.nome_petshop || 'PetControl';
    let text = `🐾 CARTEIRA DE VACINAÇÃO\n`;
    text += `${petshopName}\n\n`;
    text += `Pet: ${petInfo.nome_pet}\n`;
    text += `Tutor: ${petInfo.nome_dono}\n\n`;
    text += `── Vacinas Aplicadas ──\n\n`;
    appliedVacinas.forEach((v) => {
      const date = v.data_aplicacao || v.data_dose;
      text += `✔ ${v.tipo_vacina}\n`;
      text += `  Aplicada: ${format(new Date(date), 'dd/MM/yyyy')}\n`;
      if (v.lote_aplicacao) text += `  Lote: ${v.lote_aplicacao}\n`;
      if (v.observacao_aplicacao) text += `  Obs: ${v.observacao_aplicacao}\n`;
      text += `\n`;
    });

    const pending = petVacinas.filter((v) => !v.aplicada && v.data_proxima_dose);
    if (pending.length > 0) {
      text += `── Próximas Doses ──\n\n`;
      pending.forEach((v) => {
        text += `⏳ ${v.tipo_vacina}\n`;
        text += `  Próxima: ${format(new Date(v.data_proxima_dose!), 'dd/MM/yyyy')}\n\n`;
      });
    }

    return text;
  };

  const handleCopy = async () => {
    const text = generateComprovante();
    await navigator.clipboard.writeText(text);
    toast.success('Comprovante copiado!');
  };

  const handleShareWhatsApp = () => {
    if (!petInfo) return;
    const text = generateComprovante();
    const url = buildWhatsAppUrl(petInfo.whatsapp_dono, text);
    window.open(url, '_blank');
  };

  if (!petInfo) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <p className="text-muted-foreground text-sm">Pet não encontrado</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/vacinas')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate('/vacinas')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {petInfo.foto_pet_url ? (
              <img src={petInfo.foto_pet_url} alt={petInfo.nome_pet} className="h-12 w-12 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-xl shrink-0">🐾</div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-foreground truncate">{petInfo.nome_pet}</h2>
              <p className="text-xs text-muted-foreground truncate">{petInfo.nome_dono}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="resumo" className="text-xs gap-1">
              <FileText className="h-3.5 w-3.5" /> Resumo
            </TabsTrigger>
            <TabsTrigger value="carteira" className="text-xs gap-1">
              <Syringe className="h-3.5 w-3.5" /> Carteira
            </TabsTrigger>
            <TabsTrigger value="historico" className="text-xs gap-1">
              <Calendar className="h-3.5 w-3.5" /> Histórico
            </TabsTrigger>
          </TabsList>

          {/* RESUMO */}
          <TabsContent value="resumo" className="space-y-4 mt-4">
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Pet</p>
                  <p className="text-sm font-semibold text-foreground">{petInfo.nome_pet}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Tutor</p>
                  <p className="text-sm font-semibold text-foreground">{petInfo.nome_dono}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">WhatsApp</p>
                  <p className="text-sm font-semibold text-foreground">{petInfo.whatsapp_dono}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Vacinas</p>
                  <p className="text-sm font-semibold text-foreground">{petVacinas.length} registro(s)</p>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Aplicadas', value: appliedVacinas.length, color: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Pendentes', value: petVacinas.filter((v) => !v.aplicada && getVacinaStatus(v.data_proxima_dose, v.avisado, v.aplicada) === 'pendente').length, color: 'text-warning' },
                { label: 'Atrasadas', value: petVacinas.filter((v) => getVacinaStatus(v.data_proxima_dose, v.avisado, v.aplicada) === 'atrasado').length, color: 'text-destructive' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center">
                  <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Share buttons */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-1.5 text-xs" onClick={handleCopy}>
                <Copy className="h-3.5 w-3.5" /> Copiar comprovante
              </Button>
              <Button className="flex-1 gap-1.5 text-xs bg-[#25D366] hover:bg-[#20bd5a] text-white" onClick={handleShareWhatsApp}>
                <WhatsAppIcon className="h-3.5 w-3.5" /> Enviar por WhatsApp
              </Button>
            </div>
          </TabsContent>

          {/* CARTEIRA DE VACINAÇÃO */}
          <TabsContent value="carteira" className="space-y-3 mt-4">
            {vacinasByType.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhuma vacina registrada</p>
            ) : (
              vacinasByType.map(({ tipo, latest, applied }) => {
                const status = getVacinaStatus(latest.data_proxima_dose, latest.avisado, latest.aplicada);
                const styles = getVacinaStatusStyles(status);
                const daysInfo = getVacinaDaysInfo(latest.data_proxima_dose);

                return (
                  <div key={tipo} className="rounded-xl border border-border bg-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-foreground">{tipo}</h3>
                      <Badge variant="secondary" className={`${styles.badge} text-[10px]`}>
                        {styles.label}
                      </Badge>
                    </div>

                    {applied && (
                      <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Aplicada — {format(new Date(applied.data_aplicacao || applied.data_dose), "dd MMM yyyy", { locale: ptBR })}</span>
                      </div>
                    )}

                    {latest.data_proxima_dose && !latest.aplicada && (
                      <div className="space-y-0.5">
                        <p className="text-[11px] text-muted-foreground">
                          Próxima dose — {format(new Date(latest.data_proxima_dose), "dd MMM yyyy", { locale: ptBR })}
                        </p>
                        {daysInfo && (
                          <p className={`text-[11px] font-semibold ${status === 'atrasado' ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {daysInfo.label}
                          </p>
                        )}
                      </div>
                    )}

                    {applied?.lote_aplicacao && (
                      <p className="text-[11px] text-muted-foreground">Lote: {applied.lote_aplicacao}</p>
                    )}
                  </div>
                );
              })
            )}

            {/* Share */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 gap-1.5 text-xs" onClick={handleCopy}>
                <Copy className="h-3.5 w-3.5" /> Copiar
              </Button>
              <Button className="flex-1 gap-1.5 text-xs bg-[#25D366] hover:bg-[#20bd5a] text-white" onClick={handleShareWhatsApp}>
                <WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp
              </Button>
            </div>
          </TabsContent>

          {/* HISTÓRICO (Timeline) */}
          <TabsContent value="historico" className="mt-4">
            {timelineItems.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhum registro encontrado</p>
            ) : (
              <div className="relative pl-6">
                {/* Timeline line */}
                <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border" />

                <div className="space-y-4">
                  {timelineItems.map((v, i) => {
                    const date = new Date(v.data_aplicacao || v.data_dose);
                    const status = getVacinaStatus(v.data_proxima_dose, v.avisado, v.aplicada);
                    const isApplied = v.aplicada;

                    return (
                      <div key={v.id} className="relative">
                        {/* Timeline dot */}
                        <div className={`absolute -left-6 top-1 h-[18px] w-[18px] rounded-full border-2 flex items-center justify-center ${
                          isApplied
                            ? 'border-emerald-500 bg-emerald-500/20'
                            : status === 'atrasado'
                              ? 'border-destructive bg-destructive/20'
                              : 'border-primary bg-primary/20'
                        }`}>
                          {isApplied && <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />}
                        </div>

                        <div className="rounded-xl border border-border bg-card p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-muted-foreground uppercase">
                              {format(date, "yyyy · MMM", { locale: ptBR })}
                            </p>
                            {isApplied && (
                              <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                                ✔ Aplicada
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-foreground">{v.tipo_vacina}</p>
                          {isApplied && v.data_aplicacao && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">
                              Aplicada em {format(new Date(v.data_aplicacao), 'dd/MM/yyyy')}
                            </p>
                          )}
                          {!isApplied && v.data_proxima_dose && (
                            <p className="text-xs text-muted-foreground">
                              Próxima: {format(new Date(v.data_proxima_dose), 'dd/MM/yyyy')}
                            </p>
                          )}
                          {v.lote_aplicacao && (
                            <p className="text-[11px] text-muted-foreground">Lote: {v.lote_aplicacao}</p>
                          )}
                          {v.observacao_aplicacao && (
                            <p className="text-[11px] text-muted-foreground italic">"{v.observacao_aplicacao}"</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
