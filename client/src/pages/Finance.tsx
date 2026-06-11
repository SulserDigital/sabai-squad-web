// Finance.tsx – Echtes Kosten-Splitting mit tRPC-Backend
// Flexibles Splitting: jede Ausgabe hat individuelle Teilnehmer
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Plus, Trash2, ChevronDown, ChevronUp, Users, Pencil,
  ArrowRight, TrendingUp, Check, Plane, Bed, UtensilsCrossed,
  Ticket, ShoppingBag, Wine, MoreHorizontal, Car, Wallet, MapPin,
  LogIn, Loader2, CircleCheck, ArrowUpRight, Lock, Plug, User, Eye, EyeOff, Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import MemberAvatar from "@/components/MemberAvatar";

// ── Category Configuration ──────────────────────────────────────────────────
const CATEGORIES = [
  { id: "food", label: "Essen", icon: UtensilsCrossed },
  { id: "party", label: "Party/Drinks", icon: Wine },
  { id: "transport", label: "Taxi/Transport", icon: Car },
  { id: "accommodation", label: "Hotel/Unterkunft", icon: Bed },
  { id: "flights", label: "Flüge", icon: Plane },
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
  { id: "activities", label: "Aktivität/Tour", icon: Ticket },
  { id: "other", label: "Sonstiges", icon: MoreHorizontal },
] as const;

const CATEGORY_ICONS: Record<string, typeof Plane> = Object.fromEntries(
  CATEGORIES.map(c => [c.id, c.icon])
);
const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map(c => [c.id, c.label])
);

const MEMBER_COLORS = [
  "oklch(0.78 0.14 75)", "oklch(0.72 0.14 185)", "oklch(0.65 0.22 150)",
  "oklch(0.70 0.16 300)", "oklch(0.75 0.18 30)", "oklch(0.68 0.20 220)",
];

