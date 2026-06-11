import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useTasks(tripId: number | undefined) {
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ['tasks', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tripId,
  });

  const createTask = useMutation({
    mutationFn: async (input: {
      tripId: number;
      title: string;
      description?: string;
      assignedTo?: number;
      createdBy: number;
      dueDate?: string;
      isPrivate?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          trip_id: input.tripId,
          title: input.title,
          description: input.description ?? null,
          assigned_to: input.assignedTo ?? null,
          created_by: input.createdBy,
          due_date: input.dueDate ?? null,
          is_private: input.isPrivate ?? false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', tripId] }),
  });

  const updateTask = useMutation({
    mutationFn: async (input: { taskId: number; status?: string; title?: string; assignedTo?: number | null; dueDate?: string | null }) => {
      const { taskId, ...rest } = input;
      const updateData: any = { updated_at: new Date().toISOString() };
      if (rest.status !== undefined) {
        updateData.status = rest.status;
        if (rest.status === 'done') updateData.completed_at = new Date().toISOString();
      }
      if (rest.title !== undefined) updateData.title = rest.title;
      if (rest.assignedTo !== undefined) updateData.assigned_to = rest.assignedTo;
      if (rest.dueDate !== undefined) updateData.due_date = rest.dueDate;

      const { error } = await supabase.from('tasks').update(updateData).eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', tripId] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: number) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', tripId] }),
  });

  return {
    tasks: tasksQuery.data ?? [],
    isLoading: tasksQuery.isLoading,
    createTask,
    updateTask,
    deleteTask,
    refetch: tasksQuery.refetch,
  };
}
