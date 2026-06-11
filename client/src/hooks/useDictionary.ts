import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useDictionary(tripId: number | undefined) {
  const queryClient = useQueryClient();

  const phrasesQuery = useQuery({
    queryKey: ['dictionary', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('custom_phrases')
        .select('*')
        .eq('trip_id', tripId)
        .order('category', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tripId,
  });

  const addPhrase = useMutation({
    mutationFn: async (input: {
      tripId: number;
      german: string;
      phonetic: string;
      thai?: string;
      category?: string;
      note?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('custom_phrases')
        .insert({
          trip_id: input.tripId,
          created_by_user_id: user.id,
          german: input.german,
          phonetic: input.phonetic,
          thai: input.thai ?? '',
          category: input.category ?? 'Eigene',
          note: input.note ?? '',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dictionary', tripId] }),
  });

  const deletePhrase = useMutation({
    mutationFn: async (phraseId: number) => {
      const { error } = await supabase.from('custom_phrases').delete().eq('id', phraseId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dictionary', tripId] }),
  });

  return {
    phrases: phrasesQuery.data ?? [],
    isLoading: phrasesQuery.isLoading,
    addPhrase,
    deletePhrase,
    refetch: phrasesQuery.refetch,
  };
}
