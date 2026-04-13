import { useState, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useActivityLog } from '@/hooks/useActivityLog';
import { useSubscription } from '@/hooks/useSubscription';
import { useEstoque, type ProdutoEstoque } from '@/hooks/useEstoque';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import ProductLimitDialog from '@/components/ProductLimitDialog';
import ProductCard from '@/components/estoque/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, X, Save, PawPrint, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { toast } from 'sonner';
import { getSemaforoColor } from '@/lib/semaforo';
import { isBefore, startOfDay } from 'date-fns';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CurrencyInput } from '@/components/ui/currency-input';

const estoqueSchema = z.object({
  nome_produto: z.string().trim().min(1, 'Nome obrigatório').max(200, 'Máximo 200 caracteres'),
  quantidade: z.coerce.number().int().min(1, 'Mínimo 1'),
  data_validade: z.string().min(1, 'Data obrigatória').refine((val) => {
    const today = new Date().toISOString().split('T')[0];
    return val >= today; // Exige validade para hoje ou futuro na criação/edição.
  }, { message: 'A validade do produto deve ser hoje ou no futuro.' }),
  lote: z.string().max(100).optional(),
  codigo_barras: z.string().max(50).optional(),
  preco_unitario: z.coerce.number().min(0, 'Preço inválido').optional(),
  categoria: z.string().max(50).optional(),
});

type EstoqueForm = z.infer<typeof estoqueSchema>;

const PAGE_SIZE = 20;

