import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function usePacking(tripId: number | undefined) {
  const queryClient = useQueryClient();

  const itemsQuery = useQuery({
    queryKey: ['packing', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('packing_items')
        .select('*')
        .eq('trip_id', tripId)
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tripId,
  });

  const addItem = useMutation({
    mutationFn: async (input: { tripId: number; category: string; name: string; createdBy: number }) => {
      const { data, error } = await supabase
        .from('packing_items')
        .insert({
          trip_id: input.tripId,
          category: input.category,
          name: input.name,
          created_by: input.createdBy,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['packing', tripId] }),
  });

  const toggleItem = useMutation({
    mutationFn: async (input: { itemId: number; checked: boolean }) => {
      const { error } = await supabase
        .from('packing_items')
        .update({ checked: input.checked, updated_at: new Date().toISOString() })
        .eq('id', input.itemId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['packing', tripId] }),
  });

  const deleteItem = useMutation({
    mutationFn: async (itemId: number) => {
      const { error } = await supabase.from('packing_items').delete().eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['packing', tripId] }),
  });

  return {
    items: itemsQuery.data ?? [],
    isLoading: itemsQuery.isLoading,
    addItem,
    toggleItem,
    deleteItem,
    refetch: itemsQuery.refetch,
  };
}
