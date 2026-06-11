import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Building2, Search, Plus, ExternalLink, Copy, Phone, MapPin,
  Calendar, Wifi as WifiIcon, Key, Users, Trash2, Pencil, X, UserPlus,
  Hotel, Home as HomeIcon, Tent, ChevronDown, ChevronUp, MessageCircle,
  Waves, Snowflake, CookingPot, Car, Shirt, Sun, Eye,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
const ACCOMMODATION_TYPES = [
  { id: "hotel", label: "Hotel", icon: Hotel },
  { id: "villa", label: "Villa", icon: HomeIcon },
  { id: "airbnb", label: "Airbnb", icon: HomeIcon },
  { id: "hostel", label: "Hostel", icon: Tent },
] as const;

const PLATFORMS = [
  { id: "booking", label: "Booking.com" },
  { id: "agoda", label: "Agoda" },
  { id: "airbnb", label: "Airbnb" },
  { id: "direct", label: "Direkt" },
  { id: "other", label: "Andere" },
] as const;

const CURRENCIES = ["CHF", "THB", "EUR", "USD"] as const;

function getTypeIcon(type: string) {
  const t = ACCOMMODATION_TYPES.find(a => a.id === type);
  return t?.icon ?? Building2;
}

function formatDate(d: string | Date | null | undefined) {
  if (!d) return "–";
  const date = new Date(d);
  return date.toLocaleDateString("de-CH", { day: "2-digit", month: "short", year: "numeric" });
}

