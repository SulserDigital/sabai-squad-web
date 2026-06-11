import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useNews(tripId: number | undefined) {
  const queryClient = useQueryClient();

  const newsQuery = useQuery({
    queryKey: ['news', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('news_items')
        .select('*')
        .eq('trip_id', tripId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tripId,
  });

  const createNews = useMutation({
    mutationFn: async (input: { tripId: number; title: string; content: string; category?: string; isPinned?: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('news_items')
        .insert({
          trip_id: input.tripId,
          title: input.title,
          content: input.content,
          category: input.category ?? 'info',
          is_pinned: input.isPinned ?? false,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['news', tripId] }),
  });

  const deleteNews = useMutation({
    mutationFn: async (newsId: number) => {
      const { error } = await supabase.from('news_items').delete().eq('id', newsId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['news', tripId] }),
  });

  return {
    news: newsQuery.data ?? [],
    isLoading: newsQuery.isLoading,
    createNews,
    deleteNews,
    refetch: newsQuery.refetch,
  };
}
