// Kontaktliste – SabaiSquad
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Loader2, Plus, Users, Phone, Search, Trash2, Edit2, X, Camera,
  Lock, Globe, Instagram, MessageCircle, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ContactCategory = "taxi" | "tuktuk" | "local" | "friend" | "guide" | "other";

const CATEGORY_META: Record<ContactCategory, { label: string; color: string; emoji: string }> = {
  taxi:    { label: "Taxifahrer",   color: "text-yellow-400",  emoji: "🚕" },
  tuktuk:  { label: "Tuk-Tuk",     color: "text-orange-400",  emoji: "🛺" },
  local:   { label: "Local",        color: "text-green-400",   emoji: "🌴" },
  friend:  { label: "Freund",       color: "text-blue-400",    emoji: "👋" },
  guide:   { label: "Guide",        color: "text-purple-400",  emoji: "🗺️" },
  other:   { label: "Sonstiges",    color: "text-muted-foreground", emoji: "📋" },
};

const EMPTY_FORM = {
  name: "",
  phone: "",
  instagram: "",
  line: "",
  whatsapp: "",
  category: "other" as ContactCategory,
  note: "",
  isPrivate: false,
  photoUrl: "",
};

export default function Contacts() {
  const { isAuthenticated, loading, user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ContactCategory | "all">("all");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const { data: trips } = trpc.trips.list.useQuery(undefined, { enabled: isAuthenticated });
  const activeTripId = trips?.[0]?.id ?? null;

  const { data: contacts, isLoading } = trpc.contacts.list.useQuery(
    { tripId: activeTripId! },
    { enabled: !!activeTripId }
  );

  const utils = trpc.useUtils();

  const createContact = trpc.contacts.create.useMutation({
    onSuccess: () => {
      utils.contacts.list.invalidate();
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast.success("Kontakt gespeichert!");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateContact = trpc.contacts.update.useMutation({
    onSuccess: () => {
      utils.contacts.list.invalidate();
      setEditId(null);
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast.success("Kontakt aktualisiert!");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteContact = trpc.contacts.delete.useMutation({
    onSuccess: () => {
      utils.contacts.list.invalidate();
      toast.success("Kontakt gelöscht");
    },
  });

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Name ist ein Pflichtfeld");
      return;
    }
    if (editId) {
      updateContact.mutate({ id: editId, ...form });
    } else {
      createContact.mutate({
        ...form,
        tripId: activeTripId!,
        createdBy: user!.id,
      });
    }
  };

  const handleEdit = (c: NonNullable<typeof contacts>[number]) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      phone: c.phone ?? "",
      instagram: c.instagram ?? "",
      line: c.line ?? "",
      whatsapp: c.whatsapp ?? "",
      category: c.category as ContactCategory,
      note: c.note ?? "",
      isPrivate: c.isPrivate ?? false,
      photoUrl: c.photoUrl ?? "",
    });
    setShowForm(true);
  };

  const filtered = useMemo(() => {
    if (!contacts) return [];
    return contacts.filter(c => {
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search) || c.note?.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === "all" || c.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [contacts, search, categoryFilter]);

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
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Kontakte
            </h1>
            <p className="text-sm text-muted-foreground">Taxifahrer, Locals, Guides</p>
          </div>
          <Button
            size="sm"
            onClick={() => { setEditId(null); setForm(EMPTY_FORM); setShowForm(true); }}
            className="bg-[oklch(0.78_0.14_75)] text-black hover:bg-[oklch(0.72_0.14_75)]"
          >
            <Plus className="w-4 h-4 mr-1" /> Neu
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              categoryFilter === "all"
                ? "bg-[oklch(0.78_0.14_75)] text-black"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            Alle
          </button>
          {(Object.keys(CATEGORY_META) as ContactCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                categoryFilter === cat
                  ? "bg-[oklch(0.78_0.14_75)] text-black"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-3">
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
                  <h3 className="font-semibold">{editId ? "Kontakt bearbeiten" : "Neuer Kontakt"}</h3>
                  <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}>
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Photo Upload */}
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center overflow-hidden shrink-0">
                    {form.photoUrl ? (
                      <img src={form.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-muted-foreground text-xs font-medium cursor-pointer hover:bg-muted transition-colors w-fit">
                      <Camera className="w-4 h-4" />
                      {uploadingPhoto ? "Lädt..." : "Visitenkarte / Foto"}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingPhoto(true);
                          try {
                            const formData = new FormData();
                            formData.append("file", file);
                            formData.append("folder", "contacts");
                            const res = await fetch("/api/upload", { method: "POST", body: formData });
                            const { url } = await res.json();
                            if (url) setForm(f => ({ ...f, photoUrl: url }));
                          } catch {
                            toast.error("Upload fehlgeschlagen");
                          } finally {
                            setUploadingPhoto(false);
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>
                    {form.photoUrl && (
                      <button
                        onClick={() => setForm(f => ({ ...f, photoUrl: "" }))}
                        className="text-xs text-red-400 hover:underline mt-1 block"
                      >
                        Foto entfernen
                      </button>
                    )}
                  </div>
                </div>

                <Input
                  placeholder="Name *"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                />

                <Input
                  placeholder="Telefon / WhatsApp"
                  value={form.phone}
                  onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Instagram"
                    value={form.instagram}
                    onChange={(e) => setForm(f => ({ ...f, instagram: e.target.value }))}
                  />
                  <Input
                    placeholder="LINE ID"
                    value={form.line}
                    onChange={(e) => setForm(f => ({ ...f, line: e.target.value }))}
                  />
                </div>

                {/* Category */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {(Object.keys(CATEGORY_META) as ContactCategory[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setForm(f => ({ ...f, category: cat }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                        form.category === cat
                          ? "bg-[oklch(0.78_0.14_75)] text-black"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
                    </button>
                  ))}
                </div>

                <Input
                  placeholder="Bemerkung (optional)"
                  value={form.note}
                  onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))}
                />

                {/* Private Toggle */}
                <button
                  onClick={() => setForm(f => ({ ...f, isPrivate: !f.isPrivate }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors w-full ${
                    form.isPrivate
                      ? "bg-amber-500/15 text-amber-400"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {form.isPrivate ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                  {form.isPrivate ? "Privat – nur für mich sichtbar" : "Für die Gruppe sichtbar"}
                </button>

                <Button
                  onClick={handleSubmit}
                  disabled={createContact.isPending || updateContact.isPending}
                  className="w-full bg-[oklch(0.78_0.14_75)] text-black"
                >
                  {editId ? "Speichern" : "Kontakt hinzufügen"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty State */}
        {filtered.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {search || categoryFilter !== "all" ? "Keine Kontakte gefunden" : "Noch keine Kontakte"}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {!search && categoryFilter === "all" && "Füge Taxifahrer, Locals und Guides hinzu"}
            </p>
          </div>
        )}

        {/* Contact Cards */}
        <div className="space-y-3">
          {filtered.map((c, i) => {
            const meta = CATEGORY_META[c.category as ContactCategory] ?? CATEGORY_META.other;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`rounded-xl border bg-card p-4 ${c.isPrivate ? "border-amber-500/20" : "border-border/50"}`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar / Photo */}
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center overflow-hidden shrink-0">
                    {c.photoUrl ? (
                      <img src={c.photoUrl} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">{meta.emoji}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{c.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-muted/50 ${meta.color}`}>{meta.label}</span>
                      {c.isPrivate && <Lock className="w-3 h-3 text-amber-400" />}
                    </div>

                    <div className="mt-1.5 space-y-1">
                      {c.phone && (
                        <a
                          href={`tel:${c.phone}`}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{c.phone}</span>
                        </a>
                      )}
                      {c.instagram && (
                        <a
                          href={`https://instagram.com/${c.instagram.replace("@", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-pink-400"
                        >
                          <Instagram className="w-3 h-3" />
                          <span>{c.instagram}</span>
                        </a>
                      )}
                      {c.line && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MessageCircle className="w-3 h-3" />
                          <span>LINE: {c.line}</span>
                        </div>
                      )}
                      {c.whatsapp && (
                        <a
                          href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-green-400"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp: {c.whatsapp}</span>
                        </a>
                      )}
                      {c.note && (
                        <p className="text-xs text-muted-foreground/70 italic">{c.note}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(c)}
                      className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteContact.mutate({ id: c.id })}
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