function isPast(d: string | Date | null | undefined) {
  if (!d) return false;
  return new Date(d) < new Date();
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function Accommodations() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: trips } = trpc.trips.list.useQuery();
  const activeTripId = trips?.[0]?.id ?? 0;
  const { data: members } = trpc.members.list.useQuery(
    { tripId: activeTripId },
    { enabled: activeTripId > 0 }
  );

  const { data: accommodationsData, isLoading } = trpc.accommodations.list.useQuery(
    { tripId: activeTripId },
    { enabled: activeTripId > 0 }
  );

  const [activeTab, setActiveTab] = useState<"bookings" | "search" | "contacts">("bookings");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAcc, setEditingAcc] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [addContactForId, setAddContactForId] = useState<number | null>(null);

  const deleteAcc = trpc.accommodations.delete.useMutation({
    onSuccess: () => {
      toast.success("Unterkunft gelöscht");
      utils.accommodations.list.invalidate({ tripId: activeTripId });
      setConfirmDeleteId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const removeContact = trpc.accommodations.removeContact.useMutation({
    onSuccess: () => {
      toast.success("Kontakt entfernt");
      utils.accommodations.list.invalidate({ tripId: activeTripId });
    },
    onError: (err) => toast.error(err.message),
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[oklch(0.11_0.02_255)] pb-24">
      {/* Header */}
      <div className="sticky top-16 z-10 bg-[oklch(0.11_0.02_255/90%)] backdrop-blur-xl border-b border-[oklch(0.20_0.02_255)]">
        <div className="container py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[oklch(0.78_0.14_75/15%)] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[oklch(0.78_0.14_75)]" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Unterkünfte</h1>
                <p className="text-xs text-[oklch(0.55_0.02_255)]">
                  {accommodationsData?.length ?? 0} Buchungen
                </p>
              </div>
            </div>
            {activeTab === "bookings" && (
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)] hover:opacity-90 font-semibold gap-1.5"
                size="sm"
              >
                <Plus className="w-4 h-4" strokeWidth={1.5} />
                Buchung
              </Button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { id: "bookings" as const, label: "Buchungen", icon: Building2 },
              { id: "search" as const, label: "Suchen", icon: Search },
              { id: "contacts" as const, label: "Kontakte", icon: Users },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)]"
                    : "bg-[oklch(0.17_0.02_255)] text-[oklch(0.60_0.02_255)] hover:bg-[oklch(0.22_0.02_255)]"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-6">
        {activeTab === "bookings" && (
          <BookingsTab
            accommodations={accommodationsData ?? []}
            members={members ?? []}
            isLoading={isLoading}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
            onEdit={setEditingAcc}
            onDelete={setConfirmDeleteId}
            onAddContact={setAddContactForId}
            onRemoveContact={(id) => removeContact.mutate({ contactId: id })}
          />
        )}
        {activeTab === "search" && <SearchTab />}
        {activeTab === "contacts" && (
          <ContactsTab members={members ?? []} accommodations={accommodationsData ?? []} />
        )}
      </div>

      {/* ── ADD/EDIT DIALOG ── */}
      <AccommodationDialog
        open={showAddDialog || !!editingAcc}
        onClose={() => { setShowAddDialog(false); setEditingAcc(null); }}
        tripId={activeTripId}
        members={members ?? []}
        accommodation={editingAcc}
        onSuccess={() => {
          utils.accommodations.list.invalidate({ tripId: activeTripId });
          setShowAddDialog(false);
          setEditingAcc(null);
        }}
      />

      {/* ── ADD CONTACT DIALOG ── */}
      {addContactForId && (
        <AddContactDialog
          open={!!addContactForId}
          onClose={() => setAddContactForId(null)}
          accommodationId={addContactForId}
          onSuccess={() => {
            utils.accommodations.list.invalidate({ tripId: activeTripId });
            setAddContactForId(null);
          }}
        />
      )}

      {/* ── CONFIRM DELETE ── */}
      <Dialog open={confirmDeleteId !== null} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
        <DialogContent className="bg-[oklch(0.15_0.02_255)] border-[oklch(0.25_0.02_255)] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-[oklch(0.70_0.20_30)]" strokeWidth={1.5} />
              Unterkunft löschen?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[oklch(0.60_0.02_255)] mt-2">
            Alle Kontaktpersonen werden ebenfalls gelöscht.
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="ghost" onClick={() => setConfirmDeleteId(null)} className="flex-1 text-[oklch(0.60_0.02_255)]">
              Abbrechen
            </Button>
            <Button
              onClick={() => { if (confirmDeleteId) deleteAcc.mutate({ id: confirmDeleteId }); }}
              className="flex-1 bg-[oklch(0.70_0.20_30)] text-white hover:opacity-90 font-semibold"
            >
              Löschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── BOOKINGS TAB ─────────────────────────────────────────────────────────────
function BookingsTab({
  accommodations, members, isLoading, expandedId, setExpandedId,
  onEdit, onDelete, onAddContact, onRemoveContact,
}: {
  accommodations: any[];
  members: any[];
  isLoading: boolean;
  expandedId: number | null;
  setExpandedId: (id: number | null) => void;
  onEdit: (acc: any) => void;
  onDelete: (id: number) => void;
  onAddContact: (id: number) => void;
  onRemoveContact: (id: number) => void;
}) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopiert!`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="h-32 rounded-xl bg-[oklch(0.17_0.02_255)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (accommodations.length === 0) {
    return (
      <div className="text-center py-16">
        <Building2 className="w-12 h-12 mx-auto text-[oklch(0.30_0.02_255)] mb-4" strokeWidth={1} />
        <p className="text-[oklch(0.50_0.02_255)]">Noch keine Buchungen</p>
        <p className="text-xs text-[oklch(0.40_0.02_255)] mt-1">Nutze "Suchen" um eine Unterkunft zu finden</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {accommodations.map((acc, idx) => {
          const TypeIcon = getTypeIcon(acc.type);
          const isExpanded = expandedId === acc.id;
          const past = isPast(acc.checkoutDate);

          return (
            <motion.div
              key={acc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`rounded-xl border transition-all ${
                past
                  ? "border-[oklch(0.18_0.02_255)] opacity-60"
                  : "border-[oklch(0.25_0.02_255)] hover:border-[oklch(0.35_0.02_255)]"
              } bg-[oklch(0.14_0.02_255)]`}
            >
              {/* Card Header */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : acc.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[oklch(0.20_0.02_255)] flex items-center justify-center shrink-0">
                      <TypeIcon className="w-5 h-5 text-[oklch(0.78_0.14_75)]" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">{acc.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[oklch(0.55_0.02_255)]">
                        <Calendar className="w-3 h-3" strokeWidth={1.5} />
                        <span>{formatDate(acc.checkinDate)} → {formatDate(acc.checkoutDate)}</span>
                      </div>
                      {acc.address && (
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-[oklch(0.50_0.02_255)]">
                          <MapPin className="w-3 h-3" strokeWidth={1.5} />
                          <span className="truncate">{acc.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(acc); }} className="p-1.5 rounded-lg hover:bg-[oklch(0.25_0.02_255)] text-[oklch(0.55_0.02_255)] hover:text-white">
                      <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(acc.id); }} className="p-1.5 rounded-lg hover:bg-[oklch(0.70_0.20_30/15%)] text-[oklch(0.55_0.02_255)] hover:text-[oklch(0.70_0.20_30)]">
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-[oklch(0.45_0.02_255)]" /> : <ChevronDown className="w-4 h-4 text-[oklch(0.45_0.02_255)]" />}
                  </div>
                </div>

                {/* Quick Info Row */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {acc.accessCode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(acc.accessCode, "Zugangscode"); }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[oklch(0.78_0.14_75/10%)] text-[oklch(0.78_0.14_75)] text-[10px] font-medium"
                    >
                      <Key className="w-3 h-3" strokeWidth={1.5} />
                      {acc.accessCode}
                      <Copy className="w-2.5 h-2.5 ml-1" strokeWidth={1.5} />
                    </button>
                  )}
                  {acc.wifiPassword && (
                    <button
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(acc.wifiPassword, "WLAN-Passwort"); }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[oklch(0.72_0.14_185/10%)] text-[oklch(0.72_0.14_185)] text-[10px] font-medium"
                    >
                      <WifiIcon className="w-3 h-3" strokeWidth={1.5} />
                      {acc.wifiPassword}
                      <Copy className="w-2.5 h-2.5 ml-1" strokeWidth={1.5} />
                    </button>
                  )}
                  {acc.totalPrice && (
                    <span className="px-2 py-1 rounded-lg bg-[oklch(0.20_0.02_255)] text-[oklch(0.60_0.02_255)] text-[10px] font-medium">
                      {acc.currency} {Number(acc.totalPrice).toLocaleString("de-CH")}
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-[oklch(0.20_0.02_255)] px-4 py-4 space-y-4"
                >
                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {acc.platform && (
                      <div>
                        <span className="text-[oklch(0.45_0.02_255)]">Plattform</span>
                        <p className="text-white mt-0.5 capitalize">{acc.platform}</p>
                      </div>
                    )}
                    {acc.bookingRef && (
                      <div>
                        <span className="text-[oklch(0.45_0.02_255)]">Referenz</span>
                        <p className="text-white mt-0.5 font-mono">{acc.bookingRef}</p>
                      </div>
                    )}
                    {acc.pricePerNight && (
                      <div>
                        <span className="text-[oklch(0.45_0.02_255)]">Pro Nacht</span>
                        <p className="text-white mt-0.5">{acc.currency} {Number(acc.pricePerNight).toLocaleString("de-CH")}</p>
                      </div>
                    )}
                  </div>

                  {/* Maps Link */}
                  {acc.mapsLink && (
                    <a
                      href={acc.mapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-[oklch(0.72_0.14_185)] hover:underline"
                    >
                      <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                      In Google Maps öffnen
                      <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                    </a>
                  )}

                  {/* House Rules */}
                  {acc.houseRules && (
                    <div>
                      <span className="text-[10px] text-[oklch(0.45_0.02_255)] uppercase tracking-wider">Hausregeln</span>
                      <p className="text-xs text-[oklch(0.60_0.02_255)] mt-1 whitespace-pre-wrap">{acc.houseRules}</p>
                    </div>
                  )}

                  {/* Residents */}
                  {acc.residents && acc.residents.length > 0 && (
                    <div>
                      <span className="text-[10px] text-[oklch(0.45_0.02_255)] uppercase tracking-wider">Bewohner</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {acc.residents.map((userId: number) => {
                          const member = members.find((m: any) => m.userId === userId);
                          return (
                            <span key={userId} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[oklch(0.20_0.02_255)] text-xs text-white">
                              {member?.avatar ? (
                                <img src={member.avatar} className="w-4 h-4 rounded-full" alt="" />
                              ) : (
                                <Users className="w-3 h-3" strokeWidth={1.5} />
                              )}
                              {member?.displayName ?? `User ${userId}`}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Contacts */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[oklch(0.45_0.02_255)] uppercase tracking-wider">Kontaktpersonen</span>
                      <button
                        onClick={() => onAddContact(acc.id)}
                        className="flex items-center gap-1 text-[10px] text-[oklch(0.78_0.14_75)] hover:underline"
                      >
                        <UserPlus className="w-3 h-3" strokeWidth={1.5} />
                        Hinzufügen
                      </button>
                    </div>
                    {acc.contacts && acc.contacts.length > 0 ? (
                      <div className="space-y-2 mt-2">
                        {acc.contacts.map((c: any) => (
                          <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-[oklch(0.18_0.02_255)]">
                            <div>
                              <p className="text-xs text-white font-medium">{c.name}</p>
                              {c.role && <p className="text-[10px] text-[oklch(0.50_0.02_255)]">{c.role}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              {c.phone && (
                                <a href={`tel:${c.phone}`} className="p-1.5 rounded-lg bg-[oklch(0.72_0.14_185/15%)] text-[oklch(0.72_0.14_185)]">
                                  <Phone className="w-3.5 h-3.5" strokeWidth={1.5} />
                                </a>
                              )}
                              {c.lineId && (
                                <span className="text-[10px] text-[oklch(0.55_0.02_255)] bg-[oklch(0.22_0.02_255)] px-1.5 py-0.5 rounded">
                                  LINE: {c.lineId}
                                </span>
                              )}
                              <button
                                onClick={() => onRemoveContact(c.id)}
                                className="p-1 rounded text-[oklch(0.45_0.02_255)] hover:text-[oklch(0.70_0.20_30)]"
                              >
                                <X className="w-3 h-3" strokeWidth={1.5} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[oklch(0.40_0.02_255)] mt-2">Keine Kontakte hinterlegt</p>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ── SEARCH TAB ───────────────────────────────────────────────────────────────
// ── AMENITIES CONFIG ──────────────────────────────────────────────────────────
const AMENITIES = [
  { id: "pool", label: "Pool", icon: Waves, bookingFilter: "hotelfacility%3D433", airbnbId: "7" },
  { id: "ac", label: "Klimaanlage", icon: Snowflake, bookingFilter: "hotelfacility%3D11", airbnbId: "5" },
  { id: "wifi", label: "WLAN", icon: WifiIcon, bookingFilter: "hotelfacility%3D107", airbnbId: "4" },
  { id: "kitchen", label: "K\u00fcche", icon: CookingPot, bookingFilter: "roomfacility%3D39", airbnbId: "8" },
  { id: "parking", label: "Parkplatz", icon: Car, bookingFilter: "hotelfacility%3D2", airbnbId: "" },
  { id: "laundry", label: "Waschmaschine", icon: Shirt, bookingFilter: "", airbnbId: "33" },
  { id: "balcony", label: "Balkon", icon: Sun, bookingFilter: "", airbnbId: "" },
  { id: "seaview", label: "Meerblick", icon: Eye, bookingFilter: "", airbnbId: "" },
] as const;

const SEARCH_PROPERTY_TYPES = [
  { id: "villa", label: "Villa", airbnbId: "57" },
  { id: "apartment", label: "Apartment", airbnbId: "1" },
  { id: "hotel", label: "Hotel", airbnbId: "" },
  { id: "hostel", label: "Hostel", airbnbId: "" },
  { id: "house", label: "Haus", airbnbId: "2" },
] as const;

const SORT_OPTIONS = [
  { id: "relevance", label: "Relevanz" },
  { id: "price_asc", label: "Preis aufsteigend" },
  { id: "price_desc", label: "Preis absteigend" },
  { id: "rating", label: "Bewertung" },
  { id: "distance", label: "Entfernung" },
] as const;

function SearchTab() {
  const [ort, setOrt] = useState("");
  const [stadtteil, setStadtteil] = useState("");
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [guests, setGuests] = useState("4");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced filters
  const [bedrooms, setBedrooms] = useState("1");
  const [bathrooms, setBathrooms] = useState("1");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortBy, setSortBy] = useState("relevance");

  const toggleType = (id: string) => {
    setSelectedTypes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };
  const toggleAmenity = (id: string) => {
    setSelectedAmenities(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const fullLocation = [ort, stadtteil].filter(Boolean).join(", ");

  const buildBookingUrl = () => {
    const params = new URLSearchParams({ ss: fullLocation, group_adults: guests });
    if (checkin) params.set("checkin", checkin);
    if (checkout) params.set("checkout", checkout);
    if (showAdvanced) {
      if (parseInt(bedrooms) > 1) params.set("no_rooms", bedrooms);
      // Sort
      if (sortBy === "price_asc") params.set("order", "price");
      else if (sortBy === "rating") params.set("order", "review_score");
      else if (sortBy === "distance") params.set("order", "distance");
      // Price
      if (priceMin) params.set("price_min", priceMin);
      if (priceMax) params.set("price_max", priceMax);
    }
    // Build nflt separately to avoid double-encoding
    let url = `https://www.booking.com/searchresults.html?${params.toString()}`;
    if (showAdvanced) {
      const filters: string[] = [];
      selectedAmenities.forEach(aId => {
        const amenity = AMENITIES.find(a => a.id === aId);
        if (amenity?.bookingFilter) filters.push(amenity.bookingFilter);
      });
      if (filters.length > 0) url += `&nflt=${filters.join(";")}`;
    }
    return url;
  };

  const buildAgodaUrl = () => {
    const params = new URLSearchParams({ city: fullLocation, adults: guests });
    if (checkin) params.set("checkIn", checkin);
    if (checkout) params.set("checkOut", checkout);
    if (showAdvanced) {
      if (parseInt(bedrooms) > 1) params.set("rooms", bedrooms);
      if (priceMin) params.set("price_min", priceMin);
      if (priceMax) params.set("price_max", priceMax);
    }
    return `https://www.agoda.com/search?${params.toString()}`;
  };

  const buildAirbnbUrl = () => {
    const locationSlug = [ort, stadtteil].filter(Boolean).join("--");
    const params = new URLSearchParams({ adults: guests });
    if (checkin) params.set("checkin", checkin);
    if (checkout) params.set("checkout", checkout);
    if (showAdvanced) {
      if (parseInt(bedrooms) > 1) params.set("min_bedrooms", bedrooms);
      if (parseInt(bathrooms) > 1) params.set("min_bathrooms", bathrooms);
      // Amenities
      selectedAmenities.forEach(aId => {
        const amenity = AMENITIES.find(a => a.id === aId);
        if (amenity?.airbnbId) params.append("amenities[]", amenity.airbnbId);
      });
      // Property types
      selectedTypes.forEach(tId => {
        const pType = SEARCH_PROPERTY_TYPES.find(p => p.id === tId);
        if (pType?.airbnbId) params.append("property_type_id[]", pType.airbnbId);
      });
      // Price
      if (priceMin) params.set("price_min", priceMin);
      if (priceMax) params.set("price_max", priceMax);
      // Sort
      if (sortBy === "price_asc") params.set("sort_order", "price_asc");
      else if (sortBy === "rating") params.set("sort_order", "review_scores");
    }
    return `https://www.airbnb.com/s/${encodeURIComponent(locationSlug)}/homes?${params.toString()}`;
  };

  const inputCls = "w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-xl px-3 py-2.5 text-white text-sm placeholder-[oklch(0.40_0.02_255)] focus:outline-none focus:border-[oklch(0.78_0.14_75)]";
  const labelCls = "text-xs text-[oklch(0.60_0.02_255)] mb-1 block";

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-5 border border-[oklch(0.20_0.02_255)]">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-[oklch(0.78_0.14_75)]" strokeWidth={1.5} />
          Unterkunft suchen
        </h2>

        <div className="space-y-3">
          {/* Basic: Ort */}
          <div>
            <label className={labelCls}>Ort / Stadt</label>
            <input
              value={ort}
              onChange={e => setOrt(e.target.value)}
              placeholder="z.B. Bangkok, Chiang Mai, Koh Samui..."
              className={inputCls}
            />
          </div>

          {/* Basic: Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Check-in</label>
              <input type="date" value={checkin} onChange={e => setCheckin(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Check-out</label>
              <input type="date" value={checkout} onChange={e => setCheckout(e.target.value)} min={checkin || undefined} className={inputCls} />
            </div>
          </div>

          {/* Basic: Guests */}
          <div>
            <label className={labelCls}>Anzahl G\u00e4ste</label>
            <input type="number" min="1" max="20" value={guests} onChange={e => setGuests(e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="mt-4 flex items-center gap-2 text-xs font-medium text-[oklch(0.78_0.14_75)] hover:text-[oklch(0.85_0.14_75)] transition-colors"
        >
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.5} /> : <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} />}
          Erweiterte Filter {showAdvanced ? "ausblenden" : "anzeigen"}
        </button>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-[oklch(0.20_0.02_255)] space-y-4">
            {/* Stadtteil */}
            <div>
              <label className={labelCls}>Stadtteil / Region</label>
              <input
                value={stadtteil}
                onChange={e => setStadtteil(e.target.value)}
                placeholder="z.B. Jomtien, Nord-Pattaya, Sukhumvit..."
                className={inputCls}
              />
            </div>

            {/* Bedrooms + Bathrooms */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Schlafzimmer</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setBedrooms(String(Math.max(1, parseInt(bedrooms) - 1)))} className="w-8 h-8 rounded-lg bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] text-white flex items-center justify-center hover:bg-[oklch(0.25_0.02_255)] transition-colors">−</button>
                  <span className="text-sm text-white font-medium w-6 text-center">{bedrooms}</span>
                  <button onClick={() => setBedrooms(String(Math.min(10, parseInt(bedrooms) + 1)))} className="w-8 h-8 rounded-lg bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] text-white flex items-center justify-center hover:bg-[oklch(0.25_0.02_255)] transition-colors">+</button>
                </div>
              </div>
              <div>
                <label className={labelCls}>Badezimmer</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setBathrooms(String(Math.max(1, parseInt(bathrooms) - 1)))} className="w-8 h-8 rounded-lg bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] text-white flex items-center justify-center hover:bg-[oklch(0.25_0.02_255)] transition-colors">−</button>
                  <span className="text-sm text-white font-medium w-6 text-center">{bathrooms}</span>
                  <button onClick={() => setBathrooms(String(Math.min(5, parseInt(bathrooms) + 1)))} className="w-8 h-8 rounded-lg bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] text-white flex items-center justify-center hover:bg-[oklch(0.25_0.02_255)] transition-colors">+</button>
                </div>
              </div>
            </div>

            {/* Property Type */}
            <div>
              <label className={labelCls}>Unterkunftstyp</label>
              <div className="flex flex-wrap gap-2">
                {SEARCH_PROPERTY_TYPES.map(pt => (
                  <button
                    key={pt.id}
                    onClick={() => toggleType(pt.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedTypes.includes(pt.id)
                        ? "bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)]"
                        : "bg-[oklch(0.20_0.02_255)] text-[oklch(0.60_0.02_255)] hover:bg-[oklch(0.25_0.02_255)]"
                    }`}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className={labelCls}>Ausstattung</label>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map(am => {
                  const Icon = am.icon;
                  return (
                    <button
                      key={am.id}
                      onClick={() => toggleAmenity(am.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedAmenities.includes(am.id)
                          ? "bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)]"
                          : "bg-[oklch(0.20_0.02_255)] text-[oklch(0.60_0.02_255)] hover:bg-[oklch(0.25_0.02_255)]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                      {am.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className={labelCls}>Preisbereich (pro Nacht)</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min="0"
                  value={priceMin}
                  onChange={e => setPriceMin(e.target.value)}
                  placeholder="Min"
                  className={inputCls}
                />
                <input
                  type="number"
                  min="0"
                  value={priceMax}
                  onChange={e => setPriceMax(e.target.value)}
                  placeholder="Max"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className={labelCls}>Sortierung</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className={inputCls}
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Search Buttons */}
      <div className="space-y-3">
        <a
          href={buildBookingUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-between p-4 rounded-xl border border-[oklch(0.25_0.02_255)] bg-[oklch(0.14_0.02_255)] hover:border-[oklch(0.40_0.02_255)] transition-all ${!ort ? "opacity-50 pointer-events-none" : ""}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[oklch(0.20_0.02_255)] flex items-center justify-center">
              <Building2 className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-medium text-white">Auf Booking.com suchen</span>
          </div>
          <ExternalLink className="w-4 h-4 text-[oklch(0.50_0.02_255)]" strokeWidth={1.5} />
        </a>

        <a
          href={buildAgodaUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-between p-4 rounded-xl border border-[oklch(0.25_0.02_255)] bg-[oklch(0.14_0.02_255)] hover:border-[oklch(0.40_0.02_255)] transition-all ${!ort ? "opacity-50 pointer-events-none" : ""}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[oklch(0.20_0.02_255)] flex items-center justify-center">
              <Building2 className="w-4 h-4 text-red-400" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-medium text-white">Auf Agoda suchen</span>
          </div>
          <ExternalLink className="w-4 h-4 text-[oklch(0.50_0.02_255)]" strokeWidth={1.5} />
        </a>

        <a
          href={buildAirbnbUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-between p-4 rounded-xl border border-[oklch(0.25_0.02_255)] bg-[oklch(0.14_0.02_255)] hover:border-[oklch(0.40_0.02_255)] transition-all ${!ort ? "opacity-50 pointer-events-none" : ""}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[oklch(0.20_0.02_255)] flex items-center justify-center">
              <HomeIcon className="w-4 h-4 text-pink-400" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-medium text-white">Auf Airbnb suchen</span>
          </div>
          <ExternalLink className="w-4 h-4 text-[oklch(0.50_0.02_255)]" strokeWidth={1.5} />
        </a>
      </div>

      {!ort && (
        <p className="text-xs text-center text-[oklch(0.45_0.02_255)]">
          Gib einen Ort ein um die Suche zu starten
        </p>
      )}
    </div>
  );
}

// ── CONTACTS TAB ─────────────────────────────────────────────────────────────
function ContactsTab({ members, accommodations }: { members: any[]; accommodations: any[] }) {
  const now = new Date();

  const getMemberCurrentAccommodation = (userId: number) => {
    return accommodations.find(acc =>
      acc.residents?.includes(userId) &&
      acc.checkinDate && acc.checkoutDate &&
      new Date(acc.checkinDate) <= now &&
      new Date(acc.checkoutDate) >= now
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-white flex items-center gap-2">
        <Users className="w-4 h-4 text-[oklch(0.78_0.14_75)]" strokeWidth={1.5} />
        Gruppenmitglieder
      </h2>

      {members.length === 0 ? (
        <p className="text-xs text-[oklch(0.45_0.02_255)]">Keine Mitglieder gefunden</p>
      ) : (
        <div className="space-y-2">
          {members.map((m: any) => {
            const currentAcc = getMemberCurrentAccommodation(m.userId);
            return (
              <div key={m.userId} className="flex items-center justify-between p-3 rounded-xl bg-[oklch(0.14_0.02_255)] border border-[oklch(0.20_0.02_255)]">
                <div className="flex items-center gap-3">
                  {m.avatar ? (
                    <img src={m.avatar} className="w-9 h-9 rounded-full" alt="" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[oklch(0.25_0.02_255)] flex items-center justify-center">
                      <Users className="w-4 h-4 text-[oklch(0.55_0.02_255)]" strokeWidth={1.5} />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">{m.displayName}</p>
                    {currentAcc && (
                      <p className="text-[10px] text-[oklch(0.55_0.02_255)] flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" strokeWidth={1.5} />
                        {currentAcc.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.phone && (
                    <a href={`tel:${m.phone}`} className="p-2 rounded-lg bg-[oklch(0.72_0.14_185/15%)] text-[oklch(0.72_0.14_185)]">
                      <Phone className="w-4 h-4" strokeWidth={1.5} />
                    </a>
                  )}
                  {m.lineId && (
                    <span className="text-[10px] text-[oklch(0.55_0.02_255)] bg-[oklch(0.22_0.02_255)] px-2 py-1 rounded-lg flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" strokeWidth={1.5} />
                      {m.lineId}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── ACCOMMODATION DIALOG ─────────────────────────────────────────────────────
function AccommodationDialog({
  open, onClose, tripId, members, accommodation, onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  tripId: number;
  members: any[];
  accommodation?: any;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("hotel");
  const [address, setAddress] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [checkinDate, setCheckinDate] = useState("");
  const [checkoutDate, setCheckoutDate] = useState("");
  const [pricePerNight, setPricePerNight] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [currency, setCurrency] = useState("THB");
  const [platform, setPlatform] = useState("");
  const [bookingRef, setBookingRef] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [houseRules, setHouseRules] = useState("");
  const [residents, setResidents] = useState<number[]>([]);

  // Reset form state when dialog opens or switches between add/edit
  useEffect(() => {
    if (open) {
      setName(accommodation?.name ?? "");
      setType(accommodation?.type ?? "hotel");
      setAddress(accommodation?.address ?? "");
      setMapsLink(accommodation?.mapsLink ?? "");
      setCheckinDate(accommodation?.checkinDate ? new Date(accommodation.checkinDate).toISOString().slice(0, 16) : "");
      setCheckoutDate(accommodation?.checkoutDate ? new Date(accommodation.checkoutDate).toISOString().slice(0, 16) : "");
      setPricePerNight(accommodation?.pricePerNight ?? "");
      setTotalPrice(accommodation?.totalPrice ?? "");
      setCurrency(accommodation?.currency ?? "THB");
      setPlatform(accommodation?.platform ?? "");
      setBookingRef(accommodation?.bookingRef ?? "");
      setAccessCode(accommodation?.accessCode ?? "");
      setWifiPassword(accommodation?.wifiPassword ?? "");
      setHouseRules(accommodation?.houseRules ?? "");
      setResidents(accommodation?.residents ?? []);
    }
  }, [open, accommodation]);

  const createAcc = trpc.accommodations.create.useMutation({
    onSuccess: () => { toast.success("Buchung hinzugefügt!"); onSuccess(); },
    onError: (err) => toast.error(err.message),
  });

  const updateAcc = trpc.accommodations.update.useMutation({
    onSuccess: () => { toast.success("Buchung aktualisiert!"); onSuccess(); },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!name.trim()) { toast.error("Name ist erforderlich"); return; }
    const data = {
      tripId,
      name: name.trim(),
      type,
      address: address || undefined,
      mapsLink: mapsLink || undefined,
      checkinDate: checkinDate || undefined,
      checkoutDate: checkoutDate || undefined,
      pricePerNight: pricePerNight ? String(pricePerNight) : undefined,
      totalPrice: totalPrice ? String(totalPrice) : undefined,
      currency,
      platform: platform || undefined,
      bookingRef: bookingRef || undefined,
      accessCode: accessCode || undefined,
      wifiPassword: wifiPassword || undefined,
      houseRules: houseRules || undefined,
      residents,
    };
    if (accommodation) {
      updateAcc.mutate({ id: accommodation.id, ...data });
    } else {
      createAcc.mutate(data);
    }
  };

  const toggleResident = (userId: number) => {
    setResidents(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const isLoading = createAcc.isPending || updateAcc.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[oklch(0.15_0.02_255)] border-[oklch(0.25_0.02_255)] text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            {accommodation ? (
              <><Pencil className="w-5 h-5 text-[oklch(0.72_0.14_185)]" strokeWidth={1.5} /> Buchung bearbeiten</>
            ) : (
              <><Plus className="w-5 h-5 text-[oklch(0.78_0.14_75)]" strokeWidth={1.5} /> Neue Buchung</>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Type */}
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-2 block">Typ</label>
            <div className="grid grid-cols-4 gap-2">
              {ACCOMMODATION_TYPES.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-[10px] font-medium transition-all ${
                      type === t.id
                        ? "bg-[oklch(0.78_0.14_75/15%)] border border-[oklch(0.78_0.14_75/50%)] text-[oklch(0.78_0.14_75)]"
                        : "bg-[oklch(0.20_0.02_255)] border border-transparent text-[oklch(0.55_0.02_255)] hover:bg-[oklch(0.25_0.02_255)]"
                    }`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Centara Grand" className="w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-xl px-3 py-2 text-white text-sm placeholder-[oklch(0.40_0.02_255)] focus:outline-none focus:border-[oklch(0.78_0.14_75)]" />
          </div>

          {/* Address + Maps */}
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Adresse</label>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Strasse, Stadt" className="w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-xl px-3 py-2 text-white text-sm placeholder-[oklch(0.40_0.02_255)] focus:outline-none focus:border-[oklch(0.78_0.14_75)]" />
          </div>
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Google Maps Link</label>
            <input value={mapsLink} onChange={e => setMapsLink(e.target.value)} placeholder="https://maps.google.com/..." className="w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-xl px-3 py-2 text-white text-sm placeholder-[oklch(0.40_0.02_255)] focus:outline-none focus:border-[oklch(0.78_0.14_75)]" />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Check-in</label>
              <input type="datetime-local" value={checkinDate} onChange={e => setCheckinDate(e.target.value)} className="w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[oklch(0.78_0.14_75)]" />
            </div>
            <div>
              <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Check-out</label>
              <input type="datetime-local" value={checkoutDate} onChange={e => setCheckoutDate(e.target.value)} min={checkinDate || undefined} className="w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[oklch(0.78_0.14_75)]" />
            </div>
          </div>

          {/* Price */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Pro Nacht</label>
              <input type="number" value={pricePerNight} onChange={e => setPricePerNight(e.target.value)} placeholder="0" className="w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[oklch(0.78_0.14_75)]" />
            </div>
            <div>
              <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Gesamt</label>
              <input type="number" value={totalPrice} onChange={e => setTotalPrice(e.target.value)} placeholder="0" className="w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[oklch(0.78_0.14_75)]" />
            </div>
            <div>
              <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Währung</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[oklch(0.78_0.14_75)]">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Platform + Ref */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Plattform</label>
              <select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[oklch(0.78_0.14_75)]">
                <option value="">–</option>
                {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Buchungsreferenz</label>
              <input value={bookingRef} onChange={e => setBookingRef(e.target.value)} placeholder="ABC123" className="w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-xl px-3 py-2 text-white text-sm placeholder-[oklch(0.40_0.02_255)] focus:outline-none focus:border-[oklch(0.78_0.14_75)]" />
            </div>
          </div>

          {/* Access + WiFi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Zugangscode / PIN</label>
              <input value={accessCode} onChange={e => setAccessCode(e.target.value)} placeholder="1234" className="w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-xl px-3 py-2 text-white text-sm placeholder-[oklch(0.40_0.02_255)] focus:outline-none focus:border-[oklch(0.78_0.14_75)]" />
            </div>
            <div>
              <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">WLAN-Passwort</label>
              <input value={wifiPassword} onChange={e => setWifiPassword(e.target.value)} placeholder="wifi123" className="w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-xl px-3 py-2 text-white text-sm placeholder-[oklch(0.40_0.02_255)] focus:outline-none focus:border-[oklch(0.78_0.14_75)]" />
            </div>
          </div>

          {/* House Rules */}
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Hausregeln / Notizen</label>
            <textarea value={houseRules} onChange={e => setHouseRules(e.target.value)} rows={3} placeholder="Keine Schuhe im Haus, Pool bis 22 Uhr..." className="w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-xl px-3 py-2 text-white text-sm placeholder-[oklch(0.40_0.02_255)] focus:outline-none focus:border-[oklch(0.78_0.14_75)] resize-none" />
          </div>

          {/* Residents */}
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-2 block">Wer wohnt dort?</label>
            <div className="flex flex-wrap gap-2">
              {members.map((m: any) => (
                <button
                  key={m.userId}
                  type="button"
                  onClick={() => toggleResident(m.userId)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs transition-all ${
                    residents.includes(m.userId)
                      ? "bg-[oklch(0.78_0.14_75/20%)] border border-[oklch(0.78_0.14_75/50%)] text-[oklch(0.78_0.14_75)]"
                      : "bg-[oklch(0.20_0.02_255)] border border-transparent text-[oklch(0.55_0.02_255)] hover:bg-[oklch(0.25_0.02_255)]"
                  }`}
                >
                  {m.avatar ? (
                    <img src={m.avatar} className="w-4 h-4 rounded-full" alt="" />
                  ) : (
                    <Users className="w-3 h-3" strokeWidth={1.5} />
                  )}
                  {m.displayName}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={onClose} className="flex-1 text-[oklch(0.60_0.02_255)]">Abbrechen</Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="flex-1 bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)] hover:opacity-90 font-semibold">
              {isLoading ? "Speichern..." : (accommodation ? "Änderungen speichern" : "Buchung hinzufügen")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── ADD CONTACT DIALOG ───────────────────────────────────────────────────────
function AddContactDialog({
  open, onClose, accommodationId, onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  accommodationId: number;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [lineId, setLineId] = useState("");

  const addContact = trpc.accommodations.addContact.useMutation({
    onSuccess: () => { toast.success("Kontakt hinzugefügt!"); onSuccess(); },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!name.trim()) { toast.error("Name ist erforderlich"); return; }
    addContact.mutate({
      accommodationId,
      name: name.trim(),
      role: role || undefined,
      phone: phone || undefined,
      lineId: lineId || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[oklch(0.15_0.02_255)] border-[oklch(0.25_0.02_255)] text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[oklch(0.78_0.14_75)]" strokeWidth={1.5} />
            Kontakt hinzufügen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Khun Somchai" className="w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-xl px-3 py-2 text-white text-sm placeholder-[oklch(0.40_0.02_255)] focus:outline-none focus:border-[oklch(0.78_0.14_75)]" />
          </div>
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Rolle</label>
            <input value={role} onChange={e => setRole(e.target.value)} placeholder="z.B. Managerin, Vermieter, Rezeption" className="w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-xl px-3 py-2 text-white text-sm placeholder-[oklch(0.40_0.02_255)] focus:outline-none focus:border-[oklch(0.78_0.14_75)]" />
          </div>
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Telefonnummer</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+66 81 234 5678" className="w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-xl px-3 py-2 text-white text-sm placeholder-[oklch(0.40_0.02_255)] focus:outline-none focus:border-[oklch(0.78_0.14_75)]" />
          </div>
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">LINE ID</label>
            <input value={lineId} onChange={e => setLineId(e.target.value)} placeholder="Optional" className="w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-xl px-3 py-2 text-white text-sm placeholder-[oklch(0.40_0.02_255)] focus:outline-none focus:border-[oklch(0.78_0.14_75)]" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={onClose} className="flex-1 text-[oklch(0.60_0.02_255)]">Abbrechen</Button>
            <Button onClick={handleSubmit} disabled={addContact.isPending} className="flex-1 bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)] hover:opacity-90 font-semibold">
              {addContact.isPending ? "Speichern..." : "Hinzufügen"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
