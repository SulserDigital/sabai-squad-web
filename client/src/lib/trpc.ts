/**
 * tRPC Compatibility Layer
 * 
 * This module provides a drop-in replacement for the old tRPC client.
 * It maps the trpc.*.useQuery() / useMutation() patterns to direct Supabase calls.
 * This allows existing page components to work with minimal changes.
 * 
 * Over time, pages should be migrated to use the dedicated hooks directly
 * (useTrips, useExpenses, useChat, etc.) for cleaner code.
 */

import { supabase } from './supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Helper: get current user
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Helper: get member id for current user in a trip
async function getMyMemberId(tripId: number) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Creates a useQuery-compatible hook from a Supabase query function
 */
function createQuery<TData>(queryKey: string[], queryFn: () => Promise<TData>, options?: any) {
  return {
    useQuery: (input?: any, opts?: any) => {
      const finalKey = input !== undefined ? [...queryKey, JSON.stringify(input)] : queryKey;
      return useQuery({
        queryKey: finalKey,
        queryFn,
        ...opts,
      });
    },
  };
}

// ============================================================
// TRIPS
// ============================================================
const trips = {
  list: {
    useQuery: (_input?: any, opts?: any) => {
      return useQuery({
        queryKey: ['trips'],
        queryFn: async () => {
          const user = await getCurrentUser();
          if (!user) return [];
          const { data, error } = await supabase
            .from('trips')
            .select('*, trip_members!inner(user_id)')
            .eq('trip_members.user_id', user.id)
            .order('created_at', { ascending: false });
          if (error) throw error;
          return data ?? [];
        },
        ...opts,
      });
    },
  },
  create: {
    useMutation: (opts?: any) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const user = await getCurrentUser();
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
          // Auto-add creator as admin
          const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single();
          await supabase.from('trip_members').insert({
            trip_id: trip.id,
            user_id: user.id,
            display_name: profile?.name ?? user.email?.split('@')[0] ?? 'Admin',
            role: 'admin',
          });
          return trip;
        },
        onSuccess: (...args: any[]) => {
          queryClient.invalidateQueries({ queryKey: ['trips'] });
          opts?.onSuccess?.(...args);
        },
      });
    },
  },
  delete: {
    useMutation: (opts?: any) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const tripId = typeof input === 'number' ? input : input.tripId;
          const { error } = await supabase.from('trips').delete().eq('id', tripId);
          if (error) throw error;
        },
        onSuccess: (...args: any[]) => {
          queryClient.invalidateQueries({ queryKey: ['trips'] });
          opts?.onSuccess?.(...args);
        },
      });
    },
  },
  update: {
    useMutation: (opts?: any) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { tripId, ...rest } = input;
          const updateData: any = { updated_at: new Date().toISOString() };
          if (rest.name !== undefined) updateData.name = rest.name;
          if (rest.destination !== undefined) updateData.destination = rest.destination;
          if (rest.description !== undefined) updateData.description = rest.description;
          if (rest.startDate !== undefined) updateData.start_date = rest.startDate;
          if (rest.endDate !== undefined) updateData.end_date = rest.endDate;
          if (rest.currency !== undefined) updateData.currency = rest.currency;
          if (rest.coverImage !== undefined) updateData.cover_image = rest.coverImage;
          const { error } = await supabase.from('trips').update(updateData).eq('id', tripId);
          if (error) throw error;
        },
        onSuccess: (...args: any[]) => {
          queryClient.invalidateQueries({ queryKey: ['trips'] });
          opts?.onSuccess?.(...args);
        },
      });
    },
  },
  join: {
    useMutation: (opts?: any) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const user = await getCurrentUser();
          if (!user) throw new Error('Not authenticated');
          const { data: trip } = await supabase.from('trips').select('*').eq('invite_code', input.inviteCode).single();
          if (!trip) throw new Error('Ungültiger Einladungscode');
          const { data: existing } = await supabase.from('trip_members').select('id').eq('trip_id', trip.id).eq('user_id', user.id).maybeSingle();
          if (existing) return { tripId: trip.id, alreadyMember: true };
          await supabase.from('trip_members').insert({
            trip_id: trip.id,
            user_id: user.id,
            display_name: input.displayName ?? user.email?.split('@')[0] ?? 'Member',
            emoji: input.emoji ?? 'person',
          });
          return { tripId: trip.id, alreadyMember: false };
        },
        onSuccess: (...args: any[]) => {
          queryClient.invalidateQueries({ queryKey: ['trips'] });
          opts?.onSuccess?.(...args);
        },
      });
    },
  },
  getByInviteCode: {
    useQuery: (input: any, opts?: any) => {
      return useQuery({
        queryKey: ['trips', 'invite', input?.inviteCode],
        queryFn: async () => {
          if (!input?.inviteCode) return null;
          const { data } = await supabase.from('trips').select('*').eq('invite_code', input.inviteCode).maybeSingle();
          return data;
        },
        ...opts,
      });
    },
  },
};

