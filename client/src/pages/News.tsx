// News & Infos – Aktuelle Hinweise für Thailand-Reisende
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Info, Calendar, Cloud, Lightbulb, Bell,
  Plus, Trash2, Pin, X, ChevronDown, ChevronUp, Newspaper
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";

// ── Types ──────────────────────────────────────────────────────────────────
type Category = "warnung" | "hinweis" | "feiertag" | "wetter" | "tipp" | "info";

interface CategoryConfig {
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  bg: string;
  border: string;
  text: string;
  badge: string;
  badgeText: string;
}

const CATEGORY_CONFIG: Record<Category, CategoryConfig> = {
  warnung: {
    label: "Warnung",
    icon: AlertTriangle,
    bg: "bg-red-950/40",
    border: "border-red-800/60",
    text: "text-red-300",
    badge: "bg-red-900/60",
    badgeText: "text-red-300",
  },
  hinweis: {
    label: "Hinweis",
    icon: Bell,
    bg: "bg-amber-950/40",
    border: "border-amber-700/60",
    text: "text-amber-300",
    badge: "bg-amber-900/60",
    badgeText: "text-amber-300",
  },
  feiertag: {
    label: "Feiertag",
    icon: Calendar,
    bg: "bg-purple-950/40",
    border: "border-purple-700/60",
    text: "text-purple-300",
    badge: "bg-purple-900/60",
    badgeText: "text-purple-300",
  },
  wetter: {
    label: "Wetter",
    icon: Cloud,
    bg: "bg-sky-950/40",
    border: "border-sky-700/60",
    text: "text-sky-300",
    badge: "bg-sky-900/60",
    badgeText: "text-sky-300",
  },
  tipp: {
    label: "Tipp",
    icon: Lightbulb,
    bg: "bg-emerald-950/40",
    border: "border-emerald-700/60",
    text: "text-emerald-300",
    badge: "bg-emerald-900/60",
    badgeText: "text-emerald-300",
  },
  info: {
    label: "Info",
    icon: Info,
    bg: "bg-[oklch(0.18_0.03_255/60%)]",
    border: "border-white/10",
    text: "text-[oklch(0.75_0.01_80)]",
    badge: "bg-white/10",
    badgeText: "text-[oklch(0.75_0.01_80)]",
  },
};

const ALL_CATEGORIES: Category[] = ["warnung", "hinweis", "feiertag", "wetter", "tipp", "info"];

