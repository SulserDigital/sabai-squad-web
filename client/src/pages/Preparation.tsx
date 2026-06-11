// Reisevorbereitung – Thailand Einreise, Visa, Packliste
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink, Clock, CheckCircle2, Circle, Plus, Trash2,
  FileText, Shield, Plane, PackageCheck, ChevronDown, ChevronUp,
  AlertTriangle, Info, CheckCheck, X
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<string, string> = {
  dokumente: "Dokumente",
  kleidung: "Kleidung",
  medizin: "Medizin & Pflege",
  technik: "Technik",
  sonstiges: "Sonstiges",
};

const CATEGORY_ORDER = ["dokumente", "kleidung", "medizin", "technik", "sonstiges"] as const;
type Category = typeof CATEGORY_ORDER[number];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  dokumente: FileText,
  kleidung: PackageCheck,
  medizin: Shield,
  technik: Plane,
  sonstiges: PackageCheck,
};

// ── Info Card ────────────────────────────────────────────────────────────────
function InfoCard({ icon: Icon, title, children, accent = false }: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card rounded-2xl p-5 border ${accent ? "border-[oklch(0.78_0.14_75/30%)]" : "border-white/8"}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent ? "bg-[oklch(0.78_0.14_75/15%)]" : "bg-white/8"}`}>
          <Icon className={`w-4 h-4 ${accent ? "text-[oklch(0.78_0.14_75)]" : "text-[oklch(0.72_0.14_185)]"}`} strokeWidth={1.8} />
        </div>
        <h3 className="font-semibold text-white text-base">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function Badge({ type, children }: { type: "warning" | "info" | "success" | "danger"; children: React.ReactNode }) {
  const styles = {
    warning: "bg-amber-500/15 text-amber-300 border-amber-500/25",
    info: "bg-[oklch(0.72_0.14_185/15%)] text-[oklch(0.72_0.14_185)] border-[oklch(0.72_0.14_185/25%)]",
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    danger: "bg-red-500/15 text-red-300 border-red-500/25",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${styles[type]}`}>
      {children}
    </span>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-white/6 last:border-0">
      <span className="text-sm text-[oklch(0.60_0.02_255)] shrink-0">{label}</span>
      <span className={`text-sm text-right ${highlight ? "text-[oklch(0.78_0.14_75)] font-medium" : "text-[oklch(0.82_0.01_80)]"}`}>{value}</span>
    </div>
  );
}