// ============================================================
// MEMBERS
// ============================================================
const members = {
  list: {
    useQuery: (input: any, opts?: any) => {
      const tripId = input?.tripId ?? input;
      return useQuery({
        queryKey: ['members', tripId],
        queryFn: async () => {
          if (!tripId) return [];
          const { data, error } = await supabase.from('trip_members').select('*').eq('trip_id', tripId).order('joined_at', { ascending: true });
          if (error) throw error;
          return data ?? [];
        },
        enabled: !!tripId,
        ...opts,
      });
    },
  },
  add: {
    useMutation: (opts?: any) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { data, error } = await supabase.from('trip_members').insert({
            trip_id: input.tripId,
            display_name: input.displayName,
            emoji: input.emoji ?? 'person',
            color: input.color ?? '#C9A84C',
            user_id: input.userId ?? null,
          }).select().single();
          if (error) throw error;
          return data;
        },
        onSuccess: (...args: any[]) => {
          queryClient.invalidateQueries({ queryKey: ['members'] });
          opts?.onSuccess?.(...args);
        },
      });
    },
  },
  remove: {
    useMutation: (opts?: any) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const memberId = typeof input === 'number' ? input : input.memberId;
          const { error } = await supabase.from('trip_members').delete().eq('id', memberId);
          if (error) throw error;
        },
        onSuccess: (...args: any[]) => {
          queryClient.invalidateQueries({ queryKey: ['members'] });
          opts?.onSuccess?.(...args);
        },
      });
    },
  },
  update: {
    useMutation: (opts?: any) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { memberId, ...rest } = input;
          const updateData: any = {};
          if (rest.displayName !== undefined) updateData.display_name = rest.displayName;
          if (rest.emoji !== undefined) updateData.emoji = rest.emoji;
          if (rest.color !== undefined) updateData.color = rest.color;
          if (rest.avatarUrl !== undefined) updateData.avatar_url = rest.avatarUrl;
          if (rest.avatarIcon !== undefined) updateData.avatar_icon = rest.avatarIcon;
          if (rest.avatarColor !== undefined) updateData.avatar_color = rest.avatarColor;
          if (rest.arrivalDate !== undefined) updateData.arrival_date = rest.arrivalDate;
          if (rest.departureDate !== undefined) updateData.departure_date = rest.departureDate;
          if (rest.currentLocation !== undefined) updateData.current_location = rest.currentLocation;
          if (rest.personalNotes !== undefined) updateData.personal_notes = rest.personalNotes;
          const { error } = await supabase.from('trip_members').update(updateData).eq('id', memberId);
          if (error) throw error;
        },
        onSuccess: (...args: any[]) => {
          queryClient.invalidateQueries({ queryKey: ['members'] });
          opts?.onSuccess?.(...args);
        },
      });
    },
  },
};