// ── NewsCard ──────────────────────────────────────────────────────────────
function NewsCard({
  item,
  isAdmin,
  onDelete,
}: {
  item: { id: number; title: string; content: string; category: string; isPinned: boolean; isDefault: boolean };
  isAdmin: boolean;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_CONFIG[item.category as Category] ?? CATEGORY_CONFIG.info;
  const Icon = cat.icon;
  const isLong = item.content.length > 120;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={`rounded-xl border p-4 ${cat.bg} ${cat.border} relative`}
    >
      {item.isPinned && (
        <div className="absolute top-3 right-3">
          <Pin className="w-3.5 h-3.5 text-[oklch(0.78_0.14_75)] opacity-70" />
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cat.badge}`}>
          <Icon className={`w-4 h-4 ${cat.badgeText}`} strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-semibold uppercase tracking-wider ${cat.text}`}>
              {cat.label}
            </span>
          </div>
          <h3 className="text-white font-semibold text-sm leading-snug mb-1">{item.title}</h3>
          <p className={`text-[oklch(0.65_0.01_80)] text-xs leading-relaxed ${!expanded && isLong ? "line-clamp-3" : ""}`}>
            {item.content}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className={`flex items-center gap-1 text-xs mt-1.5 ${cat.text} hover:opacity-80 transition-opacity`}
            >
              {expanded ? (
                <><ChevronUp className="w-3 h-3" /> Weniger</>
              ) : (
                <><ChevronDown className="w-3 h-3" /> Mehr lesen</>
              )}
            </button>
          )}
        </div>
        {isAdmin && !item.isDefault && (
          <button
            onClick={() => onDelete(item.id)}
            className="shrink-0 p-1 text-white/30 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export default function News() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Get active trip
  const { data: trips = [] } = trpc.trips.list.useQuery();
  const activeTrip = trips[0];
  const tripId = activeTrip?.id ?? 0;

  const utils = trpc.useUtils();

  const { data: newsData = [], isLoading } = trpc.news.list.useQuery(
    { tripId },
    { enabled: tripId > 0 }
  );

  // Seed defaults
  const [seedAttempted, setSeedAttempted] = useState(false);
  const seedMutation = trpc.news.seedDefaults.useMutation({
    onSettled: () => utils.news.list.invalidate({ tripId }),
  });
  useEffect(() => {
    if (tripId > 0 && !isLoading && !seedAttempted && !seedMutation.isPending) {
      setSeedAttempted(true);
      seedMutation.mutate({ tripId });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, isLoading, seedAttempted]);

  // Filter
  const [activeFilter, setActiveFilter] = useState<Category | "alle">("alle");

  const filtered = newsData.filter(
    (n) => activeFilter === "alle" || n.category === activeFilter
  );

  // Sort: pinned first
  const sorted = [...filtered].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  // Delete
  const deleteMutation = trpc.news.delete.useMutation({
    onMutate: async ({ newsId }) => {
      await utils.news.list.cancel({ tripId });
      const prev = utils.news.list.getData({ tripId });
      utils.news.list.setData({ tripId }, (old) => old?.filter((n) => n.id !== newsId) ?? []);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.news.list.setData({ tripId }, ctx.prev);
    },
    onSettled: () => utils.news.list.invalidate({ tripId }),
  });

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "info" as Category,
    isPinned: false,
  });

  const createMutation = trpc.news.create.useMutation({
    onSuccess: () => {
      utils.news.list.invalidate({ tripId });
      setShowAdd(false);
      setForm({ title: "", content: "", category: "info", isPinned: false });
    },
  });

  const handleCreate = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    createMutation.mutate({ tripId, ...form });
  };

  return (
    <div className="min-h-screen bg-[oklch(0.11_0.02_255)] overflow-x-hidden">
      <div className="container mx-auto px-4 lg:px-8 pt-20 pb-8 max-w-2xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Newspaper className="w-5 h-5 text-[oklch(0.78_0.14_75)]" strokeWidth={1.5} />
                <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  News & <span className="text-gold-gradient">Infos</span>
                </h1>
              </div>
              <p className="text-[oklch(0.55_0.02_255)] text-sm">Aktuelle Hinweise für eure Thailand-Reise</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowAdd(!showAdd)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gold-gradient text-[oklch(0.11_0.02_255)] text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {showAdd ? "Abbrechen" : "Neu"}
              </button>
            )}
          </div>
        </motion.div>

        {/* Add Form (Admin only) */}
        <AnimatePresence>
          {showAdd && isAdmin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="rounded-xl border border-[oklch(0.78_0.14_75/30%)] bg-[oklch(0.16_0.03_255)] p-4 space-y-3">
                <h3 className="text-[oklch(0.78_0.14_75)] font-semibold text-sm">Neue News hinzufügen</h3>
                <input
                  type="text"
                  placeholder="Titel *"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full bg-[oklch(0.11_0.02_255)] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[oklch(0.78_0.14_75/50%)]"
                />
                <textarea
                  placeholder="Inhalt *"
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  rows={3}
                  className="w-full bg-[oklch(0.11_0.02_255)] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[oklch(0.78_0.14_75/50%)] resize-none"
                />
                <div className="flex gap-2 flex-wrap">
                  {ALL_CATEGORIES.map((cat) => {
                    const cfg = CATEGORY_CONFIG[cat];
                    return (
                      <button
                        key={cat}
                        onClick={() => setForm((f) => ({ ...f, category: cat }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all shrink-0 ${
                          form.category === cat
                            ? `${cfg.badge} ${cfg.badgeText} ${cfg.border}`
                            : "bg-white/5 text-white/50 border-white/10"
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPinned}
                    onChange={(e) => setForm((f) => ({ ...f, isPinned: e.target.checked }))}
                    className="w-4 h-4 rounded accent-[oklch(0.78_0.14_75)]"
                  />
                  <span className="text-white/60 text-sm">Oben anpinnen</span>
                </label>
                <button
                  onClick={handleCreate}
                  disabled={!form.title.trim() || !form.content.trim() || createMutation.isPending}
                  className="w-full py-2.5 rounded-lg bg-gold-gradient text-[oklch(0.11_0.02_255)] font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  {createMutation.isPending ? "Speichern..." : "News hinzufügen"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 pb-1">
          <button
            onClick={() => setActiveFilter("alle")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all border ${
              activeFilter === "alle"
                ? "bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)] border-transparent"
                : "bg-white/5 text-white/60 border-white/10 hover:text-white"
            }`}
          >
            Alle ({newsData.length})
          </button>
          {ALL_CATEGORIES.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            const count = newsData.filter((n) => n.category === cat).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all border ${
                  activeFilter === cat
                    ? `${cfg.badge} ${cfg.badgeText} ${cfg.border}`
                    : "bg-white/5 text-white/60 border-white/10 hover:text-white"
                }`}
              >
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Cards */}
        {isLoading || seedMutation.isPending ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Keine Einträge in dieser Kategorie</p>
          </div>
        ) : (
          <motion.div layout className="space-y-3">
            <AnimatePresence mode="popLayout">
              {sorted.map((item) => (
                <NewsCard
                  key={item.id}
                  item={item}
                  isAdmin={isAdmin}
                  onDelete={(id) => deleteMutation.mutate({ newsId: id })}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Legend */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="text-white/20 text-xs text-center mb-3">Kategorie-Legende</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {ALL_CATEGORIES.map((cat) => {
              const cfg = CATEGORY_CONFIG[cat];
              const Icon = cfg.icon;
              return (
                <div key={cat} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${cfg.badge} ${cfg.badgeText}`}>
                  <Icon className="w-3 h-3" strokeWidth={1.5} />
                  {cfg.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
