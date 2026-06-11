import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useExpenses(tripId: number | undefined) {
  const queryClient = useQueryClient();

  const expensesQuery = useQuery({
    queryKey: ['expenses', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('expenses')
        .select('*, expense_participants(*)')
        .eq('trip_id', tripId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tripId,
  });

  const createExpense = useMutation({
    mutationFn: async (input: {
      tripId: number;
      title: string;
      description?: string;
      category?: string;
      totalAmount: number;
      currency?: string;
      paidByMemberId: number;
      splitType?: string;
      participantIds: number[];
      customShares?: { memberId: number; amount: number }[];
      date?: string;
      isPersonal?: boolean;
      personalAmount?: number;
      paymentMethod?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create expense
      const { data: expense, error } = await supabase
        .from('expenses')
        .insert({
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
          created_by_user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Create participants
      const participants = input.participantIds.map(memberId => {
        const customShare = input.customShares?.find(s => s.memberId === memberId);
        const shareAmount = input.splitType === 'custom' && customShare
          ? customShare.amount
          : input.totalAmount / input.participantIds.length;

        return {
          expense_id: expense.id,
          member_id: memberId,
          share_amount: shareAmount,
          share_percentage: input.splitType === 'percentage' && customShare
            ? customShare.amount
            : null,
        };
      });

      const { error: partError } = await supabase
        .from('expense_participants')
        .insert(participants);

      if (partError) throw partError;
      return expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', tripId] });
      queryClient.invalidateQueries({ queryKey: ['balances', tripId] });
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (expenseId: number) => {
      const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', tripId] });
      queryClient.invalidateQueries({ queryKey: ['balances', tripId] });
    },
  });

  const updateExpense = useMutation({
    mutationFn: async (input: {
      expenseId: number;
      title: string;
      totalAmount: number;
      category: string;
      paidByMemberId: number;
      splitType: string;
      participantIds: number[];
      customShares?: { memberId: number; amount: number }[];
      isPersonal?: boolean;
      personalAmount?: number;
      paymentMethod?: string;
    }) => {
      const { error } = await supabase
        .from('expenses')
        .update({
          title: input.title,
          total_amount: input.totalAmount,
          category: input.category,
          paid_by_member_id: input.paidByMemberId,
          split_type: input.splitType,
          is_personal: input.isPersonal ?? false,
          personal_amount: input.personalAmount ?? 0,
          payment_method: input.paymentMethod ?? 'cash',
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.expenseId);

      if (error) throw error;

      // Re-create participants
      await supabase.from('expense_participants').delete().eq('expense_id', input.expenseId);

      const participants = input.participantIds.map(memberId => {
        const customShare = input.customShares?.find(s => s.memberId === memberId);
        const shareAmount = input.splitType === 'custom' && customShare
          ? customShare.amount
          : input.totalAmount / input.participantIds.length;

        return {
          expense_id: input.expenseId,
          member_id: memberId,
          share_amount: shareAmount,
        };
      });

      await supabase.from('expense_participants').insert(participants);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', tripId] });
      queryClient.invalidateQueries({ queryKey: ['balances', tripId] });
    },
  });

  return {
    expenses: expensesQuery.data ?? [],
    isLoading: expensesQuery.isLoading,
    createExpense,
    deleteExpense,
    updateExpense,
    refetch: expensesQuery.refetch,
  };
}

export function useBalances(tripId: number | undefined) {
  return useQuery({
    queryKey: ['balances', tripId],
    queryFn: async () => {
      if (!tripId) return { balances: [], settlements: [] };

      const { data: members } = await supabase
        .from('trip_members')
        .select('id')
        .eq('trip_id', tripId);

      const { data: expenses } = await supabase
        .from('expenses')
        .select('*, expense_participants(*)')
        .eq('trip_id', tripId)
        .eq('is_personal', false);

      if (!members || !expenses) return { balances: [], settlements: [] };

      // Build balance map
      const balanceMap: Record<number, number> = {};
      for (const m of members) balanceMap[m.id] = 0;

      for (const exp of expenses) {
        const totalAmount = Number(exp.total_amount);
        const paidById = exp.paid_by_member_id;
        balanceMap[paidById] = (balanceMap[paidById] ?? 0) + totalAmount;

        for (const p of (exp.expense_participants ?? [])) {
          const share = Number(p.share_amount ?? 0);
          balanceMap[p.member_id] = (balanceMap[p.member_id] ?? 0) - share;
        }
      }

      // Simplify debts
      const settlements: Array<{ fromMemberId: number; toMemberId: number; amount: number }> = [];
      const creditors = members.filter(m => (balanceMap[m.id] ?? 0) > 0.01).map(m => ({ id: m.id, amount: balanceMap[m.id] ?? 0 }));
      const debtors = members.filter(m => (balanceMap[m.id] ?? 0) < -0.01).map(m => ({ id: m.id, amount: Math.abs(balanceMap[m.id] ?? 0) }));

      let ci = 0, di = 0;
      while (ci < creditors.length && di < debtors.length) {
        const creditor = creditors[ci]!;
        const debtor = debtors[di]!;
        const amount = Math.min(creditor.amount, debtor.amount);
        if (amount > 0.01) {
          settlements.push({ fromMemberId: debtor.id, toMemberId: creditor.id, amount: Math.round(amount * 100) / 100 });
        }
        creditor.amount -= amount;
        debtor.amount -= amount;
        if (creditor.amount < 0.01) ci++;
        if (debtor.amount < 0.01) di++;
      }

      return {
        balances: Object.entries(balanceMap).map(([memberId, balance]) => ({
          memberId: parseInt(memberId),
          balance: Math.round(balance * 100) / 100,
        })),
        settlements,
      };
    },
    enabled: !!tripId,
  });
}

export function useDebtPayments(tripId: number | undefined) {
  const queryClient = useQueryClient();

  const paymentsQuery = useQuery({
    queryKey: ['debtPayments', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('debt_payments')
        .select('*')
        .eq('trip_id', tripId)
        .order('paid_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tripId,
  });

  const markAsPaid = useMutation({
    mutationFn: async (input: {
      tripId: number;
      fromMemberId: number;
      toMemberId: number;
      amount: number;
      currency?: string;
      note?: string;
    }) => {
      const { data, error } = await supabase
        .from('debt_payments')
        .insert({
          trip_id: input.tripId,
          from_member_id: input.fromMemberId,
          to_member_id: input.toMemberId,
          amount: input.amount,
          currency: input.currency ?? 'THB',
          note: input.note ?? '',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debtPayments', tripId] });
    },
  });

  return {
    payments: paymentsQuery.data ?? [],
    isLoading: paymentsQuery.isLoading,
    markAsPaid,
  };
}