// ============================================================
// EXPENSES
// ============================================================
const expenses = {
  list: {
    useQuery: (input: any, opts?: any) => {
      const tripId = input?.tripId ?? input;
      return useQuery({
        queryKey: ['expenses', tripId],
        queryFn: async () => {
          if (!tripId) return [];
          const { data, error } = await supabase.from('expenses').select('*, expense_participants(*)').eq('trip_id', tripId).order('date', { ascending: false });
          if (error) throw error;
          return data ?? [];
        },
        enabled: !!tripId,
        ...opts,
      });
    },
  },
  balances: {
    useQuery: (input: any, opts?: any) => {
      const tripId = input?.tripId ?? input;
      return useQuery({
        queryKey: ['balances', tripId],
        queryFn: async () => {
          if (!tripId) return { balances: [], settlements: [] };
          const { data: members } = await supabase.from('trip_members').select('id').eq('trip_id', tripId);
          const { data: expensesList } = await supabase.from('expenses').select('*, expense_participants(*)').eq('trip_id', tripId).eq('is_personal', false);
          if (!members || !expensesList) return { balances: [], settlements: [] };
          const balanceMap: Record<number, number> = {};
          for (const m of members) balanceMap[m.id] = 0;
          for (const exp of expensesList) {
            balanceMap[exp.paid_by_member_id] = (balanceMap[exp.paid_by_member_id] ?? 0) + Number(exp.total_amount);
            for (const p of (exp.expense_participants ?? [])) {
              balanceMap[p.member_id] = (balanceMap[p.member_id] ?? 0) - Number(p.share_amount ?? 0);
            }
          }
          const settlements: any[] = [];
          const creditors = members.filter(m => (balanceMap[m.id] ?? 0) > 0.01).map(m => ({ id: m.id, amount: balanceMap[m.id] ?? 0 }));
          const debtors = members.filter(m => (balanceMap[m.id] ?? 0) < -0.01).map(m => ({ id: m.id, amount: Math.abs(balanceMap[m.id] ?? 0) }));
          let ci = 0, di = 0;
          while (ci < creditors.length && di < debtors.length) {
            const amount = Math.min(creditors[ci]!.amount, debtors[di]!.amount);
            if (amount > 0.01) settlements.push({ fromMemberId: debtors[di]!.id, toMemberId: creditors[ci]!.id, amount: Math.round(amount * 100) / 100 });
            creditors[ci]!.amount -= amount;
            debtors[di]!.amount -= amount;
            if (creditors[ci]!.amount < 0.01) ci++;
            if (debtors[di]!.amount < 0.01) di++;
          }
          return { balances: Object.entries(balanceMap).map(([id, b]) => ({ memberId: parseInt(id), balance: Math.round(b * 100) / 100 })), settlements };
        },
        enabled: !!tripId,
        ...opts,
      });
    },
  },
  create: {
    useMutation: (opts?: any) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const user = await getCurrentUser();
          const { data: expense, error } = await supabase.from('expenses').insert({
            trip_id: input.tripId,
            title: input.title,
            description: input.description ?? null,
            category: input.category ?? 'other',
            total_amount: input.totalAmount,
            currency: input.currency ?? 'CHF',
            paid_by_member_id: input.paidByMemberId,
            split_type: input.splitType ?? 'equal',
            date: input.date ?? new Date().toISOString(),
            is_personal: input.isPersonal ?? false,
            personal_amount: input.personalAmount ?? 0,
            payment_method: input.paymentMethod ?? 'cash',
            created_by_user_id: user?.id ?? null,
          }).select().single();
          if (error) throw error;
          const participants = (input.participantIds ?? []).map((memberId: number) => {
            const customShare = input.customShares?.find((s: any) => s.memberId === memberId);
            return {
              expense_id: expense.id,
              member_id: memberId,
              share_amount: input.splitType === 'custom' && customShare ? customShare.amount : input.totalAmount / (input.participantIds?.length ?? 1),
            };
          });
          if (participants.length) await supabase.from('expense_participants').insert(participants);
          return expense;
        },
        onSuccess: (...args: any[]) => {
          queryClient.invalidateQueries({ queryKey: ['expenses'] });
          queryClient.invalidateQueries({ queryKey: ['balances'] });
          opts?.onSuccess?.(...args);
        },
      });
    },
  },
  update: {
    useMutation: (opts?: any) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { expenseId, ...rest } = input;
          const updateData: any = { updated_at: new Date().toISOString() };
          if (rest.title !== undefined) updateData.title = rest.title;
          if (rest.totalAmount !== undefined) updateData.total_amount = rest.totalAmount;
          if (rest.category !== undefined) updateData.category = rest.category;
          if (rest.paidByMemberId !== undefined) updateData.paid_by_member_id = rest.paidByMemberId;
          if (rest.splitType !== undefined) updateData.split_type = rest.splitType;
          if (rest.isPersonal !== undefined) updateData.is_personal = rest.isPersonal;
          if (rest.personalAmount !== undefined) updateData.personal_amount = rest.personalAmount;
          if (rest.paymentMethod !== undefined) updateData.payment_method = rest.paymentMethod;
          await supabase.from('expenses').update(updateData).eq('id', expenseId);
          if (rest.participantIds) {
            await supabase.from('expense_participants').delete().eq('expense_id', expenseId);
            const participants = rest.participantIds.map((memberId: number) => {
              const customShare = rest.customShares?.find((s: any) => s.memberId === memberId);
              return { expense_id: expenseId, member_id: memberId, share_amount: rest.splitType === 'custom' && customShare ? customShare.amount : (rest.totalAmount ?? 0) / rest.participantIds.length };
            });
            await supabase.from('expense_participants').insert(participants);
          }
        },
        onSuccess: (...args: any[]) => {
          queryClient.invalidateQueries({ queryKey: ['expenses'] });
          queryClient.invalidateQueries({ queryKey: ['balances'] });
          opts?.onSuccess?.(...args);
        },
      });
    },
  },
  delete: {
    useMutation: (opts?: any) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const expenseId = typeof input === 'number' ? input : input.expenseId;
          await supabase.from('expenses').delete().eq('id', expenseId);
        },
        onSuccess: (...args: any[]) => {
          queryClient.invalidateQueries({ queryKey: ['expenses'] });
          queryClient.invalidateQueries({ queryKey: ['balances'] });
          opts?.onSuccess?.(...args);
        },
      });
    },
  },
};

