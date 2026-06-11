import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useTimeline(tripId: number | undefined) {
  const queryClient = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: ['timeline', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('trip_id', tripId)
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tripId,
  });

  const createEvent = useMutation({
    mutationFn: async (input: {
      tripId: number;
      title: string;
      description?: string;
      location?: string;
      eventType?: string;
      startTime: string;
      endTime?: string;
      participantIds?: number[];
      confirmationNumber?: string;
      cost?: number;
      currency?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('timeline_events')
        .insert({
          trip_id: input.tripId,
          title: input.title,
          description: input.description ?? null,
          location: input.location ?? null,
          event_type: input.eventType ?? 'other',
          start_time: input.startTime,
          end_time: input.endTime ?? null,
          participant_ids: input.participantIds ?? [],
          confirmation_number: input.confirmationNumber ?? null,
          cost: input.cost ?? null,
          currency: input.currency ?? 'CHF',
          created_by_user_id: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', tripId] });
    },
  });

  const updateEvent = useMutation({
    mutationFn: async (input: { eventId: number; [key: string]: any }) => {
      const { eventId, ...rest } = input;
      const updateData: any = { updated_at: new Date().toISOString() };
      if (rest.title !== undefined) updateData.title = rest.title;
      if (rest.description !== undefined) updateData.description = rest.description;
      if (rest.location !== undefined) updateData.location = rest.location;
      if (rest.eventType !== undefined) updateData.event_type = rest.eventType;
      if (rest.startTime !== undefined) updateData.start_time = rest.startTime;
      if (rest.endTime !== undefined) updateData.end_time = rest.endTime;
      if (rest.participantIds !== undefined) updateData.participant_ids = rest.participantIds;
      if (rest.confirmationNumber !== undefined) updateData.confirmation_number = rest.confirmationNumber;
      if (rest.cost !== undefined) updateData.cost = rest.cost;

      const { error } = await supabase.from('timeline_events').update(updateData).eq('id', eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', tripId] });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (eventId: number) => {
      const { error } = await supabase.from('timeline_events').delete().eq('id', eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', tripId] });
    },
  });

  return {
    events: eventsQuery.data ?? [],
    isLoading: eventsQuery.isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: eventsQuery.refetch,
  };
}
