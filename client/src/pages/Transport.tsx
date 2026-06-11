// Transport-Buchungen – SabaiSquad
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Loader2, Plus, Plane, Car, Bus, Ship, Train, Zap, Package,
  Trash2, Edit2, X, ExternalLink, MapPin, Clock, CreditCard, FileText, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TransportType = "flight" | "taxi" | "bus" | "ferry" | "train" | "tuktuk" | "other";

const TYPE_META: Record<TransportType, { label: string; icon: React.ReactNode; color: string }> = {
  flight: { label: "Flug", icon: <Plane className="w-4 h-4" />, color: "text-blue-400" },
  taxi: { label: "Taxi / Grab / Bolt", icon: <Car className="w-4 h-4" />, color: "text-yellow-400" },
  bus: { label: "Bus", icon: <Bus className="w-4 h-4" />, color: "text-green-400" },
  ferry: { label: "Fähre", icon: <Ship className="w-4 h-4" />, color: "text-cyan-400" },
  train: { label: "Zug", icon: <Train className="w-4 h-4" />, color: "text-purple-400" },
  tuktuk: { label: "Tuk-Tuk", icon: <Zap className="w-4 h-4" />, color: "text-orange-400" },
  other: { label: "Sonstiges", icon: <Package className="w-4 h-4" />, color: "text-muted-foreground" },
};

const EMPTY_FORM = {
  type: "taxi" as TransportType,
  fromLocation: "",
  toLocation: "",
  departureDate: "",
  arrivalDate: "",
  price: "",
  currency: "THB",
  bookingRef: "",
  notes: "",
};

function buildDeepLinks(from: string, to: string, date: string) {
  const dateStr = date ? new Date(date).toISOString().slice(0, 10).replace(/-/g, "") : "";
  const fromEnc = encodeURIComponent(from);
  const toEnc = encodeURIComponent(to);
  return {
    skyscanner: `https://www.skyscanner.net/transport/flights/${fromEnc}/${toEnc}/${dateStr}/`,
    googleFlights: `https://www.google.com/flights?q=flights+from+${fromEnc}+to+${toEnc}`,
    grab: `https://www.grab.com/th/transport/`,
    bolt: `https://bolt.eu/en/`,
    bookingTransfer: `https://www.booking.com/airport-taxi/index.html`,
  };
}