// ============================================================
// CHAT
// ============================================================
const chat = {
  messages: {
    useQuery: (input: any, opts?: any) => {
      const tripId = input?.tripId ?? input;
      return useQuery({
        queryKey: ['chat', tripId],
        queryFn: async () => {
          if (!tripId) return [];
          const { data, error } = await supabase.from('chat_messages').select('*').eq('trip_id', tripId).order('created_at', { ascending: true }).limit(200);
          if (error) throw error;
          return data ?? [];
        },
        enabled: !!tripId,
        ...opts,
      });
    },
  },
  send: {
    useMutation: (opts?: any) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { data, error } = await supabase.from('chat_messages').insert({
            trip_id: input.tripId,
            member_id: input.memberId,
            content: input.content,
            message_type: input.messageType ?? 'text',
            media_url: input.mediaUrl ?? null,
            reply_to_id: input.replyToId ?? null,
          }).select().single();
          if (error) throw error;
          return data;
        },
        onSuccess: (...args: any[]) => {
          opts?.onSuccess?.(...args);
        },
      });
    },
  },
};

// ============================================================
// TIMELINE
// ============================================================
const timeline = {
  list: {
    useQuery: (input: any, opts?: any) => {
      const tripId = input?.tripId ?? input;
      return useQuery({
        queryKey: ['timeline', tripId],
        queryFn: async () => {
          if (!tripId) return [];
          const { data, error } = await supabase.from('timeline_events').select('*').eq('trip_id', tripId).order('start_time', { ascending: true });
          if (error) throw error;
          return data ?? [];
        },
        enabled: !!tripId,
        ...opts,
      });
    },
  },
  create: {
    useMutation: (opts?: any) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const user = await getCurrentUser();
          const { data, error } = await supabase.from('timeline_events').insert({
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
          }).select().single();
          if (error) throw error;
          return data;
        },
        onSuccess: (...args: any[]) => {
          queryClient.invalidateQueries({ queryKey: ['timeline'] });
          opts?.onSuccess?.(...args);
        },
      });
    },
  },
  update: {
    useMutation: (opts?: any) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { eventId, ...rest } = input;
          const updateData: any = { updated_at: new Date().toISOString() };
          if (rest.title !== undefined) updateData.title = rest.title;
          if (rest.description !== undefined) updateData.description = rest.description;
          if (rest.location !== undefined) updateData.location = rest.location;
          if (rest.eventType !== undefined) updateData.event_type = rest.eventType;
          if (rest.startTime !== undefined) updateData.start_time = rest.startTime;
          if (rest.endTime !== undefined) updateData.end_time = rest.endTime;
          if (rest.participantIds !== undefined) updateData.participant_ids = rest.participantIds;
          await supabase.from('timeline_events').update(updateData).eq('id', eventId);
        },
        onSuccess: (...args: any[]) => {
          queryClient.invalidateQueries({ queryKey: ['timeline'] });
          opts?.onSuccess?.(...args);
        },
      });
    },
  },
  delete: {
    useMutation: (opts?: any) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const eventId = typeof input === 'number' ? input : input.eventId;
          await supabase.from('timeline_events').delete().eq('id', eventId);
        },
        onSuccess: (...args: any[]) => {
          queryClient.invalidateQueries({ queryKey: ['timeline'] });
          opts?.onSuccess?.(...args);
        },
      });
    },
  },
};

