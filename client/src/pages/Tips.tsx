import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Lightbulb, Search, Plus, Pencil, Trash2,
  Wallet, Car, UtensilsCrossed, Bed, Shield,
  Moon, Heart, X, Check,
} from "lucide-react";

// ── Category Config ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all", label: "Alle", icon: Lightbulb },
  { id: "money", label: "Geld & Bezahlen", icon: Wallet },
  { id: "transport", label: "Transport", icon: Car },
  { id: "food", label: "Essen & Trinken", icon: UtensilsCrossed },
  { id: "accommodation", label: "Unterkunft", icon: Bed },
  { id: "culture", label: "Kultur & Verhalten", icon: Heart },
  { id: "safety", label: "Sicherheit", icon: Shield },
  { id: "nightlife", label: "Nachtleben", icon: Moon },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

function getCategoryConfig(id: string) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[0];
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function Tips() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // Get active trip
  const { data: trips } = trpc.trips.list.useQuery();
  const activeTripId = trips?.[0]?.id ?? 0;

  const { data: tipsData, isLoading } = trpc.tips.list.useQuery(
    { tripId: activeTripId },
    { enabled: activeTripId > 0 }
  );

  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTip, setEditingTip] = useState<any>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);

  const deleteTip = trpc.tips.delete.useMutation({
    onSuccess: () => {
      toast.success("Tipp gelöscht");
      utils.tips.list.invalidate({ tripId: activeTripId });
      setConfirmDeleteId(null);
    },
    onError: (err) => toast.error("Fehler: " + err.message),
  });

  // Filter tips
  const filteredTips = useMemo(() => {
    if (!tipsData) return [];
    let filtered = [...tipsData];
    if (activeCategory !== "all") {
      filtered = filtered.filter(t => t.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [tipsData, activeCategory, searchQuery]);

  // Group by category for display
  const groupedTips = useMemo(() => {
    const groups: Record<string, typeof filteredTips> = {};
    for (const tip of filteredTips) {
      if (!groups[tip.category]) groups[tip.category] = [];
      groups[tip.category].push(tip);
    }
    return groups;
  }, [filteredTips]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[oklch(0.11_0.02_255)] pb-24">
      {/* Header */}
      <div className="sticky top-16 z-10 bg-[oklch(0.11_0.02_255/90%)] backdrop-blur-xl border-b border-[oklch(0.20_0.02_255)]">
        <div className="container py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[oklch(0.78_0.14_75/15%)] flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-[oklch(0.78_0.14_75)]" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Insider-Tipps</h1>
                <p className="text-xs text-[oklch(0.55_0.02_255)]">
                  {tipsData?.length ?? 0} Tipps
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  editMode
                    ? "bg-[oklch(0.72_0.14_185/15%)] text-[oklch(0.72_0.14_185)] border border-[oklch(0.72_0.14_185/30%)]"
                    : "bg-[oklch(0.17_0.02_255)] text-[oklch(0.55_0.02_255)] hover:bg-[oklch(0.22_0.02_255)]"
                }`}
              >
                {editMode ? <Check className="w-3.5 h-3.5" strokeWidth={1.5} /> : <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />}
                {editMode ? "Fertig" : "Bearbeiten"}
              </button>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)] hover:opacity-90 font-semibold gap-1.5"
                size="sm"
              >
                <Plus className="w-4 h-4" strokeWidth={1.5} />
                Tipp
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.45_0.02_255)]" strokeWidth={1.5} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tipps durchsuchen..."
              className="w-full bg-[oklch(0.17_0.02_255)] border border-[oklch(0.25_0.02_255)] rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder-[oklch(0.40_0.02_255)] focus:outline-none focus:border-[oklch(0.78_0.14_75/50%)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[oklch(0.45_0.02_255)] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? "bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)] shadow-lg shadow-[oklch(0.78_0.14_75/20%)]"
                      : "bg-[oklch(0.17_0.02_255)] text-[oklch(0.65_0.02_255)] hover:bg-[oklch(0.22_0.02_255)] border border-[oklch(0.25_0.02_255)]"
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-6 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-xl bg-[oklch(0.17_0.02_255)] animate-pulse" />
            ))}
          </div>
        ) : filteredTips.length === 0 ? (
          <div className="text-center py-16">
            <Lightbulb className="w-12 h-12 mx-auto text-[oklch(0.30_0.02_255)] mb-4" strokeWidth={1} />
            <p className="text-[oklch(0.50_0.02_255)]">
              {searchQuery ? "Keine Tipps gefunden" : "Noch keine Tipps vorhanden"}
            </p>
          </div>
        ) : (
          Object.entries(groupedTips).map(([categoryId, categoryTips]) => {
            const catConfig = getCategoryConfig(categoryId);
            const CatIcon = catConfig.icon;
            return (
              <motion.div
                key={categoryId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Category Header */}
                <div className="flex items-center gap-2 mb-3">
                  <CatIcon className="w-4 h-4 text-[oklch(0.78_0.14_75)]" strokeWidth={1.5} />
                  <h2 className="text-sm font-semibold text-[oklch(0.78_0.14_75)]">
                    {catConfig.label}
                  </h2>
                  <span className="text-[10px] text-[oklch(0.45_0.02_255)] bg-[oklch(0.17_0.02_255)] px-2 py-0.5 rounded-full">
                    {categoryTips.length}
                  </span>
                </div>

                {/* Tips List */}
                <div className="space-y-2">
                  <AnimatePresence>
                    {categoryTips.map((tip, idx) => (
                      <motion.div
                        key={tip.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: idx * 0.03 }}
                        className="group glass-card rounded-xl p-4 border border-[oklch(0.20_0.02_255)] hover:border-[oklch(0.30_0.02_255)] transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-white mb-1">
                              {tip.title}
                            </h3>
                            <p className="text-xs text-[oklch(0.60_0.02_255)] leading-relaxed">
                              {tip.description}
                            </p>
                          </div>
                          {editMode && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => setEditingTip(tip)}
                                className="p-1.5 rounded-lg hover:bg-[oklch(0.25_0.02_255)] text-[oklch(0.55_0.02_255)] hover:text-white transition-all"
                                title="Bearbeiten"
                              >
                                <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(tip.id)}
                                className="p-1.5 rounded-lg hover:bg-[oklch(0.70_0.20_30/15%)] text-[oklch(0.55_0.02_255)] hover:text-[oklch(0.70_0.20_30)] transition-all"
                                title="Löschen"
                              >
                                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ── ADD TIP DIALOG ── */}
      <TipDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        tripId={activeTripId}
        onSuccess={() => {
          utils.tips.list.invalidate({ tripId: activeTripId });
          setShowAddDialog(false);
        }}
      />

      {/* ── EDIT TIP DIALOG ── */}
      {editingTip && (
        <TipDialog
          open={!!editingTip}
          onClose={() => setEditingTip(null)}
          tripId={activeTripId}
          tip={editingTip}
          onSuccess={() => {
            utils.tips.list.invalidate({ tripId: activeTripId });
            setEditingTip(null);
          }}
        />
      )}

      {/* ── CONFIRM DELETE DIALOG ── */}
      <Dialog open={confirmDeleteId !== null} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
        <DialogContent className="bg-[oklch(0.15_0.02_255)] border-[oklch(0.25_0.02_255)] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-[oklch(0.70_0.20_30)]" strokeWidth={1.5} />
              Tipp löschen?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[oklch(0.60_0.02_255)] mt-2">
            Möchtest du diesen Tipp wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="ghost" onClick={() => setConfirmDeleteId(null)} className="flex-1 text-[oklch(0.60_0.02_255)]">
              Abbrechen
            </Button>
            <Button
              onClick={() => {
                if (confirmDeleteId) deleteTip.mutate({ tipId: confirmDeleteId });
              }}
              className="flex-1 bg-[oklch(0.70_0.20_30)] text-white hover:opacity-90 font-semibold"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Löschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Tip Create/Edit Dialog ───────────────────────────────────────────────────
function TipDialog({
  open, onClose, tripId, tip, onSuccess
}: {
  open: boolean;
  onClose: () => void;
  tripId: number;
  tip?: any;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("money");

  // Sync form state when dialog opens or tip changes
  useEffect(() => {
    if (open) {
      setTitle(tip?.title ?? "");
      setDescription(tip?.description ?? "");
      setCategory(tip?.category ?? "money");
    }
  }, [open, tip]);

  const createTip = trpc.tips.create.useMutation({
    onSuccess: () => {
      toast.success("Tipp hinzugefügt!");
      onSuccess();
    },
    onError: (err) => toast.error("Fehler: " + err.message),
  });

  const updateTip = trpc.tips.update.useMutation({
    onSuccess: () => {
      toast.success("Tipp aktualisiert!");
      onSuccess();
    },
    onError: (err) => toast.error("Fehler: " + err.message),
  });

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Bitte Titel und Beschreibung ausfüllen");
      return;
    }
    if (tip) {
      updateTip.mutate({ tipId: tip.id, title, description, category });
    } else {
      createTip.mutate({ tripId, category, title, description });
    }
  };

  const isLoading = createTip.isPending || updateTip.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[oklch(0.15_0.02_255)] border-[oklch(0.25_0.02_255)] text-white max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            {tip ? (
              <><Pencil className="w-5 h-5 text-[oklch(0.72_0.14_185)]" strokeWidth={1.5} /> Tipp bearbeiten</>
            ) : (
              <><Plus className="w-5 h-5 text-[oklch(0.78_0.14_75)]" strokeWidth={1.5} /> Neuer Tipp</>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Category */}
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-2 block">Kategorie</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.filter(c => c.id !== "all").map(cat => {
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
                        : "bg-[oklch(0.20_0.02_255)] border border-transparent text-[oklch(0.55_0.02_255)] hover:bg-[oklch(0.25_0.02_255)]"
                    }`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                    <span className="leading-tight text-center truncate w-full">{cat.label.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Titel *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="z.B. Grab > Taxi"
              className="w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-xl px-3 py-2 text-white text-sm placeholder-[oklch(0.40_0.02_255)] focus:outline-none focus:border-[oklch(0.78_0.14_75)]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-[oklch(0.60_0.02_255)] mb-1 block">Beschreibung *</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detaillierter Tipp..."
              rows={4}
              className="w-full bg-[oklch(0.20_0.02_255)] border border-[oklch(0.28_0.02_255)] rounded-xl px-3 py-2 text-white text-sm placeholder-[oklch(0.40_0.02_255)] focus:outline-none focus:border-[oklch(0.78_0.14_75)] resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={onClose} className="flex-1 text-[oklch(0.60_0.02_255)]">
              Abbrechen
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)] hover:opacity-90 font-semibold"
            >
              {isLoading ? "Speichern..." : (tip ? "Änderungen speichern" : "Tipp hinzufügen")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
