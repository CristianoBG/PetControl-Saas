import { memo } from 'react';
import { PawPrint, MoreVertical, Pencil, Trash2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getSemaforoColor, getSemaforoStyles } from '@/lib/semaforo';
import StockBar from './StockBar';
import { startOfDay, differenceInDays, differenceInMonths } from 'date-fns';
import { AlertTriangle } from 'lucide-react';

function getExpirationLabel(dataValidade: string) {
  const today = startOfDay(new Date());
  const expiry = startOfDay(new Date(dataValidade));
  const days = differenceInDays(expiry, today);

  if (days < 0) return { text: '❌ Vencido', className: 'text-destructive font-bold' };
  if (days < 7) return { text: `⚠ ${days}d restantes`, className: 'text-destructive font-semibold' };
  if (days < 30) return { text: `${days} dias restantes`, className: 'text-warning font-semibold' };
  const months = differenceInMonths(expiry, today);
  const remainingDays = differenceInDays(expiry, new Date(today.getFullYear(), today.getMonth() + months, today.getDate()));
  if (remainingDays > 0) return { text: `${months}m ${remainingDays}d restantes`, className: 'text-muted-foreground font-medium' };
  return { text: `${months} meses`, className: 'text-muted-foreground font-medium' };
}

function getStagnantDays(lastMovementDate: string | null, createdAt?: string): number | null {
  const refDate = lastMovementDate || createdAt;
  if (!refDate) return null;
  const today = startOfDay(new Date());
  const last = startOfDay(new Date(refDate));
  const days = differenceInDays(today, last);
  return days >= 60 ? days : null;
}

interface ProductCardProps {
  product: {
    id: string;
    nome_produto: string;
    quantidade: number;
    data_validade: string;
    lote: string | null;
    codigo_barras: string | null;
    foto_url?: string | null;
    preco_unitario?: number | null;
    categoria?: string | null;
    created_at?: string;
  };
  isLocked: boolean;
  lastMovementDate?: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onLockedClick: () => void;
}

const ProductCard = memo(function ProductCard({ product, isLocked, lastMovementDate, onEdit, onDelete, onLockedClick }: ProductCardProps) {
  const color = getSemaforoColor(product.data_validade);
  const styles = getSemaforoStyles(color);

  if (isLocked) {
    return (
      <button
        onClick={onLockedClick}
        className="flex w-full items-center gap-4 rounded-xl border border-border bg-muted/50 p-4 opacity-50 text-left transition-all hover:opacity-70"
      >
        <Lock className="h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-base font-medium text-muted-foreground truncate">🔒 {product.nome_produto}</p>
        </div>
      </button>
    );
  }
  const expLabel = getExpirationLabel(product.data_validade);
  const stagnantDays = getStagnantDays(lastMovementDate ?? null, product.created_at);

  return (
    <div className={`flex gap-4 rounded-xl border ${styles.border} ${styles.bg} p-4`}>
      {/* Left: Image / paw icon */}
      <div className={`shrink-0 w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden ${styles.bg} border ${styles.border}`}>
        {product.foto_url ? (
          <img src={product.foto_url} alt={product.nome_produto} className="w-full h-full object-cover" />
        ) : (
          <PawPrint className={`h-7 w-7 ${styles.paw}`} />
        )}
      </div>

      {/* Right: Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        {/* Row 1: Name + actions */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-lg font-bold text-foreground truncate leading-snug">{product.nome_produto}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 -mt-0.5 -mr-1">
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={onEdit} className="gap-2">
                <Pencil className="h-3.5 w-3.5" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="gap-2 text-destructive focus:text-destructive">
                <Trash2 className="h-3.5 w-3.5" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Row 2: Secondary info */}
        <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground">
          {product.categoria && (
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-primary font-medium">{product.categoria}</span>
          )}
          {product.lote && <span>Lote: {product.lote}</span>}
          {product.preco_unitario ? (
            <span>R$ {product.preco_unitario.toFixed(2).replace('.', ',')}</span>
          ) : null}
        </div>

        {/* Row 3: Expiry label */}
        <div className="flex items-center justify-between mt-1">
          <p className={`text-base font-bold ${styles.text}`}>
            {expLabel.text}
          </p>
          <p className="text-sm text-muted-foreground">
            {new Date(product.data_validade).toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* Row 4: Stock bar */}
        <div className="mt-1">
          <StockBar quantity={product.quantidade} />
        </div>

        {/* Row 5: Quantity + Stock Value */}
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-base font-bold text-foreground">{product.quantidade} unidades</span>
          {product.preco_unitario ? (
            <span className="text-sm font-semibold text-primary">
              Valor: R$ {(product.quantidade * product.preco_unitario).toFixed(2).replace('.', ',')}
            </span>
          ) : null}
        </div>

        {/* Row 6: Stagnant product warning */}
        {stagnantDays !== null && (
          <div className="flex items-center gap-1.5 mt-1">
            <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
            <span className="text-xs text-warning font-medium">
              Produto parado há {stagnantDays} dias
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

export default ProductCard;
