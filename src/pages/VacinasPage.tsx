import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useActivityLog } from '@/hooks/useActivityLog';
import { useVacinas, type Vacina } from '@/hooks/useVacinas';
import { useDebounce } from '@/hooks/useDebounce';
import AppLayout from '@/components/AppLayout';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { PetCard } from '@/components/vacinas/PetCard';
import RegistrarAplicacaoDialog from '@/components/vacinas/RegistrarAplicacaoDialog';
import WhatsAppBatchAssistant from '@/components/vacinas/WhatsAppBatchAssistant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Plus, X, Upload, Search, ChevronLeft, ChevronRight, BarChart3, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { VacinaStatus } from '@/lib/vacinas';
import { validateImage, getImagePreviewUrl } from '@/lib/image';
import { normalizePhone, formatPhoneForDisplay } from '@/lib/phone';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

const MONTH_NAMES = [
  { short: 'Jan', full: 'Janeiro' },
  { short: 'Fev', full: 'Fevereiro' },
  { short: 'Mar', full: 'Março' },
  { short: 'Abr', full: 'Abril' },
  { short: 'Mai', full: 'Maio' },
  { short: 'Jun', full: 'Junho' },
  { short: 'Jul', full: 'Julho' },
  { short: 'Ago', full: 'Agosto' },
  { short: 'Set', full: 'Setembro' },
  { short: 'Out', full: 'Outubro' },
  { short: 'Nov', full: 'Novembro' },
  { short: 'Dez', full: 'Dezembro' }
];

const vacinaSchema = z.object({
  nome_pet: z.string().trim().min(1, 'Nome do pet obrigatório').max(100),
  nome_dono: z.string().trim().min(1, 'Nome do dono obrigatório').max(100),
  whatsapp: z.string().trim().min(10, 'WhatsApp deve ter DDD + Número (mínimo 10 dígitos)').max(25),
  tipo_vacina: z.string().trim().min(1, 'Tipo de vacina obrigatório').max(100),
  data_dose: z.string().min(1, 'Data da dose obrigatória'),
  data_proxima: z.string().optional().refine((val) => {
    if (!val) return true;
    return val >= new Date().toISOString().split('T')[0];
  }, { message: 'A próxima dose deve ser hoje ou uma data futura.' }),
});
type VacinaForm = z.infer<typeof vacinaSchema>;

const PAGE_SIZE = 12;