// ============================================================
// ACTIVITIES
// ============================================================
const activities = {
  list: {
    useQuery: (input: any, opts?: any) => {
      const tripId = input?.tripId ?? input;
      return useQuery({
        queryKey: ['activities', tripId],
        queryFn: async () => {
          if (!tripId) return [];
          const { data, error } = await supabase.from('activities').select('*, activity_votes(*), activity_comments(*)').eq('trip_id', tripId).order('created_at', { ascending: false });
          if (error) throw error;
          return data ?? [];
        },
        enabled: !!tripId,
        ...opts,
      });
    },
  },
  create: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const { data, error } = await supabase.from('activities').insert({ trip_id: input.tripId, title: input.title, description: input.description ?? null, location: input.location ?? null, estimated_cost: input.estimatedCost ?? null, currency: input.currency ?? 'CHF', category: input.category ?? 'general', status: input.status ?? 'proposed', scheduled_date: input.scheduledDate ?? null, scheduled_time: input.scheduledTime ?? null, proposed_by_member_id: input.proposedByMemberId ?? null, website_url: input.websiteUrl ?? null }).select().single(); if (error) throw error; return data; }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['activities'] }); opts?.onSuccess?.(...a); } }); } },
  update: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const { activityId, ...rest } = input; const ud: any = { updated_at: new Date().toISOString() }; Object.entries(rest).forEach(([k, v]) => { ud[k.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`)] = v; }); await supabase.from('activities').update(ud).eq('id', activityId); }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['activities'] }); opts?.onSuccess?.(...a); } }); } },
  delete: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const id = typeof input === 'number' ? input : input.activityId; await supabase.from('activities').delete().eq('id', id); }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['activities'] }); opts?.onSuccess?.(...a); } }); } },
  vote: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { await supabase.from('activity_votes').upsert({ activity_id: input.activityId, member_id: input.memberId, vote: input.vote }, { onConflict: 'activity_id,member_id' }); }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['activities'] }); opts?.onSuccess?.(...a); } }); } },
  comment: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { await supabase.from('activity_comments').insert({ activity_id: input.activityId, member_id: input.memberId, content: input.content }); }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['activities'] }); opts?.onSuccess?.(...a); } }); } },
};

// ============================================================
// ACCOMMODATIONS
// ============================================================
const accommodations = {
  list: { useQuery: (input: any, opts?: any) => { const tripId = input?.tripId ?? input; return useQuery({ queryKey: ['accommodations', tripId], queryFn: async () => { if (!tripId) return []; const { data, error } = await supabase.from('accommodations').select('*, accommodation_contacts(*)').eq('trip_id', tripId).order('checkin_date', { ascending: true }); if (error) throw error; return data ?? []; }, enabled: !!tripId, ...opts }); } },
  create: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const user = await getCurrentUser(); const { data, error } = await supabase.from('accommodations').insert({ trip_id: input.tripId, name: input.name, type: input.type, address: input.address ?? null, maps_link: input.mapsLink ?? null, checkin_date: input.checkinDate ?? null, checkout_date: input.checkoutDate ?? null, price_per_night: input.pricePerNight ?? null, total_price: input.totalPrice ?? null, currency: input.currency ?? 'THB', platform: input.platform ?? null, booking_ref: input.bookingRef ?? null, access_code: input.accessCode ?? null, wifi_password: input.wifiPassword ?? null, house_rules: input.houseRules ?? null, residents: input.residents ?? [], created_by_user_id: user?.id ?? null }).select().single(); if (error) throw error; return data; }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['accommodations'] }); opts?.onSuccess?.(...a); } }); } },
  update: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const { accommodationId, ...rest } = input; const ud: any = { updated_at: new Date().toISOString() }; Object.entries(rest).forEach(([k, v]) => { ud[k.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`)] = v; }); await supabase.from('accommodations').update(ud).eq('id', accommodationId); }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['accommodations'] }); opts?.onSuccess?.(...a); } }); } },
  delete: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const id = typeof input === 'number' ? input : input.accommodationId; await supabase.from('accommodations').delete().eq('id', id); }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['accommodations'] }); opts?.onSuccess?.(...a); } }); } },
};

// ============================================================
// PLANNED STAYS
// ============================================================
const plannedStays = {
  list: { useQuery: (input: any, opts?: any) => { const tripId = input?.tripId ?? input; return useQuery({ queryKey: ['plannedStays', tripId], queryFn: async () => { if (!tripId) return []; const { data, error } = await supabase.from('planned_stays').select('*, stay_invitations(*)').eq('trip_id', tripId).order('from_date', { ascending: true }); if (error) throw error; return data ?? []; }, enabled: !!tripId, ...opts }); } },
  create: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const { data, error } = await supabase.from('planned_stays').insert({ trip_id: input.tripId, member_id: input.memberId, location: input.location, from_date: input.fromDate, to_date: input.toDate, note: input.note ?? null, accommodation_id: input.accommodationId ?? null }).select().single(); if (error) throw error; return data; }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['plannedStays'] }); opts?.onSuccess?.(...a); } }); } },
};

// ============================================================
// SHOPPING
// ============================================================
const shopping = {
  lists: { useQuery: (input: any, opts?: any) => { const tripId = input?.tripId ?? input; return useQuery({ queryKey: ['shopping', tripId], queryFn: async () => { if (!tripId) return []; const { data, error } = await supabase.from('shopping_lists').select('*, shopping_items(*)').eq('trip_id', tripId).order('created_at', { ascending: false }); if (error) throw error; return data ?? []; }, enabled: !!tripId, ...opts }); } },
  createList: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const { data, error } = await supabase.from('shopping_lists').insert({ trip_id: input.tripId, name: input.name, created_by: input.createdBy }).select().single(); if (error) throw error; return data; }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['shopping'] }); opts?.onSuccess?.(...a); } }); } },
  addItem: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const { data, error } = await supabase.from('shopping_items').insert({ list_id: input.listId, name: input.name, quantity: input.quantity ?? null, image_url: input.imageUrl ?? null, added_by: input.addedBy }).select().single(); if (error) throw error; return data; }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['shopping'] }); opts?.onSuccess?.(...a); } }); } },
  toggleItem: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { await supabase.from('shopping_items').update({ is_checked: input.isChecked, checked_by: input.isChecked ? input.checkedBy ?? null : null, updated_at: new Date().toISOString() }).eq('id', input.itemId); }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['shopping'] }); opts?.onSuccess?.(...a); } }); } },
  deleteItem: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const id = typeof input === 'number' ? input : input.itemId; await supabase.from('shopping_items').delete().eq('id', id); }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['shopping'] }); opts?.onSuccess?.(...a); } }); } },
};