// ── Packing List ─────────────────────────────────────────────────────────────
function PackingList({ tripId, memberId }: { tripId: number; memberId: number }) {
  const utils = trpc.useUtils();
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<Category>("sonstiges");
  const [addingItem, setAddingItem] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const { data: items = [], isLoading } = trpc.packingList.list.useQuery({ tripId });

  const seedMutation = trpc.packingList.seedDefaults.useMutation({
    onSuccess: (data) => {
      if (data.seeded) {
        utils.packingList.list.invalidate({ tripId });
        toast.success("Standard-Packliste geladen!");
      }
    },
  });

  const toggleMutation = trpc.packingList.toggle.useMutation({
    onMutate: async ({ id, checked }) => {
      await utils.packingList.list.cancel({ tripId });
      const prev = utils.packingList.list.getData({ tripId });
      utils.packingList.list.setData({ tripId }, (old) =>
        old?.map(item => item.id === id ? { ...item, checked } : item)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.packingList.list.setData({ tripId }, ctx.prev);
    },
    onSettled: () => utils.packingList.list.invalidate({ tripId }),
  });

  const addMutation = trpc.packingList.add.useMutation({
    onSuccess: () => {
      utils.packingList.list.invalidate({ tripId });
      setNewItemName("");
      setAddingItem(false);
      toast.success("Item hinzugefügt");
    },
  });

  const deleteMutation = trpc.packingList.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.packingList.list.cancel({ tripId });
      const prev = utils.packingList.list.getData({ tripId });
      utils.packingList.list.setData({ tripId }, (old) => old?.filter(item => item.id !== id));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.packingList.list.setData({ tripId }, ctx.prev);
    },
    onSettled: () => utils.packingList.list.invalidate({ tripId }),
  });

  // Seed defaults on first load if empty - useEffect to avoid render-phase side effects
  const [seedAttempted, setSeedAttempted] = useState(false);
  useEffect(() => {
    if (!isLoading && !seedAttempted && !seedMutation.isPending) {
      setSeedAttempted(true);
      seedMutation.mutate({ tripId, memberId });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, seedAttempted]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof items> = {};
    for (const cat of CATEGORY_ORDER) map[cat] = [];
    for (const item of items) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    }
    return map;
  }, [items]);

  const totalChecked = items.filter(i => i.checked).length;
  const totalItems = items.length;
  const progress = totalItems > 0 ? (totalChecked / totalItems) * 100 : 0;

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleAdd = () => {
    if (!newItemName.trim()) return;
    addMutation.mutate({ tripId, category: newItemCategory, name: newItemName.trim(), createdBy: memberId });
  };

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="glass-card rounded-2xl p-4 border border-white/8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[oklch(0.60_0.02_255)]">Fortschritt</span>
          <span className="text-sm font-semibold text-[oklch(0.78_0.14_75)]">{totalChecked} / {totalItems} gepackt</span>
        </div>
        <div className="h-2 bg-white/8 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[oklch(0.78_0.14_75)] to-[oklch(0.72_0.14_185)] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        {totalChecked === totalItems && totalItems > 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
            <CheckCheck className="w-3.5 h-3.5" /> Alles gepackt – bereit für Thailand!
          </motion.p>
        )}
      </div>

      {/* Categories */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card rounded-2xl p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : (
        CATEGORY_ORDER.map(cat => {
          const catItems = grouped[cat] ?? [];
          if (catItems.length === 0) return null;
          const Icon = CATEGORY_ICONS[cat] ?? PackageCheck;
          const isCollapsed = collapsedCategories.has(cat);
          const checkedCount = catItems.filter(i => i.checked).length;
          return (
            <motion.div key={cat} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl border border-white/8 overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/4 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-[oklch(0.72_0.14_185)]" strokeWidth={1.8} />
                  <span className="text-sm font-semibold text-white">{CATEGORY_LABELS[cat]}</span>
                  <span className="text-xs text-[oklch(0.50_0.02_255)]">{checkedCount}/{catItems.length}</span>
                </div>
                {isCollapsed ? <ChevronDown className="w-4 h-4 text-[oklch(0.50_0.02_255)]" /> : <ChevronUp className="w-4 h-4 text-[oklch(0.50_0.02_255)]" />}
              </button>
              {/* Items */}
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-3 space-y-1">
                      {catItems.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 py-2 group"
                        >
                          <button
                            onClick={() => toggleMutation.mutate({ id: item.id, checked: !item.checked })}
                            className="shrink-0 transition-transform active:scale-95"
                          >
                            {item.checked
                              ? <CheckCircle2 className="w-5 h-5 text-[oklch(0.78_0.14_75)]" strokeWidth={2} />
                              : <Circle className="w-5 h-5 text-[oklch(0.40_0.02_255)] hover:text-[oklch(0.60_0.02_255)] transition-colors" strokeWidth={1.5} />
                            }
                          </button>
                          <span className={`flex-1 text-sm transition-colors ${item.checked ? "line-through text-[oklch(0.40_0.02_255)]" : "text-[oklch(0.82_0.01_80)]"}`}>
                            {item.name}
                          </span>
                          {!item.isDefault && (
                            <button
                              onClick={() => deleteMutation.mutate({ id: item.id })}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-500/15 text-[oklch(0.50_0.02_255)] hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })
      )}

      {/* Add Item */}
      <AnimatePresence>
        {addingItem ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass-card rounded-2xl p-4 border border-[oklch(0.78_0.14_75/25%)] space-y-3"
          >
            <input
              type="text"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAddingItem(false); }}
              placeholder="Item-Name..."
              autoFocus
              className="w-full bg-white/8 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[oklch(0.40_0.02_255)] outline-none focus:border-[oklch(0.78_0.14_75/50%)] transition-colors"
            />
            <div className="flex gap-2">
              <select
                value={newItemCategory}
                onChange={e => setNewItemCategory(e.target.value as Category)}
                className="flex-1 bg-white/8 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"
              >
                {CATEGORY_ORDER.map(cat => (
                  <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                ))}
              </select>
              <button
                onClick={handleAdd}
                disabled={!newItemName.trim() || addMutation.isPending}
                className="px-4 py-2 rounded-xl bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)] text-sm font-semibold disabled:opacity-50 hover:brightness-110 transition-all active:scale-95"
              >
                Hinzufügen
              </button>
              <button
                onClick={() => { setAddingItem(false); setNewItemName(""); }}
                className="p-2 rounded-xl glass-card hover:bg-white/10 text-[oklch(0.50_0.02_255)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setAddingItem(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-white/15 text-[oklch(0.55_0.02_255)] hover:text-[oklch(0.78_0.14_75)] hover:border-[oklch(0.78_0.14_75/40%)] transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Eigenes Item hinzufügen
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Preparation() {
  const { user } = useAuth();
  const { data: trips = [] } = trpc.trips.list.useQuery(undefined, { enabled: !!user });
  const { data: allMembers = [] } = trpc.members.list.useQuery(
    { tripId: trips[0]?.id ?? 0 },
    { enabled: !!trips[0]?.id }
  );

  const currentMember = allMembers.find(m => m.userId === user?.id);
  const tripId = trips[0]?.id;
  const memberId = currentMember?.id;

  return (
    <div className="min-h-screen bg-[oklch(0.11_0.02_255)] overflow-x-hidden">
      <div className="container mx-auto px-4 lg:px-8 pt-20 pb-8 max-w-3xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            Reise-<span className="text-gold-gradient">vorbereitung</span>
          </h1>
          <p className="text-[oklch(0.55_0.02_255)] mt-1 text-sm">Einreise, Visa, Zoll & Packliste</p>
        </motion.div>

        <div className="space-y-6">
          {/* ── 1. Thailand Digital Arrival Card ── */}
          <InfoCard icon={FileText} title="Thailand Digital Arrival Card (TDAC)" accent>
            <div className="space-y-3">
              <p className="text-sm text-[oklch(0.70_0.02_255)] leading-relaxed">
                Seit 2024 muss die TDAC <strong className="text-white">vor der Einreise online ausgefüllt</strong> werden. Sie ersetzt die frühere Einreisekarte (TM6).
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge type="warning"><Clock className="w-3 h-3" /> Innerhalb 72h vor Abflug ausfüllen</Badge>
                <Badge type="info"><Info className="w-3 h-3" /> Kostenlos & online</Badge>
              </div>
              <a
                href="https://tdac.immigration.go.th"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-[oklch(0.78_0.14_75/12%)] border border-[oklch(0.78_0.14_75/30%)] hover:bg-[oklch(0.78_0.14_75/20%)] transition-colors group"
              >
                <div>
                  <div className="text-sm font-semibold text-[oklch(0.78_0.14_75)]">tdac.immigration.go.th</div>
                  <div className="text-xs text-[oklch(0.55_0.02_255)]">Offizielles Formular der Thai Immigration</div>
                </div>
                <ExternalLink className="w-4 h-4 text-[oklch(0.78_0.14_75)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <p className="text-xs text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  Benötigt: Reisepassnummer, Flugdaten, Unterkunftsadresse (erste Nacht). Formular ausdrucken oder Screenshot machen.
                </p>
              </div>
            </div>
          </InfoCard>

          {/* ── 2. Visa-Informationen ── */}
          <InfoCard icon={Shield} title="Visa-Informationen für Schweizer">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 mb-1">
                <Badge type="success"><CheckCircle2 className="w-3 h-3" /> Visumfrei für CH-Bürger</Badge>
                <Badge type="info">Seit 2024: 60 Tage</Badge>
              </div>
              <Row label="Aufenthaltsdauer" value="60 Tage visumfrei (seit Nov. 2024)" highlight />
              <Row label="Verlängerung" value="+30 Tage beim Immigration Office (1'900 THB)" />
              <Row label="Reisepass" value="Mind. 6 Monate ab Einreisedatum gültig" />
              <Row label="Rückflugticket" value="Kann an der Grenze verlangt werden" />
              <Row label="Mehrfacheinreise" value="Möglich (Visa-Run via Landgrenze)" />
              <div className="bg-[oklch(0.72_0.14_185/10%)] border border-[oklch(0.72_0.14_185/20%)] rounded-xl p-3 mt-2">
                <p className="text-xs text-[oklch(0.72_0.14_185)] flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  Für längere Aufenthalte: Tourist Visa (TR) oder Special Tourist Visa (STV) beim Thai-Konsulat in Bern beantragen.
                </p>
              </div>
            </div>
          </InfoCard>

          {/* ── 3. Einreisebestimmungen ── */}
          <InfoCard icon={Plane} title="Einreisebestimmungen & Zoll">
            <div className="space-y-4">
              {/* Was man braucht */}
              <div>
                <h4 className="text-xs font-semibold text-[oklch(0.55_0.02_255)] uppercase tracking-wider mb-2">Benötigte Dokumente</h4>
                <div className="space-y-1.5">
                  {[
                    "Gültiger Reisepass (mind. 6 Monate)",
                    "Ausgefüllte TDAC (Digital Arrival Card)",
                    "Rück- oder Weiterflugticket",
                    "Unterkunftsnachweis (erste Nacht)",
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2.5 text-sm text-[oklch(0.75_0.01_80)]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Zoll */}
              <div>
                <h4 className="text-xs font-semibold text-[oklch(0.55_0.02_255)] uppercase tracking-wider mb-2">Zollbestimmungen</h4>
                <Row label="Alkohol" value="Max. 1 Liter (zollfrei)" />
                <Row label="Zigaretten" value="Max. 200 Stück (1 Stange)" />
                <Row label="Bargeld" value="Über 450'000 THB deklarationspflichtig" />
                <Row label="Geschenke" value="Bis 10'000 THB zollfrei" />
              </div>

              {/* Verbotenes */}
              <div>
                <h4 className="text-xs font-semibold text-[oklch(0.55_0.02_255)] uppercase tracking-wider mb-2">Verbotene Gegenstände</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" strokeWidth={2} />
                    <div>
                      <span className="text-sm font-medium text-red-300">E-Zigaretten / Vapes</span>
                      <p className="text-xs text-red-400/80 mt-0.5">Illegal in Thailand! Bis zu 10 Jahre Gefängnis und hohe Geldstrafe.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" strokeWidth={2} />
                    <div>
                      <span className="text-sm font-medium text-amber-300">Drohnen</span>
                      <p className="text-xs text-amber-400/80 mt-0.5">Registrierung bei NBTC erforderlich. Ohne Registrierung illegal zu fliegen.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" strokeWidth={2} />
                    <div>
                      <span className="text-sm font-medium text-amber-300">Bestimmte Medikamente</span>
                      <p className="text-xs text-amber-400/80 mt-0.5">Codein-haltige Medikamente und Tramadol benötigen ein Arztzeugnis auf Englisch.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </InfoCard>

          {/* ── 4. Packliste ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center">
                <PackageCheck className="w-4 h-4 text-[oklch(0.72_0.14_185)]" strokeWidth={1.8} />
              </div>
              <h3 className="font-semibold text-white text-base">Packliste</h3>
            </div>
            {tripId && memberId ? (
              <PackingList tripId={tripId} memberId={memberId} />
            ) : (
              <div className="glass-card rounded-2xl p-6 text-center">
                <p className="text-sm text-[oklch(0.55_0.02_255)]">
                  {!user ? "Bitte einloggen um die Packliste zu nutzen." : "Keine aktive Reise gefunden."}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
