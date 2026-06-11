/**
 * tRPC Compatibility Layer
 *
 * Drop-in replacement for the old tRPC client.
 * Maps trpc.*.useQuery() / useMutation() patterns to direct Supabase calls.
 */

import { supabase } from './supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ── Helpers ──────────────────────────────────────────────────────────────────
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ── TRIPS ────────────────────────────────────────────────────────────────────
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
          // Normalize to camelCase
          return (data ?? []).map((t: any) => ({
            ...t,
            startDate: t.start_date,
            endDate: t.end_date,
            inviteCode: t.invite_code,
            createdBy: t.created_by ?? t.owner_id,
            createdAt: t.created_at,
          }));
        },
        ...opts,
      });
    },
  },
  create: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
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
              created_by: user.id,
            })
            .select()
            .single();
          if (error) throw error;
          const { data: profile } = await supabase.from('user_profiles').select('display_name').eq('id', user.id).maybeSingle();
          await supabase.from('trip_members').insert({
            trip_id: trip.id,
            user_id: user.id,
            display_name: profile?.display_name ?? input.displayName ?? user.email?.split('@')[0] ?? 'Admin',
            role: 'owner',
          });
          return trip;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['trips'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  delete: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const id = typeof input === 'number' ? input : input.tripId ?? input.id;
          const { error } = await supabase.from('trips').delete().eq('id', id);
          if (error) throw error;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['trips'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  update: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { tripId, ...rest } = input;
          const ud: any = {};
          if (rest.name !== undefined) ud.name = rest.name;
          if (rest.destination !== undefined) ud.destination = rest.destination;
          if (rest.description !== undefined) ud.description = rest.description;
          if (rest.startDate !== undefined) ud.start_date = rest.startDate;
          if (rest.endDate !== undefined) ud.end_date = rest.endDate;
          if (rest.currency !== undefined) ud.currency = rest.currency;
          if (rest.coverImage !== undefined) ud.cover_image = rest.coverImage;
          const { error } = await supabase.from('trips').update(ud).eq('id', tripId);
          if (error) throw error;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['trips'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  join: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
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
            role: 'member',
          });
          return { tripId: trip.id, alreadyMember: false };
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['trips'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
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

// ── MEMBERS ──────────────────────────────────────────────────────────────────
function mapMember(m: any) {
  return {
    ...m,
    displayName: m.display_name ?? m.displayName,
    userId: m.user_id ?? m.userId,
    avatarUrl: m.avatar_url ?? m.avatarUrl ?? null,
    avatarIcon: m.avatar_icon ?? m.avatarIcon ?? null,
    avatarColor: m.avatar_color ?? m.avatarColor ?? '#C9A84C',
    arrivalDate: m.arrival_date ?? m.arrivalDate ?? null,
    departureDate: m.departure_date ?? m.departureDate ?? null,
    personalNotes: m.personal_notes ?? m.personalNotes ?? null,
    joinedAt: m.joined_at ?? m.joinedAt,
  };
}

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
          return (data ?? []).map(mapMember);
        },
        enabled: !!tripId,
        ...opts,
      });
    },
  },
  add: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { data, error } = await supabase.from('trip_members').insert({
            trip_id: input.tripId,
            display_name: input.displayName,
            color: input.color ?? '#C9A84C',
            user_id: input.userId ?? null,
            role: input.role ?? 'member',
          }).select().single();
          if (error) throw error;
          return mapMember(data);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['members'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  remove: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const id = typeof input === 'number' ? input : input.memberId ?? input.id;
          const { error } = await supabase.from('trip_members').delete().eq('id', id);
          if (error) throw error;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['members'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  update: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { memberId, ...rest } = input;
          const ud: any = {};
          if (rest.displayName !== undefined) ud.display_name = rest.displayName;
          if (rest.color !== undefined) ud.color = rest.color;
          if (rest.avatarUrl !== undefined) ud.avatar_url = rest.avatarUrl;
          if (rest.avatarIcon !== undefined) ud.avatar_icon = rest.avatarIcon;
          if (rest.avatarColor !== undefined) ud.avatar_color = rest.avatarColor;
          if (rest.arrivalDate !== undefined) ud.arrival_date = rest.arrivalDate;
          if (rest.departureDate !== undefined) ud.departure_date = rest.departureDate;
          if (rest.personalNotes !== undefined) ud.personal_notes = rest.personalNotes;
          const { error } = await supabase.from('trip_members').update(ud).eq('id', memberId);
          if (error) throw error;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['members'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  // Alias: updateAvatar → members.update
  updateAvatar: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { memberId, ...rest } = input;
          const ud: any = {};
          if (rest.avatarUrl !== undefined) ud.avatar_url = rest.avatarUrl;
          if (rest.avatarIcon !== undefined) ud.avatar_icon = rest.avatarIcon;
          if (rest.avatarColor !== undefined) ud.avatar_color = rest.avatarColor;
          const { error } = await supabase.from('trip_members').update(ud).eq('id', memberId);
          if (error) throw error;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['members'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  // Alias: updateDisplayName → members.update
  updateDisplayName: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { memberId, displayName } = input;
          const { error } = await supabase.from('trip_members').update({ display_name: displayName }).eq('id', memberId);
          if (error) throw error;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['members'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  // Alias: updateTravelDates → members.update
  updateTravelDates: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { memberId, arrivalDate, departureDate, personalNotes } = input;
          const ud: any = {};
          if (arrivalDate !== undefined) ud.arrival_date = arrivalDate || null;
          if (departureDate !== undefined) ud.departure_date = departureDate || null;
          if (personalNotes !== undefined) ud.personal_notes = personalNotes || null;
          const { error } = await supabase.from('trip_members').update(ud).eq('id', memberId);
          if (error) throw error;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['members'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
};

// ── EXPENSES ─────────────────────────────────────────────────────────────────
function mapExpense(e: any) {
  return {
    ...e,
    totalAmount: e.total_amount ?? e.totalAmount,
    paidByMemberId: e.paid_by_member_id ?? e.paidByMemberId,
    splitType: e.split_type ?? e.splitType,
    isPersonal: e.is_personal ?? e.isPersonal,
    personalAmount: e.personal_amount ?? e.personalAmount,
    paymentMethod: e.payment_method ?? e.paymentMethod,
    createdByUserId: e.created_by_user_id ?? e.createdByUserId,
    createdAt: e.created_at ?? e.createdAt,
  };
}

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
          return (data ?? []).map(mapExpense);
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
          const { data: mems } = await supabase.from('trip_members').select('id').eq('trip_id', tripId);
          const { data: expList } = await supabase.from('expenses').select('*, expense_participants(*)').eq('trip_id', tripId).eq('is_personal', false);
          if (!mems || !expList) return { balances: [], settlements: [] };
          const balMap: Record<number, number> = {};
          for (const m of mems) balMap[m.id] = 0;
          for (const exp of expList) {
            balMap[exp.paid_by_member_id] = (balMap[exp.paid_by_member_id] ?? 0) + Number(exp.total_amount);
            for (const p of (exp.expense_participants ?? [])) {
              balMap[p.member_id] = (balMap[p.member_id] ?? 0) - Number(p.share_amount ?? 0);
            }
          }
          const settlements: any[] = [];
          const creditors = mems.filter(m => (balMap[m.id] ?? 0) > 0.01).map(m => ({ id: m.id, amount: balMap[m.id] ?? 0 }));
          const debtors = mems.filter(m => (balMap[m.id] ?? 0) < -0.01).map(m => ({ id: m.id, amount: Math.abs(balMap[m.id] ?? 0) }));
          let ci = 0, di = 0;
          while (ci < creditors.length && di < debtors.length) {
            const amt = Math.min(creditors[ci]!.amount, debtors[di]!.amount);
            if (amt > 0.01) settlements.push({ fromMemberId: debtors[di]!.id, toMemberId: creditors[ci]!.id, amount: Math.round(amt * 100) / 100 });
            creditors[ci]!.amount -= amt; debtors[di]!.amount -= amt;
            if (creditors[ci]!.amount < 0.01) ci++;
            if (debtors[di]!.amount < 0.01) di++;
          }
          return { balances: Object.entries(balMap).map(([id, b]) => ({ memberId: parseInt(id), balance: Math.round(b * 100) / 100 })), settlements };
        },
        enabled: !!tripId,
        ...opts,
      });
    },
  },
  create: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const user = await getCurrentUser();
          const { data: expense, error } = await supabase.from('expenses').insert({
            trip_id: input.tripId, title: input.title, description: input.description ?? null,
            category: input.category ?? 'other', total_amount: input.totalAmount,
            currency: input.currency ?? 'CHF', paid_by_member_id: input.paidByMemberId,
            split_type: input.splitType ?? 'equal', date: input.date ?? new Date().toISOString(),
            is_personal: input.isPersonal ?? false, personal_amount: input.personalAmount ?? 0,
            payment_method: input.paymentMethod ?? 'cash', created_by_user_id: user?.id ?? null,
          }).select().single();
          if (error) throw error;
          const participants = (input.participantIds ?? []).map((mId: number) => {
            const cs = input.customShares?.find((s: any) => s.memberId === mId);
            return { expense_id: expense.id, member_id: mId, share_amount: input.splitType === 'custom' && cs ? cs.amount : input.totalAmount / (input.participantIds?.length ?? 1) };
          });
          if (participants.length) await supabase.from('expense_participants').insert(participants);
          return mapExpense(expense);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['expenses'] }); qc.invalidateQueries({ queryKey: ['balances'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  update: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { expenseId, ...rest } = input;
          const ud: any = {};
          if (rest.title !== undefined) ud.title = rest.title;
          if (rest.totalAmount !== undefined) ud.total_amount = rest.totalAmount;
          if (rest.category !== undefined) ud.category = rest.category;
          if (rest.paidByMemberId !== undefined) ud.paid_by_member_id = rest.paidByMemberId;
          if (rest.splitType !== undefined) ud.split_type = rest.splitType;
          if (rest.isPersonal !== undefined) ud.is_personal = rest.isPersonal;
          if (rest.personalAmount !== undefined) ud.personal_amount = rest.personalAmount;
          if (rest.paymentMethod !== undefined) ud.payment_method = rest.paymentMethod;
          await supabase.from('expenses').update(ud).eq('id', expenseId);
          if (rest.participantIds) {
            await supabase.from('expense_participants').delete().eq('expense_id', expenseId);
            const parts = rest.participantIds.map((mId: number) => {
              const cs = rest.customShares?.find((s: any) => s.memberId === mId);
              return { expense_id: expenseId, member_id: mId, share_amount: rest.splitType === 'custom' && cs ? cs.amount : (rest.totalAmount ?? 0) / rest.participantIds.length };
            });
            await supabase.from('expense_participants').insert(parts);
          }
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['expenses'] }); qc.invalidateQueries({ queryKey: ['balances'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  delete: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const id = typeof input === 'number' ? input : input.expenseId ?? input.id;
          await supabase.from('expenses').delete().eq('id', id);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['expenses'] }); qc.invalidateQueries({ queryKey: ['balances'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
};

// ── DEBT PAYMENTS ─────────────────────────────────────────────────────────────
const debtPayments = {
  list: {
    useQuery: (input: any, opts?: any) => {
      const tripId = input?.tripId ?? input;
      return useQuery({
        queryKey: ['debtPayments', tripId],
        queryFn: async () => {
          if (!tripId) return [];
          const { data, error } = await supabase.from('debt_payments').select('*').eq('trip_id', tripId).order('paid_at', { ascending: false });
          if (error) throw error;
          return (data ?? []).map((p: any) => ({ ...p, fromMemberId: p.from_member_id, toMemberId: p.to_member_id, paidAt: p.paid_at }));
        },
        enabled: !!tripId,
        ...opts,
      });
    },
  },
  markAsPaid: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { data, error } = await supabase.from('debt_payments').insert({
            trip_id: input.tripId, from_member_id: input.fromMemberId, to_member_id: input.toMemberId,
            amount: input.amount, currency: input.currency ?? 'THB', note: input.note ?? '',
          }).select().single();
          if (error) throw error;
          return data;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['debtPayments'] }); qc.invalidateQueries({ queryKey: ['balances'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  delete: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const id = typeof input === 'number' ? input : input.paymentId ?? input.id;
          await supabase.from('debt_payments').delete().eq('id', id);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['debtPayments'] }); qc.invalidateQueries({ queryKey: ['balances'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
};

// ── CHAT ─────────────────────────────────────────────────────────────────────
const chat = {
  messages: {
    useQuery: (input: any, opts?: any) => {
      const tripId = input?.tripId ?? input;
      return useQuery({
        queryKey: ['chat', tripId],
        queryFn: async () => {
          if (!tripId) return [];
          const { data, error } = await supabase.from('chat_messages').select('*').eq('trip_id', tripId).order('created_at', { ascending: true }).limit(input?.limit ?? 200);
          if (error) throw error;
          return (data ?? []).map((m: any) => ({ ...m, memberId: m.member_id, messageType: m.message_type, mediaUrl: m.media_url, createdAt: m.created_at }));
        },
        enabled: !!tripId,
        ...opts,
      });
    },
  },
  send: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { data, error } = await supabase.from('chat_messages').insert({
            trip_id: input.tripId, member_id: input.memberId, content: input.content,
            message_type: input.messageType ?? 'text', media_url: input.mediaUrl ?? null,
            reply_to_id: input.replyToId ?? null,
          }).select().single();
          if (error) throw error;
          return data;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['chat'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
};

// ── TIMELINE ─────────────────────────────────────────────────────────────────
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
          return (data ?? []).map((e: any) => ({ ...e, eventType: e.event_type, startTime: e.start_time, endTime: e.end_time, confirmationNumber: e.confirmation_number, participantIds: e.participant_ids }));
        },
        enabled: !!tripId,
        ...opts,
      });
    },
  },
  create: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const user = await getCurrentUser();
          const { data, error } = await supabase.from('timeline_events').insert({
            trip_id: input.tripId, title: input.title, description: input.description ?? null,
            location: input.location ?? null, event_type: input.eventType ?? 'other',
            start_time: input.startTime, end_time: input.endTime ?? null,
            participant_ids: input.participantIds ?? [], confirmation_number: input.confirmationNumber ?? null,
            cost: input.cost ?? null, currency: input.currency ?? 'CHF', created_by_user_id: user?.id ?? null,
          }).select().single();
          if (error) throw error;
          return data;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['timeline'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  delete: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const id = typeof input === 'number' ? input : input.eventId ?? input.id;
          await supabase.from('timeline_events').delete().eq('id', id);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['timeline'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
};

// ── ACTIVITIES ───────────────────────────────────────────────────────────────
function mapActivity(a: any) {
  return {
    ...a,
    estimatedCost: a.estimated_cost ?? a.estimatedCost,
    scheduledDate: a.scheduled_date ?? a.scheduledDate,
    scheduledTime: a.scheduled_time ?? a.scheduledTime,
    proposedByMemberId: a.proposed_by_member_id ?? a.proposedByMemberId,
    websiteUrl: a.website_url ?? a.websiteUrl,
    createdAt: a.created_at ?? a.createdAt,
    votes: (a.activity_votes ?? []).map((v: any) => ({ id: v.id, memberId: v.member_id, vote: v.vote })),
    comments: (a.activity_comments ?? []).map((c: any) => ({ id: c.id, memberId: c.member_id, content: c.content, createdAt: c.created_at })),
  };
}

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
          return (data ?? []).map(mapActivity);
        },
        enabled: !!tripId,
        ...opts,
      });
    },
  },
  listComments: {
    useQuery: (input: any, opts?: any) => {
      const activityId = input?.activityId ?? input;
      return useQuery({
        queryKey: ['activityComments', activityId],
        queryFn: async () => {
          if (!activityId) return [];
          const { data, error } = await supabase.from('activity_comments').select('*').eq('activity_id', activityId).order('created_at', { ascending: true });
          if (error) throw error;
          return (data ?? []).map((c: any) => ({ ...c, memberId: c.member_id, createdAt: c.created_at }));
        },
        enabled: !!activityId,
        ...opts,
      });
    },
  },
  create: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { data, error } = await supabase.from('activities').insert({
            trip_id: input.tripId, title: input.title, description: input.description ?? null,
            location: input.location ?? null, estimated_cost: input.estimatedCost ?? null,
            currency: input.currency ?? 'CHF', category: input.category ?? 'general',
            status: input.status ?? 'proposed', scheduled_date: input.scheduledDate ?? null,
            scheduled_time: input.scheduledTime ?? null, proposed_by_member_id: input.proposedByMemberId ?? null,
            website_url: input.websiteUrl ?? null,
          }).select().single();
          if (error) throw error;
          return mapActivity(data);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['activities'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  update: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { activityId, ...rest } = input;
          const ud: any = {};
          if (rest.title !== undefined) ud.title = rest.title;
          if (rest.description !== undefined) ud.description = rest.description;
          if (rest.location !== undefined) ud.location = rest.location;
          if (rest.estimatedCost !== undefined) ud.estimated_cost = rest.estimatedCost;
          if (rest.category !== undefined) ud.category = rest.category;
          if (rest.status !== undefined) ud.status = rest.status;
          if (rest.scheduledDate !== undefined) ud.scheduled_date = rest.scheduledDate;
          if (rest.scheduledTime !== undefined) ud.scheduled_time = rest.scheduledTime;
          if (rest.websiteUrl !== undefined) ud.website_url = rest.websiteUrl;
          await supabase.from('activities').update(ud).eq('id', activityId);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['activities'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  updateStatus: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { activityId, status } = input;
          const { error } = await supabase.from('activities').update({ status }).eq('id', activityId);
          if (error) throw error;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['activities'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  delete: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const id = typeof input === 'number' ? input : input.activityId ?? input.id;
          await supabase.from('activities').delete().eq('id', id);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['activities'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  vote: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          await supabase.from('activity_votes').upsert({ activity_id: input.activityId, member_id: input.memberId, vote: input.vote }, { onConflict: 'activity_id,member_id' });
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['activities'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  addComment: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { data, error } = await supabase.from('activity_comments').insert({
            activity_id: input.activityId, member_id: input.memberId, content: input.content,
          }).select().single();
          if (error) throw error;
          return data;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['activityComments'] }); qc.invalidateQueries({ queryKey: ['activities'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  deleteComment: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const id = typeof input === 'number' ? input : input.commentId ?? input.id;
          await supabase.from('activity_comments').delete().eq('id', id);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['activityComments'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
};

// ── ACCOMMODATIONS ───────────────────────────────────────────────────────────
function mapAccommodation(a: any) {
  return {
    ...a,
    checkinDate: a.checkin_date ?? a.checkinDate,
    checkoutDate: a.checkout_date ?? a.checkoutDate,
    pricePerNight: a.price_per_night ?? a.pricePerNight,
    totalPrice: a.total_price ?? a.totalPrice,
    bookingRef: a.booking_ref ?? a.bookingRef,
    accessCode: a.access_code ?? a.accessCode,
    wifiPassword: a.wifi_password ?? a.wifiPassword,
    houseRules: a.house_rules ?? a.houseRules,
    mapsLink: a.maps_link ?? a.mapsLink,
    contacts: (a.accommodation_contacts ?? []).map((c: any) => ({ ...c, lineId: c.line_id ?? c.lineId })),
  };
}

const accommodations = {
  list: {
    useQuery: (input: any, opts?: any) => {
      const tripId = input?.tripId ?? input;
      return useQuery({
        queryKey: ['accommodations', tripId],
        queryFn: async () => {
          if (!tripId) return [];
          const { data, error } = await supabase.from('accommodations').select('*, accommodation_contacts(*)').eq('trip_id', tripId).order('checkin_date', { ascending: true });
          if (error) throw error;
          return (data ?? []).map(mapAccommodation);
        },
        enabled: !!tripId,
        ...opts,
      });
    },
  },
  create: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const user = await getCurrentUser();
          const { data, error } = await supabase.from('accommodations').insert({
            trip_id: input.tripId, name: input.name, type: input.type,
            address: input.address ?? null, maps_link: input.mapsLink ?? null,
            checkin_date: input.checkinDate ?? null, checkout_date: input.checkoutDate ?? null,
            price_per_night: input.pricePerNight ?? null, total_price: input.totalPrice ?? null,
            currency: input.currency ?? 'THB', platform: input.platform ?? null,
            booking_ref: input.bookingRef ?? null, access_code: input.accessCode ?? null,
            wifi_password: input.wifiPassword ?? null, house_rules: input.houseRules ?? null,
            residents: input.residents ?? [], created_by_user_id: user?.id ?? null,
          }).select().single();
          if (error) throw error;
          return mapAccommodation(data);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['accommodations'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  update: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { accommodationId, ...rest } = input;
          const ud: any = {};
          if (rest.name !== undefined) ud.name = rest.name;
          if (rest.type !== undefined) ud.type = rest.type;
          if (rest.address !== undefined) ud.address = rest.address;
          if (rest.mapsLink !== undefined) ud.maps_link = rest.mapsLink;
          if (rest.checkinDate !== undefined) ud.checkin_date = rest.checkinDate;
          if (rest.checkoutDate !== undefined) ud.checkout_date = rest.checkoutDate;
          if (rest.pricePerNight !== undefined) ud.price_per_night = rest.pricePerNight;
          if (rest.totalPrice !== undefined) ud.total_price = rest.totalPrice;
          if (rest.currency !== undefined) ud.currency = rest.currency;
          if (rest.platform !== undefined) ud.platform = rest.platform;
          if (rest.bookingRef !== undefined) ud.booking_ref = rest.bookingRef;
          if (rest.accessCode !== undefined) ud.access_code = rest.accessCode;
          if (rest.wifiPassword !== undefined) ud.wifi_password = rest.wifiPassword;
          if (rest.houseRules !== undefined) ud.house_rules = rest.houseRules;
          if (rest.residents !== undefined) ud.residents = rest.residents;
          await supabase.from('accommodations').update(ud).eq('id', accommodationId);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['accommodations'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  delete: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const id = typeof input === 'number' ? input : input.accommodationId ?? input.id;
          await supabase.from('accommodations').delete().eq('id', id);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['accommodations'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  addContact: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { data, error } = await supabase.from('accommodation_contacts').insert({
            accommodation_id: input.accommodationId, name: input.name,
            role: input.role ?? null, phone: input.phone ?? null, line_id: input.lineId ?? null,
          }).select().single();
          if (error) throw error;
          return data;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['accommodations'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  removeContact: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const id = typeof input === 'number' ? input : input.contactId ?? input.id;
          await supabase.from('accommodation_contacts').delete().eq('id', id);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['accommodations'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
};

// ── PLANNED STAYS ─────────────────────────────────────────────────────────────
function mapStay(s: any) {
  return {
    ...s,
    memberId: s.member_id ?? s.memberId,
    fromDate: s.from_date ?? s.fromDate,
    toDate: s.to_date ?? s.toDate,
    accommodationId: s.accommodation_id ?? s.accommodationId,
    createdAt: s.created_at ?? s.createdAt,
    invitations: (s.stay_invitations ?? []).map((i: any) => ({
      ...i, memberId: i.member_id, stayId: i.stay_id, fromDate: i.from_date, toDate: i.to_date,
    })),
  };
}

const plannedStays = {
  list: {
    useQuery: (input: any, opts?: any) => {
      const tripId = input?.tripId ?? input;
      return useQuery({
        queryKey: ['plannedStays', tripId],
        queryFn: async () => {
          if (!tripId) return [];
          const { data, error } = await supabase.from('planned_stays').select('*, stay_invitations(*)').eq('trip_id', tripId).order('from_date', { ascending: true });
          if (error) throw error;
          return (data ?? []).map(mapStay);
        },
        enabled: !!tripId,
        ...opts,
      });
    },
  },
  create: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const user = await getCurrentUser();
          // Get current user's member record for this trip
          let memberId = input.memberId;
          if (!memberId && user) {
            const { data: m } = await supabase.from('trip_members').select('id').eq('trip_id', input.tripId).eq('user_id', user.id).maybeSingle();
            memberId = m?.id;
          }
          const { data, error } = await supabase.from('planned_stays').insert({
            trip_id: input.tripId, member_id: memberId, location: input.location,
            from_date: input.fromDate, to_date: input.toDate, note: input.note ?? null,
            accommodation_id: input.accommodationId ?? null,
          }).select().single();
          if (error) throw error;
          // If taggedMemberIds provided, create invitations
          if (input.taggedMemberIds?.length) {
            const invitations = input.taggedMemberIds.map((mId: number) => ({
              stay_id: data.id, member_id: mId, status: 'pending',
              from_date: input.fromDate, to_date: input.toDate,
            }));
            await supabase.from('stay_invitations').insert(invitations);
          }
          return mapStay(data);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['plannedStays'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  update: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { id, ...rest } = input;
          const ud: any = {};
          if (rest.location !== undefined) ud.location = rest.location;
          if (rest.fromDate !== undefined) ud.from_date = rest.fromDate;
          if (rest.toDate !== undefined) ud.to_date = rest.toDate;
          if (rest.note !== undefined) ud.note = rest.note;
          if (rest.accommodationId !== undefined) ud.accommodation_id = rest.accommodationId;
          const { error } = await supabase.from('planned_stays').update(ud).eq('id', id);
          if (error) throw error;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['plannedStays'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  delete: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const id = typeof input === 'number' ? input : input.id ?? input.stayId;
          await supabase.from('planned_stays').delete().eq('id', id);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['plannedStays'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  myInvitations: {
    useQuery: (input: any, opts?: any) => {
      const tripId = input?.tripId ?? input;
      return useQuery({
        queryKey: ['myInvitations', tripId],
        queryFn: async () => {
          const user = await getCurrentUser();
          if (!user || !tripId) return [];
          const { data: member } = await supabase.from('trip_members').select('id').eq('trip_id', tripId).eq('user_id', user.id).maybeSingle();
          if (!member) return [];
          const { data, error } = await supabase.from('stay_invitations').select('*, planned_stays(*)').eq('member_id', member.id);
          if (error) throw error;
          return (data ?? []).map((i: any) => ({
            ...i, memberId: i.member_id, stayId: i.stay_id,
            fromDate: i.from_date, toDate: i.to_date,
            stay: i.planned_stays ? mapStay(i.planned_stays) : null,
          }));
        },
        enabled: !!tripId,
        ...opts,
      });
    },
  },
  stayInvitationStatus: {
    useQuery: (input: any, opts?: any) => {
      const stayId = input?.stayId ?? input;
      return useQuery({
        queryKey: ['stayInvitations', stayId],
        queryFn: async () => {
          if (!stayId) return [];
          const { data, error } = await supabase.from('stay_invitations').select('*').eq('stay_id', stayId);
          if (error) throw error;
          return (data ?? []).map((i: any) => ({ ...i, memberId: i.member_id, stayId: i.stay_id, fromDate: i.from_date, toDate: i.to_date }));
        },
        enabled: !!stayId,
        ...opts,
      });
    },
  },
  memberOverview: {
    useQuery: (input: any, opts?: any) => {
      const tripId = input?.tripId ?? input;
      return useQuery({
        queryKey: ['memberOverview', tripId],
        queryFn: async () => {
          if (!tripId) return [];
          const { data: stays, error } = await supabase.from('planned_stays').select('*, stay_invitations(*), trip_members!planned_stays_member_id_fkey(display_name)').eq('trip_id', tripId).order('from_date', { ascending: true });
          if (error) return [];
          return (stays ?? []).map((s: any) => ({
            id: s.id, location: s.location, fromDate: s.from_date, toDate: s.to_date,
            participants: [
              { memberId: s.member_id, name: s.trip_members?.display_name ?? 'Unknown', fromDate: s.from_date, toDate: s.to_date, isCreator: true },
              ...(s.stay_invitations ?? []).filter((i: any) => i.status === 'accepted').map((i: any) => ({
                memberId: i.member_id, name: '', fromDate: i.from_date ?? s.from_date, toDate: i.to_date ?? s.to_date, isCreator: false,
              })),
            ],
          }));
        },
        enabled: !!tripId,
        ...opts,
      });
    },
  },
  acceptInvitation: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { invitationId, fromDate, toDate, note, accommodationId } = input;
          const ud: any = { status: 'accepted' };
          if (fromDate) ud.from_date = fromDate;
          if (toDate) ud.to_date = toDate;
          if (note) ud.note = note;
          if (accommodationId) ud.accommodation_id = accommodationId;
          const { error } = await supabase.from('stay_invitations').update(ud).eq('id', invitationId);
          if (error) throw error;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['plannedStays'] }); qc.invalidateQueries({ queryKey: ['myInvitations'] }); qc.invalidateQueries({ queryKey: ['stayInvitations'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  declineInvitation: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const id = typeof input === 'number' ? input : input.invitationId ?? input.id;
          const { error } = await supabase.from('stay_invitations').update({ status: 'declined' }).eq('id', id);
          if (error) throw error;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['myInvitations'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
};

// ── SHOPPING ─────────────────────────────────────────────────────────────────
const shopping = {
  lists: {
    useQuery: (input: any, opts?: any) => {
      const tripId = input?.tripId ?? input;
      return useQuery({
        queryKey: ['shopping', tripId],
        queryFn: async () => {
          if (!tripId) return [];
          const { data, error } = await supabase.from('shopping_lists').select('*, shopping_items(*)').eq('trip_id', tripId).order('created_at', { ascending: false });
          if (error) throw error;
          return (data ?? []).map((l: any) => ({
            ...l, createdAt: l.created_at,
            items: (l.shopping_items ?? []).map((i: any) => ({ ...i, isChecked: i.is_checked, imageUrl: i.image_url })),
          }));
        },
        enabled: !!tripId,
        ...opts,
      });
    },
  },
  items: {
    useQuery: (input: any, opts?: any) => {
      const listId = input?.listId ?? input;
      return useQuery({
        queryKey: ['shoppingItems', listId],
        queryFn: async () => {
          if (!listId) return [];
          const { data, error } = await supabase.from('shopping_items').select('*').eq('list_id', listId).order('created_at', { ascending: true });
          if (error) throw error;
          return (data ?? []).map((i: any) => ({ ...i, isChecked: i.is_checked, imageUrl: i.image_url }));
        },
        enabled: !!listId,
        ...opts,
      });
    },
  },
  createList: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const user = await getCurrentUser();
          const { data, error } = await supabase.from('shopping_lists').insert({
            trip_id: input.tripId, name: input.name, created_by: input.createdBy ?? user?.id,
          }).select().single();
          if (error) throw error;
          return data;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['shopping'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  archiveList: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const id = typeof input === 'number' ? input : input.id ?? input.listId;
          const { error } = await supabase.from('shopping_lists').update({ is_archived: true }).eq('id', id);
          if (error) throw error;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['shopping'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  deleteList: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const id = typeof input === 'number' ? input : input.id ?? input.listId;
          await supabase.from('shopping_lists').delete().eq('id', id);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['shopping'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  addItem: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const user = await getCurrentUser();
          const { data, error } = await supabase.from('shopping_items').insert({
            list_id: input.listId, name: input.name, quantity: input.quantity ?? null,
            image_url: input.imageUrl ?? null, added_by: input.addedBy ?? user?.id,
          }).select().single();
          if (error) throw error;
          return { ...data, isChecked: data.is_checked, imageUrl: data.image_url };
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['shopping'] }); qc.invalidateQueries({ queryKey: ['shoppingItems'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  toggleItem: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const id = input.id ?? input.itemId;
          await supabase.from('shopping_items').update({ is_checked: input.isChecked }).eq('id', id);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['shopping'] }); qc.invalidateQueries({ queryKey: ['shoppingItems'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  updateItem: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { id, name, quantity } = input;
          const { error } = await supabase.from('shopping_items').update({ name, quantity: quantity ?? null }).eq('id', id);
          if (error) throw error;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['shopping'] }); qc.invalidateQueries({ queryKey: ['shoppingItems'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  deleteItem: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const id = typeof input === 'number' ? input : input.id ?? input.itemId;
          await supabase.from('shopping_items').delete().eq('id', id);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['shopping'] }); qc.invalidateQueries({ queryKey: ['shoppingItems'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
};

// ── TASKS ─────────────────────────────────────────────────────────────────────
function mapTask(t: any) {
  return {
    ...t,
    assignedTo: t.assigned_to ?? t.assignedTo,
    createdBy: t.created_by ?? t.createdBy,
    dueDate: t.due_date ?? t.dueDate,
    isPrivate: t.is_private ?? t.isPrivate,
    completedAt: t.completed_at ?? t.completedAt,
    createdAt: t.created_at ?? t.createdAt,
  };
}

const tasks = {
  list: {
    useQuery: (input: any, opts?: any) => {
      const tripId = input?.tripId ?? input;
      return useQuery({
        queryKey: ['tasks', tripId],
        queryFn: async () => {
          if (!tripId) return [];
          const { data, error } = await supabase.from('tasks').select('*').eq('trip_id', tripId).order('created_at', { ascending: false });
          if (error) throw error;
          return (data ?? []).map(mapTask);
        },
        enabled: !!tripId,
        ...opts,
      });
    },
  },
  create: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const user = await getCurrentUser();
          const { data, error } = await supabase.from('tasks').insert({
            trip_id: input.tripId, title: input.title, description: input.description ?? null,
            assigned_to: input.assignedTo ?? null, created_by: input.createdBy ?? user?.id,
            due_date: input.dueDate ?? null, is_private: input.isPrivate ?? false,
            status: input.status ?? 'todo',
          }).select().single();
          if (error) throw error;
          return mapTask(data);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['tasks'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  update: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { taskId, id, ...rest } = input;
          const realId = taskId ?? id;
          const ud: any = {};
          if (rest.status !== undefined) { ud.status = rest.status; if (rest.status === 'done') ud.completed_at = new Date().toISOString(); }
          if (rest.title !== undefined) ud.title = rest.title;
          if (rest.assignedTo !== undefined) ud.assigned_to = rest.assignedTo;
          if (rest.dueDate !== undefined) ud.due_date = rest.dueDate;
          await supabase.from('tasks').update(ud).eq('id', realId);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['tasks'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  updateStatus: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { id, status } = input;
          const ud: any = { status };
          if (status === 'done') ud.completed_at = new Date().toISOString();
          const { error } = await supabase.from('tasks').update(ud).eq('id', id);
          if (error) throw error;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['tasks'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  delete: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const id = typeof input === 'number' ? input : input.taskId ?? input.id;
          await supabase.from('tasks').delete().eq('id', id);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['tasks'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
};

// ── TRANSPORTS ────────────────────────────────────────────────────────────────
function mapTransport(t: any) {
  return {
    ...t,
    fromLocation: t.from_location ?? t.fromLocation,
    toLocation: t.to_location ?? t.toLocation,
    departureDate: t.departure_date ?? t.departureDate,
    arrivalDate: t.arrival_date ?? t.arrivalDate,
    bookingRef: t.booking_ref ?? t.bookingRef,
    createdBy: t.created_by ?? t.createdBy,
  };
}

const transports = {
  list: {
    useQuery: (input: any, opts?: any) => {
      const tripId = input?.tripId ?? input;
      return useQuery({
        queryKey: ['transports', tripId],
        queryFn: async () => {
          if (!tripId) return [];
          const { data, error } = await supabase.from('transports').select('*').eq('trip_id', tripId).order('departure_date', { ascending: true });
          if (error) throw error;
          return (data ?? []).map(mapTransport);
        },
        enabled: !!tripId,
        ...opts,
      });
    },
  },
  create: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { data, error } = await supabase.from('transports').insert({
            trip_id: input.tripId, type: input.type, from_location: input.fromLocation,
            to_location: input.toLocation, departure_date: input.departureDate ?? null,
            arrival_date: input.arrivalDate ?? null, price: input.price ?? null,
            currency: input.currency ?? 'THB', booking_ref: input.bookingRef ?? null,
            notes: input.notes ?? null, created_by: input.createdBy,
          }).select().single();
          if (error) throw error;
          return mapTransport(data);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['transports'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  update: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { id, ...rest } = input;
          const ud: any = {};
          if (rest.type !== undefined) ud.type = rest.type;
          if (rest.fromLocation !== undefined) ud.from_location = rest.fromLocation;
          if (rest.toLocation !== undefined) ud.to_location = rest.toLocation;
          if (rest.departureDate !== undefined) ud.departure_date = rest.departureDate;
          if (rest.arrivalDate !== undefined) ud.arrival_date = rest.arrivalDate;
          if (rest.price !== undefined) ud.price = rest.price;
          if (rest.currency !== undefined) ud.currency = rest.currency;
          if (rest.bookingRef !== undefined) ud.booking_ref = rest.bookingRef;
          if (rest.notes !== undefined) ud.notes = rest.notes;
          const { error } = await supabase.from('transports').update(ud).eq('id', id);
          if (error) throw error;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['transports'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  delete: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const id = typeof input === 'number' ? input : input.transportId ?? input.id;
          await supabase.from('transports').delete().eq('id', id);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['transports'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
};

// ── CONTACTS ─────────────────────────────────────────────────────────────────
function mapContact(c: any) {
  return {
    ...c,
    photoUrl: c.photo_url ?? c.photoUrl,
    isPrivate: c.is_private ?? c.isPrivate,
    createdBy: c.created_by ?? c.createdBy,
    createdAt: c.created_at ?? c.createdAt,
  };
}

const contacts = {
  list: {
    useQuery: (input: any, opts?: any) => {
      const tripId = input?.tripId ?? input;
      return useQuery({
        queryKey: ['contacts', tripId],
        queryFn: async () => {
          if (!tripId) return [];
          const { data, error } = await supabase.from('contacts').select('*').eq('trip_id', tripId).order('name', { ascending: true });
          if (error) throw error;
          return (data ?? []).map(mapContact);
        },
        enabled: !!tripId,
        ...opts,
      });
    },
  },
  create: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { data, error } = await supabase.from('contacts').insert({
            trip_id: input.tripId, name: input.name, phone: input.phone ?? null,
            instagram: input.instagram ?? null, line: input.line ?? null,
            whatsapp: input.whatsapp ?? null, category: input.category ?? 'other',
            note: input.note ?? null, photo_url: input.photoUrl ?? null,
            is_private: input.isPrivate ?? false, created_by: input.createdBy,
          }).select().single();
          if (error) throw error;
          return mapContact(data);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['contacts'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  update: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { id, contactId, ...rest } = input;
          const realId = id ?? contactId;
          const ud: any = {};
          if (rest.name !== undefined) ud.name = rest.name;
          if (rest.phone !== undefined) ud.phone = rest.phone;
          if (rest.instagram !== undefined) ud.instagram = rest.instagram;
          if (rest.line !== undefined) ud.line = rest.line;
          if (rest.whatsapp !== undefined) ud.whatsapp = rest.whatsapp;
          if (rest.category !== undefined) ud.category = rest.category;
          if (rest.note !== undefined) ud.note = rest.note;
          if (rest.photoUrl !== undefined) ud.photo_url = rest.photoUrl;
          if (rest.isPrivate !== undefined) ud.is_private = rest.isPrivate;
          const { error } = await supabase.from('contacts').update(ud).eq('id', realId);
          if (error) throw error;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['contacts'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  delete: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const id = typeof input === 'number' ? input : input.contactId ?? input.id;
          await supabase.from('contacts').delete().eq('id', id);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['contacts'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
};

// ── TIPS ─────────────────────────────────────────────────────────────────────
const tips = {
  list: {
    useQuery: (input: any, opts?: any) => {
      const tripId = input?.tripId ?? input;
      return useQuery({
        queryKey: ['tips', tripId],
        queryFn: async () => {
          if (!tripId) return [];
          const { data, error } = await supabase.from('tips').select('*').eq('trip_id', tripId).order('category', { ascending: true });
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
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const user = await getCurrentUser();
          const { data, error } = await supabase.from('tips').insert({
            trip_id: input.tripId, category: input.category, title: input.title,
            description: input.description, created_by_user_id: user?.id ?? null,
          }).select().single();
          if (error) throw error;
          return data;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['tips'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  update: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { tipId, id, ...rest } = input;
          const realId = tipId ?? id;
          const ud: any = {};
          if (rest.title !== undefined) ud.title = rest.title;
          if (rest.description !== undefined) ud.description = rest.description;
          if (rest.category !== undefined) ud.category = rest.category;
          const { error } = await supabase.from('tips').update(ud).eq('id', realId);
          if (error) throw error;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['tips'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  delete: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const id = typeof input === 'number' ? input : input.tipId ?? input.id;
          await supabase.from('tips').delete().eq('id', id);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['tips'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
};

// ── VAULT ─────────────────────────────────────────────────────────────────────
const vault = {
  list: {
    useQuery: (input: any, opts?: any) => {
      return useQuery({
        queryKey: ['vault', input?.tripId],
        queryFn: async () => {
          const user = await getCurrentUser();
          if (!user) return [];
          let query = supabase.from('vault_documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
          if (input?.tripId) query = query.eq('trip_id', input.tripId);
          const { data, error } = await query;
          if (error) throw error;
          return (data ?? []).map((d: any) => ({
            ...d, documentType: d.document_type ?? d.documentType, isEncrypted: d.is_encrypted ?? d.isEncrypted,
            expiryDate: d.expiry_date ?? d.expiryDate, fileUrl: d.file_url ?? d.fileUrl, fileKey: d.file_key ?? d.fileKey,
          }));
        },
        ...opts,
      });
    },
  },
  // vault.create: store document metadata directly (no server upload needed)
  create: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const user = await getCurrentUser();
          if (!user) throw new Error('Not authenticated');
          const { data, error } = await supabase.from('vault_documents').insert({
            user_id: user.id, trip_id: input.tripId ?? null, title: input.title,
            document_type: input.documentType ?? 'other', notes: input.notes ?? null,
            file_key: input.fileKey ?? null, file_url: input.fileUrl ?? null,
            mime_type: input.mimeType ?? null, is_encrypted: false,
          }).select().single();
          if (error) throw error;
          return data;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['vault'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  delete: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const id = typeof input === 'number' ? input : input.docId ?? input.documentId ?? input.id;
          if (input.fileKey) await supabase.storage.from('vault').remove([input.fileKey]);
          await supabase.from('vault_documents').delete().eq('id', id);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['vault'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
};

// ── NEWS ─────────────────────────────────────────────────────────────────────
const news = {
  list: {
    useQuery: (input: any, opts?: any) => {
      const tripId = input?.tripId ?? input;
      return useQuery({
        queryKey: ['news', tripId],
        queryFn: async () => {
          if (!tripId) return [];
          const { data, error } = await supabase.from('news_items').select('*').eq('trip_id', tripId).order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
          if (error) throw error;
          return (data ?? []).map((n: any) => ({ ...n, isPinned: n.is_pinned ?? n.isPinned, createdAt: n.created_at }));
        },
        enabled: !!tripId,
        ...opts,
      });
    },
  },
  create: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const user = await getCurrentUser();
          if (!user) throw new Error('Not authenticated');
          const { data, error } = await supabase.from('news_items').insert({
            trip_id: input.tripId, title: input.title, content: input.content,
            category: input.category ?? 'info', is_pinned: input.isPinned ?? false, created_by: user.id,
          }).select().single();
          if (error) throw error;
          return data;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['news'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  delete: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const id = typeof input === 'number' ? input : input.newsId ?? input.id;
          await supabase.from('news_items').delete().eq('id', id);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['news'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  // seedDefaults: no-op (returns seeded=false so UI doesn't show toast)
  seedDefaults: {
    useMutation: (opts?: any) => {
      return useMutation({
        mutationFn: async (_input: any) => { return { seeded: false }; },
        onSuccess: (...a: any[]) => { opts?.onSettled?.(...a); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
};

// ── CUSTOM PHRASES ────────────────────────────────────────────────────────────
const customPhrases = {
  list: {
    useQuery: (input: any, opts?: any) => {
      const tripId = input?.tripId ?? input;
      return useQuery({
        queryKey: ['customPhrases', tripId],
        queryFn: async () => {
          if (!tripId) return [];
          const { data, error } = await supabase.from('custom_phrases').select('*').eq('trip_id', tripId).order('category', { ascending: true });
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
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const user = await getCurrentUser();
          if (!user) throw new Error('Not authenticated');
          const { data, error } = await supabase.from('custom_phrases').insert({
            trip_id: input.tripId, created_by_user_id: user.id, german: input.german,
            phonetic: input.phonetic, thai: input.thai ?? '', category: input.category ?? 'Eigene',
            note: input.note ?? '',
          }).select().single();
          if (error) throw error;
          return data;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['customPhrases'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  update: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { id, ...rest } = input;
          const ud: any = {};
          if (rest.german !== undefined) ud.german = rest.german;
          if (rest.phonetic !== undefined) ud.phonetic = rest.phonetic;
          if (rest.thai !== undefined) ud.thai = rest.thai;
          if (rest.note !== undefined) ud.note = rest.note;
          if (rest.category !== undefined) ud.category = rest.category;
          const { error } = await supabase.from('custom_phrases').update(ud).eq('id', id);
          if (error) throw error;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['customPhrases'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  delete: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const id = typeof input === 'number' ? input : input.id ?? input.phraseId;
          await supabase.from('custom_phrases').delete().eq('id', id);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['customPhrases'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
};

// ── TRANSLATOR ────────────────────────────────────────────────────────────────
// Client-side: uses MyMemory free API (no backend needed)
const translator = {
  translate: {
    useMutation: (opts?: any) => {
      return useMutation({
        mutationFn: async (input: any) => {
          const { text, targetLang } = input;
          const langMap: Record<string, string> = { th: 'th', de: 'de', en: 'en', fr: 'fr', es: 'es', ja: 'ja', zh: 'zh' };
          const toLang = langMap[targetLang] ?? targetLang;
          try {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=de|${toLang}`);
            const json = await res.json();
            const translation = json.responseData?.translatedText ?? text;
            return { translation, phonetic: '', original: text, targetLang };
          } catch {
            return { translation: text, phonetic: '', original: text, targetLang };
          }
        },
        onSuccess: (...a: any[]) => { opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
};

// ── CURRENCY ─────────────────────────────────────────────────────────────────
// Client-side: uses open.er-api.com (free, no key needed)
const currency = {
  rates: {
    useQuery: (input: any, opts?: any) => {
      const base = input?.base ?? 'CHF';
      return useQuery({
        queryKey: ['currency', base],
        queryFn: async () => {
          try {
            const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
            const json = await res.json();
            return { rates: json.rates ?? {}, lastUpdate: json.time_last_update_utc ?? new Date().toISOString() };
          } catch {
            // Fallback static rates (CHF base)
            const fallback: Record<string, number> = { CHF: 1, EUR: 0.94, USD: 1.09, THB: 38.5, GBP: 0.82, JPY: 163, AUD: 1.65, SGD: 1.45 };
            const baseRate = fallback[base] ?? 1;
            const rates: Record<string, number> = {};
            for (const [k, v] of Object.entries(fallback)) rates[k] = v / baseRate;
            return { rates, lastUpdate: new Date().toISOString() };
          }
        },
        staleTime: 5 * 60 * 1000,
        ...opts,
      });
    },
  },
};

// ── PACKING LIST ──────────────────────────────────────────────────────────────
const packingList = {
  list: {
    useQuery: (input: any, opts?: any) => {
      const tripId = input?.tripId ?? input;
      return useQuery({
        queryKey: ['packing', tripId],
        queryFn: async () => {
          if (!tripId) return [];
          const { data, error } = await supabase.from('packing_items').select('*').eq('trip_id', tripId).order('category', { ascending: true }).order('sort_order', { ascending: true });
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
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { data, error } = await supabase.from('packing_items').insert({
            trip_id: input.tripId, category: input.category, name: input.name, created_by: input.createdBy,
          }).select().single();
          if (error) throw error;
          return data;
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['packing'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  toggle: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { id, checked } = input;
          await supabase.from('packing_items').update({ checked }).eq('id', id);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['packing'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  delete: {
    useMutation: (opts?: any) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const id = typeof input === 'number' ? input : input.id ?? input.itemId;
          await supabase.from('packing_items').delete().eq('id', id);
        },
        onSuccess: (...a: any[]) => { qc.invalidateQueries({ queryKey: ['packing'] }); opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
  // seedDefaults: no-op (returns seeded=false)
  seedDefaults: {
    useMutation: (opts?: any) => {
      return useMutation({
        mutationFn: async (_input: any) => { return { seeded: false }; },
        onSuccess: (...a: any[]) => { opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
};

// ── PLACES (Google Maps stub – graceful no-op without API key) ─────────────
const places = {
  autocomplete: {
    useQuery: (_input: any, opts?: any) => {
      return useQuery({
        queryKey: ['places', 'autocomplete', _input?.input],
        queryFn: async () => [] as any[],
        enabled: false,
        ...opts,
      });
    },
  },
  details: {
    useQuery: (_input: any, opts?: any) => {
      return useQuery({
        queryKey: ['places', 'details', _input?.placeId],
        queryFn: async () => null,
        enabled: false,
        ...opts,
      });
    },
  },
};

// ── AI CHAT (stub – no backend) ───────────────────────────────────────────────
const ai = {
  chat: {
    useMutation: (opts?: any) => {
      return useMutation({
        mutationFn: async (_input: any) => { return 'AI-Chat ist noch nicht verfügbar.'; },
        onSuccess: (...a: any[]) => { opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
};

// ── AUTH ──────────────────────────────────────────────────────────────────────
const auth = {
  me: {
    useQuery: (_input?: any, opts?: any) => {
      return useQuery({
        queryKey: ['auth', 'me'],
        queryFn: async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return null;
          const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle();
          return profile ? { id: user.id, name: profile.display_name, email: user.email, role: 'member' } : { id: user.id, name: user.email?.split('@')[0], email: user.email, role: 'member' };
        },
        ...opts,
      });
    },
  },
  logout: {
    useMutation: (opts?: any) => {
      return useMutation({
        mutationFn: async () => { await supabase.auth.signOut(); },
        onSuccess: (...a: any[]) => { opts?.onSuccess?.(...a); },
        onError: opts?.onError,
      });
    },
  },
};

// ── EXPORT ────────────────────────────────────────────────────────────────────
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
  customPhrases,
  translator,
  currency,
  packingList,
  places,
  ai,
  useUtils: () => {
    const qc = useQueryClient();
    const makeList = (key: string) => ({
      invalidate: (input?: any) => qc.invalidateQueries({ queryKey: input ? [key, typeof input === 'object' ? JSON.stringify(input) : input] : [key] }),
      setData: (input: any, updater: any) => qc.setQueryData([key, typeof input === 'object' ? JSON.stringify(input) : input], updater),
      getData: (input: any) => qc.getQueryData([key, typeof input === 'object' ? JSON.stringify(input) : input]),
      cancel: (input?: any) => qc.cancelQueries({ queryKey: input ? [key, typeof input === 'object' ? JSON.stringify(input) : input] : [key] }),
    });
    return {
      auth: { me: { setData: (_: any, d: any) => qc.setQueryData(['auth', 'me'], d), invalidate: () => qc.invalidateQueries({ queryKey: ['auth'] }) } },
      trips: { list: makeList('trips') },
      members: { list: makeList('members') },
      expenses: { list: makeList('expenses'), balances: makeList('balances') },
      debtPayments: { list: makeList('debtPayments') },
      chat: { messages: { ...makeList('chat'), invalidate: () => qc.invalidateQueries({ queryKey: ['chat'] }) } },
      timeline: { list: makeList('timeline') },
      activities: {
        list: makeList('activities'),
        listComments: {
          invalidate: (input?: any) => qc.invalidateQueries({ queryKey: input?.activityId ? ['activityComments', input.activityId] : ['activityComments'] }),
        },
      },
      accommodations: { list: makeList('accommodations') },
      plannedStays: {
        list: makeList('plannedStays'),
        myInvitations: { invalidate: (input?: any) => qc.invalidateQueries({ queryKey: input ? ['myInvitations', input.tripId] : ['myInvitations'] }) },
      },
      shopping: {
        lists: makeList('shopping'),
        items: { invalidate: (input?: any) => qc.invalidateQueries({ queryKey: input?.listId ? ['shoppingItems', input.listId] : ['shoppingItems'] }) },
      },
      tasks: { list: makeList('tasks') },
      transports: { list: makeList('transports') },
      contacts: { list: makeList('contacts') },
      tips: { list: makeList('tips') },
      vault: { list: makeList('vault') },
      news: {
        list: {
          invalidate: (input?: any) => qc.invalidateQueries({ queryKey: input?.tripId ? ['news', input.tripId] : ['news'] }),
          setData: (input: any, updater: any) => qc.setQueryData(['news', input?.tripId ?? input], updater),
          getData: (input: any) => qc.getQueryData(['news', input?.tripId ?? input]),
          cancel: (input?: any) => qc.cancelQueries({ queryKey: input?.tripId ? ['news', input.tripId] : ['news'] }),
        },
      },
      packingList: {
        list: {
          invalidate: (input?: any) => qc.invalidateQueries({ queryKey: input?.tripId ? ['packing', input.tripId] : ['packing'] }),
          setData: (input: any, updater: any) => qc.setQueryData(['packing', input?.tripId ?? input], updater),
          getData: (input: any) => qc.getQueryData(['packing', input?.tripId ?? input]),
          cancel: (input?: any) => qc.cancelQueries({ queryKey: input?.tripId ? ['packing', input.tripId] : ['packing'] }),
        },
      },
      customPhrases: { list: makeList('customPhrases') },
    };
  },
};
