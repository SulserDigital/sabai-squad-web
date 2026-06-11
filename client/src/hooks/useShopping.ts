import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useShopping(tripId: number | undefined) {
  const queryClient = useQueryClient();

  const listsQuery = useQuery({
    queryKey: ['shopping', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*, shopping_items(*)')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tripId,
  });

  const createList = useMutation({
    mutationFn: async (input: { tripId: number; name: string; createdBy: number }) => {
      const { data, error } = await supabase
        .from('shopping_lists')
        .insert({ trip_id: input.tripId, name: input.name, created_by: input.createdBy })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping', tripId] }),
  });

  const addItem = useMutation({
    mutationFn: async (input: { listId: number; name: string; quantity?: string; imageUrl?: string; addedBy: number }) => {
      const { data, error } = await supabase
        .from('shopping_items')
        .insert({
          list_id: input.listId,
          name: input.name,
          quantity: input.quantity ?? null,
          image_url: input.imageUrl ?? null,
          added_by: input.addedBy,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping', tripId] }),
  });

  const toggleItem = useMutation({
    mutationFn: async (input: { itemId: number; isChecked: boolean; checkedBy?: number }) => {
      const { error } = await supabase
        .from('shopping_items')
        .update({
          is_checked: input.isChecked,
          checked_by: input.isChecked ? input.checkedBy ?? null : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.itemId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping', tripId] }),
  });

  const deleteItem = useMutation({
    mutationFn: async (itemId: number) => {
      const { error } = await supabase.from('shopping_items').delete().eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping', tripId] }),
  });

  const deleteList = useMutation({
    mutationFn: async (listId: number) => {
      const { error } = await supabase.from('shopping_lists').delete().eq('id', listId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping', tripId] }),
  });

  return {
    lists: listsQuery.data ?? [],
    isLoading: listsQuery.isLoading,
    createList,
    addItem,
    toggleItem,
    deleteItem,
    deleteList,
    refetch: listsQuery.refetch,
  };
}
