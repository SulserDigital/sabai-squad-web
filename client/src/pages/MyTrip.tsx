import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Loader2, MapPin, Calendar, Plane, Save, Check, Pencil,
  Plus, Trash2, X,
  // Avatar icon imports
  Cat, Bird, Fish, TreePalm, Waves, Martini, Bike, Compass, Anchor,
  Sun, Moon, Mountain, Flame, Crown, Diamond, Rocket, Zap, Star, Heart,
  Skull, Swords, Shield, Gem, Feather, Leaf, Flower2, Music, Gamepad2, Globe
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MemberAvatar from "@/components/MemberAvatar";

// ============================================================
// AVATAR ICON GALLERY – 30 unique icons
// ============================================================
const AVATAR_ICONS = [
  { name: "cat", Icon: Cat, label: "Katze" },
  { name: "bird", Icon: Bird, label: "Adler" },
  { name: "fish", Icon: Fish, label: "Hai" },
  { name: "palm", Icon: TreePalm, label: "Palme" },
  { name: "waves", Icon: Waves, label: "Welle" },
  { name: "martini", Icon: Martini, label: "Cocktail" },
  { name: "bike", Icon: Bike, label: "Motorrad" },
  { name: "compass", Icon: Compass, label: "Kompass" },
  { name: "anchor", Icon: Anchor, label: "Anker" },
  { name: "sun", Icon: Sun, label: "Sonne" },
  { name: "moon", Icon: Moon, label: "Mond" },
  { name: "mountain", Icon: Mountain, label: "Berg" },
  { name: "flame", Icon: Flame, label: "Flamme" },
  { name: "crown", Icon: Crown, label: "Krone" },
  { name: "diamond", Icon: Diamond, label: "Diamant" },
  { name: "rocket", Icon: Rocket, label: "Rakete" },
  { name: "zap", Icon: Zap, label: "Blitz" },
  { name: "star", Icon: Star, label: "Stern" },
  { name: "heart", Icon: Heart, label: "Herz" },
  { name: "skull", Icon: Skull, label: "Totenkopf" },
  { name: "swords", Icon: Swords, label: "Schwerter" },
  { name: "shield", Icon: Shield, label: "Schild" },
  { name: "gem", Icon: Gem, label: "Edelstein" },
  { name: "feather", Icon: Feather, label: "Feder" },
  { name: "leaf", Icon: Leaf, label: "Blatt" },
  { name: "flower", Icon: Flower2, label: "Blume" },
  { name: "music", Icon: Music, label: "Musik" },
  { name: "gamepad", Icon: Gamepad2, label: "Gaming" },
  { name: "globe", Icon: Globe, label: "Globus" },
  { name: "plane", Icon: Plane, label: "Flugzeug" },
] as const;

// Color palette for icons
const AVATAR_COLORS = [
  "#C9A84C", "#4ECDC4", "#FF6B6B", "#A78BFA", "#F59E0B",
  "#10B981", "#EC4899", "#6366F1", "#14B8A6", "#F97316",
  "#8B5CF6", "#EF4444", "#06B6D4", "#84CC16", "#E11D48",
  "#22D3EE", "#FB923C", "#A3E635", "#F472B6", "#818CF8",
];