export default function Finance() {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "expenses" | "personal" | "settle">("overview");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showGoCardless, setShowGoCardless] = useState(false);
  const [showWiseModal, setShowWiseModal] = useState(false);
  const [expandedExpense, setExpandedExpense] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [markPaidDialog, setMarkPaidDialog] = useState<{ fromMemberId: number; toMemberId: number; amount: number } | null>(null);
  const [markPaidNote, setMarkPaidNote] = useState("");

  // ── Queries ────────────────────────────────────────────────────────────────
  const tripsQuery = trpc.trips.list.useQuery(undefined, { enabled: isAuthenticated });
  const activeTripId = tripsQuery.data?.[0]?.id ?? 0;
  const hasTrip = activeTripId > 0;

  const membersQuery = trpc.members.list.useQuery(
    { tripId: activeTripId },
    { enabled: hasTrip }
  );
  const expensesQuery = trpc.expenses.list.useQuery(
    { tripId: activeTripId },
    { enabled: hasTrip }
  );
  const balancesQuery = trpc.expenses.balances.useQuery(
    { tripId: activeTripId },
    { enabled: hasTrip }
  );
  const debtPaymentsQuery = trpc.debtPayments.list.useQuery(
    { tripId: activeTripId },
    { enabled: hasTrip }
  );

  const utils = trpc.useUtils();

  // ── Mutations ──────────────────────────────────────────────────────────────
  const deleteExpense = trpc.expenses.delete.useMutation({
    onSuccess: () => {
      utils.expenses.list.invalidate({ tripId: activeTripId });
      utils.expenses.balances.invalidate({ tripId: activeTripId });
      toast.success("Ausgabe gelöscht");
    },
    onError: (err) => {
      toast.error(err.message || "Fehler beim Löschen");
    },
  });

  const markAsPaid = trpc.debtPayments.markAsPaid.useMutation({
    onSuccess: () => {
      utils.debtPayments.list.invalidate({ tripId: activeTripId });
      toast.success("Als bezahlt markiert!");
      setMarkPaidDialog(null);
      setMarkPaidNote("");
    },
    onError: (err) => toast.error(err.message || "Fehler"),
  });

  const deleteDebtPayment = trpc.debtPayments.delete.useMutation({
    onSuccess: () => {
      utils.debtPayments.list.invalidate({ tripId: activeTripId });
      toast.success("Zahlung entfernt");
    },
    onError: (err) => toast.error(err.message || "Fehler"),
  });

  const members = membersQuery.data ?? [];
  const expenses = expensesQuery.data ?? [];
  const balances = balancesQuery.data;
  const debtPayments = debtPaymentsQuery.data ?? [];

  // ── Computed ───────────────────────────────────────────────────────────────
  const groupExpenses = useMemo(() => expenses.filter(e => !(e as any).isPersonal), [expenses]);
  const personalExpenses = useMemo(() => expenses.filter(e => (e as any).isPersonal), [expenses]);

  const totalAmount = useMemo(
    () => groupExpenses.reduce((sum, e) => sum + parseFloat(String(e.totalAmount)), 0),
    [groupExpenses]
  );

  const personalTotal = useMemo(
    () => personalExpenses.reduce((sum, e) => sum + parseFloat(String(e.totalAmount)), 0),
    [personalExpenses]
  );

  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of groupExpenses) {
      map[e.category] = (map[e.category] ?? 0) + parseFloat(String(e.totalAmount));
    }
    return Object.entries(map)
      .map(([cat, amount]) => ({ cat, amount, percent: totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, [groupExpenses, totalAmount]);

  // Build a set of "fromId-toId" keys for paid settlements
  const paidSettlementKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const p of debtPayments) {
      keys.add(`${p.fromMemberId}-${p.toMemberId}`);
    }
    return keys;
  }, [debtPayments]);

  const filteredExpenses = useMemo(() => {
    const base = activeTab === "personal" ? personalExpenses : groupExpenses;
    return filterCategory ? base.filter(e => e.category === filterCategory) : base;
  }, [groupExpenses, personalExpenses, activeTab, filterCategory]);

  const getMemberName = (id: number) => members.find(m => m.id === id)?.displayName ?? `#${id}`;
  const getMember = (id: number) => members.find(m => m.id === id);

  if (!isAuthenticated) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Wallet className="w-14 h-14 text-[oklch(0.78_0.14_75)] mb-4" strokeWidth={1.5} />
          <h2 className="text-2xl font-bold text-white mb-3">Anmelden erforderlich</h2>
          <p className="text-[oklch(0.60_0.02_255)] mb-6">Melde dich an um Ausgaben zu verwalten.</p>
          <a href="/login" className="px-6 py-3 rounded-xl bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)] font-semibold">
            Anmelden
          </a>
        </div>
      </div>
    );
  }

  if (!hasTrip && !tripsQuery.isLoading) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-14 h-14 text-[oklch(0.78_0.14_75)] mb-4" strokeWidth={1.5} />
          <h2 className="text-2xl font-bold text-white mb-3">Noch keine Reise</h2>
          <p className="text-[oklch(0.60_0.02_255)] mb-6">Erstelle zuerst eine Reise im Dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(0.11_0.02_255)]">
      <div className="container mx-auto px-4 lg:px-8 pt-20 pb-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-start justify-between">
          <div>
            <span className="text-[oklch(0.78_0.14_75)] text-sm font-medium uppercase tracking-widest">
              {tripsQuery.data?.[0]?.name ?? "Meine Reise"} · Finanzen
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-white mt-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Kosten-<span className="text-gold-gradient">Splitting</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWiseModal(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-[oklch(0.20_0.02_255)] border border-[oklch(0.30_0.02_255)] text-[oklch(0.72_0.14_185)] hover:bg-[oklch(0.25_0.02_255)] transition-all text-sm font-medium"
            >
              <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} />
              In Wise öffnen
            </button>
            <Button
              onClick={() => setShowAddExpense(true)}
              disabled={!hasTrip || members.length === 0}
              className="bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)] hover:opacity-90 font-semibold gap-2"
            >
              <Plus className="w-4 h-4" />
              Ausgabe
            </Button>
          </div>
        </motion.div>

        {/* Wise button mobile */}
        <div className="sm:hidden mb-4">
          <button
            onClick={() => setShowWiseModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[oklch(0.20_0.02_255)] border border-[oklch(0.30_0.02_255)] text-[oklch(0.72_0.14_185)] hover:bg-[oklch(0.25_0.02_255)] transition-all text-sm font-medium w-full"
          >
            <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} />
            In Wise öffnen
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card-gold p-5 rounded-2xl">
            <div className="text-sm text-[oklch(0.78_0.14_75/70%)]">Gruppenausgaben</div>
            <div className="text-3xl font-bold text-[oklch(0.78_0.14_75)] mt-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              CHF {totalAmount.toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-[oklch(0.55_0.02_255)] mt-1">{groupExpenses.length} Ausgaben</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass-card p-5 rounded-2xl">
            <div className="text-sm text-[oklch(0.60_0.02_255)]">Persönlich</div>
            <div className="text-3xl font-bold text-white mt-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              CHF {personalTotal.toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-[oklch(0.55_0.02_255)] mt-1">{personalExpenses.length} private Ausgaben</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-card p-5 rounded-2xl">
            <div className="text-sm text-[oklch(0.60_0.02_255)]">Offene Ausgleiche</div>
            <div className="text-3xl font-bold text-[oklch(0.72_0.14_185)] mt-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              {balances?.settlements.length ?? 0}
            </div>
            <div className="text-xs text-[oklch(0.55_0.02_255)] mt-1">Überweisungen nötig</div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          {(["overview", "expenses", "personal", "settle"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setFilterCategory(null); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === tab
                  ? "bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)]"
                  : "glass-card text-[oklch(0.65_0.02_255)] hover:text-white"
              }`}
            >
              {tab === "personal" && <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />}
              {tab === "overview" ? "Übersicht" : tab === "expenses" ? "Gruppe" : tab === "personal" ? "Persönlich" : "Ausgleich"}
            </button>
          ))}
          {/* GoCardless / Wise connect button */}
          <button
            onClick={() => setShowGoCardless(true)}
            className="ml-auto px-3 py-2 rounded-xl text-sm font-medium glass-card text-[oklch(0.55_0.02_255)] hover:text-white transition-all flex items-center gap-1.5"
          >
            <Plug className="w-3.5 h-3.5" strokeWidth={1.5} />
            Konto verbinden
          </button>
        </div>

        {/* ── TAB: OVERVIEW ── */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-[oklch(0.78_0.14_75)]" />
                Mitglieder-Salden
              </h3>
              {members.length === 0 ? (
                <div className="text-center py-8 text-[oklch(0.55_0.02_255)]">
                  Noch keine Mitglieder. Füge Mitglieder zur Reise hinzu.
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member, i) => {
                    const balance = balances?.balances.find(b => b.memberId === member.id)?.balance ?? 0;
                    const isPositive = balance >= 0;
                    return (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-[oklch(0.15_0.02_255)]"
                      >
                        <div className="flex items-center gap-3">
                          <MemberAvatar
                            avatarUrl={(member as any).avatarUrl}
                            avatarIcon={(member as any).avatarIcon}
                            avatarColor={(member as any).avatarColor}
                            displayName={member.displayName}
                            size="sm"
                          />
                          <div className="font-medium text-white text-sm">{member.displayName}</div>
                        </div>
                        <div className={`font-semibold text-sm ${isPositive ? "text-[oklch(0.65_0.22_150)]" : "text-[oklch(0.70_0.20_30)]"}`}>
                          {isPositive ? "+" : ""}CHF {balance.toFixed(2)}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {categoryTotals.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[oklch(0.72_0.14_185)]" />
                  Nach Kategorie
                </h3>
                <div className="space-y-3">
                  {categoryTotals.map(({ cat, amount, percent }, i) => (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[oklch(0.70_0.02_255)] flex items-center gap-2">
                          {(() => { const I = CATEGORY_ICONS[cat] ?? MoreHorizontal; return <I className="w-4 h-4" strokeWidth={1.5} />; })()}
                          {CATEGORY_LABELS[cat] ?? cat}
                        </span>
                        <span className="text-sm font-medium text-white">
                          CHF {amount.toFixed(2)} <span className="text-[oklch(0.50_0.02_255)]">({percent}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 bg-[oklch(0.20_0.02_255)] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                          className="h-full rounded-full"
                          style={{ background: MEMBER_COLORS[i % MEMBER_COLORS.length] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB: EXPENSES (Group) & PERSONAL ── */}
        {(activeTab === "expenses" || activeTab === "personal") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {/* Personal tab info banner + budget summary */}
            {activeTab === "personal" && (
              <>
                <div className="glass-card rounded-2xl p-4 flex items-center gap-3 mb-2 border border-[oklch(0.30_0.02_255)]">
                  <EyeOff className="w-5 h-5 text-[oklch(0.60_0.02_255)] shrink-0" strokeWidth={1.5} />
                  <p className="text-xs text-[oklch(0.60_0.02_255)]">
                    Persönliche Ausgaben sind nur für dich sichtbar und werden nicht in den Gruppen-Ausgleich einbezogen.
                  </p>
                </div>
                {/* Personal budget breakdown by payment method */}
                {(() => {
                  const allPersonalAmounts = expenses.map(e => ({
                    personalAmount: parseFloat(String((e as any).personalAmount ?? "0")),
                    paymentMethod: (e as any).paymentMethod ?? "cash",
                    totalAmount: parseFloat(String(e.totalAmount)),
                    isPersonal: (e as any).isPersonal,
                  }));
                  const totalPersonalFromGroup = allPersonalAmounts
                    .filter(e => !e.isPersonal && e.personalAmount > 0)
                    .reduce((sum, e) => sum + e.personalAmount, 0);
                  const totalPersonalDirect = allPersonalAmounts
                    .filter(e => e.isPersonal)
                    .reduce((sum, e) => sum + e.totalAmount, 0);
                  const wiseTotal = allPersonalAmounts
                    .filter(e => e.paymentMethod === "wise")
                    .reduce((sum, e) => sum + (e.isPersonal ? e.totalAmount : e.personalAmount), 0);
                  const cashTotal = allPersonalAmounts
                    .filter(e => e.paymentMethod === "cash")
                    .reduce((sum, e) => sum + (e.isPersonal ? e.totalAmount : e.personalAmount), 0);
                  const grandTotal = totalPersonalFromGroup + totalPersonalDirect;
                  if (grandTotal === 0) return null;
                  return (
                    <div className="glass-card rounded-2xl p-4 border border-[oklch(0.65_0.15_300/30%)] bg-[oklch(0.65_0.15_300/5%)]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-[oklch(0.65_0.15_300)] uppercase tracking-wider">Persönliches Budget</span>
                        <span className="text-lg font-bold text-white">CHF {grandTotal.toFixed(2)}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 rounded-xl bg-[oklch(0.20_0.02_255)]">
                          <div className="text-[oklch(0.55_0.02_255)] mb-1">Aus Gruppe</div>
                          <div className="font-semibold text-white">CHF {totalPersonalFromGroup.toFixed(2)}</div>
                        </div>
                        <div className="text-center p-2 rounded-xl bg-[oklch(0.20_0.02_255)]">
                          <div className="text-[oklch(0.55_0.02_255)] mb-1">💳 Wise</div>
                          <div className="font-semibold text-white">CHF {wiseTotal.toFixed(2)}</div>
                        </div>
                        <div className="text-center p-2 rounded-xl bg-[oklch(0.20_0.02_255)]">
                          <div className="text-[oklch(0.55_0.02_255)] mb-1">💵 Bargeld</div>
                          <div className="font-semibold text-white">CHF {cashTotal.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            {/* Category Filter Chips */}
            {(activeTab === "expenses" ? groupExpenses : personalExpenses).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  onClick={() => setFilterCategory(null)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    filterCategory === null
                      ? "bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)]"
                      : "bg-[oklch(0.20_0.02_255)] text-[oklch(0.60_0.02_255)] hover:bg-[oklch(0.25_0.02_255)]"
                  }`}
                >
                  Alle
                </button>
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const isActive = filterCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setFilterCategory(isActive ? null : cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                        isActive
                          ? "bg-[oklch(0.78_0.14_75/20%)] border border-[oklch(0.78_0.14_75/50%)] text-[oklch(0.78_0.14_75)]"
                          : "bg-[oklch(0.20_0.02_255)] text-[oklch(0.60_0.02_255)] hover:bg-[oklch(0.25_0.02_255)]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            )}

            {expensesQuery.isLoading ? (
              <div className="text-center py-12 text-[oklch(0.55_0.02_255)]">Lade Ausgaben...</div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-12">
                {activeTab === "personal" ? (
                  <>
                    <Lock className="w-12 h-12 text-[oklch(0.55_0.02_255)] mb-4 mx-auto" strokeWidth={1.5} />
                    <p className="text-[oklch(0.55_0.02_255)] mb-4">Noch keine persönlichen Ausgaben.</p>
                  </>
                ) : (
                  <>
                    <Wallet className="w-12 h-12 text-[oklch(0.55_0.02_255)] mb-4 mx-auto" strokeWidth={1.5} />
                    <p className="text-[oklch(0.55_0.02_255)] mb-4">
                      {filterCategory ? "Keine Ausgaben in dieser Kategorie." : "Noch keine Ausgaben erfasst."}
                    </p>
                  </>
                )}
                <Button
                  onClick={() => setShowAddExpense(true)}
                  disabled={members.length === 0}
                  className="bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)]"
                >
                  <Plus className="w-4 h-4 mr-2" /> Ausgabe erfassen
                </Button>
              </div>
            ) : (
              filteredExpenses.map((expense, i) => {
                const isExpanded = expandedExpense === expense.id;
                const amount = parseFloat(String(expense.totalAmount));
                const payer = getMember(expense.paidByMemberId);
                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="glass-card rounded-2xl overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer"
                      onClick={() => setExpandedExpense(isExpanded ? null : expense.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[oklch(0.78_0.14_75/15%)] flex items-center justify-center text-[oklch(0.78_0.14_75)]">
                          {(() => { const I = CATEGORY_ICONS[expense.category] ?? MoreHorizontal; return <I className="w-5 h-5" strokeWidth={1.5} />; })()}
                        </div>
                        <div>
                          <div className="font-medium text-white text-sm flex items-center gap-2">
                            {expense.title}
                            {(expense as any).isPersonal && (
                              <Badge variant="outline" className="text-[10px] border-[oklch(0.40_0.02_255)] text-[oklch(0.55_0.02_255)] px-1.5 py-0">
                                <Lock className="w-2.5 h-2.5 mr-0.5" /> Privat
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-[oklch(0.55_0.02_255)] flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <MemberAvatar
                                avatarUrl={(payer as any)?.avatarUrl}
                                avatarIcon={(payer as any)?.avatarIcon}
                                avatarColor={(payer as any)?.avatarColor}
                                displayName={payer?.displayName || "?"}
                                size="xs"
                              />
                              {payer?.displayName ?? `#${expense.paidByMemberId}`}
                            </span>
                            <span>·</span>
                            <span>{new Date(expense.date).toLocaleDateString("de-CH", { day: "numeric", month: "short" })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-1">
                          <div className="font-bold text-[oklch(0.78_0.14_75)] text-sm">CHF {amount.toFixed(2)}</div>
                          <Badge variant="outline" className="text-xs border-[oklch(0.30_0.02_255)] text-[oklch(0.55_0.02_255)]">
                            {CATEGORY_LABELS[expense.category] ?? expense.category}
                          </Badge>
                        </div>
                        {(expense as any).createdByUserId === user?.id && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingExpense(expense); }}
                              className="p-1.5 rounded-lg text-[oklch(0.55_0.02_255)] hover:text-[oklch(0.72_0.14_185)] hover:bg-[oklch(0.20_0.02_255)] transition-all"
                              title="Bearbeiten"
                            >
                              <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(expense.id); }}
                              className="p-1.5 rounded-lg text-[oklch(0.55_0.02_255)] hover:text-[oklch(0.70_0.20_30)] hover:bg-[oklch(0.70_0.20_30/10%)] transition-all"
                              title="Löschen"
                            >
                              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                            </button>
                          </>
                        )}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-[oklch(0.50_0.02_255)]" /> : <ChevronDown className="w-4 h-4 text-[oklch(0.50_0.02_255)]" />}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-[oklch(0.20_0.02_255)] px-4 pb-4 pt-3"
                        >
                          {/* Prominent "Bezahlt von" section */}
                          <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-[oklch(0.13_0.02_255)]">
                            <span className="text-xs text-[oklch(0.50_0.02_255)]">Bezahlt von:</span>
                            <MemberAvatar
                              avatarUrl={(payer as any)?.avatarUrl}
                              avatarIcon={(payer as any)?.avatarIcon}
                              avatarColor={(payer as any)?.avatarColor}
                              displayName={payer?.displayName || "?"}
                              size="sm"
                            />
                            <span className="text-sm font-medium text-white">{payer?.displayName ?? `#${expense.paidByMemberId}`}</span>
                            <span className="ml-auto text-sm font-bold text-[oklch(0.78_0.14_75)]">CHF {amount.toFixed(2)}</span>
                          </div>

                          {/* Personal amount + payment method info */}
                          {((expense as any).personalAmount > 0 || (expense as any).paymentMethod) && (
                            <div className="flex items-center gap-3 mb-3 text-xs text-[oklch(0.55_0.02_255)]">
                              {(expense as any).personalAmount > 0 && (
                                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[oklch(0.65_0.15_300/10%)] border border-[oklch(0.65_0.15_300/30%)] text-[oklch(0.65_0.15_300)]">
                                  <User className="w-3 h-3" strokeWidth={1.5} />
                                  Persönlich: CHF {parseFloat(String((expense as any).personalAmount)).toFixed(2)}
                                </span>
                              )}
                              {(expense as any).paymentMethod && (
                                <span className="flex items-center gap-1">
                                  {(expense as any).paymentMethod === "wise" ? "💳 Wise" : (expense as any).paymentMethod === "cash" ? "💵 Bargeld" : "🔗 Andere"}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="text-xs text-[oklch(0.55_0.02_255)] mb-3">
                            Aufteilung ({expense.splitType === "equal" ? "Gleich" : "Individuell"}):
                          </div>
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {((expense as any).participants ?? []).map((p: any) => {
                              const member = members.find(m => m.id === p.memberId);
                              return (
                                <div key={p.memberId} className="flex items-center justify-between bg-[oklch(0.15_0.02_255)] rounded-lg px-3 py-2">
                                  <span className="text-xs text-[oklch(0.70_0.02_255)] flex items-center gap-1.5">
                                    <MemberAvatar
                                      avatarUrl={(member as any)?.avatarUrl}
                                      avatarIcon={(member as any)?.avatarIcon}
                                      avatarColor={(member as any)?.avatarColor}
                                      displayName={member?.displayName || "?"}
                                      size="xs"
                                    />
                                    {member?.displayName ?? `#${p.memberId}`}
                                  </span>
                                  <span className="text-xs font-medium text-white">
                                    CHF {parseFloat(String(p.shareAmount ?? 0)).toFixed(2)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {/* ── TAB: SETTLE ── */}
        {activeTab === "settle" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

            {/* ── OPEN SETTLEMENTS ── */}
            <div>
              <h3 className="text-sm font-semibold text-[oklch(0.78_0.14_75)] uppercase tracking-widest mb-3 flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Offene Schulden
              </h3>
              {!balances || balances.settlements.filter(s => !paidSettlementKeys.has(`${s.fromMemberId}-${s.toMemberId}`)).length === 0 ? (
                <div className="glass-card rounded-2xl p-8 text-center">
                  <CircleCheck className="w-10 h-10 text-[oklch(0.65_0.22_150)] mb-3 mx-auto" strokeWidth={1.5} />
                  <h3 className="text-lg font-bold text-white mb-1">Alles ausgeglichen!</h3>
                  <p className="text-sm text-[oklch(0.55_0.02_255)]">Keine offenen Schulden.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {balances!.settlements
                    .filter(s => !paidSettlementKeys.has(`${s.fromMemberId}-${s.toMemberId}`))
                    .map((s, i) => {
                      const fromMember = getMember(s.fromMemberId);
                      const toMember = getMember(s.toMemberId);
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="glass-card rounded-2xl p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <MemberAvatar
                                avatarUrl={(fromMember as any)?.avatarUrl}
                                avatarIcon={(fromMember as any)?.avatarIcon}
                                avatarColor={(fromMember as any)?.avatarColor}
                                displayName={fromMember?.displayName || "?"}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <div className="font-medium text-white text-sm truncate">{getMemberName(s.fromMemberId)}</div>
                                <div className="text-xs text-[oklch(0.60_0.20_30)]">schuldet</div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-[oklch(0.78_0.14_75)] shrink-0" />
                              <MemberAvatar
                                avatarUrl={(toMember as any)?.avatarUrl}
                                avatarIcon={(toMember as any)?.avatarIcon}
                                avatarColor={(toMember as any)?.avatarColor}
                                displayName={toMember?.displayName || "?"}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <div className="font-medium text-white text-sm truncate">{getMemberName(s.toMemberId)}</div>
                                <div className="text-xs text-[oklch(0.65_0.22_150)]">erhält</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <div className="text-lg font-bold text-[oklch(0.60_0.20_30)]">CHF {s.amount.toFixed(2)}</div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => setMarkPaidDialog({ fromMemberId: s.fromMemberId, toMemberId: s.toMemberId, amount: s.amount })}
                                className="bg-[oklch(0.65_0.22_150/20%)] hover:bg-[oklch(0.65_0.22_150/35%)] text-[oklch(0.65_0.22_150)] border border-[oklch(0.65_0.22_150/40%)] text-xs font-medium px-3 h-8"
                              >
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Bezahlt
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* ── PAID SETTLEMENTS ── */}
            {debtPayments.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[oklch(0.65_0.22_150)] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CircleCheck className="w-4 h-4" />
                  Erledigt ({debtPayments.length})
                </h3>
                <div className="space-y-2">
                  {debtPayments.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="glass-card rounded-xl p-3 flex items-center justify-between opacity-70"
                    >
                      <div className="flex items-center gap-2">
                        <CircleCheck className="w-4 h-4 text-[oklch(0.65_0.22_150)] shrink-0" />
                        <span className="text-sm text-[oklch(0.70_0.02_255)] line-through">
                          {getMemberName(p.fromMemberId)} → {getMemberName(p.toMemberId)}
                        </span>
                        {(p.note as string) && (
                          <span className="text-xs text-[oklch(0.55_0.02_255)] italic ml-1">· {p.note as string}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[oklch(0.65_0.22_150)] font-medium">CHF {parseFloat(p.amount as string).toFixed(2)}</span>
                        <button
                          onClick={() => deleteDebtPayment.mutate({ id: p.id })}
                          className="text-[oklch(0.45_0.02_255)] hover:text-[oklch(0.70_0.20_30)] transition-colors"
                          title="Rückgängig"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* ── ADD EXPENSE DIALOG ── */}
      <AddExpenseDialog
        open={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        tripId={activeTripId}
        members={members}
        defaultPersonal={activeTab === "personal"}
        onSuccess={() => {
          utils.expenses.list.invalidate({ tripId: activeTripId });
          utils.expenses.balances.invalidate({ tripId: activeTripId });
          setShowAddExpense(false);
        }}
      />

      {/* ── EDIT EXPENSE DIALOG ── */}
      {editingExpense && (
        <EditExpenseDialog
          open={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          tripId={activeTripId}
          members={members}
          expense={editingExpense}
          onSuccess={() => {
            utils.expenses.list.invalidate({ tripId: activeTripId });
            utils.expenses.balances.invalidate({ tripId: activeTripId });
            setEditingExpense(null);
          }}
        />
      )}

      {/* ── CONFIRM DELETE DIALOG ── */}
      <Dialog open={confirmDeleteId !== null} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
        <DialogContent className="bg-[oklch(0.15_0.02_255)] border-[oklch(0.25_0.02_255)] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-[oklch(0.70_0.20_30)]" strokeWidth={1.5} />
              Ausgabe löschen?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[oklch(0.60_0.02_255)] mt-2">
            Möchtest du diese Ausgabe wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="ghost" onClick={() => setConfirmDeleteId(null)} className="flex-1 text-[oklch(0.60_0.02_255)]">
              Abbrechen
            </Button>
            <Button
              onClick={() => {
                if (confirmDeleteId) {
                  deleteExpense.mutate({ expenseId: confirmDeleteId });
                  setConfirmDeleteId(null);
                }
              }}
              className="flex-1 bg-[oklch(0.70_0.20_30)] text-white hover:opacity-90 font-semibold"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Löschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── WISE APP MODAL ── */}
      <Dialog open={showWiseModal} onOpenChange={(o) => !o && setShowWiseModal(false)}>
        <DialogContent className="bg-[oklch(0.15_0.02_255)] border-[oklch(0.25_0.02_255)] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-[oklch(0.72_0.14_185)]" strokeWidth={1.5} />
              Wise öffnen
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-[oklch(0.65_0.02_255)] leading-relaxed">
              Öffne die Wise-App auf deinem Handy, um Transaktionen und Kontostände zu sehen.
            </p>
            <a
              href="https://wise.com/app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[oklch(0.72_0.14_185)] text-white font-semibold hover:opacity-90 transition-all"
            >
              <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} />
              Wise-App öffnen
            </a>
            <p className="text-[10px] text-center text-[oklch(0.45_0.02_255)]">
              Falls die App nicht installiert ist, wirst du zur Wise-Webseite weitergeleitet.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── MARK AS PAID DIALOG ── */}
      <Dialog open={!!markPaidDialog} onOpenChange={(o) => { if (!o) { setMarkPaidDialog(null); setMarkPaidNote(""); } }}>
        <DialogContent className="bg-[oklch(0.15_0.02_255)] border-[oklch(0.25_0.02_255)] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CircleCheck className="w-5 h-5 text-[oklch(0.65_0.22_150)]" strokeWidth={1.5} />
              Als bezahlt markieren
            </DialogTitle>
          </DialogHeader>
          {markPaidDialog && (
            <div className="space-y-4 mt-2">
              <div className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <MemberAvatar
                    avatarUrl={(getMember(markPaidDialog.fromMemberId) as any)?.avatarUrl}
                    avatarIcon={(getMember(markPaidDialog.fromMemberId) as any)?.avatarIcon}
                    avatarColor={(getMember(markPaidDialog.fromMemberId) as any)?.avatarColor}
                    displayName={getMemberName(markPaidDialog.fromMemberId)}
                    size="sm"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{getMemberName(markPaidDialog.fromMemberId)}</div>
                    <div className="text-xs text-[oklch(0.55_0.02_255)]">bezahlt an {getMemberName(markPaidDialog.toMemberId)}</div>
                  </div>
                  <div className="text-lg font-bold text-[oklch(0.65_0.22_150)]">CHF {markPaidDialog.amount.toFixed(2)}</div>
                </div>
              </div>
              <div>
                <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1.5 block">Notiz (optional)</label>
                <input
                  type="text"
                  value={markPaidNote}
                  onChange={(e) => setMarkPaidNote(e.target.value)}
                  placeholder="z.B. Per Twint bezahlt, Bar erhalten ..."
                  className="w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.30_0.02_255)] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[oklch(0.45_0.02_255)] focus:outline-none focus:border-[oklch(0.65_0.22_150)]"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => { setMarkPaidDialog(null); setMarkPaidNote(""); }} className="flex-1 text-[oklch(0.60_0.02_255)]">
                  Abbrechen
                </Button>
                <Button
                  onClick={() => markAsPaid.mutate({
                    tripId: activeTripId,
                    fromMemberId: markPaidDialog.fromMemberId,
                    toMemberId: markPaidDialog.toMemberId,
                    amount: markPaidDialog.amount,
                    currency: "CHF",
                    note: markPaidNote,
                  })}
                  disabled={markAsPaid.isPending}
                  className="flex-1 bg-[oklch(0.65_0.22_150)] text-white hover:opacity-90 font-semibold"
                >
                  {markAsPaid.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CircleCheck className="w-4 h-4 mr-2" /> Bezahlt</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── GOCARDLESS / WISE CONNECT MODAL ── */}
      <Dialog open={showGoCardless} onOpenChange={(o) => !o && setShowGoCardless(false)}>
        <DialogContent className="bg-[oklch(0.15_0.02_255)] border-[oklch(0.25_0.02_255)] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plug className="w-5 h-5 text-[oklch(0.72_0.14_185)]" strokeWidth={1.5} />
              Wise-Konto verbinden
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="glass-card rounded-xl p-4 border border-[oklch(0.25_0.02_255)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[oklch(0.72_0.14_185/15%)] flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5 text-[oklch(0.72_0.14_185)]" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">Automatischer Import</h4>
                  <p className="text-xs text-[oklch(0.55_0.02_255)]">Kommt bald</p>
                </div>
              </div>
              <p className="text-sm text-[oklch(0.65_0.02_255)] leading-relaxed">
                Verbinde dein Wise-Konto, um Transaktionen automatisch zu importieren. Deine privaten Ausgaben bleiben privat – nur Gruppen-Transaktionen werden geteilt.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-[oklch(0.55_0.02_255)]">
                <Check className="w-3.5 h-3.5 text-[oklch(0.65_0.22_150)]" />
                Automatischer Transaktions-Import
              </div>
              <div className="flex items-center gap-2 text-xs text-[oklch(0.55_0.02_255)]">
                <Check className="w-3.5 h-3.5 text-[oklch(0.65_0.22_150)]" />
                Schnell-Zuordnung zu Mitgliedern
              </div>
              <div className="flex items-center gap-2 text-xs text-[oklch(0.55_0.02_255)]">
                <Check className="w-3.5 h-3.5 text-[oklch(0.65_0.22_150)]" />
                Privat/Gruppe-Trennung bleibt erhalten
              </div>
            </div>

            <Button
              disabled
              className="w-full bg-[oklch(0.25_0.02_255)] text-[oklch(0.55_0.02_255)] cursor-not-allowed"
            >
              <Plug className="w-4 h-4 mr-2" />
              Konto verbinden (bald verfügbar)
            </Button>
            <p className="text-[10px] text-center text-[oklch(0.45_0.02_255)]">
              Integration via GoCardless Open Banking API – in Entwicklung
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Add Expense Dialog ─────────────────────────────────────────────────────
function AddExpenseDialog({
  open, onClose, tripId, members, defaultPersonal, onSuccess
}: {
  open: boolean;
  onClose: () => void;
  tripId: number;
  members: Array<{ id: number; displayName: string; emoji: string | null }>;
  defaultPersonal?: boolean;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [personalAmount, setPersonalAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"wise" | "cash" | "other">("cash");
  const [category, setCategory] = useState("other");
  const [isPersonal, setIsPersonal] = useState(defaultPersonal ?? false);
  const [paidByMemberId, setPaidByMemberId] = useState<number | null>(null);
  const [splitType, setSplitType] = useState<"equal" | "custom">("equal");
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [customShares, setCustomShares] = useState<Record<number, string>>({});

  const createExpense = trpc.expenses.create.useMutation({
    onSuccess: () => {
      toast.success(isPersonal ? "Persönliche Ausgabe erfasst!" : "Ausgabe erfasst!");
      onSuccess();
      resetForm();
    },
    onError: (err) => toast.error("Fehler: " + err.message),
  });

  const resetForm = () => {
    setTitle(""); setAmount(""); setPersonalAmount(""); setPaymentMethod("cash"); setCategory("other");
    setIsPersonal(defaultPersonal ?? false);
    setPaidByMemberId(null); setSplitType("equal");
    setSelectedParticipants([]); setCustomShares({});
  };

  const toggleParticipant = (id: number) => {
    setSelectedParticipants(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (!title || !amount || !paidByMemberId || selectedParticipants.length === 0) {
      toast.error("Bitte alle Pflichtfelder ausfüllen");
      return;
    }
    const totalAmount = parseFloat(amount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      toast.error("Ungültiger Betrag");
      return;
    }
    const customSharesArr = splitType === "custom"
      ? selectedParticipants.map(id => ({ memberId: id, amount: parseFloat(customShares[id] ?? "0") }))
      : undefined;

    const parsedPersonalAmount = parseFloat(personalAmount || "0");
    createExpense.mutate({
      tripId,
      title,
      totalAmount,
      category: category as any,
      paidByMemberId,
      splitType,
      participantIds: selectedParticipants,
      customShares: customSharesArr,
      isPersonal,
      personalAmount: isNaN(parsedPersonalAmount) ? 0 : parsedPersonalAmount,
      paymentMethod,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[oklch(0.15_0.02_255)] border-[oklch(0.25_0.02_255)] text-white max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Ausgabe erfassen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Personal / Group Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsPersonal(false)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                !isPersonal
                  ? "bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)]"
                  : "bg-[oklch(0.20_0.02_255)] text-[oklch(0.60_0.02_255)] hover:bg-[oklch(0.25_0.02_255)]"
              }`}
            >
              <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
              Gruppenausgabe
            </button>
            <button
              type="button"
              onClick={() => setIsPersonal(true)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                isPersonal
                  ? "bg-[oklch(0.65_0.15_300)] text-white"
                  : "bg-[oklch(0.20_0.02_255)] text-[oklch(0.60_0.02_255)] hover:bg-[oklch(0.25_0.02_255)]"
              }`}
            >
              <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
              Persönlich
            </button>
          </div>

          {isPersonal && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[oklch(0.65_0.15_300/10%)] border border-[oklch(0.65_0.15_300/30%)]">
              <EyeOff className="w-4 h-4 text-[oklch(0.65_0.15_300)] shrink-0" strokeWidth={1.5} />
              <p className="text-[10px] text-[oklch(0.65_0.15_300)]">
                Nur für dich sichtbar – wird nicht in den Gruppen-Ausgleich einbezogen.
              </p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Bezeichnung *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="z.B. Flugtickets Bangkok"
              className="w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-xl px-3 py-2 text-white text-sm placeholder-[oklch(0.40_0.02_255)] focus:outline-none focus:border-[oklch(0.78_0.14_75)]"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Betrag (CHF) *</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-xl px-3 py-2 text-white text-sm placeholder-[oklch(0.40_0.02_255)] focus:outline-none focus:border-[oklch(0.78_0.14_75)]"
            />
          </div>

          {/* Personal Amount Split (only for group expenses) */}
          {!isPersonal && (
            <div>
              <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">
                Davon persönlich <span className="text-[oklch(0.45_0.02_255)]">(optional)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={personalAmount}
                  onChange={e => setPersonalAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-xl px-3 py-2 text-white text-sm placeholder-[oklch(0.40_0.02_255)] focus:outline-none focus:border-[oklch(0.65_0.15_300)]"
                />
                {amount && personalAmount && parseFloat(personalAmount) > 0 && (
                  <span className="text-xs text-[oklch(0.60_0.02_255)] whitespace-nowrap">
                    Gruppe: {(parseFloat(amount || "0") - parseFloat(personalAmount || "0")).toFixed(2)}
                  </span>
                )}
              </div>
              {personalAmount && parseFloat(personalAmount) > 0 && (
                <p className="text-[10px] text-[oklch(0.65_0.15_300)] mt-1">
                  {parseFloat(personalAmount).toFixed(2)} persönlich, {(parseFloat(amount || "0") - parseFloat(personalAmount || "0")).toFixed(2)} wird gesplittet.
                </p>
              )}
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Zahlungsmethode</label>
            <div className="flex gap-2">
              {(["cash", "wise", "other"] as const).map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                    paymentMethod === method
                      ? "bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)]"
                      : "bg-[oklch(0.20_0.02_255)] text-[oklch(0.60_0.02_255)] hover:bg-[oklch(0.25_0.02_255)]"
                  }`}
                >
                  {method === "cash" ? "💵 Bargeld" : method === "wise" ? "💳 Wise" : "🔗 Andere"}
                </button>
              ))}
            </div>
          </div>


          {/* Category – Icon Button Grid */}
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-2 block">Kategorie</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isActive = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-[10px] font-medium transition-all ${
                      isActive
                        ? "bg-[oklch(0.78_0.14_75/15%)] border border-[oklch(0.78_0.14_75/50%)] text-[oklch(0.78_0.14_75)]"
                        : "bg-[oklch(0.20_0.02_255)] border border-transparent text-[oklch(0.55_0.02_255)] hover:bg-[oklch(0.25_0.02_255)] hover:text-[oklch(0.70_0.02_255)]"
                    }`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                    <span className="leading-tight text-center">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paid By */}
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Bezahlt von *</label>
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => setPaidByMemberId(m.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1 ${
                    paidByMemberId === m.id
                      ? "bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)]"
                      : "bg-[oklch(0.20_0.02_255)] text-[oklch(0.70_0.02_255)] hover:bg-[oklch(0.25_0.02_255)]"
                  }`}
                >
                  <MemberAvatar avatarUrl={(m as any).avatarUrl} avatarIcon={(m as any).avatarIcon} avatarColor={(m as any).avatarColor} displayName={m.displayName} size="xs" />
                  {m.displayName}
                </button>
              ))}
            </div>
          </div>

          {/* Participants – KERN-FEATURE: individuelle Teilnehmer */}
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">
              Für wen? * <span className="text-[oklch(0.45_0.02_255)]">(nur beteiligte Personen auswählen)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {members.map(m => {
                const isSelected = selectedParticipants.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleParticipant(m.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1 ${
                      isSelected
                        ? "bg-[oklch(0.72_0.14_185/30%)] border border-[oklch(0.72_0.14_185)] text-[oklch(0.72_0.14_185)]"
                        : "bg-[oklch(0.20_0.02_255)] text-[oklch(0.55_0.02_255)] hover:bg-[oklch(0.25_0.02_255)]"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <MemberAvatar avatarUrl={(m as any).avatarUrl} avatarIcon={(m as any).avatarIcon} avatarColor={(m as any).avatarColor} displayName={m.displayName} size="xs" />
                    {m.displayName}
                  </button>
                );
              })}
            </div>
            {selectedParticipants.length > 0 && (
              <p className="text-xs text-[oklch(0.50_0.02_255)] mt-1">
                {selectedParticipants.length} von {members.length} Personen ausgewählt
              </p>
            )}
          </div>

          {/* Split Type */}
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Aufteilung</label>
            <div className="flex gap-2">
              {(["equal", "custom"] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setSplitType(type)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                    splitType === type
                      ? "bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)]"
                      : "bg-[oklch(0.20_0.02_255)] text-[oklch(0.65_0.02_255)]"
                  }`}
                >
                  {type === "equal" ? "Gleich" : "Individuell"}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Shares */}
          {splitType === "custom" && selectedParticipants.length > 0 && (
            <div>
              <label className="text-xs text-[oklch(0.60_0.02_255)] mb-2 block">Individuelle Beträge (CHF)</label>
              <div className="space-y-2">
                {selectedParticipants.map(id => {
                  const member = members.find(m => m.id === id);
                  return (
                    <div key={id} className="flex items-center gap-2">
                      <span className="text-sm w-24 text-[oklch(0.70_0.02_255)] flex items-center gap-1">
                        <MemberAvatar avatarUrl={(member as any)?.avatarUrl} avatarIcon={(member as any)?.avatarIcon} avatarColor={(member as any)?.avatarColor} displayName={member?.displayName || "?"} size="xs" />
                        {member?.displayName}
                      </span>
                      <input
                        type="number"
                        value={customShares[id] ?? ""}
                        onChange={e => setCustomShares(prev => ({ ...prev, [id]: e.target.value }))}
                        placeholder="0.00"
                        className="flex-1 bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[oklch(0.78_0.14_75)]"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={onClose} className="flex-1 text-[oklch(0.60_0.02_255)]">
              Abbrechen
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createExpense.isPending}
              className="flex-1 bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)] hover:opacity-90 font-semibold"
            >
              {createExpense.isPending ? "Speichern..." : "Ausgabe speichern"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


// ── Edit Expense Dialog ───────────────────────────────────────────────────
function EditExpenseDialog({
  open, onClose, tripId, members, expense, onSuccess
}: {
  open: boolean;
  onClose: () => void;
  tripId: number;
  members: Array<{ id: number; displayName: string; emoji: string | null }>;
  expense: any;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(expense.title ?? "");
  const [amount, setAmount] = useState(String(parseFloat(String(expense.totalAmount))));
  const [category, setCategory] = useState(expense.category ?? "other");
  const [isPersonal, setIsPersonal] = useState(expense.isPersonal ?? false);
  const [paidByMemberId, setPaidByMemberId] = useState<number | null>(expense.paidByMemberId ?? null);
  const [splitType, setSplitType] = useState<"equal" | "custom">(expense.splitType ?? "equal");
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>(
    (expense.participants ?? []).map((p: any) => p.memberId)
  );
  const [customShares, setCustomShares] = useState<Record<number, string>>(() => {
    const shares: Record<number, string> = {};
    (expense.participants ?? []).forEach((p: any) => {
      if (p.shareAmount) shares[p.memberId] = String(parseFloat(String(p.shareAmount)));
    });
    return shares;
  });

  const updateExpense = trpc.expenses.update.useMutation({
    onSuccess: () => {
      toast.success("Ausgabe aktualisiert!");
      onSuccess();
    },
    onError: (err) => toast.error("Fehler: " + err.message),
  });

  const toggleParticipant = (id: number) => {
    setSelectedParticipants(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (!title || !amount || !paidByMemberId || selectedParticipants.length === 0) {
      toast.error("Bitte alle Pflichtfelder ausfüllen");
      return;
    }
    const totalAmount = parseFloat(amount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      toast.error("Ungültiger Betrag");
      return;
    }
    const customSharesArr = splitType === "custom"
      ? selectedParticipants.map(id => ({ memberId: id, amount: parseFloat(customShares[id] ?? "0") }))
      : undefined;

    updateExpense.mutate({
      expenseId: expense.id,
      title,
      totalAmount,
      category: category as any,
      paidByMemberId,
      splitType,
      participantIds: selectedParticipants,
      customShares: customSharesArr,
      isPersonal,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[oklch(0.15_0.02_255)] border-[oklch(0.25_0.02_255)] text-white max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Pencil className="w-5 h-5 text-[oklch(0.72_0.14_185)]" strokeWidth={1.5} />
            Ausgabe bearbeiten
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Personal / Group Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsPersonal(false)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                !isPersonal
                  ? "bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)]"
                  : "bg-[oklch(0.20_0.02_255)] text-[oklch(0.60_0.02_255)] hover:bg-[oklch(0.25_0.02_255)]"
              }`}
            >
              <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
              Gruppenausgabe
            </button>
            <button
              type="button"
              onClick={() => setIsPersonal(true)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                isPersonal
                  ? "bg-[oklch(0.65_0.15_300)] text-white"
                  : "bg-[oklch(0.20_0.02_255)] text-[oklch(0.60_0.02_255)] hover:bg-[oklch(0.25_0.02_255)]"
              }`}
            >
              <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
              Persönlich
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Bezeichnung *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="z.B. Flugtickets Bangkok"
              className="w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-xl px-3 py-2 text-white text-sm placeholder-[oklch(0.40_0.02_255)] focus:outline-none focus:border-[oklch(0.78_0.14_75)]"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Betrag (CHF) *</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-xl px-3 py-2 text-white text-sm placeholder-[oklch(0.40_0.02_255)] focus:outline-none focus:border-[oklch(0.78_0.14_75)]"
            />
          </div>

          {/* Category – Icon Button Grid */}
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-2 block">Kategorie</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isActive = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-[10px] font-medium transition-all ${
                      isActive
                        ? "bg-[oklch(0.78_0.14_75/15%)] border border-[oklch(0.78_0.14_75/50%)] text-[oklch(0.78_0.14_75)]"
                        : "bg-[oklch(0.20_0.02_255)] border border-transparent text-[oklch(0.55_0.02_255)] hover:bg-[oklch(0.25_0.02_255)] hover:text-[oklch(0.70_0.02_255)]"
                    }`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                    <span className="leading-tight text-center">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paid By */}
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Bezahlt von *</label>
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => setPaidByMemberId(m.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1 ${
                    paidByMemberId === m.id
                      ? "bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)]"
                      : "bg-[oklch(0.20_0.02_255)] text-[oklch(0.70_0.02_255)] hover:bg-[oklch(0.25_0.02_255)]"
                  }`}
                >
                  <MemberAvatar avatarUrl={(m as any).avatarUrl} avatarIcon={(m as any).avatarIcon} avatarColor={(m as any).avatarColor} displayName={m.displayName} size="xs" />
                  {m.displayName}
                </button>
              ))}
            </div>
          </div>

          {/* Participants */}
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">
              Für wen? * <span className="text-[oklch(0.45_0.02_255)]">(nur beteiligte Personen auswählen)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {members.map(m => {
                const isSelected = selectedParticipants.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleParticipant(m.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1 ${
                      isSelected
                        ? "bg-[oklch(0.72_0.14_185/30%)] border border-[oklch(0.72_0.14_185)] text-[oklch(0.72_0.14_185)]"
                        : "bg-[oklch(0.20_0.02_255)] text-[oklch(0.55_0.02_255)] hover:bg-[oklch(0.25_0.02_255)]"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <MemberAvatar avatarUrl={(m as any).avatarUrl} avatarIcon={(m as any).avatarIcon} avatarColor={(m as any).avatarColor} displayName={m.displayName} size="xs" />
                    {m.displayName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split Type */}
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Aufteilung</label>
            <div className="flex gap-2">
              {(["equal", "custom"] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setSplitType(type)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                    splitType === type
                      ? "bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)]"
                      : "bg-[oklch(0.20_0.02_255)] text-[oklch(0.65_0.02_255)]"
                  }`}
                >
                  {type === "equal" ? "Gleich" : "Individuell"}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Shares */}
          {splitType === "custom" && selectedParticipants.length > 0 && (
            <div>
              <label className="text-xs text-[oklch(0.60_0.02_255)] mb-2 block">Individuelle Beträge (CHF)</label>
              <div className="space-y-2">
                {selectedParticipants.map(id => {
                  const member = members.find(m => m.id === id);
                  return (
                    <div key={id} className="flex items-center gap-2">
                      <span className="text-sm w-24 text-[oklch(0.70_0.02_255)] flex items-center gap-1">
                        <MemberAvatar avatarUrl={(member as any)?.avatarUrl} avatarIcon={(member as any)?.avatarIcon} avatarColor={(member as any)?.avatarColor} displayName={member?.displayName || "?"} size="xs" />
                        {member?.displayName}
                      </span>
                      <input
                        type="number"
                        value={customShares[id] ?? ""}
                        onChange={e => setCustomShares(prev => ({ ...prev, [id]: e.target.value }))}
                        placeholder="0.00"
                        className="flex-1 bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[oklch(0.78_0.14_75)]"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={onClose} className="flex-1 text-[oklch(0.60_0.02_255)]">
              Abbrechen
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={updateExpense.isPending}
              className="flex-1 bg-[oklch(0.72_0.14_185)] text-white hover:opacity-90 font-semibold"
            >
              {updateExpense.isPending ? "Speichern..." : "Änderungen speichern"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