export default function Transport() {
  const { isAuthenticated, loading, user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showLinks, setShowLinks] = useState<number | null>(null);

  const { data: trips } = trpc.trips.list.useQuery(undefined, { enabled: isAuthenticated });
  const activeTripId = trips?.[0]?.id ?? null;

  const { data: transports, isLoading } = trpc.transports.list.useQuery(
    { tripId: activeTripId! },
    { enabled: !!activeTripId }
  );

  const { data: contacts } = trpc.contacts.list.useQuery(
    { tripId: activeTripId! },
    { enabled: !!activeTripId }
  );

  const utils = trpc.useUtils();

  const createTransport = trpc.transports.create.useMutation({
    onSuccess: () => {
      utils.transports.list.invalidate();
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast.success("Transport erfasst!");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateTransport = trpc.transports.update.useMutation({
    onSuccess: () => {
      utils.transports.list.invalidate();
      setEditId(null);
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast.success("Transport aktualisiert!");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteTransport = trpc.transports.delete.useMutation({
    onSuccess: () => {
      utils.transports.list.invalidate();
      toast.success("Transport gelöscht");
    },
  });

  const handleSubmit = () => {
    if (!form.fromLocation.trim() || !form.toLocation.trim()) {
      toast.error("Von und Nach sind Pflichtfelder");
      return;
    }
    if (editId) {
      updateTransport.mutate({ id: editId, ...form });
    } else {
      createTransport.mutate({
        ...form,
        tripId: activeTripId!,
        createdBy: user!.id,
      });
    }
  };

  const handleEdit = (t: typeof transports extends (infer U)[] | undefined ? U : never) => {
    if (!t) return;
    setEditId(t.id);
    setForm({
      type: t.type as TransportType,
      fromLocation: t.fromLocation,
      toLocation: t.toLocation,
      departureDate: t.departureDate ? new Date(t.departureDate).toISOString().slice(0, 16) : "",
      arrivalDate: t.arrivalDate ? new Date(t.arrivalDate).toISOString().slice(0, 16) : "",
      price: t.price ?? "",
      currency: t.currency ?? "THB",
      bookingRef: t.bookingRef ?? "",
      notes: t.notes ?? "",
    });
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Header */}
      <div className="sticky top-16 z-20 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Plane className="w-5 h-5" />
              Transport
            </h1>
            <p className="text-sm text-muted-foreground">Flüge, Taxis, Transfers</p>
          </div>
          <Button
            size="sm"
            onClick={() => { setEditId(null); setForm(EMPTY_FORM); setShowForm(true); }}
            className="bg-[oklch(0.78_0.14_75)] text-black hover:bg-[oklch(0.72_0.14_75)]"
          >
            <Plus className="w-4 h-4 mr-1" /> Hinzufügen
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Quick Links */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Schnell-Links</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Skyscanner", url: "https://www.skyscanner.net", color: "text-blue-400" },
              { label: "Google Flights", url: "https://www.google.com/flights", color: "text-green-400" },
              { label: "Grab", url: "https://www.grab.com/th/transport/", color: "text-green-500" },
              { label: "Bolt", url: "https://bolt.eu/en/", color: "text-[oklch(0.78_0.14_75)]" },
              { label: "12Go Asia", url: "https://12go.asia/en", color: "text-orange-400" },
              { label: "Booking Transfer", url: "https://www.booking.com/airport-taxi/index.html", color: "text-blue-500" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors text-sm font-medium"
              >
                <ExternalLink className={`w-3.5 h-3.5 ${link.color}`} />
                <span>{link.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-[oklch(0.78_0.14_75)]/30 bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{editId ? "Transport bearbeiten" : "Neuer Transport"}</h3>
                  <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}>
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Type Selector */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {(Object.keys(TYPE_META) as TransportType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                        form.type === t
                          ? "bg-[oklch(0.78_0.14_75)] text-black"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {TYPE_META[t].icon}
                      {TYPE_META[t].label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Von (z.B. BKK)"
                    value={form.fromLocation}
                    onChange={(e) => setForm(f => ({ ...f, fromLocation: e.target.value }))}
                  />
                  <Input
                    placeholder="Nach (z.B. HKT)"
                    value={form.toLocation}
                    onChange={(e) => setForm(f => ({ ...f, toLocation: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Abfahrt</label>
                    <Input
                      type="datetime-local"
                      value={form.departureDate}
                      onChange={(e) => setForm(f => ({ ...f, departureDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Ankunft</label>
                    <Input
                      type="datetime-local"
                      value={form.arrivalDate}
                      onChange={(e) => setForm(f => ({ ...f, arrivalDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Input
                      placeholder="Preis"
                      value={form.price}
                      onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                    />
                  </div>
                  <Input
                    placeholder="Währung"
                    value={form.currency}
                    onChange={(e) => setForm(f => ({ ...f, currency: e.target.value }))}
                  />
                </div>

                <Input
                  placeholder="Buchungsreferenz (optional)"
                  value={form.bookingRef}
                  onChange={(e) => setForm(f => ({ ...f, bookingRef: e.target.value }))}
                />

                <Input
                  placeholder="Notizen (optional)"
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                />

                {/* Deep Links for Flights */}
                {(form.type === "flight" || form.type === "taxi") && form.fromLocation && form.toLocation && (
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground mb-2">Direkt suchen:</p>
                    <div className="flex flex-wrap gap-2">
                      {form.type === "flight" && (
                        <>
                          <a
                            href={buildDeepLinks(form.fromLocation, form.toLocation, form.departureDate).skyscanner}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                          >
                            Skyscanner ↗
                          </a>
                          <a
                            href={buildDeepLinks(form.fromLocation, form.toLocation, form.departureDate).googleFlights}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          >
                            Google Flights ↗
                          </a>
                        </>
                      )}
                      {form.type === "taxi" && (
                        <>
                          <a href="https://www.grab.com/th/transport/" target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30">Grab ↗</a>
                          <a href="https://bolt.eu/en/" target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 rounded bg-[oklch(0.78_0.14_75)]/20 text-[oklch(0.78_0.14_75)] hover:bg-[oklch(0.78_0.14_75)]/30">Bolt ↗</a>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={createTransport.isPending || updateTransport.isPending}
                  className="w-full bg-[oklch(0.78_0.14_75)] text-black"
                >
                  {editId ? "Speichern" : "Hinzufügen"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transport List */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {transports?.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Plane className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Noch keine Transporte erfasst</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Füge Flüge, Taxis und Transfers hinzu</p>
          </div>
        )}

        <div className="space-y-3">
          {transports?.map((t, i) => {
            const meta = TYPE_META[t.type as TransportType] ?? TYPE_META.other;
            const contact = contacts?.find(c => c.id === t.contactId);
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-border/50 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`mt-0.5 ${meta.color}`}>{meta.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{t.fromLocation}</span>
                        <span className="text-muted-foreground text-xs">→</span>
                        <span className="font-semibold text-sm">{t.toLocation}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-muted/50 ${meta.color}`}>{meta.label}</span>
                      </div>

                      <div className="mt-2 space-y-1">
                        {t.departureDate && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>Abfahrt: {new Date(t.departureDate).toLocaleString("de-CH", { dateStyle: "short", timeStyle: "short" })}</span>
                          </div>
                        )}
                        {t.arrivalDate && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>Ankunft: {new Date(t.arrivalDate).toLocaleString("de-CH", { dateStyle: "short", timeStyle: "short" })}</span>
                          </div>
                        )}
                        {t.price && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CreditCard className="w-3 h-3" />
                            <span>{t.price} {t.currency}</span>
                          </div>
                        )}
                        {t.bookingRef && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <FileText className="w-3 h-3" />
                            <span>Ref: {t.bookingRef}</span>
                          </div>
                        )}
                        {contact && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span>{contact.name}</span>
                          </div>
                        )}
                        {t.notes && (
                          <p className="text-xs text-muted-foreground/70 italic">{t.notes}</p>
                        )}
                      </div>

                      {/* Quick links for this entry */}
                      {(t.type === "flight" || t.type === "taxi") && (
                        <div className="mt-2">
                          <button
                            onClick={() => setShowLinks(showLinks === t.id ? null : t.id)}
                            className="text-xs text-[oklch(0.78_0.14_75)] hover:underline"
                          >
                            {showLinks === t.id ? "Links ausblenden" : "Buchen / Suchen ↗"}
                          </button>
                          <AnimatePresence>
                            {showLinks === t.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {t.type === "flight" && (
                                    <>
                                      <a href={buildDeepLinks(t.fromLocation, t.toLocation, t.departureDate?.toString() ?? "").skyscanner} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">Skyscanner ↗</a>
                                      <a href={buildDeepLinks(t.fromLocation, t.toLocation, t.departureDate?.toString() ?? "").googleFlights} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">Google Flights ↗</a>
                                    </>
                                  )}
                                  {t.type === "taxi" && (
                                    <>
                                      <a href="https://www.grab.com/th/transport/" target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">Grab ↗</a>
                                      <a href="https://bolt.eu/en/" target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 rounded bg-[oklch(0.78_0.14_75)]/20 text-[oklch(0.78_0.14_75)]">Bolt ↗</a>
                                    </>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(t)}
                      className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteTransport.mutate({ id: t.id })}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
