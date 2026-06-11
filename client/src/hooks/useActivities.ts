import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useActivities(tripId: number | undefined) {
  const queryClient = useQueryClient();

  const activitiesQuery = useQuery({
    queryKey: ['activities', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('activities')
        .select('*, activity_votes(*), activity_comments(*)')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tripId,
  });

  const createActivity = useMutation({
    mutationFn: async (input: {
      tripId: number;
      title: string;
      description?: string;
      location?: string;
      estimatedCost?: number;
      currency?: string;
      category?: string;
      scheduledDate?: string;
      scheduledTime?: string;
      proposedByMemberId?: number;
      websiteUrl?: string;
    }) => {
      const { data, error } = await supabase
        .from('activities')
        .insert({
          trip_id: input.tripId,
          title: input.title,
          description: input.description ?? null,
          location: input.location ?? null,
          estimated_cost: input.estimatedCost ?? null,
          currency: input.currency ?? 'CHF',
          category: input.category ?? 'general',
          scheduled_date: input.scheduledDate ?? null,
          scheduled_time: input.scheduledTime ?? null,
          proposed_by_member_id: input.proposedByMemberId ?? null,
          website_url: input.websiteUrl ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', tripId] });
    },
  });

  const updateActivity = useMutation({
    mutationFn: async (input: { activityId: number; [key: string]: any }) => {
      const { activityId, ...rest } = input;
      const updateData: any = {};
      if (rest.title !== undefined) updateData.title = rest.title;
      if (rest.description !== undefined) updateData.description = rest.description;
      if (rest.location !== undefined) updateData.location = rest.location;
      if (rest.estimatedCost !== undefined) updateData.estimated_cost = rest.estimatedCost;
      if (rest.category !== undefined) updateData.category = rest.category;
      if (rest.status !== undefined) updateData.status = rest.status;
      if (rest.scheduledDate !== undefined) updateData.scheduled_date = rest.scheduledDate;
      if (rest.scheduledTime !== undefined) updateData.scheduled_time = rest.scheduledTime;
      if (rest.websiteUrl !== undefined) updateData.website_url = rest.websiteUrl;
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('activities')
        .update(updateData)
        .eq('id', activityId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', tripId] });
    },
  });

  const deleteActivity = useMutation({
    mutationFn: async (activityId: number) => {
      const { error } = await supabase.from('activities').delete().eq('id', activityId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', tripId] });
    },
  });

  const vote = useMutation({
    mutationFn: async (input: { activityId: number; memberId: number; vote: 'yes' | 'no' | 'maybe' }) => {
      const { data, error } = await supabase
        .from('activity_votes')
        .upsert(
          { activity_id: input.activityId, member_id: input.memberId, vote: input.vote },
          { onConflict: 'activity_id,member_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', tripId] });
    },
  });

  const addComment = useMutation({
    mutationFn: async (input: { activityId: number; memberId: number; content: string }) => {
      const { data, error } = await supabase
        .from('activity_comments')
        .insert({
          activity_id: input.activityId,
          member_id: input.memberId,
          content: input.content,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', tripId] });
    },
  });

  return {
    activities: activitiesQuery.data ?? [],
    isLoading: activitiesQuery.isLoading,
    createActivity,
    updateActivity,
    deleteActivity,
    vote,
    addComment,
    refetch: activitiesQuery.refetch,
  };
}