export default function EstoquePage() {
  const { user } = useAuth();
  const { logActivity } = useActivityLog();
  const { productLimit, isUnlimited } = useSubscription();
  const { estoque, isLoadingEstoque, lastMovementMap, deleteProduct, updateProduct, clearExpired } = useEstoque();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const filtro = searchParams.get('filtro') || 'todos';
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [limitDialogType, setLimitDialogType] = useState<'limit_reached' | 'locked_product'>('limit_reached');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nome_produto: string; data_validade: string; lote: string | null; preco_unitario?: number | null } | null>(null);
  const [clearExpiredOpen, setClearExpiredOpen] = useState(false);

  const editForm = useForm<EstoqueForm>({
    resolver: zodResolver(estoqueSchema),
    defaultValues: { nome_produto: '', quantidade: 1, data_validade: '', lote: '', codigo_barras: '', preco_unitario: 0, categoria: '' },
  });

  const [originalQtd, setOriginalQtd] = useState(0);

  const today = startOfDay(new Date());

  const suggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 1) return [];
    const term = searchTerm.toLowerCase();
    const unique = [...new Set(estoque.map(p => p.nome_produto))];
    return unique.filter(name => name.toLowerCase().includes(term)).slice(0, 6);
  }, [estoque, searchTerm]);

  const filtered = useMemo(() => {
    return estoque.filter((p) => {
      const color = getSemaforoColor(p.data_validade);
      const matchesFilter = filtro === 'todos' ? true : color === filtro;
      const matchesSearch = searchTerm
        ? p.nome_produto.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      const matchesCategoria = categoriaFiltro === 'Todos'
        ? true
        : (p.categoria || 'Outros') === categoriaFiltro;
      return matchesFilter && matchesSearch && matchesCategoria;
    });
  }, [estoque, filtro, searchTerm, categoriaFiltro]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const vencidosCount = estoque.filter(p => isBefore(new Date(p.data_validade), today)).length;
  
  const counts = useMemo(() => {
    const c = { red: 0, orange: 0, green: 0 };
    estoque.forEach((p) => { c[getSemaforoColor(p.data_validade)]++; });
    return c;
  }, [estoque]);

  const valorTotalEstoque = useMemo(() => {
    return estoque.reduce((sum, p) => sum + (p.quantidade * (p.preco_unitario ?? 0)), 0);
  }, [estoque]);

  const filters: { key: string; label: string; color: string }[] = [
    { key: 'red', label: 'Crítico', color: 'text-destructive' },
    { key: 'orange', label: 'Atenção', color: 'text-warning' },
    { key: 'green', label: 'Seguro', color: 'text-primary' },
  ];

  const startEdit = (p: ProdutoEstoque) => {
    setEditingId(p.id);
    setOriginalQtd(p.quantidade);
    editForm.reset({
      nome_produto: p.nome_produto,
      quantidade: p.quantidade,
      data_validade: p.data_validade,
      lote: p.lote || '',
      codigo_barras: p.codigo_barras || '',
      preco_unitario: p.preco_unitario ?? 0,
      categoria: p.categoria || '',
    });
  };

  const saveEdit = (data: EstoqueForm) => {
    if (!editingId) return;
    
    const delta = data.quantidade - originalQtd;

    updateProduct.mutateAsync({
      id: editingId,
      delta_quantidade: delta,
      nome_produto: data.nome_produto,
      quantidade: data.quantidade,
      data_validade: data.data_validade,
      lote: data.lote || null,
      codigo_barras: data.codigo_barras || null,
      preco_unitario: data.preco_unitario ?? null,
      categoria: data.categoria || null,
    }).then(() => {
      toast.success('Produto atualizado');
      setEditingId(null);
      logActivity.mutate({ tipo: 'estoque_update', descricao: `${data.nome_produto} atualizado` });
    });
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Estoque</h2>
          {vencidosCount > 0 && (
            <Button size="sm" variant="destructive" onClick={() => setClearExpiredOpen(true)} className="gap-1 text-xs">
              <Trash2 className="h-3 w-3" /> Limpar Vencidos ({vencidosCount})
            </Button>
          )}
        </div>

        {/* Valor total em estoque */}
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <span className="text-2xl">💰</span>
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground">Valor total em estoque</p>
            <p className="text-xl font-extrabold text-primary">
              R$ {valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <span className="text-xs text-muted-foreground">{estoque.length} produtos</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {filters.map((f) => {
            const isActive = filtro === f.key;
            const count = counts[f.key as keyof typeof counts] || 0;
            const borderMap = { red: 'border-destructive', orange: 'border-warning', green: 'border-primary' };
            const activeBorder = borderMap[f.key as keyof typeof borderMap];
            return (
              <button
                key={f.key}
                onClick={() => { setSearchParams(filtro === f.key ? {} : { filtro: f.key }); setPage(0); }}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 bg-card p-3 transition-all ${
                  isActive ? `${activeBorder} shadow-md scale-[1.03]` : 'border-border opacity-70 hover:opacity-90'
                }`}
              >
                <span className={`text-2xl font-extrabold ${f.color}`}>{count}</span>
                <PawPrint className={`${f.color} transition-all`} size={40} strokeWidth={2.5} />
                <span className={`text-sm font-semibold ${isActive ? f.color : 'text-muted-foreground'}`}>{f.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search bar */}
        <div className="relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); setPage(0); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="pl-9 pr-8"
            />
            {searchTerm && (
              <button onClick={() => { setSearchTerm(''); setShowSuggestions(false); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden">
              {suggestions.map((name) => (
                <button
                  key={name}
                  onMouseDown={() => { setSearchTerm(name); setShowSuggestions(false); setPage(0); }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-accent/50 transition-colors text-left"
                >
                  <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {['Todos', 'Vacinas', 'Rações', 'Medicamentos', 'Brinquedos', 'Higiene', 'Outros'].map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategoriaFiltro(cat); setPage(0); }}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                categoriaFiltro === cat
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {isLoadingEstoque && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-card border-2 border-muted animate-pulse"></div>
              ))}
            </div>
          )}
          
          {!isLoadingEstoque && paginatedItems.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhum produto encontrado</p>
          )}

          {!isLoadingEstoque && paginatedItems.map((p) => {
            const isEditing = editingId === p.id;
            const globalIndex = filtered.indexOf(p);
            const isLocked = !isUnlimited && productLimit !== null && globalIndex >= productLimit;

            if (isEditing && !isLocked) {
              return (
                <Form key={p.id} {...editForm}>
                  <form onSubmit={editForm.handleSubmit(saveEdit)} className="space-y-2 rounded-xl border border-primary/30 bg-card p-3">
                    <fieldset disabled={updateProduct.isPending} className="space-y-2 border-none p-0 m-0">
                      <FormField control={editForm.control} name="nome_produto" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <div className="grid grid-cols-3 gap-2">
                        <FormField control={editForm.control} name="quantidade" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Qtd</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={editForm.control} name="lote" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Lote</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={editForm.control} name="preco_unitario" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Preço (R$)</FormLabel><FormControl>
                            <CurrencyInput value={field.value ?? 0} onChange={(val) => field.onChange(val)} />
                          </FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <FormField control={editForm.control} name="categoria" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Categoria</FormLabel><FormControl>
                          <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <option value="">Selecione</option>
                            <option value="Vacinas">Vacinas</option>
                            <option value="Rações">Rações</option>
                            <option value="Medicamentos">Medicamentos</option>
                            <option value="Brinquedos">Brinquedos</option>
                            <option value="Higiene">Higiene</option>
                            <option value="Outros">Outros</option>
                          </select>
                        </FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={editForm.control} name="data_validade" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Validade</FormLabel><FormControl><Input type="date" min={today.toISOString().split('T')[0]} {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      {(editForm.watch('preco_unitario') ?? 0) > 0 && (editForm.watch('quantidade') ?? 0) > 0 && (
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-center">
                          <p className="text-xs text-muted-foreground">Valor total deste lote</p>
                          <p className="text-base font-extrabold text-primary">
                            R$ {((editForm.watch('preco_unitario') ?? 0) * (editForm.watch('quantidade') ?? 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                    </fieldset>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={updateProduct.isPending} className="flex-1 gap-1">
                        <Save className="h-3 w-3" /> Salvar
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(null)} disabled={updateProduct.isPending}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </form>
                </Form>
              );
            }

            return (
              <ProductCard
                key={p.id}
                product={p}
                isLocked={isLocked}
                lastMovementDate={lastMovementMap[p.nome_produto.toLowerCase()] || null}
                onEdit={() => startEdit(p)}
                onDelete={() => setDeleteTarget({ id: p.id, nome_produto: p.nome_produto, data_validade: p.data_validade, lote: p.lote, preco_unitario: p.preco_unitario })}
                onLockedClick={() => { setLimitDialogType('locked_product'); setLimitDialogOpen(true); }}
              />
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="gap-1">
              Próximo <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={() => {
          if (deleteTarget) {
            deleteProduct.mutate({
              id: deleteTarget.id,
              nome_produto: deleteTarget.nome_produto,
              data_validade: deleteTarget.data_validade,
              lote: deleteTarget.lote,
              preco_unitario: deleteTarget.preco_unitario
            });
            setDeleteTarget(null);
          }
        }}
        title="Excluir produto?"
        description={`Tem certeza que deseja excluir "${deleteTarget?.nome_produto}"? Esta ação não pode ser desfeita.`}
      />

      <ConfirmDeleteDialog
        open={clearExpiredOpen}
        onOpenChange={setClearExpiredOpen}
        onConfirm={() => {
          clearExpired.mutate(undefined, {
            onSuccess: (count) => {
              toast.success(`${count} produto(s) removido(s) e registrado(s) como perda.`);
            }
          });
          setClearExpiredOpen(false);
        }}
        title={`Remover ${vencidosCount} produtos vencidos?`}
        description="Todos os produtos vencidos serão removidos e registrados como perdas automaticamente."
      />

      <ProductLimitDialog
        open={limitDialogOpen}
        onOpenChange={setLimitDialogOpen}
        type={limitDialogType}
        productLimit={productLimit ?? 10}
      />
    </AppLayout>
  );
}
