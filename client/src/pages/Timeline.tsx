// Itinerary / Timeline – Full trip planner with multiple destinations, hotels, activities, transports
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Loader2, Plus, Plane, Hotel, MapPin, Train, Utensils, Camera, Trash2, X, Car, CalendarDays, Clock,
  BedDouble, Navigation, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EVENT_TYPES = [
  { value: "flight", label: "Flug", icon: Plane, color: "oklch(0.65_0.22_250)" },
  { value: "hotel", label: "Hotel", icon: Hotel, color: "oklch(0.72_0.18_150)" },
  { value: "activity", label: "Aktivität", icon: Camera, color: "oklch(0.78_0.14_75)" },
  { value: "transport", label: "Transfer", icon: Car, color: "oklch(0.65_0.15_300)" },
  { value: "meal", label: "Restaurant", icon: Utensils, color: "oklch(0.70_0.15_30)" },
  { value: "other", label: "Sonstiges", icon: MapPin, color: "oklch(0.60_0.10_200)" },
] as const;

type EventType = "flight" | "hotel" | "activity" | "transport" | "meal" | "other";

function getEventConfig(type: EventType) {
  return EVENT_TYPES.find(e => e.value === type) || EVENT_TYPES[5];
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("de-CH", { weekday: "short", day: "numeric", month: "short" });
}

function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
}

