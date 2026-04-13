import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Pencil, Trash2, CheckCircle, Syringe } from 'lucide-react';
import { format } from 'date-fns';
import { getVacinaStatus, getVacinaStatusStyles, getVacinaDaysInfo, type VacinaStatus } from '@/lib/vacinas';

/* ─────────────────────────────────────────────────────────────────────────────
   WhatsApp SVG icon
───────────────────────────────────────────────────────────────────────────── */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────── */
interface VacinaCardProps {
  vacina: {
    id: string;
    nome_pet: string;
    nome_dono: string;
    tipo_vacina: string;
    data_dose: string;
    data_proxima_dose: string | null;
    avisado: boolean;
    aplicada: boolean;
    foto_pet_url: string | null;
    whatsapp_dono: string;
  };
  batchMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onSendWhatsApp: () => void;
  onMarkSent: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRegisterApplication: () => void;
}

/* ─────────────────────────────────────────────────────────────────────────────
   VacinaCard — mobile-first redesign
   Layout vertical: foto + dados em cima, ações em baixo
   WhatsApp é destaque (botão cheio verde, não apenas ícone)
   Swipe lateral mantido mas com reveal consistente
───────────────────────────────────────────────────────────────────────────── */
export default function VacinaCard({
  vacina: v,
  batchMode,
  isSelected,
  onToggleSelect,
  onSendWhatsApp,
  onMarkSent,
  onEdit,
  onDelete,
  onRegisterApplication,
}: VacinaCardProps) {
  const navigate = useNavigate();
  const status = getVacinaStatus(v.data_proxima_dose, v.avisado, v.aplicada);
  const styles = getVacinaStatusStyles(status);
  const daysInfo = getVacinaDaysInfo(v.data_proxima_dose);

  // Swipe lateral (revela botões secundários no desktop/toque)
  const swipeWidth = status === 'aplicada' ? -70 : -105;
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (batchMode) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontal.current = null;
    setSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swiping || batchMode) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (isHorizontal.current === null) {
      isHorizontal.current = Math.abs(dx) > Math.abs(dy);
    }
    if (!isHorizontal.current) return;
    setSwipeX(Math.max(swipeWidth, Math.min(0, dx)));
  };

  const handleTouchEnd = () => {
    setSwiping(false);
    isHorizontal.current = null;
    setSwipeX(swipeX < swipeWidth / 2 ? swipeWidth : 0);
  };

  const closeSwipe = () => setSwipeX(0);

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Swipe action buttons (secondary — reveal on swipe) */}
      <div className="absolute inset-y-0 right-0 flex items-stretch">
        {status !== 'aplicada' && (
          <button
            onClick={() => { closeSwipe(); onRegisterApplication(); }}
            className="flex w-[52px] items-center justify-center bg-emerald-600 text-white"
            aria-label="Registrar aplicação"
          >
            <Syringe className="h-5 w-5" />
          </button>
        )}
        <button
          onClick={() => { closeSwipe(); onEdit(); }}
          className="flex w-[52px] items-center justify-center bg-primary text-primary-foreground"
          aria-label="Editar"
        >
          <Pencil className="h-5 w-5" />
        </button>
      </div>

      {/* Main card — slides on swipe */}
      <div
        className={`relative border bg-card transition-transform ${
          swiping ? '' : 'duration-200'
        } ${isSelected ? 'border-primary ring-1 ring-primary' : 'border-border'} ${
          status === 'atrasado' ? 'border-l-[3px] border-l-destructive' : ''
        }`}
        style={{ borderRadius: 12, transform: `translateX(${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={
          batchMode && status !== 'enviado'
            ? () => onToggleSelect(v.id)
            : swipeX < 0
            ? closeSwipe
            : undefined
        }
        role={batchMode ? 'button' : undefined}
      >
        {/* ── Linha superior: foto + dados + badge + checkbox ─────────────── */}
        <div className="flex items-start gap-3 p-3">
          {/* Batch checkbox */}
          {batchMode && status !== 'enviado' && (
            <div
              className={`mt-0.5 h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                isSelected ? 'border-primary bg-primary' : 'border-border'
              }`}
            >
              {isSelected && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
            </div>
          )}

          {/* Pet photo */}
          {v.foto_pet_url ? (
            <img src={v.foto_pet_url} alt={v.nome_pet} className="h-12 w-12 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-xl shrink-0">🐾</div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Pet name */}
            <button
              className="text-sm font-bold text-foreground truncate block text-left hover:text-primary transition-colors w-full"
              onClick={() => navigate(`/pet/${encodeURIComponent(`${v.nome_pet}--${v.whatsapp_dono}`)}`)}
            >
              {v.nome_pet}
            </button>
            {/* Dono + tipo */}
            <p className="text-xs text-muted-foreground truncate">{v.nome_dono} · {v.tipo_vacina}</p>
            {/* Próxima dose */}
            {v.data_proxima_dose && (
              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                <p className="text-[11px] text-muted-foreground">
                  {format(new Date(v.data_proxima_dose), 'dd MMM yyyy')}
                </p>
                {daysInfo && (
                  <span
                    className={`text-[11px] font-semibold ${
                      status === 'atrasado'
                        ? 'text-destructive'
                        : daysInfo.days <= 7
                        ? 'text-amber-500'
                        : 'text-muted-foreground'
                    }`}
                  >
                    · {daysInfo.label}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Badge de status (sempre visível) */}
          <Badge
            variant="secondary"
            className={`${styles.badge} text-[10px] whitespace-nowrap shrink-0 self-start`}
          >
            {styles.label}
          </Badge>
        </div>

        {/* ── Linha inferior: botões de ação (mobile-first) ───────────────── */}
        {!batchMode && status !== 'aplicada' && (
          <div className="flex items-center gap-1.5 px-3 pb-3">
            {/* WhatsApp — botão de destaque (ação principal) */}
            <button
              onClick={onSendWhatsApp}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-white text-xs font-semibold transition-opacity hover:opacity-90 active:scale-[0.97]"
              aria-label="Enviar WhatsApp"
            >
              <WhatsAppIcon className="h-3.5 w-3.5 shrink-0" />
              <span>WhatsApp</span>
            </button>

            {/* Marcar enviado (se ainda não enviado) */}
            {!v.avisado && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={onMarkSent}
                      aria-label="Marcar como enviado"
                    >
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Marcar como enviado</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Excluir */}
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0"
                    onClick={onDelete}
                    aria-label="Excluir"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Excluir vacina</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Linha inferior para status "aplicada" — só editar/excluir */}
        {!batchMode && status === 'aplicada' && (
          <div className="flex items-center justify-end gap-1 px-3 pb-3">
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