// ── Stay Dialog ──────────────────────────────────────────────────────────────
function StayDialog({
  open,
  onClose,
  tripId,
  stay,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  tripId: number;
  stay?: any;
  onSuccess: () => void;
}) {
  const [location, setLocation] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [note, setNote] = useState("");
  const [taggedMemberIds, setTaggedMemberIds] = useState<number[]>([]);
  const utils = trpc.useUtils();
  const { data: members } = trpc.members.list.useQuery({ tripId }, { enabled: !!tripId });

  useEffect(() => {
    if (open) {
      setLocation(stay?.location ?? "");
      setFromDate(stay?.fromDate ? new Date(stay.fromDate).toISOString().split("T")[0] : "");
      setToDate(stay?.toDate ? new Date(stay.toDate).toISOString().split("T")[0] : "");
      setNote(stay?.note ?? "");
    }
  }, [open, stay]);

  const createStay = trpc.plannedStays.create.useMutation({
    onSuccess: () => {
      toast.success("Aufenthalt hinzugefügt!");
      utils.plannedStays.list.invalidate({ tripId });
      onSuccess();
    },
    onError: (err) => toast.error("Fehler: " + err.message),
  });

  const updateStay = trpc.plannedStays.update.useMutation({
    onSuccess: () => {
      toast.success("Aufenthalt aktualisiert!");
      utils.plannedStays.list.invalidate({ tripId });
      onSuccess();
    },
    onError: (err) => toast.error("Fehler: " + err.message),
  });

  const handleSubmit = () => {
    if (!location.trim() || !fromDate || !toDate) {
      toast.error("Bitte Ort, Von- und Bis-Datum angeben");
      return;
    }
    if (stay) {
      updateStay.mutate({ id: stay.id, location, fromDate, toDate, note: note || undefined });
    } else {
      createStay.mutate({ tripId, location, fromDate, toDate, note: note || undefined, taggedMemberIds });
    }
  };

  const isPending = createStay.isPending || updateStay.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[oklch(0.15_0.02_255)] border-[oklch(0.25_0.02_255)] text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[oklch(0.65_0.22_150)]" strokeWidth={1.5} />
            {stay ? "Aufenthalt bearbeiten" : "Aufenthalt hinzufügen"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-[oklch(0.65_0.02_255)] text-xs mb-1 block">Ort *</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="z.B. Bangkok, Koh Samui..."
              className="bg-[oklch(1_0_0/8%)] border-white/10 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[oklch(0.65_0.02_255)] text-xs mb-1 block">Von *</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-[oklch(1_0_0/8%)] border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-[oklch(0.65_0.02_255)] text-xs mb-1 block">Bis *</Label>
              <Input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-[oklch(1_0_0/8%)] border-white/10 text-white"
              />
            </div>
          </div>
          <div>
            <Label className="text-[oklch(0.65_0.02_255)] text-xs mb-1 block">Notiz (optional)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="z.B. Bei Freunden, Airbnb, Hotel XY..."
              className="bg-[oklch(1_0_0/8%)] border-white/10 text-white"
            />
          </div>
          {!stay && members && (
            <div>
              <Label className="text-[oklch(0.65_0.02_255)] text-xs mb-2 block">Wer ist auch dabei? (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const isSelected = taggedMemberIds.includes(m.id);
                  const color = (m as any).avatarColor || '#C9A84C';
                  return (
                    <button
                      key={m.id}
                      onClick={() => setTaggedMemberIds(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id])}
                      className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full text-xs font-medium transition-all border ${
                        isSelected
                          ? 'border-transparent text-white'
                          : 'bg-transparent text-[oklch(0.60_0.02_255)] border-[oklch(0.28_0.02_255)] hover:border-[oklch(0.40_0.02_255)]'
                      }`}
                      style={isSelected ? { backgroundColor: `${color}30`, borderColor: `${color}80` } : {}}
                    >
                      <MemberAvatar
                        avatarUrl={(m as any).avatarUrl}
                        avatarIcon={(m as any).avatarIcon}
                        avatarColor={(m as any).avatarColor}
                        displayName={m.displayName}
                        size="xs"
                      />
                      <span>{m.displayName || `Mitglied ${m.id}`}</span>
                      {isSelected && <Check className="w-3 h-3 ml-0.5" style={{ color }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" onClick={onClose} className="flex-1 text-[oklch(0.60_0.02_255)]">
              Abbrechen
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="flex-1 bg-[oklch(0.65_0.22_150)] text-white hover:opacity-90 font-semibold"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              {stay ? "Speichern" : "Hinzufügen"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
// ── Member Overview Component ────────────────────────────────────────
function MemberOverview({ tripId, members }: { tripId: number; members: any[] }) {
  const { data: overviewData } = trpc.plannedStays.memberOverview.useQuery({ tripId });

  if (!overviewData || overviewData.length === 0) {
    if (!members || members.length === 0) return null;
    // Show basic member list even without stays
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 rounded-2xl mt-8">
        <h3 className="font-semibold text-white mb-4">Gruppe – Wer ist wann wo?</h3>
        <div className="space-y-2">
          {members.map((m) => {
            const mColor = (m as any).avatarColor as string || "#C9A84C";
            const mUrl = (m as any).avatarUrl as string | null;
            const mIcon = (m as any).avatarIcon as string | null;
            const IconEntry = AVATAR_ICONS.find(i => i.name === mIcon);
            return (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-[oklch(1_0_0/5%)]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border shrink-0" style={{ borderColor: mColor, backgroundColor: mUrl ? "transparent" : `${mColor}20` }}>
                  {mUrl ? <img src={mUrl} alt="" className="w-full h-full object-cover" /> : IconEntry ? <IconEntry.Icon className="w-4 h-4" style={{ color: mColor }} strokeWidth={1.5} /> : <span className="text-xs font-bold" style={{ color: mColor }}>{m.displayName.charAt(0).toUpperCase()}</span>}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{m.displayName}</p>
                  <p className="text-xs text-[oklch(0.45_0.02_255)]">Noch keine Aufenthalte geplant</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // Group stays by location for a compact table view
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 rounded-2xl mt-8">
      <h3 className="font-semibold text-white mb-4">Gruppe – Wer ist wann wo?</h3>
      <div className="space-y-4">
        {overviewData.map((stay: any) => (
          <div key={stay.id} className="rounded-xl border border-[oklch(0.25_0.02_255)] overflow-hidden">
            {/* Stay header */}
            <div className="flex items-center gap-2 px-3 py-2 bg-[oklch(0.65_0.22_150/10%)] border-b border-[oklch(0.65_0.22_150/20%)]">
              <MapPin className="w-3.5 h-3.5 text-[oklch(0.65_0.22_150)] shrink-0" strokeWidth={1.5} />
              <span className="text-sm font-semibold text-white">{stay.location}</span>
              <span className="text-xs text-[oklch(0.55_0.02_255)] ml-auto">
                {new Date(stay.fromDate).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" })} – {new Date(stay.toDate).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" })}
              </span>
            </div>
            {/* Participants */}
            <div className="divide-y divide-[oklch(0.20_0.02_255)]">
              {stay.participants.map((p: any) => {
                const member = members.find(m => m.id === p.memberId);
                const mColor = (member as any)?.avatarColor as string || "#C9A84C";
                const mUrl = (member as any)?.avatarUrl as string | null;
                const mIcon = (member as any)?.avatarIcon as string | null;
                const IconEntry = AVATAR_ICONS.find(i => i.name === mIcon);
                const sameAsMaster = p.isCreator || (
                  new Date(p.fromDate).toDateString() === new Date(stay.fromDate).toDateString() &&
                  new Date(p.toDate).toDateString() === new Date(stay.toDate).toDateString()
                );
                return (
                  <div key={p.memberId} className="flex items-center gap-3 px-3 py-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden border shrink-0" style={{ borderColor: mColor, backgroundColor: mUrl ? "transparent" : `${mColor}20` }}>
                      {mUrl ? <img src={mUrl} alt="" className="w-full h-full object-cover" /> : IconEntry ? <IconEntry.Icon className="w-3.5 h-3.5" style={{ color: mColor }} strokeWidth={1.5} /> : <span className="text-xs font-bold" style={{ color: mColor }}>{p.name.charAt(0).toUpperCase()}</span>}
                    </div>
                    <span className="text-xs font-medium text-white flex-1">{p.name}</span>
                    {p.isCreator && <span className="text-[10px] text-[oklch(0.65_0.22_150)] bg-[oklch(0.65_0.22_150/10%)] px-1.5 py-0.5 rounded-full">Ersteller</span>}
                    <span className="text-xs text-[oklch(0.55_0.02_255)]">
                      {sameAsMaster ? (
                        <span className="text-[oklch(0.45_0.02_255)]">wie oben</span>
                      ) : (
                        <span className="text-[oklch(0.78_0.14_75)]">
                          {new Date(p.fromDate).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" })} – {new Date(p.toDate).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" })}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Stay Invitation Status Component ────────────────────────────────────────
function StayInvitationStatus({ stayId, members }: { stayId: number; members: any[] }) {
  const { data: invitations } = trpc.plannedStays.stayInvitationStatus.useQuery({ stayId });

  if (!invitations || invitations.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {invitations.map((inv: any) => {
        const member = members.find(m => m.id === inv.memberId);
        const name = member?.displayName ?? inv.memberName ?? "?";
        const isAccepted = inv.status === "accepted";
        const isDeclined = inv.status === "declined";
        const statusLabel = isAccepted ? "Bestätigt" : isDeclined ? "Abgelehnt" : "Ausstehend";
        const statusColor = isAccepted
          ? "oklch(0.65_0.22_150)"
          : isDeclined
          ? "oklch(0.70_0.20_30)"
          : "oklch(0.65_0.15_75)";
        const dotColor = isAccepted ? "#22c55e" : isDeclined ? "#ef4444" : "#f59e0b";
        const title = isAccepted
          ? `${name}: ${inv.acceptedFromDate ? new Date(inv.acceptedFromDate).toLocaleDateString('de-CH') : '?'} – ${inv.acceptedToDate ? new Date(inv.acceptedToDate).toLocaleDateString('de-CH') : '?'}`
          : isDeclined
          ? `${name}: Abgelehnt`
          : `${name}: Ausstehend`;
        return (
          <span
            key={inv.id}
            title={title}
            className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border"
            style={{ borderColor: `${statusColor}35`, backgroundColor: `${statusColor}12`, color: statusColor }}
          >
            <MemberAvatar
              avatarUrl={member?.avatarUrl}
              avatarIcon={member?.avatarIcon}
              avatarColor={member?.avatarColor}
              displayName={name}
              size="xs"
            />
            <span className="font-medium">{name}</span>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
            <span className="opacity-80">{statusLabel}</span>
          </span>
        );
      })}
    </div>
  );
}

export default function MyTrip() {
  const { isAuthenticated, user, loading } = useAuth();

  // Queries
  const { data: trips } = trpc.trips.list.useQuery(undefined, { enabled: isAuthenticated });
  const activeTripId = trips?.[0]?.id ?? null;
  const activeTrip = trips?.find(t => t.id === activeTripId);

  const { data: members } = trpc.members.list.useQuery(
    { tripId: activeTripId! },
    { enabled: !!activeTripId }
  );

  const { data: staysData, refetch: refetchStays } = trpc.plannedStays.list.useQuery(
    { tripId: activeTripId! },
    { enabled: !!activeTripId }
  );

  const { data: myInvitations } = trpc.plannedStays.myInvitations.useQuery(
    { tripId: activeTripId! },
    { enabled: !!activeTripId }
  );

  const utils = trpc.useUtils();

  // Current user's member record
  const currentMember = useMemo(() => {
    if (!members || !user) return null;
    return members.find(m => m.userId === user.id) ?? null;
  }, [members, user]);

  // My stays
  const myStays = useMemo(() => {
    if (!staysData || !currentMember) return [];
    return staysData.filter(s => s.memberId === currentMember.id);
  }, [staysData, currentMember]);

  // Form state
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [personalNotes, setPersonalNotes] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Stay dialog state
  const [showStayDialog, setShowStayDialog] = useState(false);
  const [editingStay, setEditingStay] = useState<any>(null);
  const [confirmDeleteStayId, setConfirmDeleteStayId] = useState<number | null>(null);
  const [invitationToAccept, setInvitationToAccept] = useState<any>(null);

  const pendingInvitations = useMemo(() => {
    return myInvitations?.filter((inv: any) => inv.status === "pending") ?? [];
  }, [myInvitations]);

  // Accommodations for picker in accept dialog
  const { data: accommodationsData } = trpc.accommodations.list.useQuery(
    { tripId: activeTripId! },
    { enabled: !!activeTripId }
  );

  // Accept dialog state
  const [acceptFromDate, setAcceptFromDate] = useState("");
  const [acceptToDate, setAcceptToDate] = useState("");
  const [acceptNote, setAcceptNote] = useState("");
  const [acceptAccommodationId, setAcceptAccommodationId] = useState<number | null>(null);

  const acceptInvitation = trpc.plannedStays.acceptInvitation.useMutation({
    onSuccess: () => {
      toast.success("Einladung bestätigt!");
      utils.plannedStays.myInvitations.invalidate({ tripId: activeTripId! });
      utils.plannedStays.list.invalidate({ tripId: activeTripId! });
      setInvitationToAccept(null);
      setAcceptFromDate(""); setAcceptToDate(""); setAcceptNote(""); setAcceptAccommodationId(null);
    },
    onError: (err) => toast.error("Fehler: " + err.message),
  });

  const declineInvitation = trpc.plannedStays.declineInvitation.useMutation({
    onSuccess: () => {
      toast.success("Einladung abgelehnt");
      utils.plannedStays.myInvitations.invalidate({ tripId: activeTripId! });
    },
    onError: (err) => toast.error("Fehler: " + err.message),
  });

  // Pre-fill accept dialog dates from invitation's stay dates
  useEffect(() => {
    if (invitationToAccept?.stay) {
      setAcceptFromDate(new Date(invitationToAccept.stay.fromDate).toISOString().split("T")[0]);
      setAcceptToDate(new Date(invitationToAccept.stay.toDate).toISOString().split("T")[0]);
      setAcceptNote("");
      setAcceptAccommodationId(null);
    }
  }, [invitationToAccept]);

  // Initialize form from member data
  useEffect(() => {
    if (currentMember && !initialized) {
      if (currentMember.arrivalDate) setArrivalDate(new Date(currentMember.arrivalDate).toISOString().split("T")[0]);
      if (currentMember.departureDate) setDepartureDate(new Date(currentMember.departureDate).toISOString().split("T")[0]);
      if (currentMember.personalNotes) setPersonalNotes(currentMember.personalNotes);
      setInitialized(true);
    }
  }, [currentMember, initialized]);

  const updateTravel = trpc.members.updateTravelDates.useMutation({
    onSuccess: () => {
      toast.success("Gespeichert!");
      utils.members.list.invalidate();
    },
    onError: () => toast.error("Fehler beim Speichern"),
  });



  const deleteStay = trpc.plannedStays.delete.useMutation({
    onSuccess: () => {
      toast.success("Aufenthalt gelöscht");
      utils.plannedStays.list.invalidate({ tripId: activeTripId! });
      setConfirmDeleteStayId(null);
    },
    onError: (err) => toast.error("Fehler: " + err.message),
  });

  const handleSave = () => {
    if (!currentMember) return;
    updateTravel.mutate({
      memberId: currentMember.id,
      arrivalDate: arrivalDate || undefined,
      departureDate: departureDate || undefined,
      personalNotes: personalNotes || undefined,
    });
  };









  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[oklch(0.11_0.02_255)] flex items-center justify-center">
        <div className="text-center glass-card p-8 rounded-2xl max-w-sm">
          <Plane className="w-10 h-10 text-[oklch(0.78_0.14_75)] mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-white mb-2">Login erforderlich</h2>
          <a href="/login" className="inline-block px-6 py-3 rounded-xl bg-gold-gradient text-[oklch(0.11_0.02_255)] font-semibold text-sm">
            Einloggen
          </a>
        </div>
      </div>
    );
  }

  if (!activeTripId && !loading) {
    return (
      <div className="min-h-screen bg-[oklch(0.11_0.02_255)] flex items-center justify-center">
        <div className="text-center glass-card p-8 rounded-2xl max-w-sm">
          <MapPin className="w-10 h-10 text-[oklch(0.65_0.22_150)] mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-white mb-2">Keine Reise vorhanden</h2>
          <p className="text-sm text-[oklch(0.55_0.02_255)]">Erstelle oder tritt einer Reise bei.</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[oklch(0.11_0.02_255)]">
      <div className="container mx-auto px-4 lg:px-8 pt-20 pb-8 max-w-2xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <span className="text-[oklch(0.78_0.14_75)] text-sm font-medium uppercase tracking-widest">Mein Bereich</span>
          <h1 className="text-3xl md:text-4xl font-bold text-white mt-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Meine <span className="text-gold-gradient">Reise</span>
          </h1>
          <p className="text-[oklch(0.55_0.02_255)] mt-1">
            {activeTrip?.name} · {activeTrip?.destination}
          </p>
        </motion.div>


        {/* Travel Dates */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 rounded-2xl mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Plane className="w-5 h-5 text-[oklch(0.78_0.14_75)]" />
            <h3 className="font-semibold text-white">An- & Abreise</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-[oklch(0.65_0.02_255)]">
                <Calendar className="w-3 h-3 inline mr-1" /> Ankunft
              </Label>
              <Input
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className="bg-[oklch(1_0_0/8%)] border-white/10 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-[oklch(0.65_0.02_255)]">
                <Calendar className="w-3 h-3 inline mr-1" /> Abreise
              </Label>
              <Input
                type="date"
                value={departureDate}
                min={arrivalDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="bg-[oklch(1_0_0/8%)] border-white/10 text-white mt-1"
              />
            </div>
          </div>
        </motion.div>

        {/* Stay Invitations */}
        {pendingInvitations && pendingInvitations.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 rounded-2xl mb-6 border border-[oklch(0.65_0.22_150/40%)] bg-[oklch(0.65_0.22_150/5%)]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[oklch(0.65_0.22_150/20%)] flex items-center justify-center">
                <Plane className="w-4 h-4 text-[oklch(0.65_0.22_150)]" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Aufenthalts-Einladungen</h3>
                <p className="text-[10px] text-[oklch(0.55_0.02_255)]">Du wurdest eingeladen</p>
              </div>
              <span className="ml-auto text-[10px] font-bold text-[oklch(0.65_0.22_150)] bg-[oklch(0.65_0.22_150/20%)] w-6 h-6 rounded-full flex items-center justify-center">{pendingInvitations.length}</span>
            </div>
            <div className="space-y-3">
              {pendingInvitations.map((inv) => {
                const inviterMember = members?.find((m: any) => m.id === inv.stay?.memberId);
                return (
                  <div key={inv.id} className="rounded-xl overflow-hidden border border-[oklch(0.65_0.22_150/25%)]">
                    {/* Card header */}
                    <div className="flex items-center gap-3 p-3 bg-[oklch(0.65_0.22_150/12%)]">
                      <div className="w-9 h-9 rounded-lg bg-[oklch(0.65_0.22_150/20%)] flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-[oklch(0.65_0.22_150)]" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{inv.stay?.location}</p>
                        <p className="text-[11px] text-[oklch(0.55_0.02_255)]">
                          {inv.stay?.fromDate && new Date(inv.stay.fromDate).toLocaleDateString('de-CH', { day: '2-digit', month: 'short' })} – {inv.stay?.toDate && new Date(inv.stay.toDate).toLocaleDateString('de-CH', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                      {inviterMember && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <MemberAvatar
                            avatarUrl={(inviterMember as any).avatarUrl}
                            avatarIcon={(inviterMember as any).avatarIcon}
                            avatarColor={(inviterMember as any).avatarColor}
                            displayName={inviterMember.displayName}
                            size="xs"
                          />
                          <span className="text-[10px] text-[oklch(0.55_0.02_255)] hidden sm:block">{inviterMember.displayName}</span>
                        </div>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex">
                      <button
                        onClick={() => setInvitationToAccept(inv)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-[oklch(0.65_0.22_150)] hover:bg-[oklch(0.65_0.22_150/15%)] transition-colors border-r border-[oklch(0.65_0.22_150/20%)]"
                      >
                        <Check className="w-3.5 h-3.5" /> Bestätigen
                      </button>
                      <button
                        onClick={() => declineInvitation.mutate({ invitationId: inv.id })}
                        disabled={declineInvitation.isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-[oklch(0.55_0.02_255)] hover:bg-[oklch(0.70_0.20_30/10%)] hover:text-[oklch(0.70_0.20_30)] transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Ablehnen
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Planned Stays */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6 rounded-2xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[oklch(0.65_0.22_150)]" />
              <h3 className="font-semibold text-white">Geplante Aufenthalte</h3>
              {myStays.length > 0 && (
                <span className="text-[10px] text-[oklch(0.45_0.02_255)] bg-[oklch(0.17_0.02_255)] px-2 py-0.5 rounded-full">
                  {myStays.length}
                </span>
              )}
            </div>
            <button
              onClick={() => { setEditingStay(null); setShowStayDialog(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[oklch(0.65_0.22_150/15%)] text-[oklch(0.65_0.22_150)] hover:bg-[oklch(0.65_0.22_150/25%)] text-xs font-medium transition-all"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
              Aufenthalt
            </button>
          </div>

          {myStays.length === 0 ? (
            <div className="text-center py-6 text-[oklch(0.45_0.02_255)]">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" strokeWidth={1} />
              <p className="text-sm">Noch keine Aufenthalte geplant</p>
              <p className="text-xs mt-1 opacity-70">Füge Orte hinzu, wo du übernachtest</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {myStays.map((stay, idx) => (
                  <motion.div
                    key={stay.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: idx * 0.04 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-[oklch(1_0_0/5%)] border border-[oklch(0.20_0.02_255)]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[oklch(0.65_0.22_150/15%)] flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-[oklch(0.65_0.22_150)]" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{stay.location}</p>
                      <p className="text-xs text-[oklch(0.55_0.02_255)] mt-0.5">
                        {new Date(stay.fromDate).toLocaleDateString("de-CH")} – {new Date(stay.toDate).toLocaleDateString("de-CH")}
                      </p>
                      {stay.note && (
                        <p className="text-xs text-[oklch(0.50_0.02_255)] mt-0.5 italic">{stay.note}</p>
                      )}
                      {/* Invitation status badges */}
                      <StayInvitationStatus stayId={stay.id} members={members ?? []} />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setEditingStay(stay); setShowStayDialog(true); }}
                        className="p-1.5 rounded-lg hover:bg-[oklch(0.25_0.02_255)] text-[oklch(0.50_0.02_255)] hover:text-white transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteStayId(stay.id)}
                        className="p-1.5 rounded-lg hover:bg-[oklch(0.70_0.20_30/15%)] text-[oklch(0.50_0.02_255)] hover:text-[oklch(0.70_0.20_30)] transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Personal Notes */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 rounded-2xl mb-6">
          <h3 className="font-semibold text-white mb-3">Persönliche Notizen</h3>
          <textarea
            value={personalNotes}
            onChange={(e) => setPersonalNotes(e.target.value)}
            placeholder="Flugdaten, Wünsche, Allergien, Notfallkontakte..."
            rows={4}
            className="w-full bg-[oklch(1_0_0/8%)] border border-white/10 rounded-md px-3 py-2 text-white text-sm outline-none resize-none"
          />
        </motion.div>

        {/* Save */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Button
            onClick={handleSave}
            disabled={updateTravel.isPending || !currentMember}
            className="w-full bg-gold-gradient text-[oklch(0.11_0.02_255)] hover:opacity-90 py-3"
          >
            {updateTravel.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Änderungen speichern
          </Button>
        </motion.div>

        {/* Group Overview – Wer ist wann wo? */}
        {activeTripId && <MemberOverview tripId={activeTripId} members={members ?? []} />}
      </div>

      {/* Stay Dialog */}
      {activeTripId && (
        <StayDialog
          open={showStayDialog}
          onClose={() => { setShowStayDialog(false); setEditingStay(null); }}
          tripId={activeTripId}
          stay={editingStay}
          onSuccess={() => { setShowStayDialog(false); setEditingStay(null); }}
        />
      )}

      {/* Accept Invitation Dialog */}
      <Dialog open={!!invitationToAccept} onOpenChange={(o) => !o && setInvitationToAccept(null)}>
        <DialogContent className="bg-[oklch(0.15_0.02_255)] border-[oklch(0.25_0.02_255)] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Check className="w-5 h-5 text-[oklch(0.65_0.22_150)]" strokeWidth={1.5} />
              Einladung bestätigen
            </DialogTitle>
          </DialogHeader>
          {invitationToAccept && (
            <div className="space-y-4 mt-2">
              <div className="p-3 rounded-lg bg-[oklch(0.65_0.22_150/10%)] border border-[oklch(0.65_0.22_150/20%)]">
                <p className="text-sm font-semibold text-white">{invitationToAccept.stay?.location}</p>
                <p className="text-xs text-[oklch(0.55_0.02_255)] mt-0.5">Ursprünglich: {invitationToAccept.stay?.fromDate && new Date(invitationToAccept.stay.fromDate).toLocaleDateString('de-CH')} – {invitationToAccept.stay?.toDate && new Date(invitationToAccept.stay.toDate).toLocaleDateString('de-CH')}</p>
              </div>
              <p className="text-xs text-[oklch(0.55_0.02_255)]">Passe deine eigenen Daten an (optional):</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[oklch(0.55_0.02_255)] mb-1 block">Von</Label>
                  <Input type="date" value={acceptFromDate} onChange={e => setAcceptFromDate(e.target.value)} className="bg-[oklch(0.20_0.02_255)] border-[oklch(0.30_0.02_255)] text-white text-xs" />
                </div>
                <div>
                  <Label className="text-xs text-[oklch(0.55_0.02_255)] mb-1 block">Bis</Label>
                  <Input type="date" value={acceptToDate} onChange={e => setAcceptToDate(e.target.value)} className="bg-[oklch(0.20_0.02_255)] border-[oklch(0.30_0.02_255)] text-white text-xs" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-[oklch(0.55_0.02_255)] mb-1 block">Notiz (optional)</Label>
                <Input value={acceptNote} onChange={e => setAcceptNote(e.target.value)} placeholder="z.B. Komme später, fliege früher..." className="bg-[oklch(0.20_0.02_255)] border-[oklch(0.30_0.02_255)] text-white text-xs" />
              </div>
              {accommodationsData && accommodationsData.length > 0 && (
                <div>
                  <Label className="text-xs text-[oklch(0.55_0.02_255)] mb-1 block">Eigene Unterkunft (optional)</Label>
                  <select
                    value={acceptAccommodationId ?? ""}
                    onChange={e => setAcceptAccommodationId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.30_0.02_255)] text-white text-xs rounded-md px-3 py-2 outline-none"
                  >
                    <option value="">Keine eigene Unterkunft</option>
                    {accommodationsData.map((acc: any) => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 mt-2">
                <Button variant="ghost" onClick={() => setInvitationToAccept(null)} className="flex-1 text-[oklch(0.60_0.02_255)]">
                  Abbrechen
                </Button>
                <Button
                  onClick={() => acceptInvitation.mutate({
                    invitationId: invitationToAccept.id,
                    fromDate: acceptFromDate,
                    toDate: acceptToDate,
                    note: acceptNote || undefined,
                    accommodationId: acceptAccommodationId,
                  })}
                  disabled={acceptInvitation.isPending || !acceptFromDate || !acceptToDate}
                  className="flex-1 bg-[oklch(0.65_0.22_150)] text-[oklch(0.11_0.02_255)] hover:opacity-90 font-semibold"
                >
                  {acceptInvitation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  Bestätigen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Stay */}
      <Dialog open={confirmDeleteStayId !== null} onOpenChange={(o) => !o && setConfirmDeleteStayId(null)}>
        <DialogContent className="bg-[oklch(0.15_0.02_255)] border-[oklch(0.25_0.02_255)] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-[oklch(0.70_0.20_30)]" strokeWidth={1.5} />
              Aufenthalt löschen?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[oklch(0.60_0.02_255)] mt-2">
            Möchtest du diesen Aufenthalt wirklich löschen?
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="ghost" onClick={() => setConfirmDeleteStayId(null)} className="flex-1 text-[oklch(0.60_0.02_255)]">
              Abbrechen
            </Button>
            <Button
              onClick={() => { if (confirmDeleteStayId) deleteStay.mutate({ id: confirmDeleteStayId }); }}
              disabled={deleteStay.isPending}
              className="flex-1 bg-[oklch(0.70_0.20_30)] text-white hover:opacity-90 font-semibold"
            >
              {deleteStay.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Löschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
