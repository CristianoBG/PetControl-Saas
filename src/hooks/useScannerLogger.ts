/**
 * useScannerLogger — log estruturado do scanner.
 *
 * logInfo  → console.log com objeto {message, barcode?, userId?, timestamp}
 * logError → console.error + insert fire-and-forget em scanner_errors no Supabase
 *
 * Nunca quebra o fluxo principal: erros de persistência são silenciosos.
 */
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface LogExtra {
  barcode?: string;
  userId?: string;
  error?: unknown;
}

interface LogEntry extends LogExtra {
  message: string;
  timestamp: string;
}

export function useScannerLogger() {
  const { user } = useAuth();

  const logInfo = useCallback((message: string, extra?: LogExtra) => {
    const entry: LogEntry = { message, timestamp: new Date().toISOString(), ...extra };
    console.log('[Scanner]', entry);
  }, []);

  const logError = useCallback((message: string, extra?: LogExtra) => {
    const entry: LogEntry = { message, timestamp: new Date().toISOString(), ...extra };
    console.error('[Scanner][ERROR]', entry);

    // Persiste no banco de forma silenciosa (fire-and-forget)
    const userId = extra?.userId ?? user?.id;
    const errorMessage =
      extra?.error instanceof Error
        ? extra.error.message
        : typeof extra?.error === 'string'
        ? extra.error
        : message;

    // Fire-and-forget: nunca lança exceção para o chamador
    void (async () => {
      try {
        await supabase
          .from('scanner_errors' as any)
          .insert({
            user_id: userId ?? null,
            barcode: extra?.barcode ?? null,
            error_message: errorMessage,
          });
      } catch {
        // silencioso — o fluxo principal nunca é interrompido
      }
    })();
  }, [user]);

  return { logInfo, logError };
}
