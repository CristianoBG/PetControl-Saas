import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, MessageSquare, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Vacina } from '@/hooks/useVacinas';

interface WhatsAppBatchAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queue: (Vacina & { status: string })[];
  getWhatsAppLink: (v: Vacina) => string;
  onMarkSent: (vacinaId: string) => void;
}

export default function WhatsAppBatchAssistant({
  open,
  onOpenChange,
  queue,
  getWhatsAppLink,
  onMarkSent
}: WhatsAppBatchAssistantProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isWaitingForFocus, setIsWaitingForFocus] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const currentVacina = queue[currentIndex];
  const progress = queue.length > 0 ? (currentIndex / queue.length) * 100 : 0;
  const isFinished = currentIndex >= queue.length && queue.length > 0;

  const handleSendCurrent = useCallback(() => {
    if (!currentVacina) return;
    
    const url = getWhatsAppLink(currentVacina);
    window.open(url, '_blank');
    setIsWaitingForFocus(true);
  }, [currentVacina, getWhatsAppLink]);

  const handleNext = () => {
    setCurrentIndex(prev => prev + 1);
    setIsWaitingForFocus(false);
  };

  const handleConfirmSent = () => {
    if (!currentVacina) return;
    // Marcar localmente para feedback visual imediato
    setSentIds(prev => new Set(prev).add(currentVacina.id));
    onMarkSent(currentVacina.id);
    handleNext();
  };

  const handleSkip = () => {
    handleNext();
  };

  // Detectar volta para a aba
  useEffect(() => {
    const handleFocus = () => {
      if (isWaitingForFocus) {
        // Opcional: Pequeno delay para garantir que o usuário veja a conversa abrir
        // setIsWaitingForFocus(false); 
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isWaitingForFocus]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !isWaitingForFocus && onOpenChange(val)}>
      <DialogContent className="sm:max-w-md border-primary/20 bg-card/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <MessageSquare className="h-5 w-5" />
            Assistente de Notificação
          </DialogTitle>
        </DialogHeader>

        {isFinished ? (
          <div className="py-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-bounce">
                <CheckCircle2 className="h-8 w-8" />
              </div>
            </div>
            <h3 className="text-xl font-bold">Tudo pronto!</h3>
            <p className="text-sm text-muted-foreground">
              Você enviou {queue.length} notificações com sucesso.
            </p>
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Fechar Assistente
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* PROGRESSO */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-muted-foreground">
                <span>Progresso: {currentIndex + 1} de {queue.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* CARD DO PET ATUAL */}
            <div className="rounded-2xl border bg-muted/30 p-4 space-y-3 relative overflow-hidden group">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-black text-foreground">{currentVacina?.nome_pet}</p>
                  <p className="text-xs text-muted-foreground">Dono: {currentVacina?.nome_dono}</p>
                </div>
                <Badge variant={currentVacina?.status === 'atrasado' ? 'destructive' : 'secondary'} className="text-[10px] uppercase">
                  {currentVacina?.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-primary font-bold bg-primary/5 p-2 rounded-lg">
                <AlertCircle className="h-3 w-3" />
                Vacina: {currentVacina?.tipo_vacina}
              </div>
            </div>

            {/* CONTROLES */}
            <div className="space-y-3">
              {!isWaitingForFocus ? (
                <Button className="w-full h-12 text-lg font-bold gap-2 animate-pulse" onClick={handleSendCurrent}>
                  <MessageSquare className="h-5 w-5" />
                  Abrir WhatsApp do(a) {currentVacina?.nome_pet}
                </Button>
              ) : (
                <div className="space-y-3 animate-in fade-in zoom-in duration-300">
                  <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-100 flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    Janela do WhatsApp aberta!
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="h-12 border-destructive/20 text-destructive hover:bg-destructive/5" onClick={handleSkip}>
                      Pular / Não enviada
                    </Button>
                    <Button className="h-12 bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={handleConfirmSent}>
                      Mensagem enviada <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-start">
          <p className="text-[10px] text-muted-foreground">
            O assistente evita que o navegador bloqueie seus popups automatizando um por um.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
