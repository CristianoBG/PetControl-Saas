import { AlertTriangle, Calendar, RefreshCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SubscriptionAlert() {
  const { subscriptionDaysRemaining, status, isActive } = useSubscription();

  // Apenas mostra se estiver ativo e tiver data de expiração
  if (!isActive || status !== 'active') return null;

  const days = subscriptionDaysRemaining;
  
  // Lógica de cores e urgência
  const isCritical = days <= 3;
  const isWarning = days <= 7;
  
  // Se faltar mais de 7 dias, opcionalmente não mostrar nada (ou mostrar informativo suave)
  // O usuário pediu: > 7 verde, <= 7 amarelo, <= 3 vermelho.
  
  const alertStyles = cn(
    "mb-6 transition-all duration-500",
    days > 7 && "bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400",
    days <= 7 && days > 3 && "bg-yellow-500/10 border-yellow-500/50 text-yellow-700 dark:text-yellow-400",
    days <= 3 && "bg-red-500/10 border-red-500/50 text-red-700 dark:text-red-400 animate-pulse"
  );

  const iconStyles = cn(
    "h-4 w-4",
    days > 7 && "text-green-500",
    days <= 7 && days > 3 && "text-yellow-500",
    days <= 3 && "text-red-500"
  );

  return (
    <Alert className={alertStyles}>
      {isWarning ? <AlertTriangle className={iconStyles} /> : <Calendar className={iconStyles} />}
      <AlertTitle className="flex items-center gap-2 font-bold">
        {isCritical ? "⚠️ Atenção: Expiração Crítica" : isWarning ? "Aviso de Expiração" : "Status da Assinatura"}
      </AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <span>
          O seu plano expira em <strong>{days} {days === 1 ? 'dia' : 'dias'}</strong>. 
          Renove agora para manter o acesso ilimitado aos seus dados.
        </span>
        <Button 
          asChild 
          variant={isCritical ? "destructive" : isWarning ? "default" : "outline"}
          size="sm"
          className="shrink-0"
        >
          <Link to="/planos" className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" />
            Renovar Agora
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