export default function VacinasPage() {
  const { user } = useAuth();
  const { logActivity } = useActivityLog();
  const {
    vacinas, vacinasComStatus, petsGrouped, isLoadingVacinas,
    dashboardStats, dashboardChart, fetchNextPage, hasNextPage, isFetchingNextPage,
    getWhatsAppLink,
    addVacina, updateVacina, deleteVacina, marcarAvisado, registrarAplicacao,
  } = useVacinas();

  const [showForm, setShowForm]               = useState(false);
  const [petPhoto, setPetPhoto]               = useState<File | null>(null);
  const [petPhotoPreview, setPetPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (petPhotoPreview && petPhotoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(petPhotoPreview);
      }
    };
  }, [petPhotoPreview]);

  const [searchText, setSearchText]           = useState('');
  const debouncedSearchText = useDebounce(searchText, 300);
  const [dashboardFilter, setDashboardFilter] = useState<string | 'all'>('all');
  const [page, setPage]                       = useState(0);
  const [applicationTarget, setApplicationTarget] = useState<string | null>(null);
  const [batchQueue, setBatchQueue]                 = useState<(Vacina & { status: string })[] | null>(null);

  const form = useForm<VacinaForm>({
    resolver: zodResolver(vacinaSchema),
    defaultValues: { nome_pet: '', nome_dono: '', whatsapp: '', tipo_vacina: '', data_dose: '', data_proxima: '' },
  });

  // ── Filtragem de Pets ──
  // Filtra sobre a lista infinitamente carregada
  const filteredPets = useMemo(() => {
    return petsGrouped.filter((p) => {
      // 1. Filtro de Busca
      const search = debouncedSearchText.toLowerCase();
      const matchesSearch = !search || 
        p.nome_pet.toLowerCase().includes(search) || 
        p.nome_dono.toLowerCase().includes(search) || 
        p.whatsapp_dono.includes(search);
      
      if (!matchesSearch) return false;

      // 2. Filtro de Categoria do Dashboard
      if (dashboardFilter === 'all') return true;
      
      // Mapeamento de Labels para Status do Helper (lib/vacinas.ts)
      const filterMap: Record<string, string> = {
        'atrasadas': 'atrasado',
        'vencendo': 'vencendo',
        'aplicadas': 'aplicada',
        'pendentes': 'pendente' // Agendadas
      };

      const targetStatus = filterMap[dashboardFilter];
      return p.vacinas.some(v => v.status === targetStatus);
    });
  }, [petsGrouped, debouncedSearchText, dashboardFilter]);

  // ── Fallback dos Stats para enquanto o DB carrega ──
  const stats = dashboardStats || { vencendo: 0, atrasadas: 0, aplicadas: 0, pendentes: 0 };
  
  // ── Chart Helper ──
  const chartData = useMemo(() => {
     if (!dashboardChart || dashboardChart.length === 0) {
       return MONTH_NAMES.map(m => ({ name: m.short, fullName: m.full, total: 0 }));
     }
     return dashboardChart.map((col) => ({
        name: MONTH_NAMES[col.month - 1].short,
        fullName: MONTH_NAMES[col.month - 1].full,
        total: col.total
     }));
  }, [dashboardChart]);

  const isChartEmpty = useMemo(() => {
    return !dashboardChart || dashboardChart.every(m => m.total === 0);
  }, [dashboardChart]);

  // ── Helpers ──
  const handleSendWhatsApp = (vacinaId: string) => {
    const v = vacinas.find(x => x.id === vacinaId);
    if (!v) return;
    const win = window.open(getWhatsAppLink(v), '_blank');
    if (!win) {
      toast.warning('Popup bloqueado. Permita popups neste site para abrir o WhatsApp.', { duration: 5000 });
      return;
    }
    marcarAvisado.mutate([v.id]);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImage(file);
    if (!validation.valid) { toast.error(validation.message); e.target.value = ''; return; }
    setPetPhoto(file);
    if (petPhotoPreview && petPhotoPreview.startsWith('blob:')) URL.revokeObjectURL(petPhotoPreview);
    setPetPhotoPreview(getImagePreviewUrl(file));
  };

  const resetForm = () => {
    form.reset(); 
    setPetPhoto(null); 
    if (petPhotoPreview && petPhotoPreview.startsWith('blob:')) URL.revokeObjectURL(petPhotoPreview);
    setPetPhotoPreview(null);
    setShowForm(false);
  };

  const handleStartBatch = () => {
    const pending = vacinasComStatus.filter(v => (v.status === 'atrasado' || v.status === 'vencendo') && !v.aplicada);
    if (pending.length === 0) {
      toast.info('Não há vacinas atrasadas ou vencendo para notificar no momento.');
      return;
    }
    setBatchQueue(pending);
  };

  const onSubmit = async (data: VacinaForm) => {
    const explicitlyTypedData = {
      nome_pet: data.nome_pet, nome_dono: data.nome_dono, whatsapp: data.whatsapp,
      tipo_vacina: data.tipo_vacina, data_dose: data.data_dose, data_proxima: data.data_proxima,
    };
    await addVacina.mutateAsync({ formData: explicitlyTypedData, petPhoto });
    logActivity.mutate({ tipo: 'vacina_add', descricao: `Vacina de ${data.nome_pet} registrada` });
    toast.success('Vacina registrada!');
    resetForm();
  };

  if (!user) return null;

  return (
    <AppLayout>
      <div className="space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-foreground max-sm:text-xl">Dashboard Vacinas</h2>
          <Button size="sm" onClick={() => { if (showForm) resetForm(); else setShowForm(true); }} className="gap-1 font-bold">
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Cancelar' : 'Nova Vacina'}
          </Button>
        </div>

        {showForm && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 rounded-xl border border-border bg-card p-4 animate-in slide-in-from-top-4">
              <fieldset disabled={addVacina.isPending} className="space-y-3 border-none p-0 m-0">
                <div className="flex items-center gap-3">
                  <label className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted overflow-hidden hover:bg-muted/80">
                    {petPhotoPreview ? <img src={petPhotoPreview} className="h-full w-full object-cover" alt="Pet" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                  <p className="text-xs text-muted-foreground">Foto do pet (opcional)</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="nome_pet" render={({ field }) => (
                    <FormItem><FormLabel className="text-xs">Nome do Pet</FormLabel><FormControl><Input placeholder="Rex" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="nome_dono" render={({ field }) => (
                    <FormItem><FormLabel className="text-xs">Nome do Dono</FormLabel><FormControl><Input placeholder="João" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="whatsapp" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">WhatsApp (Dono)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+55 11 99999-9999" 
                        inputMode="tel" 
                        {...field} 
                        onChange={(e) => {
                          // Permite apenas dígitos, espaços, +, - e ()
                          const val = e.target.value.replace(/[^0-9+\s()\-]/g, '');
                          field.onChange(val);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="tipo_vacina" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Tipo de Vacina</FormLabel>
                    <FormControl>
                      <>
                        <Input placeholder="V10, Antirrábica..." list="vacina-suggestions" {...field} />
                        <datalist id="vacina-suggestions">
                          {['V8', 'V10', 'Antirrábica', 'Gripe', 'Giardia', 'Leishmaniose'].map((s) => (
                            <option key={s} value={s} />
                          ))}
                        </datalist>
                      </>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="data_dose" render={({ field }) => (
                    <FormItem><FormLabel className="text-xs">Data da Dose</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="data_proxima" render={({ field }) => (
                    <FormItem><FormLabel className="text-xs">Próxima Dose</FormLabel><FormControl><Input type="date" min={new Date().toISOString().split('T')[0]} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </fieldset>
              <Button type="submit" disabled={addVacina.isPending} className="w-full">
                {addVacina.isPending ? 'Salvando...' : 'Registrar Vacina'}
              </Button>
            </form>
          </Form>
        )}

        {/* ── TOP STATS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div 
            onClick={() => setDashboardFilter(prev => prev === 'vencendo' ? 'all' : 'vencendo')}
            className={`cursor-pointer transition-all duration-200 bg-amber-500 text-white rounded-xl p-4 shadow-sm relative overflow-hidden hover:scale-[1.02] active:scale-[0.98] ${dashboardFilter === 'vencendo' ? 'ring-4 ring-amber-200 ring-offset-2 scale-[1.02]' : 'opacity-80 hover:opacity-100'}`}
          >
            <div className="text-3xl font-black mb-0.5">{stats.vencendo}</div>
            <div className="text-sm font-medium opacity-90">Vencendo em Breve</div>
            <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-[60px]">⏳</div>
          </div>
          <div 
            onClick={() => setDashboardFilter(prev => prev === 'atrasadas' ? 'all' : 'atrasadas')}
            className={`cursor-pointer transition-all duration-200 bg-destructive text-destructive-foreground rounded-xl p-4 shadow-sm relative overflow-hidden hover:scale-[1.02] active:scale-[0.98] ${dashboardFilter === 'atrasadas' ? 'ring-4 ring-destructive/30 ring-offset-2 scale-[1.02]' : 'opacity-80 hover:opacity-100'}`}
          >
            <div className="text-3xl font-black mb-0.5">{stats.atrasadas}</div>
            <div className="text-sm font-medium opacity-90">Atrasadas</div>
            <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-[60px]">⚠</div>
          </div>
          <div 
            onClick={() => setDashboardFilter(prev => prev === 'aplicadas' ? 'all' : 'aplicadas')}
            className={`cursor-pointer transition-all duration-200 bg-emerald-500 text-white rounded-xl p-4 shadow-sm relative overflow-hidden hover:scale-[1.02] active:scale-[0.98] ${dashboardFilter === 'aplicadas' ? 'ring-4 ring-emerald-200 ring-offset-2 scale-[1.02]' : 'opacity-80 hover:opacity-100'}`}
          >
            <div className="text-3xl font-black mb-0.5">{stats.aplicadas}</div>
            <div className="text-sm font-medium opacity-90">Aplicadas</div>
            <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-[60px]">✔</div>
          </div>
          <div 
            onClick={() => setDashboardFilter(prev => prev === 'pendentes' ? 'all' : 'pendentes')}
            className={`cursor-pointer transition-all duration-200 bg-primary text-primary-foreground rounded-xl p-4 shadow-sm relative overflow-hidden hover:scale-[1.02] active:scale-[0.98] ${dashboardFilter === 'pendentes' ? 'ring-4 ring-primary/30 ring-offset-2 scale-[1.02]' : 'opacity-80 hover:opacity-100'}`}
          >
            <div className="text-3xl font-black mb-0.5">{stats.pendentes}</div>
            <div className="text-sm font-medium opacity-90">Agendadas</div>
            <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-[60px]">🕒</div>
          </div>
        </div>

        {/* ── BAR CHART ── */}
        <div className="bg-card rounded-2xl border shadow-sm p-5 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-bold text-foreground">Previsão: Vacinas por Mês</h3>
            <span className="text-xs text-muted-foreground ml-auto">({new Date().getFullYear()})</span>
          </div>
          
          <div className="h-[180px] w-full mt-2">
            {isChartEmpty ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
                <BarChart3 className="w-8 h-8 opacity-20 mb-2" />
                <p className="text-xs font-medium">Sem vacinas agendadas para {new Date().getFullYear()}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#888' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#888' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 8 }}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                    labelStyle={{ color: '#888', marginBottom: '4px' }}
                    formatter={(value: number, name: string, props: any) => [
                      `${value} vacina${value !== 1 ? 's' : ''}`, 
                      props.payload.fullName
                    ]}
                  />
                  <Bar 
                    dataKey="total" 
                    fill="currentColor" 
                    className="text-primary" 
                    radius={[6, 6, 0, 0]}
                    barSize={24}
                    animationDuration={1500}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.total > 0 ? undefined : 'rgba(0,0,0,0.05)'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── TOOLBAR ── */}
        <div className="flex items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por pet ou dono..." value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setPage(0); }} className="pl-9 bg-card border shadow-sm" />
            {dashboardFilter !== 'all' && (
              <button 
                onClick={() => setDashboardFilter('all')}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold text-muted-foreground hover:bg-accent transition-colors"
              >
                Limpar Filtro <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>

          <Button 
            variant="outline" 
            onClick={handleStartBatch}
            className="gap-2 font-bold text-primary border-primary/20 bg-primary/5 hover:bg-primary/10 shadow-sm whitespace-nowrap"
          >
             <MessageSquare className="h-4 w-4" />
             Notificar Pendentes
          </Button>
        </div>

        {/* ── PET CARDS GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPets.length === 0 && !isLoadingVacinas && (
            <div className="col-span-full text-center text-sm text-muted-foreground py-10 bg-card rounded-2xl border border-dashed">
               Nenhum pet encontrado.
            </div>
          )}
          {filteredPets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              onSendWhatsApp={handleSendWhatsApp}
              onMarkSent={(vid) => marcarAvisado.mutate([vid])}
              onApplyVaccine={(vid) => setApplicationTarget(vid)}
            />
          ))}
        </div>

        {/* ── FILA / PAGINATION INFINITA ── */}
        <div className="flex justify-center pt-6 pb-2">
           <Button 
             variant="outline" 
             onClick={() => fetchNextPage()} 
             disabled={!hasNextPage || isFetchingNextPage}
             className="rounded-full shadow-sm"
           >
             {isFetchingNextPage 
               ? 'Carregando mais pets...' 
               : hasNextPage 
                 ? 'Carregar mais pets' 
                 : 'Todos os pets carregados'}
           </Button>
        </div>
      </div>

      <RegistrarAplicacaoDialog
        open={!!applicationTarget}
        onOpenChange={(open) => { if (!open) setApplicationTarget(null); }}
        vacina={applicationTarget ? vacinas.find((v) => v.id === applicationTarget) || null : null}
        onConfirm={(data) => {
          if (applicationTarget) {
            registrarAplicacao.mutateAsync({ id: applicationTarget, ...data }).then((nome) => {
              toast.success(`Vacina de ${nome} registrada com sucesso!`);
              if (data.autoScheduleDays > 0) {
                 toast.success(`Dose do ano que vem foi agendada automaticamente! 🚀`);
              }
              logActivity.mutate({ tipo: 'vacina_aplicada', descricao: `Vacina de ${nome} aplicada` });
              setApplicationTarget(null);
            }).catch((e: Error) => toast.error(e.message));
          }
        }}
        isPending={registrarAplicacao.isPending}
      />

      <WhatsAppBatchAssistant
        open={!!batchQueue}
        onOpenChange={(open) => !open && setBatchQueue(null)}
        queue={batchQueue || []}
        getWhatsAppLink={getWhatsAppLink}
        onMarkSent={(vid) => marcarAvisado.mutate([vid])}
      />
    </AppLayout>
  );
}