export default function Timeline() {
  const { isAuthenticated, loading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<EventType | "all">("all");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventType, setEventType] = useState<EventType>("activity");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [cost, setCost] = useState("");
  const [currency, setCurrency] = useState("THB");

  // Queries
  const { data: trips } = trpc.trips.list.useQuery(undefined, { enabled: isAuthenticated });
  const activeTripId = trips?.[0]?.id ?? null;

  const { data: events, isLoading } = trpc.timeline.list.useQuery(
    { tripId: activeTripId! },
    { enabled: !!activeTripId }
  );

  const { data: stays } = trpc.plannedStays.list.useQuery(
    { tripId: activeTripId! },
    { enabled: !!activeTripId }
  );

  const { data: accommodations } = trpc.accommodations.list.useQuery(
    { tripId: activeTripId! },
    { enabled: !!activeTripId }
  );

  const utils = trpc.useUtils();

  const createEvent = trpc.timeline.create.useMutation({
    onSuccess: () => {
      utils.timeline.list.invalidate({ tripId: activeTripId! });
      toast.success("Eintrag hinzugefügt!");
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteEvent = trpc.timeline.delete.useMutation({
    onSuccess: () => {
      utils.timeline.list.invalidate({ tripId: activeTripId! });
      toast.success("Eintrag gelöscht");
    },
  });

  const resetForm = () => {
    setTitle(""); setDescription(""); setLocation(""); setEventType("activity");
    setStartTime(""); setEndTime(""); setConfirmationNumber(""); setCost(""); setCurrency("THB");
    setShowForm(false);
  };

  const handleCreate = () => {
    if (!title.trim() || !startTime) return;
    createEvent.mutate({
      tripId: activeTripId!,
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      eventType,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : undefined,
      confirmationNumber: confirmationNumber.trim() || undefined,
      cost: cost ? parseFloat(cost) : undefined,
      currency,
    });
  };

  // Group events by date (including stays and accommodations)
  const groupedEvents = useMemo(() => {
    const allItems: any[] = [];
    if (events) {
      const filtered = filterType === "all" ? events : events.filter(e => e.eventType === filterType);
      allItems.push(...filtered.map(e => ({ ...e, itemType: 'event', startDate: e.startTime })));
    }
    if (filterType === "all" && stays) {
      allItems.push(...stays.map(s => ({ ...s, itemType: 'stay', startDate: s.fromDate, title: s.location })));
    }
    if (filterType === "all" && accommodations) {
      allItems.push(...accommodations.map(a => ({ ...a, itemType: 'accommodation', startDate: a.checkinDate, title: a.name })));
    }
    const groups: Record<string, any[]> = {};
    allItems.forEach(item => {
      const dateKey = new Date(item.startDate).toISOString().split("T")[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, items]) => ({
        date,
        label: formatDate(date),
        items: items.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
      }));
  }, [events, stays, accommodations, filterType]);

  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[oklch(0.11_0.02_255)] flex items-center justify-center">
        <div className="text-center glass-card p-8 rounded-2xl max-w-sm">
          <CalendarDays className="w-10 h-10 text-[oklch(0.78_0.14_75)] mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-white mb-2">Login erforderlich</h2>
          <a href="/login" className="inline-block px-6 py-3 rounded-xl bg-gold-gradient text-[oklch(0.11_0.02_255)] font-semibold text-sm">
            Einloggen
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(0.11_0.02_255)]">
      <div className="container mx-auto px-4 lg:px-8 pt-20 pb-8 max-w-4xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <span className="text-[oklch(0.78_0.14_75)] text-sm font-medium uppercase tracking-widest">Reiseverlauf</span>
          <h1 className="text-3xl md:text-4xl font-bold text-white mt-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Itinerary <span className="text-gold-gradient">Planer</span>
          </h1>
          <p className="text-[oklch(0.55_0.02_255)] mt-1">
            Flüge, Hotels, Aktivitäten & Transfers – alles chronologisch
          </p>
        </motion.div>

        {/* Actions Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex flex-wrap items-center gap-3 mb-6">
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gold-gradient text-[oklch(0.11_0.02_255)] hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-1" /> Neuer Eintrag
          </Button>

          {/* Filter */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterType === "all" ? "bg-white/15 text-white" : "text-[oklch(0.55_0.02_255)] hover:text-white"
              }`}
            >
              Alle
            </button>
            {EVENT_TYPES.map(et => {
              const Icon = et.icon;
              return (
                <button
                  key={et.value}
                  onClick={() => setFilterType(et.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                    filterType === et.value ? "bg-white/15 text-white" : "text-[oklch(0.55_0.02_255)] hover:text-white"
                  }`}
                >
                  <Icon className="w-3 h-3" /> {et.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Create Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card p-6 rounded-2xl mb-6 border border-[oklch(0.78_0.14_75/30%)]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Neuer Eintrag</h3>
                <button onClick={() => setShowForm(false)} className="text-[oklch(0.55_0.02_255)] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Event Type Selection */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                {EVENT_TYPES.map(et => {
                  const Icon = et.icon;
                  return (
                    <button
                      key={et.value}
                      onClick={() => setEventType(et.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs transition-all ${
                        eventType === et.value
                          ? "bg-[oklch(0.78_0.14_75/20%)] border border-[oklch(0.78_0.14_75/50%)] text-[oklch(0.78_0.14_75)]"
                          : "bg-[oklch(1_0_0/5%)] text-[oklch(0.55_0.02_255)] hover:bg-[oklch(1_0_0/10%)]"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {et.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-[oklch(0.65_0.02_255)]">Titel *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={eventType === "flight" ? "z.B. ZRH → BKK (Swiss LX180)" : eventType === "hotel" ? "z.B. Marriott Pattaya" : eventType === "transport" ? "z.B. Grab nach Jomtien" : "Titel"}
                    className="bg-[oklch(1_0_0/8%)] border-white/10 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[oklch(0.65_0.02_255)]">Ort / Destination</Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="z.B. Bangkok, Pattaya, Koh Samui..."
                    className="bg-[oklch(1_0_0/8%)] border-white/10 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[oklch(0.65_0.02_255)]">Start (Datum & Zeit) *</Label>
                  <Input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-[oklch(1_0_0/8%)] border-white/10 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[oklch(0.65_0.02_255)]">Ende (Datum & Zeit)</Label>
                  <Input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="bg-[oklch(1_0_0/8%)] border-white/10 text-white mt-1"
                  />
                </div>
              </div>

              <div className="mb-4">
                <Label className="text-[oklch(0.65_0.02_255)]">Beschreibung / Notizen</Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details, Adresse, Hinweise..."
                  rows={2}
                  className="w-full bg-[oklch(1_0_0/8%)] border border-white/10 rounded-md px-3 py-2 text-white text-sm outline-none resize-none mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label className="text-[oklch(0.65_0.02_255)]">Buchungsnr. / Ref.</Label>
                  <Input
                    value={confirmationNumber}
                    onChange={(e) => setConfirmationNumber(e.target.value)}
                    placeholder="z.B. ABC123"
                    className="bg-[oklch(1_0_0/8%)] border-white/10 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[oklch(0.65_0.02_255)]">Kosten</Label>
                  <Input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="0.00"
                    className="bg-[oklch(1_0_0/8%)] border-white/10 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[oklch(0.65_0.02_255)]">Währung</Label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-[oklch(1_0_0/8%)] border border-white/10 rounded-md px-3 py-2.5 text-white text-sm outline-none mt-1"
                  >
                    <option value="THB">🇹🇭 THB</option>
                    <option value="CHF">🇨🇭 CHF</option>
                    <option value="EUR">🇪🇺 EUR</option>
                    <option value="USD">🇺🇸 USD</option>
                  </select>
                </div>
              </div>

              <Button
                onClick={handleCreate}
                disabled={!title.trim() || !startTime || createEvent.isPending}
                className="w-full bg-gold-gradient text-[oklch(0.11_0.02_255)] hover:opacity-90"
              >
                {createEvent.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Eintrag hinzufügen
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[oklch(0.55_0.02_255)]" />
          </div>
        ) : groupedEvents.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <CalendarDays className="w-12 h-12 text-[oklch(0.55_0.02_255)] mb-4" strokeWidth={1.5} />
            <h3 className="text-xl font-semibold text-white mb-2">Noch keine Einträge</h3>
            <p className="text-[oklch(0.55_0.02_255)] mb-4">
              Füge Flüge, Hotels, Aktivitäten und Transfers hinzu, um deinen Reiseverlauf zu planen.
            </p>
            <Button onClick={() => setShowForm(true)} className="bg-gold-gradient text-[oklch(0.11_0.02_255)]">
              <Plus className="w-4 h-4 mr-1" /> Ersten Eintrag erstellen
            </Button>
          </motion.div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-[oklch(0.78_0.14_75/50%)] via-[oklch(0.78_0.14_75/20%)] to-transparent" />

            {groupedEvents.map((group, gi) => (
              <motion.div
                key={group.date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.05 }}
                className="mb-8"
              >
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-4 relative">
                  <div className="w-12 h-12 rounded-full bg-[oklch(0.78_0.14_75/15%)] border border-[oklch(0.78_0.14_75/40%)] flex items-center justify-center text-xs font-bold text-[oklch(0.78_0.14_75)] z-10">
                    {new Date(group.date).getDate()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{group.label}</div>
                    <div className="text-xs text-[oklch(0.50_0.02_255)]">{group.items.length} {group.items.length === 1 ? "Eintrag" : "Einträge"}</div>
                  </div>
                </div>

                {/* Events */}
                <div className="ml-14 space-y-3">
                  {group.items.map((item, idx) => {
                    // Accommodation item
                    if (item.itemType === 'accommodation') {
                      return (
                        <motion.div key={`acc-${item.id}`} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.04 }}
                          className="glass-card p-4 rounded-xl border border-[oklch(0.55_0.18_220/30%)] bg-[oklch(0.55_0.18_220/8%)]"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[oklch(0.55_0.18_220/20%)]">
                              <BedDouble className="w-5 h-5 text-[oklch(0.65_0.18_220)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[9px] uppercase tracking-widest font-bold text-[oklch(0.65_0.18_220)] bg-[oklch(0.65_0.18_220/15%)] px-2 py-0.5 rounded-full">Unterkunft</span>
                                <span className="text-[10px] text-[oklch(0.50_0.02_255)]">{item.type}</span>
                              </div>
                              <h4 className="font-semibold text-white text-sm">{item.title}</h4>
                              {item.address && <p className="text-xs text-[oklch(0.55_0.02_255)] flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{item.address}</p>}
                              <div className="flex flex-wrap gap-3 mt-2 text-xs text-[oklch(0.55_0.02_255)]">
                                {item.checkinDate && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Check-in: {formatDate(item.checkinDate)}</span>}
                                {item.checkoutDate && <span>→ Check-out: {formatDate(item.checkoutDate)}</span>}
                                {item.totalPrice && <span className="text-[oklch(0.78_0.14_75)]">{parseFloat(item.totalPrice).toFixed(0)} {item.currency}</span>}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    }
                    // Stay item
                    if (item.itemType === 'stay') {
                      return (
                        <motion.div key={`stay-${item.id}`} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.04 }}
                          className="glass-card p-4 rounded-xl border border-[oklch(0.65_0.22_150/30%)] bg-[oklch(0.65_0.22_150/8%)]"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[oklch(0.65_0.22_150/20%)]">
                              <Navigation className="w-5 h-5 text-[oklch(0.65_0.22_150)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[9px] uppercase tracking-widest font-bold text-[oklch(0.65_0.22_150)] bg-[oklch(0.65_0.22_150/15%)] px-2 py-0.5 rounded-full">Aufenthalt</span>
                              </div>
                              <h4 className="font-semibold text-white text-sm">{item.title}</h4>
                              {item.note && <p className="text-xs text-[oklch(0.55_0.02_255)] mt-0.5">{item.note}</p>}
                              <div className="flex flex-wrap gap-3 mt-2 text-xs text-[oklch(0.55_0.02_255)]">
                                {item.fromDate && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(item.fromDate)}</span>}
                                {item.toDate && <span>→ {formatDate(item.toDate)}</span>}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    }
                    // Regular timeline event
                    const config = getEventConfig(item.eventType as EventType);
                    const Icon = config.icon;
                    return (
                      <motion.div
                        key={`evt-${item.id}`}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.04 }}
                        className="glass-card p-4 rounded-xl border border-transparent hover:border-white/10 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${config.color}` + "20" }}
                          >
                            <Icon className="w-5 h-5" style={{ color: config.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-medium text-white text-sm">{item.title}</h4>
                                {item.location && (
                                  <p className="text-xs text-[oklch(0.55_0.02_255)] flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3" /> {item.location}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => deleteEvent.mutate({ eventId: item.id })}
                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            {item.description && (
                              <p className="text-xs text-[oklch(0.50_0.02_255)] mt-1">{item.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[oklch(0.55_0.02_255)]">
                              {item.startTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(item.startTime)}</span>}
                              {item.endTime && <span>→ {formatTime(item.endTime)}</span>}
                              {item.confirmationNumber && (
                                <span className="bg-[oklch(1_0_0/8%)] px-2 py-0.5 rounded text-[oklch(0.65_0.02_255)]">
                                  #{item.confirmationNumber}
                                </span>
                              )}
                              {item.cost && (
                                <span className="text-[oklch(0.78_0.14_75)]">
                                  {parseFloat(item.cost).toFixed(0)} {item.currency}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats */}
        {events && events.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card p-5 rounded-2xl mt-8">
            <h3 className="font-semibold text-white mb-3">Übersicht</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {EVENT_TYPES.map(et => {
                const count = events.filter(e => e.eventType === et.value).length;
                const Icon = et.icon;
                return (
                  <div key={et.value} className="text-center p-3 rounded-xl bg-[oklch(1_0_0/5%)]">
                    <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: et.color }} />
                    <div className="text-lg font-bold text-white">{count}</div>
                    <div className="text-xs text-[oklch(0.50_0.02_255)]">{et.label}</div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
