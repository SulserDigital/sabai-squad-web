import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useTrips() {
  const queryClient = useQueryClient();

  const tripsQuery = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('trips')
        .select('*, trip_members!inner(user_id)')
        .eq('trip_members.user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data ?? [];
    },
  });

  const createTrip = useMutation({
    mutationFn: async (input: {
      name: string;
      destination?: string;
      description?: string;
      currency?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data: trip, error } = await supabase
        .from('trips')
        .insert({
          name: input.name,
          destination: input.destination ?? null,
          description: input.description ?? null,
          currency: input.currency ?? 'CHF',
          start_date: input.startDate ?? null,
          end_date: input.endDate ?? null,
          invite_code: inviteCode,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-add creator as admin member
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      await supabase.from('trip_members').insert({
        trip_id: trip.id,
        user_id: user.id,
        display_name: profile?.name ?? 'Admin',
        role: 'admin',
      });

      return trip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });

  const getTripByInviteCode = async (inviteCode: string) => {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();
    if (error) return null;
    return data;
  };

  const joinTrip = useMutation({
    mutationFn: async (input: { inviteCode: string; displayName: string; emoji?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const trip = await getTripByInviteCode(input.inviteCode);
      if (!trip) throw new Error('Ungültiger Einladungscode');

      // Check if already a member
      const { data: existing } = await supabase
        .from('trip_members')
        .select('id')
        .eq('trip_id', trip.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) return { tripId: trip.id, memberId: existing.id, alreadyMember: true };

      const { data: member, error } = await supabase
        .from('trip_members')
        .insert({
          trip_id: trip.id,
          user_id: user.id,
          display_name: input.displayName,
          emoji: input.emoji ?? 'person',
        })
        .select()
        .single();

      if (error) throw error;
      return { tripId: trip.id, memberId: member.id, alreadyMember: false };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });

  const deleteTrip = useMutation({
    mutationFn: async (tripId: number) => {
      const { error } = await supabase.from('trips').delete().eq('id', tripId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });

  const updateTrip = useMutation({
    mutationFn: async (input: { tripId: number; name?: string; destination?: string; description?: string; startDate?: string; endDate?: string }) => {
      const { tripId, ...data } = input;
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.destination !== undefined) updateData.destination = data.destination;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.startDate !== undefined) updateData.start_date = data.startDate;
      if (data.endDate !== undefined) updateData.end_date = data.endDate;
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase.from('trips').update(updateData).eq('id', tripId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });

  return {
    trips: tripsQuery.data ?? [],
    isLoading: tripsQuery.isLoading,
    error: tripsQuery.error,
    createTrip,
    joinTrip,
    deleteTrip,
    updateTrip,
    getTripByInviteCode,
    refetch: tripsQuery.refetch,
  };
}

export function useMembers(tripId: number | undefined) {
  return useQuery({
    queryKey: ['members', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('trip_members')
        .select('*')
        .eq('trip_id', tripId)
        .order('joined_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tripId,
  });
}
