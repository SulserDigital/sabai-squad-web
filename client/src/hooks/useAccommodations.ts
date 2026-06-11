import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useAccommodations(tripId: number | undefined) {
  const queryClient = useQueryClient();

  const accommodationsQuery = useQuery({
    queryKey: ['accommodations', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('accommodations')
        .select('*, accommodation_contacts(*)')
        .eq('trip_id', tripId)
        .order('checkin_date', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tripId,
  });

  const createAccommodation = useMutation({
    mutationFn: async (input: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { contacts: inputContacts, ...accData } = input;
      
      const { data, error } = await supabase
        .from('accommodations')
        .insert({
          trip_id: accData.tripId,
          name: accData.name,
          type: accData.type,
          address: accData.address ?? null,
          maps_link: accData.mapsLink ?? null,
          checkin_date: accData.checkinDate ?? null,
          checkout_date: accData.checkoutDate ?? null,
          price_per_night: accData.pricePerNight ?? null,
          total_price: accData.totalPrice ?? null,
          currency: accData.currency ?? 'THB',
          platform: accData.platform ?? null,
          booking_ref: accData.bookingRef ?? null,
          access_code: accData.accessCode ?? null,
          wifi_password: accData.wifiPassword ?? null,
          house_rules: accData.houseRules ?? null,
          residents: accData.residents ?? [],
          created_by_user_id: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;

      // Add contacts if provided
      if (inputContacts?.length) {
        await supabase.from('accommodation_contacts').insert(
          inputContacts.map((c: any) => ({
            accommodation_id: data.id,
            name: c.name,
            role: c.role ?? null,
            phone: c.phone ?? null,
            line_id: c.lineId ?? null,
          }))
        );
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accommodations', tripId] });
    },
  });

  const updateAccommodation = useMutation({
    mutationFn: async (input: any) => {
      const { accommodationId, ...rest } = input;
      const updateData: any = { updated_at: new Date().toISOString() };
      Object.entries(rest).forEach(([key, val]) => {
        const snakeKey = key.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`);
        updateData[snakeKey] = val;
      });

      const { error } = await supabase
        .from('accommodations')
        .update(updateData)
        .eq('id', accommodationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accommodations', tripId] });
    },
  });

  const deleteAccommodation = useMutation({
    mutationFn: async (accommodationId: number) => {
      const { error } = await supabase.from('accommodations').delete().eq('id', accommodationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accommodations', tripId] });
    },
  });

  return {
    accommodations: accommodationsQuery.data ?? [],
    isLoading: accommodationsQuery.isLoading,
    createAccommodation,
    updateAccommodation,
    deleteAccommodation,
    refetch: accommodationsQuery.refetch,
  };
}

export function usePlannedStays(tripId: number | undefined) {
  const queryClient = useQueryClient();

  const staysQuery = useQuery({
    queryKey: ['plannedStays', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('planned_stays')
        .select('*, stay_invitations(*)')
        .eq('trip_id', tripId)
        .order('from_date', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tripId,
  });

  const createStay = useMutation({
    mutationFn: async (input: {
      tripId: number;
      memberId: number;
      location: string;
      fromDate: string;
      toDate: string;
      note?: string;
      accommodationId?: number;
    }) => {
      const { data, error } = await supabase
        .from('planned_stays')
        .insert({
          trip_id: input.tripId,
          member_id: input.memberId,
          location: input.location,
          from_date: input.fromDate,
          to_date: input.toDate,
          note: input.note ?? null,
          accommodation_id: input.accommodationId ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plannedStays', tripId] });
    },
  });

  const respondToInvitation = useMutation({
    mutationFn: async (input: {
      invitationId: number;
      status: 'accepted' | 'declined';
      fromDate?: string;
      toDate?: string;
      note?: string;
      accommodationId?: number;
    }) => {
      const { error } = await supabase
        .from('stay_invitations')
        .update({
          status: input.status,
          accepted_from_date: input.fromDate ?? null,
          accepted_to_date: input.toDate ?? null,
          accepted_note: input.note ?? null,
          accommodation_id: input.accommodationId ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.invitationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plannedStays', tripId] });
    },
  });

  return {
    stays: staysQuery.data ?? [],
    isLoading: staysQuery.isLoading,
    createStay,
    respondToInvitation,
    refetch: staysQuery.refetch,
  };
}
