import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'limit_reached' | 'locked_product';
  productLimit?: number;
}

export default function ProductLimitDialog({ open, onOpenChange, type, productLimit = 10 }: Props) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
            <Lock className="h-6 w-6 text-warning" />
          </div>
          <DialogTitle className="text-center">
            {type === 'limit_reached'
              ? 'Limite de produtos atingido'
              : 'Produto bloqueado'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {type === 'limit_reached'
              ? 'Você atingiu o limite de produtos do seu plano.'
              : `Este produto está bloqueado porque seu plano atual permite apenas ${productLimit} produtos.`}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-center text-muted-foreground">
          Atualize seu plano para desbloquear todos os produtos.
        </p>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className="w-full" onClick={() => { onOpenChange(false); navigate('/planos'); }}>
            Atualizar Plano
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
