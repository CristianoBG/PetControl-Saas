import { supabase } from '@/integrations/supabase/client';

export interface KlivopayCard {
  number: string;
  holder_name: string;
  exp_month: number;
  exp_year: number;
  cvv: string;
}

export interface KlivopayTransactionResult {
  transaction_id: string;
  status: string;
  pix_code: string | null;
  qr_code: string | null;
  paid: boolean;
}

/**
 * Creates a Klivopay transaction via Supabase Edge Function.
 * The Edge Function is responsible for calling the Klivopay API with the secret token.
 */
export async function createKlivopayTransaction(params: {
  planKey: string;
  paymentMethod: 'pix' | 'credit_card';
  card?: KlivopayCard;
  installments?: number;
  customer: {
    name: string;
    email: string;
    document: string;
    phone: string;
  };
}): Promise<KlivopayTransactionResult> {
  const { data, error } = await supabase.functions.invoke('create-klivopay-transaction', {
    body: {
      planKey:       params.planKey,
      paymentMethod: params.paymentMethod,
      card:          params.card ?? null,
      installments:  params.installments ?? 1,
      customer:      params.customer,
    },
  });

  if (error) {
    if (error instanceof Error && 'context' in error) {
      try {
        const errData = await (error as any).context.json();
        const msg = errData.details || errData.error || errData.message || JSON.stringify(errData);
        throw new Error(msg);
      } catch (e) {
        // failed to parse json
      }
    }
    throw error;
  }

  // Handle programmable errors returned with status 200
  if (data && (data.error || data.details)) {
    throw new Error(data.details || data.error);
  }

  console.log("PAYLOAD COMPLETO DA KLIVOPAY:", JSON.stringify(data, null, 2));

  return data as KlivopayTransactionResult;
}
