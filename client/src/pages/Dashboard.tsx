// Dashboard – Trip-Verwaltung mit tRPC-Backend
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  Plus, Trash2, Users, MapPin, Calendar, DollarSign,
  Plane, UserPlus, LogIn, Loader2, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MemberAvatar from "@/components/MemberAvatar";

const MEMBER_COLORS = ["#C9A84C", "#4ECDC4", "#FF6B6B", "#A78BFA", "#F59E0B", "#10B981", "#EC4899", "#6366F1", "#14B8A6", "#F97316"];

export default function Dashboard() {
  const { isAuthenticated, loading } = useAuth();
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);

  // Trip form
  const [tripName, setTripName] = useState("");
  const [tripDestination, setTripDestination] = useState("");
  const [tripCurrency, setTripCurrency] = useState("CHF");
  const [tripStartDate, setTripStartDate] = useState("");
  const [tripEndDate, setTripEndDate] = useState("");

  // Member form
  const [memberName, setMemberName] = useState("");
  const [memberEmoji, setMemberEmoji] = useState("");

  const utils = trpc.useUtils();

  // Queries
  const { data: trips, isLoading: tripsLoading } = trpc.trips.list.useQuery(undefined, { enabled: isAuthenticated });

  const activeTripId = selectedTripId ?? (trips?.[0]?.id ?? null);
  const activeTrip = trips?.find(t => t.id === activeTripId);

  const { data: members } = trpc.members.list.useQuery(
    { tripId: activeTripId! },
    { enabled: !!activeTripId }
  );
  const { data: expenses } = trpc.expenses.list.useQuery(
    { tripId: activeTripId! },
    { enabled: !!activeTripId }
  );

  // Mutations
  const createTrip = trpc.trips.create.useMutation({
    onSuccess: () => {
      utils.trips.list.invalidate();
      setShowCreateTrip(false);
      setTripName("");
      setTripDestination("");
      setTripCurrency("CHF");
      setTripStartDate("");
      setTripEndDate("");
      toast.success("Reise erstellt!");
    },
    onError: (err) => toast.error("Fehler: " + err.message),
  });

  const deleteTrip = trpc.trips.delete.useMutation({
    onSuccess: () => {
      utils.trips.list.invalidate();
      setSelectedTripId(null);
      toast.success("Reise gelöscht");
    },
    onError: (err) => toast.error("Fehler: " + err.message),
  });

  const addMember = trpc.members.add.useMutation({
    onSuccess: () => {
      utils.members.list.invalidate();
      setShowAddMember(false);
      setMemberName("");
      setMemberEmoji("");
      toast.success("Mitglied hinzugefügt!");
    },
    onError: (err) => toast.error("Fehler: " + err.message),
  });

  const removeMember = trpc.members.remove.useMutation({
    onSuccess: () => {
      utils.members.list.invalidate();
      toast.success("Mitglied entfernt");
    },
    onError: (err) => toast.error("Fehler: " + err.message),
  });

  const handleCreateTrip = () => {
    if (!tripName.trim()) return toast.error("Bitte einen Namen eingeben");
    createTrip.mutate({
      name: tripName.trim(),
      destination: tripDestination.trim() || undefined,
      currency: tripCurrency,
      startDate: tripStartDate || undefined,
      endDate: tripEndDate || undefined,
    });
  };

  const handleAddMember = () => {
    if (!memberName.trim()) return toast.error("Bitte einen Namen eingeben");
    if (!activeTripId) return;
    addMember.mutate({
      tripId: activeTripId,
      displayName: memberName.trim(),
      emoji: memberEmoji,
      color: MEMBER_COLORS[(members?.length ?? 0) % MEMBER_COLORS.length],
    });
  };

  const totalExpenses = (expenses ?? []).reduce((sum, e) => sum + parseFloat(String(e.totalAmount)), 0);

  // Days calculation
  const getDaysInfo = () => {
    if (!activeTrip?.startDate) return null;
    const start = new Date(activeTrip.startDate);
    const end = activeTrip.endDate ? new Date(activeTrip.endDate) : null;
    const now = new Date();
    const daysUntil = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = end ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) : null;
    return { daysUntil, totalDays };
  };
  const daysInfo = getDaysInfo();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[oklch(0.11_0.02_255)]">
        <Loader2 className="w-8 h-8 animate-spin text-[oklch(0.78_0.14_75)]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center bg-[oklch(0.11_0.02_255)]">
        <div className="text-center">
          <MapPin className="w-14 h-14 text-[oklch(0.78_0.14_75)] mb-4" strokeWidth={1.5} />
          <h2 className="text-2xl font-bold text-white mb-3">Anmelden erforderlich</h2>
          <p className="text-[oklch(0.60_0.02_255)] mb-6">Melde dich an um deine Reisen zu verwalten.</p>
          <a href="/login" className="px-6 py-3 rounded-xl bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)] font-semibold inline-flex items-center gap-2">
            <LogIn className="w-4 h-4" />Anmelden
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(0.11_0.02_255)]">
      <div className="container mx-auto px-4 lg:px-8 pt-20 pb-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[oklch(0.78_0.14_75)] text-sm font-medium uppercase tracking-widest">Dashboard</span>
            <h1 className="text-3xl md:text-4xl font-bold text-white mt-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Meine <span className="text-gold-gradient">Reisen</span>
            </h1>
          </div>
          <Button
            onClick={() => setShowCreateTrip(true)}
            className="bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)] hover:opacity-90 font-semibold gap-2"
          >
            <Plus className="w-4 h-4" />
            Neue Reise
          </Button>
        </motion.div>

        {/* Trip List */}
        {tripsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[oklch(0.78_0.14_75)]" />
          </div>
        ) : !trips || trips.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <Plane className="w-16 h-16 text-[oklch(0.78_0.14_75)] mb-6" strokeWidth={1.5} />
            <h3 className="text-2xl font-bold text-white mb-3">Noch keine Reise erstellt</h3>
            <p className="text-[oklch(0.55_0.02_255)] mb-8 max-w-md mx-auto">
              Erstelle deine erste Reise und füge Mitglieder hinzu, um Ausgaben zu teilen und Aktivitäten zu planen.
            </p>
            <Button
              onClick={() => setShowCreateTrip(true)}
              className="bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)] font-semibold gap-2 px-8 py-3"
            >
              <Plane className="w-5 h-5" />
              Erste Reise erstellen
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Trip Tabs */}
            {trips.length > 1 && (
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {trips.map(trip => (
                  <button
                    key={trip.id}
                    onClick={() => setSelectedTripId(trip.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-all ${
                      trip.id === activeTripId
                        ? "bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)]"
                        : "glass-card text-[oklch(0.65_0.02_255)] hover:text-white"
                    }`}
                  >
                    {trip.name}
                  </button>
                ))}
              </div>
            )}

            {/* Active Trip Details */}
            {activeTrip && (
              <div className="space-y-6">
                {/* Trip Header Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card-gold rounded-2xl p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {activeTrip.name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[oklch(0.65_0.02_255)]">
                        {activeTrip.destination && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[oklch(0.78_0.14_75)]" />
                            {activeTrip.destination}
                          </span>
                        )}
                        {activeTrip.startDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[oklch(0.72_0.14_185)]" />
                            {new Date(activeTrip.startDate).toLocaleDateString("de-CH")}
                            {activeTrip.endDate && ` – ${new Date(activeTrip.endDate).toLocaleDateString("de-CH")}`}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-[oklch(0.78_0.14_75)]" />
                          {activeTrip.currency}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Reise "${activeTrip.name}" wirklich löschen?`)) {
                          deleteTrip.mutate({ tripId: activeTrip.id });
                        }
                      }}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="glass-card rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-[oklch(0.78_0.14_75)]" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {members?.length ?? 0}
                    </div>
                    <div className="text-xs text-[oklch(0.55_0.02_255)] mt-1">Mitglieder</div>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="glass-card rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {expenses?.length ?? 0}
                    </div>
                    <div className="text-xs text-[oklch(0.55_0.02_255)] mt-1">Ausgaben</div>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="glass-card rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-[oklch(0.72_0.14_185)]" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {activeTrip.currency} {totalExpenses.toFixed(0)}
                    </div>
                    <div className="text-xs text-[oklch(0.55_0.02_255)] mt-1">Gesamtausgaben</div>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    className="glass-card rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {daysInfo ? (daysInfo.daysUntil > 0 ? `${daysInfo.daysUntil}d` : "Jetzt!") : "–"}
                    </div>
                    <div className="text-xs text-[oklch(0.55_0.02_255)] mt-1">
                      {daysInfo && daysInfo.daysUntil > 0 ? "bis Abreise" : "Reisedauer"}
                    </div>
                  </motion.div>
                </div>

                {/* Members Section */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="glass-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-[oklch(0.78_0.14_75)]" />
                      Mitglieder ({members?.length ?? 0})
                    </h3>
                    <Button
                      onClick={() => setShowAddMember(true)}
                      size="sm"
                      className="bg-[oklch(0.72_0.14_185/20%)] text-[oklch(0.72_0.14_185)] hover:bg-[oklch(0.72_0.14_185/30%)] gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Hinzufügen
                    </Button>
                  </div>

                  {!members || members.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-10 h-10 text-[oklch(0.55_0.02_255)] mb-3" strokeWidth={1.5} />
                      <p className="text-[oklch(0.55_0.02_255)] text-sm">
                        Noch keine Mitglieder. Füge die Reisegruppe hinzu!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <AnimatePresence>
                        {members.map((member, i) => (
                          <motion.div
                            key={member.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: i * 0.05 }}
                            className="group flex items-center gap-3 p-3 rounded-xl bg-[oklch(0.15_0.02_255)] hover:bg-[oklch(0.18_0.02_255)] transition-all"
                          >
                            <MemberAvatar
                              avatarUrl={(member as any).avatarUrl}
                              avatarIcon={(member as any).avatarIcon}
                              avatarColor={(member as any).avatarColor || member.color}
                              displayName={member.displayName}
                              size="md"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white text-sm truncate">{member.displayName}</div>
                              <div className="text-xs text-[oklch(0.50_0.02_255)]">
                                {member.userId ? "Verknüpft" : "Nicht verknüpft"}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (confirm(`${member.displayName} entfernen?`)) {
                                  removeMember.mutate({ memberId: member.id });
                                }
                              }}
                              className="p-1.5 rounded-lg text-[oklch(0.40_0.02_255)] hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>

                {/* Quick Links */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Link href="/finance">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                      className="glass-card rounded-2xl p-5 cursor-pointer hover:border-[oklch(0.78_0.14_75/40%)] transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-semibold text-white">Finanzen</div>
                          <div className="text-xs text-[oklch(0.55_0.02_255)] mt-1">Ausgaben & Splitting</div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-[oklch(0.78_0.14_75)] group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  </Link>
                  <Link href="/activities">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                      className="glass-card rounded-2xl p-5 cursor-pointer hover:border-[oklch(0.72_0.14_185/40%)] transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-semibold text-white">Aktivitäten</div>
                          <div className="text-xs text-[oklch(0.55_0.02_255)] mt-1">Voting & Planung</div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-[oklch(0.72_0.14_185)] group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  </Link>
                  <Link href="/chat">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                      className="glass-card rounded-2xl p-5 cursor-pointer hover:border-[oklch(0.65_0.22_150/40%)] transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-semibold text-white">Chat</div>
                          <div className="text-xs text-[oklch(0.55_0.02_255)] mt-1">Gruppen-Chat</div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-[oklch(0.65_0.22_150)] group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Trip Dialog */}
      <Dialog open={showCreateTrip} onOpenChange={setShowCreateTrip}>
        <DialogContent className="bg-[oklch(0.15_0.025_255)] border-[oklch(0.78_0.14_75/20%)] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
              Neue Reise erstellen
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-[oklch(0.75_0.02_255)] text-sm">Name *</Label>
              <Input
                value={tripName}
                onChange={e => setTripName(e.target.value)}
                placeholder="z.B. Thailand 2025"
                className="mt-1 bg-[oklch(0.20_0.02_255)] border-[oklch(0.30_0.02_255)] text-white placeholder:text-[oklch(0.40_0.02_255)]"
              />
            </div>
            <div>
              <Label className="text-[oklch(0.75_0.02_255)] text-sm">Destination</Label>
              <Input
                value={tripDestination}
                onChange={e => setTripDestination(e.target.value)}
                placeholder="z.B. Bangkok, Phuket, Koh Samui"
                className="mt-1 bg-[oklch(0.20_0.02_255)] border-[oklch(0.30_0.02_255)] text-white placeholder:text-[oklch(0.40_0.02_255)]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[oklch(0.75_0.02_255)] text-sm">Startdatum</Label>
                <Input
                  type="date"
                  value={tripStartDate}
                  onChange={e => setTripStartDate(e.target.value)}
                  className="mt-1 bg-[oklch(0.20_0.02_255)] border-[oklch(0.30_0.02_255)] text-white"
                />
              </div>
              <div>
                <Label className="text-[oklch(0.75_0.02_255)] text-sm">Enddatum</Label>
                <Input
                  type="date"
                  value={tripEndDate}
                  onChange={e => setTripEndDate(e.target.value)}
                  className="mt-1 bg-[oklch(0.20_0.02_255)] border-[oklch(0.30_0.02_255)] text-white"
                />
              </div>
            </div>
            <div>
              <Label className="text-[oklch(0.75_0.02_255)] text-sm">Währung</Label>
              <div className="flex gap-2 mt-1">
                {["CHF", "EUR", "THB", "USD"].map(cur => (
                  <button
                    key={cur}
                    onClick={() => setTripCurrency(cur)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      tripCurrency === cur
                        ? "bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)]"
                        : "bg-[oklch(0.20_0.02_255)] text-[oklch(0.65_0.02_255)] hover:bg-[oklch(0.25_0.02_255)]"
                    }`}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowCreateTrip(false)} className="flex-1 text-[oklch(0.60_0.02_255)]">
                Abbrechen
              </Button>
              <Button
                onClick={handleCreateTrip}
                disabled={createTrip.isPending}
                className="flex-1 bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)] hover:opacity-90 font-semibold"
              >
                {createTrip.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Erstellen"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent className="bg-[oklch(0.15_0.025_255)] border-[oklch(0.72_0.14_185/20%)] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
              Mitglied hinzufügen
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-[oklch(0.75_0.02_255)] text-sm">Name *</Label>
              <Input
                value={memberName}
                onChange={e => setMemberName(e.target.value)}
                placeholder="z.B. Alex"
                className="mt-1 bg-[oklch(0.20_0.02_255)] border-[oklch(0.30_0.02_255)] text-white placeholder:text-[oklch(0.40_0.02_255)]"
              />
            </div>
            <div>
              <Label className="text-[oklch(0.75_0.02_255)] text-sm">Farbe</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {MEMBER_COLORS.map((color, idx) => (
                  <button
                    key={color}
                    onClick={() => setMemberEmoji(String(idx))}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2 ${
                      memberEmoji === String(idx)
                        ? "border-white scale-110"
                        : "border-transparent hover:border-white/30"
                    }`}
                    style={{ backgroundColor: `${color}30` }}
                  >
                    <span style={{ color }} className="font-bold text-sm">{memberName.charAt(0).toUpperCase() || "?"}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowAddMember(false)} className="flex-1 text-[oklch(0.60_0.02_255)]">
                Abbrechen
              </Button>
              <Button
                onClick={handleAddMember}
                disabled={addMember.isPending}
                className="flex-1 bg-[oklch(0.72_0.14_185)] text-white hover:opacity-90 font-semibold"
              >
                {addMember.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hinzufügen"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
