import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useTips(tripId: number | undefined) {
  const queryClient = useQueryClient();

  const tipsQuery = useQuery({
    queryKey: ['tips', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('tips')
        .select('*')
        .eq('trip_id', tripId)
        .order('category', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tripId,
  });

  const createTip = useMutation({
    mutationFn: async (input: { tripId: number; category: string; title: string; description: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('tips')
        .insert({
          trip_id: input.tripId,
          category: input.category,
          title: input.title,
          description: input.description,
          created_by_user_id: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tips', tripId] }),
  });

  const updateTip = useMutation({
    mutationFn: async (input: { tipId: number; category?: string; title?: string; description?: string }) => {
      const { tipId, ...rest } = input;
      const updateData: any = { updated_at: new Date().toISOString() };
      if (rest.category !== undefined) updateData.category = rest.category;
      if (rest.title !== undefined) updateData.title = rest.title;
      if (rest.description !== undefined) updateData.description = rest.description;

      const { error } = await supabase.from('tips').update(updateData).eq('id', tipId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tips', tripId] }),
  });

  const deleteTip = useMutation({
    mutationFn: async (tipId: number) => {
      const { error } = await supabase.from('tips').delete().eq('id', tipId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tips', tripId] }),
  });

  return {
    tips: tipsQuery.data ?? [],
    isLoading: tipsQuery.isLoading,
    createTip,
    updateTip,
    deleteTip,
    refetch: tipsQuery.refetch,
  };
}
