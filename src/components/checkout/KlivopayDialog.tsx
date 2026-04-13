import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Copy,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
  CreditCard,
  QrCode,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { createKlivopayTransaction, KlivopayCard } from '@/services/klivopay';
import { cn } from '@/lib/utils';

interface KlivopayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  planKey: string | null;
  planName: string;
  defaultTab?: 'pix' | 'credit_card';
}

type PaymentTab = 'credit_card' | 'pix';
type ModalStatus = 'idle' | 'processing' | 'waiting_pix' | 'paid' | 'error';

const PIX_EXPIRY_SECONDS = 24 * 60 * 60; // 24h (Klivopay expire_in_days: 1)

function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function KlivopayDialog({ isOpen, onClose, planKey, planName, defaultTab = 'credit_card' }: KlivopayDialogProps) {
  const queryClient = useQueryClient();

  // ── Tab ──────────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<PaymentTab>(defaultTab);

  // ── Customer fields ───────────────────────────────────────────────────────────
  const [customerName, setCustomerName]         = useState('');
  const [customerEmail, setCustomerEmail]       = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [customerPhone, setCustomerPhone]       = useState('');

  // ── Card fields ───────────────────────────────────────────────────────────────
  const [cardNumber, setCardNumber]     = useState('');
  const [holderName, setHolderName]     = useState('');
  const [expiry, setExpiry]             = useState('');      // "MM/YY"
  const [cvv, setCvv]                   = useState('');
  const [installments, setInstallments] = useState(1);

  // ── State ─────────────────────────────────────────────────────────────────────
  const [status, setStatus]           = useState<ModalStatus>('idle');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [pixCode, setPixCode]         = useState<string | null>(null);
  const [qrCode, setQrCode]           = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(PIX_EXPIRY_SECONDS);
  const [checkingManually, setCheckingManually] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const clearAllTimers = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (timerRef.current)   clearInterval(timerRef.current);
    pollingRef.current = null;
    timerRef.current   = null;
  }, []);

  const handleSuccess = useCallback(() => {
    clearAllTimers();
    setStatus('paid');
    toast.success('Pagamento confirmado! Bem-vindo ao novo plano.');
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['is-admin'] });
      onClose();
    }, 3000);
  }, [clearAllTimers, queryClient, onClose]);

  const resetState = useCallback(() => {
    clearAllTimers();
    setStatus('idle');
    setTransactionId(null);
    setPixCode(null);
    setQrCode(null);
    setSecondsLeft(PIX_EXPIRY_SECONDS);
    setCardNumber('');
    setHolderName('');
    setExpiry('');
    setCvv('');
    setInstallments(1);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerDocument('');
    setCustomerPhone('');
    setTab('credit_card');
  }, [clearAllTimers]);

  // ── Open / Close ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab);   // sync tab with the button that was clicked
    } else {
      resetState();
    }
  }, [isOpen, defaultTab, resetState]);

  // ── Countdown (PIX only) ──────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'waiting_pix') return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) { setStatus('error'); clearAllTimers(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status, clearAllTimers]);

  // ── Polling (PIX only) ────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'waiting_pix' || !transactionId) return;

    const checkStatus = async () => {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('status')
        .eq('transaction_hash', transactionId)
        .maybeSingle();
      if (!error && data?.status === 'paid') handleSuccess();
    };

    pollingRef.current = setInterval(checkStatus, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [status, transactionId, handleSuccess]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!planKey) return;
    setStatus('processing');

    try {
      let card: KlivopayCard | undefined;
      if (tab === 'credit_card') {
        const [expMonthStr, expYearStr] = expiry.split('/');
        card = {
          number:      cardNumber.replace(/\s/g, ''),
          holder_name: holderName.trim(),
          exp_month:   parseInt(expMonthStr, 10),
          exp_year:    parseInt(expYearStr,  10),
          cvv:         cvv.trim(),
        };
      }

      const result = await createKlivopayTransaction({
        planKey,
        paymentMethod: tab,
        card,
        installments: tab === 'credit_card' ? installments : 1,
        customer: {
          name: customerName.trim(),
          email: customerEmail.trim(),
          document: customerDocument.replace(/\D/g, ''),
          phone: customerPhone.replace(/\D/g, ''),
        }
      });

      setTransactionId(result.transaction_id);

      if (result.paid || result.status === 'paid') {
        handleSuccess();
        return;
      }

      if (tab === 'pix') {
        setPixCode(result.pix_code);
        setQrCode(result.qr_code);
        setSecondsLeft(PIX_EXPIRY_SECONDS);
        setStatus('waiting_pix');
      } else {
        // Credit card — status is likely "processing", poll for confirmation
        setStatus('waiting_pix'); // reuse polling logic
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Klivopay transaction failed:', err);
      toast.error(`Falha no pagamento: ${message}`);
      setStatus('error');
    }
  };

  const handleManualCheck = async () => {
    if (!transactionId || checkingManually) return;
    setCheckingManually(true);
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('status')
        .eq('transaction_hash', transactionId)
        .maybeSingle();
      if (error) throw error;
      if (data?.status === 'paid') {
        handleSuccess();
      } else {
        toast.info('Pagamento ainda não detectado. Aguarde alguns instantes.');
      }
    } catch {
      toast.error('Erro ao verificar o pagamento.');
    } finally {
      setCheckingManually(false);
    }
  };

  const handleCopy = () => {
    if (!pixCode) return;
    navigator.clipboard.writeText(pixCode);
    toast.success('Código PIX copiado!');
  };

  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return h > 0 ? `${h}h ${m}m` : `${m}:${s}`;
  };

  const isCardValid =
    cardNumber.replace(/\s/g, '').length === 16 &&
    holderName.trim().length > 2 &&
    expiry.length === 5 &&
    cvv.length >= 3;

  const isCustomerValid = 
    customerName.trim().length > 2 &&
    customerEmail.includes('@') &&
    customerDocument.replace(/\D/g, '').length >= 11 &&
    customerPhone.replace(/\D/g, '').length >= 10;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-violet-400" />
            Pagamento — {planName}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Escolha como deseja pagar
          </DialogDescription>
        </DialogHeader>

        {/* ── Paid ─────────────────────────────────────────────────────────── */}
        {status === 'paid' && (
          <div className="flex flex-col items-center text-emerald-400 gap-4 py-8 animate-in zoom-in duration-500">
            <div className="h-20 w-20 bg-emerald-400/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <p className="font-bold text-lg text-slate-100">Pronto! Recursos Liberados.</p>
            <p className="text-sm text-slate-400">Atualizando seu plano...</p>
          </div>
        )}

        {/* ── Error ─────────────────────────────────────────────────────────── */}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-5 py-6 animate-in fade-in duration-300">
            <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold text-slate-100">Falha no pagamento</p>
              <p className="text-sm text-slate-400">Verifique os dados e tente novamente.</p>
            </div>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setStatus('idle')}>
              <RefreshCw className="h-4 w-4 mr-2" /> Tentar novamente
            </Button>
          </div>
        )}

        {/* ── Waiting PIX ───────────────────────────────────────────────────── */}
        {status === 'waiting_pix' && tab === 'pix' && (
          <div className="flex flex-col items-center gap-5 py-4 animate-in fade-in duration-500 w-full overflow-hidden">
            <div className="text-sm font-mono font-semibold text-emerald-400 flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" />
              PIX válido por {formatTimer(secondsLeft)}
            </div>
            {qrCode && (
              <div className="p-3 bg-white rounded-xl shadow-lg w-44 h-44 flex items-center justify-center shrink-0">
                <img src={qrCode} alt="QR Code PIX" className="w-full h-full object-contain" />
              </div>
            )}
            {pixCode && (
              <div className="w-full space-y-1 text-left overflow-hidden">
                <p className="text-xs text-slate-500 font-medium ml-1">CÓDIGO COPIA E COLA</p>
                <div className="flex w-full items-center">
                  <div className="flex-1 min-w-0 bg-slate-950/60 border border-slate-800 rounded-l-lg p-3 text-xs text-slate-300 font-mono break-all line-clamp-3 overflow-hidden">
                    {pixCode}
                  </div>
                  <Button
                    variant="default"
                    className="rounded-l-none bg-violet-600 hover:bg-violet-700 text-white h-[42px] px-4 shrink-0"
                    onClick={handleCopy}
                  >
                    <Copy className="h-4 w-4 mr-1.5" /> Copiar
                  </Button>
                </div>
              </div>
            )}
            <div className="flex flex-col items-center gap-3 w-full">
              <div className="flex items-center gap-2 text-[13px] text-amber-400 bg-amber-400/10 px-4 py-2.5 rounded-full font-medium border border-amber-400/20">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                Aguardando confirmação bancária...
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-slate-100 text-xs"
                onClick={handleManualCheck}
                disabled={checkingManually}
              >
                {checkingManually
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                Já paguei — verificar agora
              </Button>
            </div>
          </div>
        )}

        {/* ── Processing (card) ─────────────────────────────────────────────── */}
        {status === 'waiting_pix' && tab === 'credit_card' && (
          <div className="flex flex-col items-center gap-5 py-8 animate-in fade-in duration-300">
            <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
            <div className="text-center">
              <p className="font-semibold text-slate-100">Processando pagamento...</p>
              <p className="text-sm text-slate-400 mt-1">Aguarde enquanto confirmamos com o banco.</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-slate-100 text-xs"
              onClick={handleManualCheck}
              disabled={checkingManually}
            >
              {checkingManually
                ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
              Verificar status
            </Button>
          </div>
        )}

        {/* ── Idle / Form ───────────────────────────────────────────────────── */}
        {(status === 'idle' || status === 'processing') && (
          <div className="space-y-5">
            {/* Customer Form */}
            <div className="space-y-3 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
              <h3 className="text-sm font-semibold text-slate-300">Dados do Pagador</h3>
              
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Nome Completo</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="bg-slate-900 border-slate-700 text-slate-100" />
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Email</Label>
                <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="bg-slate-900 border-slate-700 text-slate-100" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs">CPF ou CNPJ</Label>
                  <Input value={customerDocument} onChange={(e) => setCustomerDocument(e.target.value)} placeholder="000.000.000-00" className="bg-slate-900 border-slate-700 text-slate-100 font-mono text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs">Telefone / WhatsApp</Label>
                  <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="(11) 99999-9999" className="bg-slate-900 border-slate-700 text-slate-100 font-mono text-sm" />
                </div>
              </div>
            </div>

            {/* Tab switcher */}
            <div className="flex rounded-xl overflow-hidden border border-slate-700 bg-slate-800/50">
              <button
                type="button"
                onClick={() => setTab('credit_card')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors',
                  tab === 'credit_card'
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <CreditCard className="h-4 w-4" /> Cartão de Crédito
              </button>
              <button
                type="button"
                onClick={() => setTab('pix')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors',
                  tab === 'pix'
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <QrCode className="h-4 w-4" /> PIX
              </button>
            </div>

            {/* Credit Card Form */}
            {tab === 'credit_card' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs">Número do Cartão</Label>
                  <Input
                    id="card-number"
                    placeholder="4111 1111 1111 1111"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-600 font-mono"
                    maxLength={19}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs">Nome no Cartão</Label>
                  <Input
                    id="holder-name"
                    placeholder="NOME SOBRENOME"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value.toUpperCase())}
                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-600 uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs">Validade</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/AA"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-600 font-mono"
                      maxLength={5}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-600 font-mono"
                      maxLength={4}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs">Parcelas</Label>
                  <select
                    id="installments"
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                    className="w-full rounded-md border border-slate-700 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {[1, 2, 3, 6, 12].map((n) => (
                      <option key={n} value={n}>
                        {n}× {n === 1 ? '(sem juros)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  id="klivopay-submit-card"
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                  onClick={handleSubmit}
                  disabled={status === 'processing' || !isCustomerValid || !isCardValid}
                >
                  {status === 'processing'
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processando...</>
                    : <><CreditCard className="h-4 w-4 mr-2" /> Pagar com Cartão</>}
                </Button>
              </div>
            )}

            {/* PIX Tab */}
            {tab === 'pix' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 text-center space-y-2">
                  <QrCode className="h-10 w-10 text-violet-400 mx-auto" />
                  <p className="text-sm text-slate-300">
                    Clique em <strong>Gerar PIX</strong> para receber o QR Code e o código Copia e Cola.
                  </p>
                  <p className="text-xs text-slate-500">O código expira em 24 horas.</p>
                </div>

                <Button
                  id="klivopay-submit-pix"
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                  onClick={handleSubmit}
                  disabled={status === 'processing' || !isCustomerValid}
                >
                  {status === 'processing'
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Gerando PIX...</>
                    : <><QrCode className="h-4 w-4 mr-2" /> Gerar PIX</>}
                </Button>
              </div>
            )}

            <p className="text-center text-xs text-slate-600">
              Pagamento processado com segurança via Klivopay
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
