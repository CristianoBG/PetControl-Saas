import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useActivityLog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: activities = [] } = useQuery({
    queryKey: ['atividades', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atividades')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const logActivity = useMutation({
    mutationFn: async ({ tipo, descricao }: { tipo: string; descricao: string }) => {
      if (!user) return;
      const { error } = await supabase.from('atividades').insert({
        user_id: user.id,
        tipo,
        descricao,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['atividades'] }),
  });

  return { activities, logActivity };
}
