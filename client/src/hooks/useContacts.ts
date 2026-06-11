import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useContacts(tripId: number | undefined) {
  const queryClient = useQueryClient();

  const contactsQuery = useQuery({
    queryKey: ['contacts', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('trip_id', tripId)
        .order('name', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tripId,
  });

  const createContact = useMutation({
    mutationFn: async (input: {
      tripId: number;
      name: string;
      phone?: string;
      instagram?: string;
      line?: string;
      whatsapp?: string;
      category?: string;
      note?: string;
      photoUrl?: string;
      isPrivate?: boolean;
      createdBy: number;
    }) => {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          trip_id: input.tripId,
          name: input.name,
          phone: input.phone ?? null,
          instagram: input.instagram ?? null,
          line: input.line ?? null,
          whatsapp: input.whatsapp ?? null,
          category: input.category ?? 'other',
          note: input.note ?? null,
          photo_url: input.photoUrl ?? null,
          is_private: input.isPrivate ?? false,
          created_by: input.createdBy,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts', tripId] }),
  });

  const updateContact = useMutation({
    mutationFn: async (input: { contactId: number; [key: string]: any }) => {
      const { contactId, ...rest } = input;
      const updateData: any = { updated_at: new Date().toISOString() };
      if (rest.name !== undefined) updateData.name = rest.name;
      if (rest.phone !== undefined) updateData.phone = rest.phone;
      if (rest.instagram !== undefined) updateData.instagram = rest.instagram;
      if (rest.line !== undefined) updateData.line = rest.line;
      if (rest.whatsapp !== undefined) updateData.whatsapp = rest.whatsapp;
      if (rest.category !== undefined) updateData.category = rest.category;
      if (rest.note !== undefined) updateData.note = rest.note;
      if (rest.photoUrl !== undefined) updateData.photo_url = rest.photoUrl;
      if (rest.isPrivate !== undefined) updateData.is_private = rest.isPrivate;

      const { error } = await supabase.from('contacts').update(updateData).eq('id', contactId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts', tripId] }),
  });

  const deleteContact = useMutation({
    mutationFn: async (contactId: number) => {
      const { error } = await supabase.from('contacts').delete().eq('id', contactId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts', tripId] }),
  });

  return {
    contacts: contactsQuery.data ?? [],
    isLoading: contactsQuery.isLoading,
    createContact,
    updateContact,
    deleteContact,
    refetch: contactsQuery.refetch,
  };
}
