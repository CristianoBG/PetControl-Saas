import { useState, useEffect } from 'react';
import { differenceInDays, addDays, format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Syringe } from 'lucide-react';

interface RegistrarAplicacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacina: {
    id: string;
    nome_pet: string;
    tipo_vacina: string;
    data_proxima_dose: string | null;
  } | null;
  onConfirm: (data: { dataAplicacao: string; lote: string; observacao: string; autoScheduleDays: number }) => void;
  isPending: boolean;
}

export default function RegistrarAplicacaoDialog({
  open,
  onOpenChange,
  vacina,
  onConfirm,
  isPending,
}: RegistrarAplicacaoDialogProps) {
  const today = new Date().toISOString().split('T')[0];
  const [dataAplicacao, setDataAplicacao] = useState(today);
  const [lote, setLote] = useState('');
  const [observacao, setObservacao] = useState('');
  const [autoScheduleDays, setAutoScheduleDays] = useState(365);
  const [manualNextDate, setManualNextDate] = useState(format(addDays(new Date(), 365), 'yyyy-MM-dd'));
  const [localSubmitting, setLocalSubmitting] = useState(false);

  // Sync manual date when quick select changes
  useEffect(() => {
    if (autoScheduleDays > 0) {
      const nextDate = format(addDays(new Date(dataAplicacao), autoScheduleDays), 'yyyy-MM-dd');
      setManualNextDate(nextDate);
    } else if (autoScheduleDays === 0) {
      setManualNextDate('');
    }
  }, [autoScheduleDays, dataAplicacao]);

  const handleConfirm = async () => {
    if (isPending || localSubmitting) return; // Sync lock
    setLocalSubmitting(true);
    
    try {
      let finalDays = autoScheduleDays;
      if (autoScheduleDays === -1 && manualNextDate) {
        finalDays = differenceInDays(new Date(manualNextDate), new Date(dataAplicacao));
      }

      await onConfirm({ 
        dataAplicacao: dataAplicacao || today, 
        lote: lote.trim(), 
        observacao: observacao.trim(), 
        autoScheduleDays: finalDays < 0 ? 0 : finalDays 
      });
      setDataAplicacao(today);
      setLote('');
      setObservacao('');
      setAutoScheduleDays(365);
      setManualNextDate(format(addDays(new Date(), 365), 'yyyy-MM-dd'));
    } finally {
      // Unlock after react digest or error
      setLocalSubmitting(false);
    }
  };

  const loading = isPending || localSubmitting;

  if (!vacina) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5 text-primary" />
            Registrar aplicação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 rounded-lg bg-muted/50 p-3">
          <p className="text-sm font-semibold text-foreground">{vacina.nome_pet}</p>
          <p className="text-xs text-muted-foreground">{vacina.tipo_vacina}</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-primary">Deseja agendar a próxima dose?</Label>
              <select
                value={autoScheduleDays}
                onChange={(e) => setAutoScheduleDays(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value={365}>Em 1 Ano (+365 dias)</option>
                <option value={180}>Em 6 Meses (+180 dias)</option>
                <option value={30}>Em 30 dias</option>
                <option value={-1}>Data Personalizada...</option>
                <option value={0}>Não (Encerrar ciclo)</option>
              </select>
            </div>

            {(autoScheduleDays > 0 || autoScheduleDays === -1) && (
              <div className="space-y-1.5 pt-2 animate-in fade-in slide-in-from-top-1">
                <Label htmlFor="data-proxima" className="text-[10px] uppercase font-bold text-primary">Data da próxima dose</Label>
                <Input
                  id="data-proxima"
                  type="date"
                  min={dataAplicacao}
                  value={manualNextDate}
                  onChange={(e) => {
                    setManualNextDate(e.target.value);
                    setAutoScheduleDays(-1);
                  }}
                  className="bg-background/80 border-primary/20 h-9"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="data-aplicacao" className="text-xs">Data da aplicação atual</Label>
            <Input
              id="data-aplicacao"
              type="date"
              max={today}
              value={dataAplicacao}
              onChange={(e) => setDataAplicacao(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lote" className="text-xs">Lote da vacina (opcional)</Label>
            <Input
              id="lote"
              placeholder="Ex: ABC123"
              value={lote}
              onChange={(e) => setLote(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao" className="text-xs">Observação (opcional)</Label>
            <Textarea
              id="observacao"
              placeholder="Ex: Pet apresentou boa reação"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="min-h-[60px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading} className="gap-1.5">
            <Syringe className="h-4 w-4" />
            {loading ? 'Salvando...' : 'Confirmar aplicação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