// ============================================================
// TASKS
// ============================================================
const tasks = {
  list: { useQuery: (input: any, opts?: any) => { const tripId = input?.tripId ?? input; return useQuery({ queryKey: ['tasks', tripId], queryFn: async () => { if (!tripId) return []; const { data, error } = await supabase.from('tasks').select('*').eq('trip_id', tripId).order('created_at', { ascending: false }); if (error) throw error; return data ?? []; }, enabled: !!tripId, ...opts }); } },
  create: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const { data, error } = await supabase.from('tasks').insert({ trip_id: input.tripId, title: input.title, description: input.description ?? null, assigned_to: input.assignedTo ?? null, created_by: input.createdBy, due_date: input.dueDate ?? null, is_private: input.isPrivate ?? false }).select().single(); if (error) throw error; return data; }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['tasks'] }); opts?.onSuccess?.(...a); } }); } },
  update: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const { taskId, ...rest } = input; const ud: any = { updated_at: new Date().toISOString() }; if (rest.status !== undefined) { ud.status = rest.status; if (rest.status === 'done') ud.completed_at = new Date().toISOString(); } if (rest.title !== undefined) ud.title = rest.title; if (rest.assignedTo !== undefined) ud.assigned_to = rest.assignedTo; if (rest.dueDate !== undefined) ud.due_date = rest.dueDate; await supabase.from('tasks').update(ud).eq('id', taskId); }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['tasks'] }); opts?.onSuccess?.(...a); } }); } },
  delete: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const id = typeof input === 'number' ? input : input.taskId; await supabase.from('tasks').delete().eq('id', id); }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['tasks'] }); opts?.onSuccess?.(...a); } }); } },
};

// ============================================================
// TRANSPORTS
// ============================================================
const transports = {
  list: { useQuery: (input: any, opts?: any) => { const tripId = input?.tripId ?? input; return useQuery({ queryKey: ['transports', tripId], queryFn: async () => { if (!tripId) return []; const { data, error } = await supabase.from('transports').select('*').eq('trip_id', tripId).order('departure_date', { ascending: true }); if (error) throw error; return data ?? []; }, enabled: !!tripId, ...opts }); } },
  create: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const { data, error } = await supabase.from('transports').insert({ trip_id: input.tripId, type: input.type, from_location: input.fromLocation, to_location: input.toLocation, departure_date: input.departureDate ?? null, arrival_date: input.arrivalDate ?? null, price: input.price ?? null, currency: input.currency ?? 'THB', booking_ref: input.bookingRef ?? null, notes: input.notes ?? null, contact_id: input.contactId ?? null, created_by: input.createdBy }).select().single(); if (error) throw error; return data; }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['transports'] }); opts?.onSuccess?.(...a); } }); } },
  delete: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const id = typeof input === 'number' ? input : input.transportId; await supabase.from('transports').delete().eq('id', id); }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['transports'] }); opts?.onSuccess?.(...a); } }); } },
};

