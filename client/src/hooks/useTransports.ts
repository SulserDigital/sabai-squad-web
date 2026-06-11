import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useTransports(tripId: number | undefined) {
  const queryClient = useQueryClient();

  const transportsQuery = useQuery({
    queryKey: ['transports', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('transports')
        .select('*')
        .eq('trip_id', tripId)
        .order('departure_date', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tripId,
  });

  const createTransport = useMutation({
    mutationFn: async (input: {
      tripId: number;
      type: string;
      fromLocation: string;
      toLocation: string;
      departureDate?: string;
      arrivalDate?: string;
      price?: number;
      currency?: string;
      bookingRef?: string;
      notes?: string;
      contactId?: number;
      createdBy: number;
    }) => {
      const { data, error } = await supabase
        .from('transports')
        .insert({
          trip_id: input.tripId,
          type: input.type,
          from_location: input.fromLocation,
          to_location: input.toLocation,
          departure_date: input.departureDate ?? null,
          arrival_date: input.arrivalDate ?? null,
          price: input.price ?? null,
          currency: input.currency ?? 'THB',
          booking_ref: input.bookingRef ?? null,
          notes: input.notes ?? null,
          contact_id: input.contactId ?? null,
          created_by: input.createdBy,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transports', tripId] }),
  });

  const deleteTransport = useMutation({
    mutationFn: async (transportId: number) => {
      const { error } = await supabase.from('transports').delete().eq('id', transportId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transports', tripId] }),
  });

  return {
    transports: transportsQuery.data ?? [],
    isLoading: transportsQuery.isLoading,
    createTransport,
    deleteTransport,
    refetch: transportsQuery.refetch,
  };
}
