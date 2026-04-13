import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useScannerLogger } from '@/hooks/useScannerLogger';
import AppLayout from '@/components/AppLayout';
import ProductLimitDialog from '@/components/ProductLimitDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Camera, Plus, Minus, X, Keyboard, ArrowLeft, ImagePlus, CameraIcon,
  CheckCircle2, AlertCircle, Search, Edit2, Clock, Loader2,
} from 'lucide-react';
import { CurrencyInput } from '@/components/ui/currency-input';
import { toast } from 'sonner';
import { addMonths, addYears, format } from 'date-fns';
import { normalizeBarcode, validateBarcode, isValidBarcode, formatBarcodeDisplay } from '@/lib/barcode';
import { validateImage, compressImage, getImagePreviewUrl } from '@/lib/image';

// ─── Tipos ─────────────────────────────────────────────────────────────────────
type Mode = null | 'add' | 'remove';
type InputMethod = null | 'scan' | 'manual' | 'byname';

// ─── Constantes ────────────────────────────────────────────────────────────────
const SCANNER_TIMEOUT_SECONDS = 60;
const SCANNER_WARN_SECONDS = 10;
const SCAN_DEBOUNCE_MS = 1500;

// ─────────────────────────────────────────────────────────────────────────────
export default function ScannerPage() {
  const { user } = useAuth();
  const { productLimit, isUnlimited } = useSubscription();
  const queryClient = useQueryClient();
  const { logInfo, logError } = useScannerLogger();

  const [mode, setMode] = useState<Mode>(null);
  const [inputMethod, setInputMethod] = useState<InputMethod>(null);
  const [rawBarcode, setRawBarcode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [phase, setPhase] = useState<null | 'confirm' | 'form'>(null);
  const [scanning, setScanning] = useState(false);
  const [scanTimeoutLeft, setScanTimeoutLeft] = useState(SCANNER_TIMEOUT_SECONDS);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastScannedRef = useRef<string>('');       // debounce: último código lido
  const lastScannedAtRef = useRef<number>(0);      // debounce: timestamp

  const [nameSearch, setNameSearch] = useState('');
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [dataValidade, setDataValidade] = useState('');
  const [lote, setLote] = useState('');
  const [priceMode, setPriceMode] = useState<'unit' | 'lote'>('unit');
  const [precoUnitario, setPrecoUnitario] = useState(0);
  const [valorTotal, setValorTotal] = useState(0);
  const [categoria, setCategoria] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  
  // ── Auto-preenchimento Protegido ──────────────────────────────────────────
  const [userEdited, setUserEdited] = useState(false);
  const lastAutoFilledRef = useRef<string>('');
  const handleUserEdit = useCallback(() => {
    if (!userEdited) setUserEdited(true);
  }, [userEdited]);

  const handlePriceModeChange = useCallback((mode: 'unit' | 'lote') => {
    setPriceMode(mode);
    handleUserEdit();
    if (mode === 'unit') {
      setValorTotal(0);
    } else {
      setPrecoUnitario(0);
    }
  }, [handleUserEdit]);

  // ── Proteção contra memory leak de preview ─────────────────────────────────
  useEffect(() => {
    return () => {
      // Cleanup no unmount
      if (fotoPreview && fotoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(fotoPreview);
      }
    };
  }, [fotoPreview]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [removeQty, setRemoveQty] = useState('1');
  const [manualCode, setManualCode] = useState('');

  // ── Cleanup: para o scanner ao desmontar o componente ─────────────────────
  useEffect(() => {
    return () => {
      clearScannerTimers();
      scannerRef.current?.stop().catch(() => {});
      logInfo('Scanner desmontado — câmera encerrada.');
    };
  }, []);

  // ── Queries ────────────────────────────────────────────────────────────────

  const {
    data: existingProduct,
    isFetching: isFetchingCatalog,
  } = useQuery({
    queryKey: ['product-by-barcode', barcode, user?.id],
    queryFn: async () => {
      if (!barcode || !user) return null;
      logInfo('Buscando no catálogo', { barcode, userId: user.id });
      const { data: catalogItem, error: err1 } = await supabase
        .from('produtos_catalogo' as any)
        .select('nome_produto')
        .eq('user_id', user.id)
        .eq('codigo_barras', barcode)
        .maybeSingle();
      if (err1) logError('Falha ao consultar produtos_catalogo', { error: err1, barcode, userId: user.id });
      if (catalogItem) return catalogItem as unknown as { nome_produto: string };

      const { data, error: err2 } = await supabase
        .from('estoque')
        .select('nome_produto, preco_unitario, categoria, foto_url')
        .eq('user_id', user.id)
        .eq('codigo_barras', barcode)
        .limit(1)
        .maybeSingle();
      if (err2) logError('Falha ao consultar estoque (lookup nome)', { error: err2, barcode, userId: user.id });
      return data;
    },
    enabled: !!barcode && isValidBarcode(barcode) && !!user,
  });

  const {
    data: stockItem,
    isFetching: stockFetching,
  } = useQuery({
    queryKey: ['stock-item-barcode', barcode, user?.id],
    queryFn: async () => {
      if (!barcode || !user) return null;
      logInfo('Buscando no estoque para remoção', { barcode, userId: user.id });
      const { data, error } = await supabase
        .from('estoque')
        .select('*')
        .eq('user_id', user.id)
        .eq('codigo_barras', barcode)
        .limit(1)
        .maybeSingle();
      if (error) logError('Falha ao consultar estoque (remoção)', { error, barcode, userId: user.id });
      return data;
    },
    enabled: !!barcode && isValidBarcode(barcode) && !!user && mode === 'remove',
  });

  const { data: nameResults, isFetching: isFetchingByName } = useQuery({
    queryKey: ['stock-by-name', nameSearch, user?.id],
    queryFn: async () => {
      if (!nameSearch.trim() || !user) return [];
      const { data, error } = await supabase
        .from('estoque')
        .select('id, nome_produto, codigo_barras, quantidade')
        .eq('user_id', user.id)
        .ilike('nome_produto', `%${nameSearch.trim()}%`)
        .limit(8);
      if (error) logError('Falha na busca por nome', { error, userId: user.id });
      return data || [];
    },
    enabled: !!nameSearch && nameSearch.length >= 2 && !!user && inputMethod === 'byname',
  });

  useEffect(() => {
    if (!existingProduct || mode !== 'add' || userEdited) return;
    if (barcode && barcode === lastAutoFilledRef.current) return;

    setNome(existingProduct.nome_produto || '');
    if ('preco_unitario' in existingProduct) {
      if (existingProduct.preco_unitario !== null) setPrecoUnitario(existingProduct.preco_unitario);
      if (existingProduct.categoria) setCategoria(existingProduct.categoria);
      if (existingProduct.foto_url) setFotoPreview(existingProduct.foto_url);
    }
    
    if (barcode) lastAutoFilledRef.current = barcode;
    toast.success('Produto reconhecido. Dados preenchidos.');
  }, [existingProduct, mode, userEdited, barcode]);

  // ── Áudio / Vibração ───────────────────────────────────────────────────────
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playBeep = useCallback((success: boolean) => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = success ? 880 : 300;
      osc.type = success ? 'sine' : 'square';
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + (success ? 0.12 : 0.3));
    } catch { /* ignora ambientes sem AudioContext */ }
  }, []);

  const vibrateDevice = useCallback(() => {
    try { navigator.vibrate?.(80); } catch { /* ignora */ }
  }, []);

  // ── Timers do scanner ──────────────────────────────────────────────────────
  const clearScannerTimers = () => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  };

  const startScannerTimers = useCallback(() => {
    clearScannerTimers();
    setScanTimeoutLeft(SCANNER_TIMEOUT_SECONDS);

    // countdown visual
    countdownRef.current = setInterval(() => {
      setScanTimeoutLeft((prev) => {
        if (prev <= 1) { clearScannerTimers(); return 0; }
        return prev - 1;
      });
    }, 1000);

    // timeout final: para câmera
    timeoutRef.current = setTimeout(() => {
      logInfo('Scanner expirou por timeout automático (60s)', { userId: user?.id });
      stopScanner();
      toast.warning('Scanner encerrado por inatividade (60s). Tente novamente.', { duration: 5000 });
    }, SCANNER_TIMEOUT_SECONDS * 1000);
  }, [user]);

  // ── Scanner ────────────────────────────────────────────────────────────────
  const startScanner = async () => {
    setScanning(true);
    logInfo('Iniciando scanner', { userId: user?.id });
    try {
      const scanner = new Html5Qrcode('scanner-region');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 15, qrbox: { width: 180, height: 80 } },
        (decodedText) => {
          // ── Debounce: ignora releituras do mesmo código em <1.5s ──
          const now = Date.now();
          const normalized = normalizeBarcode(decodedText);
          if (
            normalized === lastScannedRef.current &&
            now - lastScannedAtRef.current < SCAN_DEBOUNCE_MS
          ) {
            return; // dupla leitura ignorada silenciosamente
          }
          lastScannedRef.current = normalized;
          lastScannedAtRef.current = now;

          logInfo('Barcode lido (raw)', { barcode: decodedText, userId: user?.id });
          logInfo('Barcode normalizado', { barcode: normalized, userId: user?.id });

          // ── Validação ──
          const validationError = validateBarcode(normalized);
          if (validationError) {
            logError('Barcode inválido descartado', { barcode: normalized, error: validationError, userId: user?.id });
            toast.warning(`Código ignorado: ${validationError}`, { duration: 3000 });
            return; // continua escaneando
          }

          vibrateDevice();
          playBeep(true);
          clearScannerTimers();
          scanner.stop().catch(() => {});
          setScanning(false);
          setRawBarcode(decodedText);
          setBarcode(normalized);
          setPhase('confirm');
        },
        () => { /* falhas de decode são normais — ignorar */ }
      );
      startScannerTimers();
    } catch (err) {
      logError('Falha ao iniciar câmera', { error: err, userId: user?.id });
      toast.error('Não foi possível acessar a câmera. Use a opção manual.');
      setScanning(false);
    }
  };

  const stopScanner = useCallback(() => {
    clearScannerTimers();
    scannerRef.current?.stop().catch(() => {});
    setScanning(false);
    setScanTimeoutLeft(SCANNER_TIMEOUT_SECONDS);
  }, []);

  // ── Confirmação de barcode ─────────────────────────────────────────────────
  const confirmBarcode = (editedBarcode?: string) => {
    const final = normalizeBarcode(editedBarcode ?? barcode);
    logInfo('Barcode confirmado pelo usuário', { barcode: final, userId: user?.id });

    const validationError = validateBarcode(final);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setBarcode(final);
    setPhase('form');
  };

  // ── Manual ─────────────────────────────────────────────────────────────────
  const handleManualSubmit = () => {
    const normalized = normalizeBarcode(manualCode);
    logInfo('Código manual inserido', { barcode: normalized, userId: user?.id });

    const validationError = validateBarcode(normalized);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setRawBarcode(manualCode);
    setBarcode(normalized);
    setPhase('form');
  };

  // ── Busca por nome ─────────────────────────────────────────────────────────
  const selectByName = (item: { nome_produto: string; codigo_barras: string | null; id: string; quantidade: number }) => {
    const code = normalizeBarcode(item.codigo_barras ?? '');
    logInfo('Produto selecionado por nome', { barcode: code || item.id, userId: user?.id });
    setBarcode(code || item.id);
    setNome(item.nome_produto);
    setPhase('form');
  };

  // ── Fotos ──────────────────────────────────────────────────────────────────
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleUserEdit();
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImage(file);
    if (!validation.valid) {
      toast.error(validation.message);
      e.target.value = '';
      return;
    }

    setFotoFile(file);
    if (fotoPreview && fotoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(fotoPreview);
    }
    setFotoPreview(getImagePreviewUrl(file));
  };

  // ── Mutation — Adicionar produto ───────────────────────────────────────────
  const addProduct = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Não autenticado');
      if (!isUnlimited && productLimit !== null) {
        const { count } = await supabase
          .from('estoque')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        if (count !== null && count >= productLimit) {
          setLimitDialogOpen(true);
          throw new Error('LIMIT_REACHED');
        }
      }
      const today = new Date().toISOString().split('T')[0];
      if (dataValidade < today) throw new Error('A validade do produto deve ser uma data futura.');

      const barcodeToSave = barcode || null;

      // Incrementa se já existe com mesmo código + validade
      if (barcodeToSave) {
        const { data: existing, error: findErr } = await supabase
          .from('estoque')
          .select('id, quantidade')
          .eq('user_id', user.id)
          .eq('codigo_barras', barcodeToSave)
          .eq('data_validade', dataValidade)
          .maybeSingle();
        if (findErr) logError('Falha ao verificar duplicidade', { error: findErr, barcode: barcodeToSave, userId: user.id });

        if (existing) {
          logInfo('Produto existente — incrementando quantidade', { barcode: barcodeToSave, userId: user.id });
          const newQty = existing.quantidade + (parseInt(quantidade) || 1);
          const { error } = await supabase.from('estoque').update({ quantidade: newQty }).eq('id', existing.id);
          if (error) {
            logError('Falha ao atualizar quantidade', { error, barcode: barcodeToSave, userId: user.id });
            throw error;
          }
          await supabase.from('produtos_catalogo' as any).upsert(
            { user_id: user.id, codigo_barras: barcodeToSave, nome_produto: nome },
            { onConflict: 'user_id,codigo_barras' }
          ).then(() => {});
          return;
        }
      }

      // ── Cálculo do Preço Unitário Seguro ──
      let precoFinal = 0;
      const qtd = parseInt(quantidade) || 1;
      
      if (priceMode === 'unit') {
        precoFinal = precoUnitario;
      } else {
        if (!qtd || qtd <= 0) {
          toast.error('Quantidade deve ser maior que zero');
          throw new Error('Quantidade inválida para preço por lote');
        }
        if (qtd > 10000) {
          toast.error('Quantidade muito alta');
          throw new Error('Quantidade muito alta');
        }
        const precoCalculado = valorTotal / qtd;
        precoFinal = Number(precoCalculado.toFixed(2));
      }

      if (isNaN(precoFinal)) {
        toast.error('Valores inválidos');
        throw new Error('Cálculo resultou em NaN');
      }

      if (priceMode === 'lote' && precoFinal <= 0) {
        toast.error('Preço inválido');
        throw new Error('Preço calculado <= 0');
      }

      if (precoFinal > 0) {
        if (precoFinal < 0.01) {
          toast.error('Valor por unidade muito baixo');
          throw new Error('Valor por unidade muito baixo');
        }
        if (precoFinal > 100000) {
          toast.error('Valor por unidade muito alto');
          throw new Error('Valor por unidade muito alto');
        }
      }

      logInfo('price_calculated', { mode: priceMode, valorTotal, quantidade: qtd, precoFinal, userId: user.id });

      // Upload foto com compressão prévia
      let fotoUrl: string | null = null;
      if (fotoFile && user) {
        try {
          const compressed = await compressImage(fotoFile);
          const fileName = `${Date.now()}_${crypto.randomUUID().substring(0, 8)}.jpg`;
          const filePath = `${user.id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('product-photos')
            .upload(filePath, compressed, {
              contentType: 'image/jpeg',
              upsert: true,
            });
            
          if (uploadError) {
            logError('Falha no upload da foto', { error: uploadError, userId: user.id });
            toast.error('Erro ao enviar foto, tente novamente');
          } else {
            const { data: urlData } = supabase.storage.from('product-photos').getPublicUrl(filePath);
            fotoUrl = urlData.publicUrl;
          }
        } catch (err) {
          logError('Falha ao comprimir foto', { error: err, userId: user.id });
          toast.error('Erro ao processar imagem');
        }
      }

      const { error } = await supabase.from('estoque').insert({
        user_id: user.id,
        nome_produto: nome,
        codigo_barras: barcodeToSave,
        quantidade: parseInt(quantidade) || 1,
        data_validade: dataValidade,
        lote: lote || null,
        foto_url: fotoUrl,
        preco_unitario: precoFinal > 0 ? precoFinal : null,
        categoria: categoria || null,
      });
      if (error) {
        logError('Falha ao inserir produto no estoque', { error, barcode: barcodeToSave, userId: user.id });
        throw error;
      }

      if (barcodeToSave) {
        await supabase.from('produtos_catalogo' as any).upsert(
          { user_id: user.id, codigo_barras: barcodeToSave, nome_produto: nome },
          { onConflict: 'user_id,codigo_barras' }
        ).then(() => {});
      }
      logInfo('Produto adicionado com sucesso', { barcode: barcodeToSave ?? undefined, userId: user.id });
    },
    onSuccess: () => {
      playBeep(true);
      toast.success('Estoque atualizado com sucesso.');
      if (user) {
        supabase.from('inventory_movements').insert({
          user_id: user.id,
          produto_nome: nome,
          codigo_barras: barcode || null,
          tipo: 'entrada',
          quantidade: parseInt(quantidade) || 1,
          origem: inputMethod === 'scan' ? 'scanner' : 'manual',
        }).then(() => {});
      }
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
      queryClient.invalidateQueries({ queryKey: ['inventory_movements'] });
      resetForm();
    },
    onError: (e) => {
      if (e.message !== 'LIMIT_REACHED') {
        playBeep(false);
        logError('Erro ao adicionar produto (mutation)', { error: e, barcode, userId: user?.id });
        toast.error(e.message);
      }
    },
  });

  // ── Mutation — Remover produto ─────────────────────────────────────────────
  const removeProduct = useMutation({
    mutationFn: async () => {
      if (!user || !stockItem) throw new Error('Produto não encontrado no estoque');
      const qtyToRemove = parseInt(removeQty) || 1;
      if (qtyToRemove > stockItem.quantidade) {
        throw new Error(`Quantidade maior que o estoque disponível (${stockItem.quantidade} unid.).`);
      }
      const newQty = stockItem.quantidade - qtyToRemove;
      if (newQty <= 0) {
        const { error } = await supabase.from('estoque').delete().eq('id', stockItem.id);
        if (error) {
          logError('Falha ao deletar produto', { error, barcode, userId: user.id });
          throw error;
        }
      } else {
        const { error } = await supabase.from('estoque').update({ quantidade: newQty }).eq('id', stockItem.id);
        if (error) {
          logError('Falha ao atualizar quantidade (remoção)', { error, barcode, userId: user.id });
          throw error;
        }
      }
      logInfo('Produto removido com sucesso', { barcode, userId: user.id });
    },
    onSuccess: () => {
      playBeep(true);
      toast.success('Estoque atualizado com sucesso.');
      if (user && stockItem) {
        supabase.from('inventory_movements').insert({
          user_id: user.id,
          produto_nome: stockItem.nome_produto,
          codigo_barras: stockItem.codigo_barras || null,
          tipo: 'saida',
          quantidade: parseInt(removeQty) || 1,
          origem: inputMethod === 'scan' ? 'scanner' : 'manual',
        }).then(() => {});
      }
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
      queryClient.invalidateQueries({ queryKey: ['inventory_movements'] });
      resetForm();
    },
    onError: (e) => {
      playBeep(false);
      logError('Erro ao remover produto (mutation)', { error: e, barcode, userId: user?.id });
      toast.error(e.message);
    },
  });

  // ── Reset ──────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setBarcode(''); setRawBarcode(''); setManualCode('');
    setNome(''); setQuantidade('1'); setDataValidade('');
    setLote(''); setPrecoUnitario(0); setValorTotal(0); setPriceMode('unit'); setCategoria('');
    setRemoveQty('1'); 
    setFotoFile(null); 
    if (fotoPreview && fotoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(fotoPreview);
    }
    setFotoPreview(null);
    setPhase(null); setNameSearch('');
    setUserEdited(false); lastAutoFilledRef.current = '';
  };

  const goBack = () => {
    stopScanner();
    if (phase === 'form') { setPhase('confirm'); }
    else if (phase === 'confirm') { setPhase(null); setBarcode(''); setRawBarcode(''); }
    else if (inputMethod) { setInputMethod(null); resetForm(); }
    else { setMode(null); }
  };

  const setDateShortcut = (months: number) => {
    const d = months >= 12 ? addYears(new Date(), months / 12) : addMonths(new Date(), months);
    setDataValidade(format(d, 'yyyy-MM-dd'));
  };

  const isAdd = mode === 'add';

  // ── TELA 1 — Seleção de modo ───────────────────────────────────────────────
  if (!mode) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-foreground">Movimentar Estoque</h2>
          <div className="space-y-3">
            <button onClick={() => setMode('add')}
              className="flex w-full items-center gap-4 rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 transition-all hover:border-primary hover:shadow-md active:scale-[0.98]">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Plus className="h-7 w-7 text-primary" />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-primary">Adicionar Produto</span>
                <p className="text-xs text-muted-foreground mt-0.5">Registrar entrada no estoque</p>
              </div>
            </button>
            <button onClick={() => setMode('remove')}
              className="flex w-full items-center gap-4 rounded-2xl border-2 border-destructive/30 bg-destructive/5 p-5 transition-all hover:border-destructive hover:shadow-md active:scale-[0.98]">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <Minus className="h-7 w-7 text-destructive" />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-destructive">Remover Produto</span>
                <p className="text-xs text-muted-foreground mt-0.5">Registrar saída do estoque</p>
              </div>
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── TELA 2 — Seleção de método ─────────────────────────────────────────────
  if (!inputMethod && phase === null) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={goBack} className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
            <h2 className="text-lg font-bold text-foreground">{isAdd ? 'Adicionar Produto' : 'Remover Produto'}</h2>
          </div>
          <p className="text-sm text-muted-foreground">Como deseja identificar o produto?</p>
          <div className="space-y-3">
            {[
              {
                icon: <Camera className={`h-6 w-6 ${isAdd ? 'text-primary' : 'text-destructive'}`} />,
                label: 'Escanear Código',
                sub: 'Câmera com confirmação e timeout de 60s',
                action: () => { setInputMethod('scan'); setTimeout(startScanner, 100); },
              },
              {
                icon: <Keyboard className={`h-6 w-6 ${isAdd ? 'text-primary' : 'text-destructive'}`} />,
                label: 'Digitar Código',
                sub: 'Inserir código de barras manualmente',
                action: () => setInputMethod('manual'),
              },
              {
                icon: <Search className={`h-6 w-6 ${isAdd ? 'text-primary' : 'text-destructive'}`} />,
                label: 'Buscar por Nome',
                sub: 'Encontrar produto pelo nome no estoque',
                action: () => setInputMethod('byname'),
              },
            ].map(({ icon, label, sub, action }) => (
              <button key={label} onClick={action}
                className={`flex w-full items-center gap-4 rounded-2xl border-2 p-5 transition-all hover:shadow-md active:scale-[0.98] ${
                  isAdd ? 'border-primary/20 bg-primary/5 hover:border-primary' : 'border-destructive/20 bg-destructive/5 hover:border-destructive'
                }`}>
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${isAdd ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                  {icon}
                </div>
                <div className="text-left">
                  <p className={`text-sm font-bold ${isAdd ? 'text-primary' : 'text-destructive'}`}>{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── TELA 3–7 — Scanner / Manual / Nome / Confirmar / Formulário ───────────
  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={goBack} className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
          <h2 className="text-lg font-bold text-foreground">{isAdd ? 'Adicionar Produto' : 'Remover Produto'}</h2>
        </div>

        {/* ── Scanner ativo ──────────────────────────────────────────────── */}
        {inputMethod === 'scan' && phase === null && (
          <>
            <p className="text-xs text-center text-muted-foreground">
              Enquadre o código na área. Incline levemente o celular para evitar reflexo.
            </p>
            <div id="scanner-region" className="overflow-hidden rounded-xl" />

            {/* Countdown + aviso de timeout */}
            {scanning && (
              <>
                <div className={`flex items-center justify-center gap-1.5 text-xs font-medium ${
                  scanTimeoutLeft <= SCANNER_WARN_SECONDS ? 'text-amber-500 animate-pulse' : 'text-muted-foreground'
                }`}>
                  <Clock className="h-3.5 w-3.5" />
                  {scanTimeoutLeft <= SCANNER_WARN_SECONDS
                    ? `Scanner encerrando em ${scanTimeoutLeft}s…`
                    : `Scanner ativo · ${scanTimeoutLeft}s restantes`}
                </div>
                <Button onClick={stopScanner} variant="outline" className="w-full gap-2">
                  <X className="h-4 w-4" /> Parar Scanner
                </Button>
              </>
            )}
          </>
        )}

        {/* ── Manual ────────────────────────────────────────────────────── */}
        {inputMethod === 'manual' && phase === null && (
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Código de Barras</Label>
              <Input value={manualCode} onChange={(e) => setManualCode(e.target.value)}
                placeholder="Digite apenas os números (mín. 8 dígitos)"
                inputMode="numeric" autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()} />
              <p className="text-[11px] text-muted-foreground">Letras e espaços são ignorados automaticamente.</p>
            </div>
            <Button onClick={handleManualSubmit} className="w-full" disabled={!manualCode.trim()}>
              Buscar Produto
            </Button>
          </div>
        )}

        {/* ── Busca por nome ─────────────────────────────────────────────── */}
        {inputMethod === 'byname' && phase === null && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={nameSearch} onChange={(e) => setNameSearch(e.target.value)}
                placeholder="Digite o nome do produto..." className="pl-9" autoFocus />
            </div>
            {isFetchingByName && (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Buscando produtos...
              </div>
            )}
            {!isFetchingByName && nameSearch.length >= 2 && (
              <div className="space-y-2">
                {nameResults?.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">Nenhum produto encontrado</p>
                )}
                {nameResults?.map((item) => (
                  <button key={item.id} onClick={() => selectByName(item)}
                    className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary transition-colors text-left">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{item.nome_produto}</p>
                      <p className="text-xs text-muted-foreground">
                        Cód: {item.codigo_barras ? formatBarcodeDisplay(item.codigo_barras) : '—'} · {item.quantidade} unid.
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Confirmação de barcode ─────────────────────────────────────── */}
        {phase === 'confirm' && (
          <ConfirmBarcodePhase
            rawBarcode={rawBarcode}
            normalizedBarcode={barcode}
            onConfirm={confirmBarcode}
            isAdd={isAdd}
          />
        )}

        {/* ── Formulário ADD ────────────────────────────────────────────── */}
        {phase === 'form' && isAdd && (
          <div className="space-y-3 rounded-xl border border-primary/30 bg-card p-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground text-sm flex-1">Novo Produto</h3>
              {isFetchingCatalog ? (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Verificando catálogo…
                </span>
              ) : existingProduct ? (
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Produto encontrado
                </span>
              ) : barcode && isValidBarcode(barcode) ? (
                <span className="flex items-center gap-1 text-[11px] font-medium text-amber-500">
                  <AlertCircle className="h-3.5 w-3.5" /> Novo no catálogo
                </span>
              ) : null}
            </div>

            {barcode && (
              <div className="rounded-lg bg-muted px-3 py-2 flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">
                  Código: <span className="text-foreground font-semibold">{formatBarcodeDisplay(barcode)}</span>
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Código de Barras</Label>
              <Input value={barcode} onChange={(e) => setBarcode(normalizeBarcode(e.target.value))}
                placeholder="Digite ou escaneie" inputMode="numeric" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Nome do Produto</Label>
              <Input value={nome} onChange={(e) => { handleUserEdit(); setNome(e.target.value); }} placeholder="Ex: Ração Premium 15kg" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Quantidade</Label>
                <Input type="number" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} inputMode="numeric" min={1} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Lote (opcional)</Label>
                <Input value={lote} onChange={(e) => setLote(e.target.value)} placeholder="Opcional" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-full">
                <button
                  type="button"
                  onClick={() => handlePriceModeChange('unit')}
                  className={`flex-1 py-1.5 text-[11px] sm:text-xs font-semibold rounded-md transition-all ${priceMode === 'unit' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                >
                  Preço por Unidade
                </button>
                <button
                  type="button"
                  onClick={() => handlePriceModeChange('lote')}
                  className={`flex-1 py-1.5 text-[11px] sm:text-xs font-semibold rounded-md transition-all ${priceMode === 'lote' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                >
                  Valor Total do Lote
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{priceMode === 'unit' ? 'Preço da Unidade (R$)' : 'Valor Total pago (R$)'}</Label>
                  {priceMode === 'unit' ? (
                    <CurrencyInput value={precoUnitario} onChange={(val) => { handleUserEdit(); setPrecoUnitario(val); }} />
                  ) : (
                    <CurrencyInput value={valorTotal} onChange={(val) => { handleUserEdit(); setValorTotal(val); }} />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Categoria</Label>
                  <select value={categoria} onChange={(e) => { handleUserEdit(); setCategoria(e.target.value); }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">Selecione</option>
                    <option value="Vacinas">Vacinas</option>
                    <option value="Rações">Rações</option>
                    <option value="Medicamentos">Medicamentos</option>
                    <option value="Brinquedos">Brinquedos</option>
                    <option value="Higiene">Higiene</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Data de Validade</Label>
              <Input type="date" value={dataValidade} onChange={(e) => setDataValidade(e.target.value)}
                min={new Date().toISOString().split('T')[0]} required />
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setDateShortcut(1)}>+1 mês</Button>
                <Button type="button" variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setDateShortcut(6)}>+6 meses</Button>
                <Button type="button" variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setDateShortcut(12)}>+1 ano</Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Foto do Produto (opcional)</Label>
              {fotoPreview && (
                <div className="relative w-20 h-20">
                  <img src={fotoPreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-border" />
                  <button onClick={() => { setFotoFile(null); setFotoPreview(null); }}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelect} />
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                <Button type="button" variant="outline" size="sm" className="flex-1 gap-1 text-xs" onClick={() => cameraInputRef.current?.click()}>
                  <CameraIcon className="h-3 w-3" /> Tirar Foto
                </Button>
                <Button type="button" variant="outline" size="sm" className="flex-1 gap-1 text-xs" onClick={() => fileInputRef.current?.click()}>
                  <ImagePlus className="h-3 w-3" /> Galeria
                </Button>
              </div>
            </div>

            {(() => {
              const qtd = parseInt(quantidade) || 1;
              if (priceMode === 'unit' && precoUnitario > 0 && qtd > 0) {
                return (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Valor total deste lote</p>
                    <p className="text-lg font-extrabold text-primary">
                      R$ {(precoUnitario * qtd).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                );
              }
              if (priceMode === 'lote' && valorTotal > 0 && qtd > 0) {
                const precoCalculado = valorTotal / qtd;
                return (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-center">
                    <p className="text-sm text-muted-foreground">
                      Cada unidade custará: <strong>R$ {precoCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </p>
                  </div>
                );
              }
              return null;
            })()}

            <Button onClick={() => addProduct.mutate()}
              disabled={!nome || !dataValidade || addProduct.isPending}
              className="w-full bg-primary hover:bg-primary/90">
              {addProduct.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando…</>
                : 'Salvar Produto'}
            </Button>
          </div>
        )}

        {/* ── Formulário REMOVE ─────────────────────────────────────────── */}
        {phase === 'form' && !isAdd && (
          <div className="space-y-3 rounded-xl border border-destructive/30 bg-card p-4">
            {stockFetching ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> Buscando produto no estoque…
              </div>
            ) : stockItem ? (
              <>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <h3 className="font-semibold text-foreground text-sm">Produto encontrado</h3>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-1">
                  <p className="text-sm font-bold text-foreground">{stockItem.nome_produto}</p>
                  <p className="text-xs text-muted-foreground">
                    Código: {stockItem.codigo_barras ? formatBarcodeDisplay(stockItem.codigo_barras) : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">Lote: {stockItem.lote || '—'}</p>
                  <p className="text-sm font-semibold text-foreground mt-2">
                    Estoque atual: <span className="text-primary">{stockItem.quantidade} unidades</span>
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Quantidade para remover</Label>
                  <Input type="number" value={removeQty} onChange={(e) => setRemoveQty(e.target.value)}
                    inputMode="numeric" min={1} max={stockItem.quantidade} />
                  <div className="flex gap-2">
                    {[1, 5, 10].map((n) => (
                      <Button key={n} type="button" variant="outline" size="sm"
                        className="flex-1 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={() => setRemoveQty(String(n))}>
                        -{n}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button onClick={() => removeProduct.mutate()}
                  disabled={removeProduct.isPending || !removeQty || parseInt(removeQty) < 1}
                  variant="destructive" className="w-full">
                  {removeProduct.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Removendo…</>
                    : 'Confirmar Remoção'}
                </Button>
              </>
            ) : (
              <div className="text-center py-8 space-y-3">
                <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
                <div>
                  <p className="text-sm font-semibold text-destructive">Produto não encontrado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nenhum produto com o código{' '}
                    <span className="font-mono font-medium text-foreground">{formatBarcodeDisplay(barcode)}</span>{' '}
                    foi localizado no estoque.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={goBack}>← Tentar outro código</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setInputMethod('byname'); setPhase(null); }}>
                    <Search className="h-3.5 w-3.5 mr-1.5" /> Buscar por nome
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ProductLimitDialog open={limitDialogOpen} onOpenChange={setLimitDialogOpen}
        type="limit_reached" productLimit={productLimit ?? 10} />
    </AppLayout>
  );
}

// ─── Sub-componente: ConfirmBarcodePhase ──────────────────────────────────────
interface ConfirmBarcodePhaseProps {
  rawBarcode: string;
  normalizedBarcode: string;
  onConfirm: (edited?: string) => void;
  isAdd: boolean;
}

function ConfirmBarcodePhase({ rawBarcode, normalizedBarcode, onConfirm, isAdd }: ConfirmBarcodePhaseProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(normalizedBarcode);

  return (
    <div className={`space-y-4 rounded-xl border-2 p-5 ${
      isAdd ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'
    }`}>
      <div className="flex items-center gap-2">
        <CheckCircle2 className={`h-5 w-5 shrink-0 ${isAdd ? 'text-primary' : 'text-destructive'}`} />
        <p className="text-sm font-semibold text-foreground">Código detectado — confirme antes de prosseguir</p>
      </div>

      <div className="rounded-lg bg-background border border-border p-3 space-y-1">
        {rawBarcode !== normalizedBarcode && (
          <p className="text-[11px] text-muted-foreground font-mono">
            Original: <span className="opacity-70">{rawBarcode}</span>
          </p>
        )}
        {!editing ? (
          <>
            <p className="text-2xl font-mono font-bold text-foreground tracking-wider">
              {formatBarcodeDisplay(normalizedBarcode)}
            </p>
            <p className="text-[11px] text-muted-foreground">{normalizedBarcode.length} dígitos · normalizado</p>
          </>
        ) : (
          <div className="space-y-1">
            <input type="tel" inputMode="numeric" value={editValue}
              onChange={(e) => setEditValue(normalizeBarcode(e.target.value))}
              className="w-full text-2xl font-mono font-bold bg-transparent border-b border-primary outline-none text-foreground tracking-wider"
              autoFocus />
            <p className="text-[11px] text-muted-foreground">Digite apenas números (mín. 8 dígitos)</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing((v) => !v)}>
          <Edit2 className="h-3.5 w-3.5" />{editing ? 'Cancelar' : 'Editar'}
        </Button>
        <Button size="sm" className="flex-1" onClick={() => onConfirm(editing ? editValue : undefined)}>
          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Confirmar e continuar
        </Button>
      </div>
    </div>
  );
}