// ============================================================
// CONTACTS
// ============================================================
const contacts = {
  list: { useQuery: (input: any, opts?: any) => { const tripId = input?.tripId ?? input; return useQuery({ queryKey: ['contacts', tripId], queryFn: async () => { if (!tripId) return []; const { data, error } = await supabase.from('contacts').select('*').eq('trip_id', tripId).order('name', { ascending: true }); if (error) throw error; return data ?? []; }, enabled: !!tripId, ...opts }); } },
  create: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const { data, error } = await supabase.from('contacts').insert({ trip_id: input.tripId, name: input.name, phone: input.phone ?? null, instagram: input.instagram ?? null, line: input.line ?? null, whatsapp: input.whatsapp ?? null, category: input.category ?? 'other', note: input.note ?? null, photo_url: input.photoUrl ?? null, is_private: input.isPrivate ?? false, created_by: input.createdBy }).select().single(); if (error) throw error; return data; }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['contacts'] }); opts?.onSuccess?.(...a); } }); } },
  update: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const { contactId, ...rest } = input; const ud: any = { updated_at: new Date().toISOString() }; Object.entries(rest).forEach(([k, v]) => { ud[k.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`)] = v; }); await supabase.from('contacts').update(ud).eq('id', contactId); }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['contacts'] }); opts?.onSuccess?.(...a); } }); } },
  delete: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const id = typeof input === 'number' ? input : input.contactId; await supabase.from('contacts').delete().eq('id', id); }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['contacts'] }); opts?.onSuccess?.(...a); } }); } },
};

// ============================================================
// TIPS
// ============================================================
const tips = {
  list: { useQuery: (input: any, opts?: any) => { const tripId = input?.tripId ?? input; return useQuery({ queryKey: ['tips', tripId], queryFn: async () => { if (!tripId) return []; const { data, error } = await supabase.from('tips').select('*').eq('trip_id', tripId).order('category', { ascending: true }); if (error) throw error; return data ?? []; }, enabled: !!tripId, ...opts }); } },
  create: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const user = await getCurrentUser(); const { data, error } = await supabase.from('tips').insert({ trip_id: input.tripId, category: input.category, title: input.title, description: input.description, created_by_user_id: user?.id ?? null }).select().single(); if (error) throw error; return data; }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['tips'] }); opts?.onSuccess?.(...a); } }); } },
  delete: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const id = typeof input === 'number' ? input : input.tipId; await supabase.from('tips').delete().eq('id', id); }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['tips'] }); opts?.onSuccess?.(...a); } }); } },
};

// ============================================================
// VAULT
// ============================================================
const vault = {
  list: { useQuery: (input: any, opts?: any) => { return useQuery({ queryKey: ['vault', input?.tripId], queryFn: async () => { const user = await getCurrentUser(); if (!user) return []; let query = supabase.from('vault_documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }); if (input?.tripId) query = query.eq('trip_id', input.tripId); const { data, error } = await query; if (error) throw error; return data ?? []; }, ...opts }); } },
  upload: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { return input; /* Handled by useVault hook with encryption */ }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['vault'] }); opts?.onSuccess?.(...a); } }); } },
  delete: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const id = typeof input === 'number' ? input : input.documentId; if (input.fileKey) await supabase.storage.from('vault').remove([input.fileKey]); await supabase.from('vault_documents').delete().eq('id', id); }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['vault'] }); opts?.onSuccess?.(...a); } }); } },
};

// ============================================================
// NEWS
// ============================================================
const news = {
  list: { useQuery: (input: any, opts?: any) => { const tripId = input?.tripId ?? input; return useQuery({ queryKey: ['news', tripId], queryFn: async () => { if (!tripId) return []; const { data, error } = await supabase.from('news_items').select('*').eq('trip_id', tripId).order('is_pinned', { ascending: false }).order('created_at', { ascending: false }); if (error) throw error; return data ?? []; }, enabled: !!tripId, ...opts }); } },
  create: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const user = await getCurrentUser(); if (!user) throw new Error('Not authenticated'); const { data, error } = await supabase.from('news_items').insert({ trip_id: input.tripId, title: input.title, content: input.content, category: input.category ?? 'info', is_pinned: input.isPinned ?? false, created_by: user.id }).select().single(); if (error) throw error; return data; }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['news'] }); opts?.onSuccess?.(...a); } }); } },
  delete: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const id = typeof input === 'number' ? input : input.newsId; await supabase.from('news_items').delete().eq('id', id); }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['news'] }); opts?.onSuccess?.(...a); } }); } },
};

// ============================================================
// DICTIONARY (Custom Phrases)
// ============================================================
const dictionary = {
  phrases: { useQuery: (input: any, opts?: any) => { const tripId = input?.tripId ?? input; return useQuery({ queryKey: ['dictionary', tripId], queryFn: async () => { if (!tripId) return []; const { data, error } = await supabase.from('custom_phrases').select('*').eq('trip_id', tripId).order('category', { ascending: true }); if (error) throw error; return data ?? []; }, enabled: !!tripId, ...opts }); } },
  addPhrase: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const user = await getCurrentUser(); if (!user) throw new Error('Not authenticated'); const { data, error } = await supabase.from('custom_phrases').insert({ trip_id: input.tripId, created_by_user_id: user.id, german: input.german, phonetic: input.phonetic, thai: input.thai ?? '', category: input.category ?? 'Eigene', note: input.note ?? '' }).select().single(); if (error) throw error; return data; }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['dictionary'] }); opts?.onSuccess?.(...a); } }); } },
  deletePhrase: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const id = typeof input === 'number' ? input : input.phraseId; await supabase.from('custom_phrases').delete().eq('id', id); }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['dictionary'] }); opts?.onSuccess?.(...a); } }); } },
};

// ============================================================
// PACKING
// ============================================================
const packing = {
  list: { useQuery: (input: any, opts?: any) => { const tripId = input?.tripId ?? input; return useQuery({ queryKey: ['packing', tripId], queryFn: async () => { if (!tripId) return []; const { data, error } = await supabase.from('packing_items').select('*').eq('trip_id', tripId).order('category', { ascending: true }).order('sort_order', { ascending: true }); if (error) throw error; return data ?? []; }, enabled: !!tripId, ...opts }); } },
  addItem: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const { data, error } = await supabase.from('packing_items').insert({ trip_id: input.tripId, category: input.category, name: input.name, created_by: input.createdBy }).select().single(); if (error) throw error; return data; }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['packing'] }); opts?.onSuccess?.(...a); } }); } },
  toggleItem: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { await supabase.from('packing_items').update({ checked: input.checked, updated_at: new Date().toISOString() }).eq('id', input.itemId); }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['packing'] }); opts?.onSuccess?.(...a); } }); } },
  deleteItem: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const id = typeof input === 'number' ? input : input.itemId; await supabase.from('packing_items').delete().eq('id', id); }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['packing'] }); opts?.onSuccess?.(...a); } }); } },
};

// ============================================================
// DEBT PAYMENTS
// ============================================================
const debtPayments = {
  list: { useQuery: (input: any, opts?: any) => { const tripId = input?.tripId ?? input; return useQuery({ queryKey: ['debtPayments', tripId], queryFn: async () => { if (!tripId) return []; const { data, error } = await supabase.from('debt_payments').select('*').eq('trip_id', tripId).order('paid_at', { ascending: false }); if (error) throw error; return data ?? []; }, enabled: !!tripId, ...opts }); } },
  markAsPaid: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const { data, error } = await supabase.from('debt_payments').insert({ trip_id: input.tripId, from_member_id: input.fromMemberId, to_member_id: input.toMemberId, amount: input.amount, currency: input.currency ?? 'THB', note: input.note ?? '' }).select().single(); if (error) throw error; return data; }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['debtPayments'] }); opts?.onSuccess?.(...a); } }); } },
  delete: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const id = typeof input === 'number' ? input : input.paymentId; await supabase.from('debt_payments').delete().eq('id', id); }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['debtPayments'] }); opts?.onSuccess?.(...a); } }); } },
};

// ============================================================
// AUTH (compatibility with old trpc.auth.me)
// ============================================================
const auth = {
  me: {
    useQuery: (_input?: any, opts?: any) => {
      return useQuery({
        queryKey: ['auth', 'me'],
        queryFn: async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return null;
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          return profile ? { id: profile.id, name: profile.name, email: profile.email, role: profile.role } : null;
        },
        ...opts,
      });
    },
  },
  logout: {
    useMutation: (opts?: any) => {
      return useMutation({
        mutationFn: async () => {
          await supabase.auth.signOut();
        },
        ...opts,
      });
    },
  },
};

// ============================================================
// SETTINGS (profile updates)
// ============================================================
const settings = {
  updateProfile: { useMutation: (opts?: any) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: any) => { const user = await getCurrentUser(); if (!user) throw new Error('Not authenticated'); const ud: any = { updated_at: new Date().toISOString() }; if (input.name !== undefined) ud.name = input.name; await supabase.from('profiles').update(ud).eq('id', user.id); }, onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['auth'] }); opts?.onSuccess?.(...a); } }); } },
};

// ============================================================
// EXPORT: The trpc object that pages import
// ============================================================
export const trpc = {
  auth,
  trips,
  members,
  expenses,
  debtPayments,
  chat,
  timeline,
  activities,
  accommodations,
  plannedStays,
  shopping,
  tasks,
  transports,
  contacts,
  tips,
  vault,
  news,
  dictionary,
  packing,
  settings,
  useUtils: () => {
    const queryClient = useQueryClient();
    return {
      auth: { me: { setData: (_: any, data: any) => queryClient.setQueryData(['auth', 'me'], data), invalidate: () => queryClient.invalidateQueries({ queryKey: ['auth'] }) } },
      trips: { list: { invalidate: () => queryClient.invalidateQueries({ queryKey: ['trips'] }) } },
      members: { list: { invalidate: () => queryClient.invalidateQueries({ queryKey: ['members'] }) } },
      expenses: { list: { invalidate: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }) } },
      chat: { messages: { invalidate: () => queryClient.invalidateQueries({ queryKey: ['chat'] }), setData: (_: any, data: any) => queryClient.setQueryData(['chat'], data) } },
      timeline: { list: { invalidate: () => queryClient.invalidateQueries({ queryKey: ['timeline'] }) } },
      activities: { list: { invalidate: () => queryClient.invalidateQueries({ queryKey: ['activities'] }) } },
      accommodations: { list: { invalidate: () => queryClient.invalidateQueries({ queryKey: ['accommodations'] }) } },
      shopping: { lists: { invalidate: () => queryClient.invalidateQueries({ queryKey: ['shopping'] }) } },
      tasks: { list: { invalidate: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }) } },
      transports: { list: { invalidate: () => queryClient.invalidateQueries({ queryKey: ['transports'] }) } },
      contacts: { list: { invalidate: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }) } },
      tips: { list: { invalidate: () => queryClient.invalidateQueries({ queryKey: ['tips'] }) } },
      news: { list: { invalidate: () => queryClient.invalidateQueries({ queryKey: ['news'] }) } },
      vault: { list: { invalidate: () => queryClient.invalidateQueries({ queryKey: ['vault'] }) } },
      packing: { list: { invalidate: () => queryClient.invalidateQueries({ queryKey: ['packing'] }) } },
      dictionary: { phrases: { invalidate: () => queryClient.invalidateQueries({ queryKey: ['dictionary'] }) } },
    };
  },
};
