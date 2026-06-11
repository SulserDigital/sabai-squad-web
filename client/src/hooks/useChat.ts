import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js';

export function useChat(tripId: number | undefined) {
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ['chat', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tripId,
  });

  // Realtime subscription for new messages
  useEffect(() => {
    if (!tripId) return;

    const channel = supabase
      .channel(`chat:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload: RealtimePostgresInsertPayload<any>) => {
          // Optimistically add the new message to cache
          queryClient.setQueryData(['chat', tripId], (old: any[] | undefined) => {
            if (!old) return [payload.new];
            // Avoid duplicates
            if (old.find(m => m.id === payload.new.id)) return old;
            return [...old, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async (input: {
      tripId: number;
      memberId: number;
      content: string;
      messageType?: string;
      mediaUrl?: string;
      replyToId?: number;
    }) => {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          trip_id: input.tripId,
          member_id: input.memberId,
          content: input.content,
          message_type: input.messageType ?? 'text',
          media_url: input.mediaUrl ?? null,
          reply_to_id: input.replyToId ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    // Don't invalidate – realtime handles it
  });

  return {
    messages: messagesQuery.data ?? [],
    isLoading: messagesQuery.isLoading,
    sendMessage,
    refetch: messagesQuery.refetch,
  };
}
