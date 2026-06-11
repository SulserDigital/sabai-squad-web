// Activities: Aktivitäten mit Voting, Kommentaren, Edit/Delete, Datum+Uhrzeit
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Plus, Loader2, MapPin, Calendar, DollarSign, Target, Waves, UtensilsCrossed,
  Landmark, PartyPopper, Palmtree, ShoppingBag, Sparkles, PersonStanding,
  Vote as VoteIcon, ThumbsUp, ThumbsDown, Minus, Check, Trash2, Pencil,
  MessageCircle, Send, ChevronDown, ChevronUp, Clock, AlertCircle, X as XIcon,
  ExternalLink, Link
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlacesAutocomplete } from "@/components/PlacesAutocomplete";
import MemberAvatar from "@/components/MemberAvatar";

const ACTIVITY_ICONS: Record<string, typeof Target> = {
  general: Target,
  adventure: Waves,
  food: UtensilsCrossed,
  culture: Landmark,
  nightlife: PartyPopper,
  nature: Palmtree,
  shopping: ShoppingBag,
  wellness: Sparkles,
  sport: PersonStanding,
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  proposed: { label: "Vorgeschlagen", color: "oklch(0.78_0.14_75)" },
  voting: { label: "Abstimmung", color: "oklch(0.72_0.14_185)" },
  confirmed: { label: "Bestätigt", color: "oklch(0.65_0.22_150)" },
  done: { label: "Erledigt", color: "oklch(0.55_0.02_255)" },
  cancelled: { label: "Abgesagt", color: "oklch(0.50_0.14_30)" },
};

type Activity = {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  estimatedCost: string | null;
  currency: string | null;
  category: string | null;
  status: "proposed" | "voting" | "confirmed" | "done" | "cancelled";
  scheduledDate: Date | null;
  scheduledTime: string | null;
  proposedByMemberId: number | null;
  websiteUrl?: string | null;
  votes: Array<{ id: number; memberId: number; vote: "yes" | "no" | "maybe" }>;
};

function ActivityCard({
  activity,
  currentMember,
  memberMap,
  activeTripId,
  onEdit,
}: {
  activity: Activity;
  currentMember: { id: number; displayName: string; avatarUrl?: string | null; avatarIcon?: string | null; avatarColor?: string | null } | null;
  memberMap: Map<number, { displayName: string; avatarUrl?: string | null; avatarIcon?: string | null; avatarColor?: string | null }>;
  activeTripId: number;
  onEdit: (activity: Activity) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const utils = trpc.useUtils();

  const { data: comments } = trpc.activities.listComments.useQuery(
    { activityId: activity.id },
    { enabled: showComments }
  );

  const voteMutation = trpc.activities.vote.useMutation({
    onSuccess: () => utils.activities.list.invalidate({ tripId: activeTripId }),
    onError: (err) => toast.error("Fehler: " + err.message),
  });

  const updateStatus = trpc.activities.updateStatus.useMutation({
    onSuccess: () => {
      utils.activities.list.invalidate({ tripId: activeTripId });
      toast.success("Status aktualisiert!");
    },
  });

  const deleteActivity = trpc.activities.delete.useMutation({
    onSuccess: () => {
      utils.activities.list.invalidate({ tripId: activeTripId });
      toast.success("Aktivität gelöscht.");
    },
    onError: (err) => toast.error("Fehler: " + err.message),
  });

  const addComment = trpc.activities.addComment.useMutation({
    onSuccess: () => {
      utils.activities.listComments.invalidate({ activityId: activity.id });
      setCommentText("");
    },
    onError: (err) => toast.error("Fehler: " + err.message),
  });

  const deleteComment = trpc.activities.deleteComment.useMutation({
    onSuccess: () => utils.activities.listComments.invalidate({ activityId: activity.id }),
  });

  const votes = activity.votes ?? [];
  const myVote = currentMember ? votes.find(v => v.memberId === currentMember.id)?.vote : null;
  const yes = votes.filter(v => v.vote === "yes").length;
  const no = votes.filter(v => v.vote === "no").length;
  const maybe = votes.filter(v => v.vote === "maybe").length;
  const total = yes + no + maybe;
  const yesPercent = total > 0 ? Math.round((yes / total) * 100) : 0;

  const CategoryIcon = ACTIVITY_ICONS[activity.category ?? "general"] ?? Target;
  const statusInfo = STATUS_LABELS[activity.status] ?? STATUS_LABELS.proposed;

  const isOwner = currentMember && activity.proposedByMemberId === currentMember.id;

  const dateStr = activity.scheduledDate
    ? new Date(activity.scheduledDate).toLocaleDateString("de-CH", { weekday: "short", day: "2-digit", month: "short" })
    : null;
  const timeStr = activity.scheduledTime ?? null;

  const isPast = activity.scheduledDate
    ? new Date(activity.scheduledDate) < new Date(new Date().setHours(0, 0, 0, 0))
    : false;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: isPast ? 0.65 : 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className={`glass-card rounded-2xl overflow-hidden ${isPast ? "border border-white/5" : "border border-white/10"}`}
    >
      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${statusInfo.color}20` }}>
              <CategoryIcon className="w-4.5 h-4.5" style={{ color: statusInfo.color }} strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-sm leading-tight truncate">{activity.title}</h3>
              {activity.description && (
                <p className="text-xs text-[oklch(0.55_0.02_255)] mt-0.5 line-clamp-2">{activity.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: `${statusInfo.color}20`, color: statusInfo.color }}>
              {statusInfo.label}
            </span>
            {isOwner && (
              <>
                <button onClick={() => onEdit(activity)} className="p-1.5 rounded-lg hover:bg-white/10 text-[oklch(0.55_0.02_255)] hover:text-white transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setShowDeleteConfirm(true)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-[oklch(0.55_0.02_255)] hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-2 mb-3">
          {(dateStr || timeStr) && (
            <span className="flex items-center gap-1 text-xs text-[oklch(0.60_0.02_255)]">
              <Calendar className="w-3.5 h-3.5" />
              {dateStr}{timeStr ? ` um ${timeStr}` : ""}
              {isPast && <span className="text-[oklch(0.45_0.02_255)]">(vergangen)</span>}
            </span>
          )}
          {activity.location && (
            <span className="flex items-center gap-1 text-xs text-[oklch(0.60_0.02_255)]">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate max-w-[160px]">{activity.location}</span>
            </span>
          )}
          {activity.estimatedCost && (
            <span className="flex items-center gap-1 text-xs text-[oklch(0.60_0.02_255)]">
              <DollarSign className="w-3.5 h-3.5" />
              {activity.estimatedCost} {activity.currency ?? "CHF"}
            </span>
          )}
          {!activity.scheduledDate && !activity.scheduledTime && (
            <span className="flex items-center gap-1 text-xs text-[oklch(0.45_0.02_255)] italic">
              <Clock className="w-3.5 h-3.5" />
              Noch kein Datum
            </span>
          )}
          {activity.websiteUrl && (
            <a
              href={activity.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[oklch(0.72_0.14_185)] hover:text-[oklch(0.85_0.14_185)] transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Website
            </a>
          )}
        </div>

        {/* Vote bar */}
        {total > 0 && (
          <div className="mb-3">
            <div className="flex gap-1 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[oklch(0.65_0.22_150)] transition-all" style={{ width: `${yesPercent}%` }} />
              <div className="bg-[oklch(0.55_0.02_255)] transition-all" style={{ width: `${Math.round((maybe / total) * 100)}%` }} />
              <div className="bg-[oklch(0.50_0.14_30)] transition-all" style={{ width: `${Math.round((no / total) * 100)}%` }} />
            </div>
            <div className="flex gap-3 mt-1 text-xs text-[oklch(0.50_0.02_255)]">
              <span className="text-[oklch(0.65_0.22_150)]">{yes} Ja</span>
              <span>{maybe} Vielleicht</span>
              <span className="text-[oklch(0.50_0.14_30)]">{no} Nein</span>
            </div>
          </div>
        )}

        {/* Vote buttons */}
        {currentMember && activity.status !== "done" && activity.status !== "cancelled" && (
          <div className="flex gap-2 mb-3">
            {(["yes", "maybe", "no"] as const).map((v) => {
              const icons = { yes: ThumbsUp, maybe: Minus, no: ThumbsDown };
              const labels = { yes: "Ja", maybe: "Vielleicht", no: "Nein" };
              const colors = {
                yes: "oklch(0.65_0.22_150)",
                maybe: "oklch(0.78_0.14_75)",
                no: "oklch(0.50_0.14_30)",
              };
              const Icon = icons[v];
              const isActive = myVote === v;
              return (
                <button
                  key={v}
                  onClick={() => voteMutation.mutate({ activityId: activity.id, memberId: currentMember.id, vote: v })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
                  style={{
                    background: isActive ? `${colors[v]}25` : "rgba(255,255,255,0.05)",
                    color: isActive ? colors[v] : "oklch(0.55_0.02_255)",
                    border: isActive ? `1px solid ${colors[v]}50` : "1px solid transparent",
                  }}
                >
                  <Icon className="w-3.5 h-3.5" /> {labels[v]}
                </button>
              );
            })}
          </div>
        )}

        {/* Status change (owner) */}
        {isOwner && activity.status !== "done" && activity.status !== "cancelled" && (
          <div className="flex gap-2 mb-3">
            {activity.status !== "confirmed" && (
              <button
                onClick={() => updateStatus.mutate({ activityId: activity.id, status: "confirmed" })}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[oklch(0.65_0.22_150/15%)] text-[oklch(0.65_0.22_150)] hover:bg-[oklch(0.65_0.22_150/25%)] transition-colors"
              >
                <Check className="w-3 h-3" /> Bestätigen
              </button>
            )}
            {activity.status !== "voting" && activity.status !== "confirmed" && (
              <button
                onClick={() => updateStatus.mutate({ activityId: activity.id, status: "voting" })}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[oklch(0.72_0.14_185/15%)] text-[oklch(0.72_0.14_185)] hover:bg-[oklch(0.72_0.14_185/25%)] transition-colors"
              >
                <VoteIcon className="w-3 h-3" /> Abstimmung öffnen
              </button>
            )}
          </div>
        )}

        {/* Comments toggle */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs text-[oklch(0.50_0.02_255)] hover:text-[oklch(0.70_0.02_255)] transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Kommentare
          {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Comments section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 bg-[oklch(0.09_0.02_255/50%)]"
          >
            <div className="p-4 space-y-3">
              {/* Existing comments */}
              {comments && comments.length > 0 ? (
                comments.map((comment) => {
                  const m = memberMap.get(comment.memberId);
                  const isMyComment = currentMember && comment.memberId === currentMember.id;
                  return (
                    <div key={comment.id} className="flex gap-2.5 items-start">
                      <MemberAvatar
                        avatarUrl={m?.avatarUrl}
                        avatarIcon={m?.avatarIcon}
                        avatarColor={m?.avatarColor}
                        displayName={m?.displayName ?? "?"}
                        size="xs"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-medium text-white">{m?.displayName ?? "Unbekannt"}</span>
                          <span className="text-xs text-[oklch(0.40_0.02_255)]">
                            {new Date(comment.createdAt).toLocaleString("de-CH", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-xs text-[oklch(0.65_0.02_255)] mt-0.5 break-words">{comment.content}</p>
                      </div>
                      {isMyComment && (
                        <button
                          onClick={() => deleteComment.mutate({ commentId: comment.id })}
                          className="p-1 rounded hover:bg-red-500/20 text-[oklch(0.40_0.02_255)] hover:text-red-400 transition-colors shrink-0"
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-[oklch(0.40_0.02_255)] text-center py-2">Noch keine Kommentare.</p>
              )}

              {/* Add comment */}
              {currentMember && (
                <div className="flex gap-2 items-end pt-1">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Kommentar oder Vorschlag..."
                    className="bg-[oklch(0.14_0.025_255)] border-white/10 text-white text-xs resize-none min-h-[60px]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (commentText.trim()) {
                          addComment.mutate({ activityId: activity.id, memberId: currentMember.id, content: commentText.trim() });
                        }
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    disabled={!commentText.trim() || addComment.isPending}
                    onClick={() => {
                      if (commentText.trim()) {
                        addComment.mutate({ activityId: activity.id, memberId: currentMember.id, content: commentText.trim() });
                      }
                    }}
                    className="bg-gold-gradient text-[oklch(0.11_0.02_255)] hover:opacity-90 h-[60px] px-3"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[oklch(0.08_0.02_255/90%)] backdrop-blur-sm rounded-2xl flex items-center justify-center z-10"
          >
            <div className="text-center p-6">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">Aktivität löschen?</p>
              <p className="text-xs text-[oklch(0.50_0.02_255)] mb-4">Alle Votes und Kommentare werden ebenfalls gelöscht.</p>
              <div className="flex gap-2 justify-center">
                <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)} className="border-white/20 text-white hover:bg-white/10">
                  Abbrechen
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    deleteActivity.mutate({ activityId: activity.id });
                    setShowDeleteConfirm(false);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white"
                  disabled={deleteActivity.isPending}
                >
                  {deleteActivity.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Löschen"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Activities() {
  const { isAuthenticated, user, loading } = useAuth();
  const [filter, setFilter] = useState<"all" | "voting" | "confirmed">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);

  // Create form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [category, setCategory] = useState("general");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editCategory, setEditCategory] = useState("general");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editWebsiteUrl, setEditWebsiteUrl] = useState("");

  const { data: trips } = trpc.trips.list.useQuery(undefined, { enabled: isAuthenticated });
  const activeTripId = trips?.[0]?.id ?? null;

  const { data: members } = trpc.members.list.useQuery(
    { tripId: activeTripId! },
    { enabled: !!activeTripId }
  );

  const { data: activities, isLoading } = trpc.activities.list.useQuery(
    { tripId: activeTripId! },
    { enabled: !!activeTripId }
  );

  const utils = trpc.useUtils();

  const currentMember = useMemo(() => {
    if (!members || !user) return null;
    return members.find(m => m.userId === user.id) ?? members[0] ?? null;
  }, [members, user]);

  const memberMap = useMemo(() => {
    const map = new Map<number, { displayName: string; avatarUrl?: string | null; avatarIcon?: string | null; avatarColor?: string | null }>();
    if (members) {
      for (const m of members) {
        map.set(m.id, {
          displayName: m.displayName,
          avatarUrl: (m as any).avatarUrl ?? null,
          avatarIcon: (m as any).avatarIcon ?? null,
          avatarColor: (m as any).avatarColor ?? null,
        });
      }
    }
    return map;
  }, [members]);

  const createActivity = trpc.activities.create.useMutation({
    onSuccess: () => {
      utils.activities.list.invalidate({ tripId: activeTripId! });
      setShowCreate(false);
      setTitle(""); setDescription(""); setLocation(""); setEstimatedCost(""); setCategory("general");
      setScheduledDate(""); setScheduledTime(""); setWebsiteUrl("");
      toast.success("Aktivität vorgeschlagen!");
    },
    onError: (err) => toast.error("Fehler: " + err.message),
  });

  const updateActivity = trpc.activities.update.useMutation({
    onSuccess: () => {
      utils.activities.list.invalidate({ tripId: activeTripId! });
      setEditActivity(null);
      toast.success("Aktivität aktualisiert!");
    },
    onError: (err) => toast.error("Fehler: " + err.message),
  });

  // Split activities into upcoming/past
  const { upcoming, past } = useMemo(() => {
    if (!activities) return { upcoming: [], past: [] };
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const sorted = [...activities].sort((a, b) => {
      const aDate = a.scheduledDate ? new Date(a.scheduledDate).getTime() : Infinity;
      const bDate = b.scheduledDate ? new Date(b.scheduledDate).getTime() : Infinity;
      return aDate - bDate;
    });
    const upcoming: Activity[] = [];
    const past: Activity[] = [];
    for (const a of sorted) {
      const actDate = a.scheduledDate ? new Date(a.scheduledDate) : null;
      if (actDate && actDate < now) {
        past.push(a as Activity);
      } else {
        upcoming.push(a as Activity);
      }
    }
    return { upcoming, past };
  }, [activities]);

  const filterActivities = (list: Activity[]) => {
    if (filter === "all") return list;
    if (filter === "voting") return list.filter(a => a.status === "voting" || a.status === "proposed");
    return list.filter(a => a.status === filter);
  };

  const handleCreate = () => {
    if (!title.trim() || !activeTripId) return;
    createActivity.mutate({
      tripId: activeTripId,
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
      category,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      scheduledTime: scheduledTime || undefined,
      proposedByMemberId: currentMember?.id,
      websiteUrl: websiteUrl.trim() || undefined,
    });
  };

  const handleEditOpen = (activity: Activity) => {
    setEditActivity(activity);
    setEditTitle(activity.title);
    setEditDescription(activity.description ?? "");
    setEditLocation(activity.location ?? "");
    setEditCost(activity.estimatedCost ?? "");
    setEditCategory(activity.category ?? "general");
    setEditDate(activity.scheduledDate
      ? new Date(activity.scheduledDate).toISOString().split("T")[0]
      : "");
    setEditTime(activity.scheduledTime ?? "");
    setEditWebsiteUrl((activity as any).websiteUrl ?? "");
  };

  const handleEditSave = () => {
    if (!editActivity || !editTitle.trim()) return;
    updateActivity.mutate({
      activityId: editActivity.id,
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      location: editLocation.trim() || undefined,
      estimatedCost: editCost ? parseFloat(editCost) : undefined,
      category: editCategory,
      scheduledDate: editDate ? new Date(editDate) : undefined,
      scheduledTime: editTime || undefined,
      websiteUrl: editWebsiteUrl.trim() || undefined,
    });
  };

  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[oklch(0.11_0.02_255)] flex items-center justify-center">
        <div className="text-center glass-card p-8 rounded-2xl max-w-sm">
          <VoteIcon className="w-10 h-10 text-[oklch(0.78_0.14_75)] mb-4" strokeWidth={1.5} />
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
          <Palmtree className="w-10 h-10 text-[oklch(0.78_0.14_75)] mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-white mb-2">Keine Reise vorhanden</h2>
        </div>
      </div>
    );
  }

  const filteredUpcoming = filterActivities(upcoming);
  const filteredPast = filterActivities(past);

  return (
    <div className="min-h-screen bg-[oklch(0.11_0.02_255)]">
      <div className="container mx-auto px-4 lg:px-8 pt-20 pb-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-start justify-between">
          <div>
            <span className="text-[oklch(0.78_0.14_75)] text-sm font-medium uppercase tracking-widest">Demokratisch</span>
            <h1 className="text-3xl md:text-4xl font-bold text-white mt-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Aktivitäten-<span className="text-gold-gradient">Voting</span>
            </h1>
            <p className="text-[oklch(0.55_0.02_255)] mt-1">Stimme ab, kommentiere und plane gemeinsam.</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-gold-gradient text-[oklch(0.11_0.02_255)] hover:opacity-90">
            <Plus className="w-4 h-4 mr-1" /> Vorschlagen
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Bestätigt", value: activities?.filter(a => a.status === "confirmed").length ?? 0, color: "oklch(0.65_0.22_150)" },
            { label: "Offen", value: activities?.filter(a => a.status === "voting" || a.status === "proposed").length ?? 0, color: "oklch(0.78_0.14_75)" },
            { label: "Gesamt", value: activities?.length ?? 0, color: "white" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-4 rounded-2xl text-center">
              <div className="text-2xl font-bold" style={{ color: stat.color, fontFamily: "'Playfair Display', serif" }}>{stat.value}</div>
              <div className="text-xs text-[oklch(0.50_0.02_255)]">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(["all", "voting", "confirmed"] as const).map((f) => {
            const labels = { all: "Alle", voting: "Offen", confirmed: "Bestätigt" };
            return (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === f
                    ? "bg-[oklch(0.78_0.14_75/20%)] text-[oklch(0.78_0.14_75)] border border-[oklch(0.78_0.14_75/40%)]"
                    : "glass-card text-[oklch(0.55_0.02_255)] hover:text-white"
                }`}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[oklch(0.55_0.02_255)]" /></div>
        ) : (
          <>
            {/* Upcoming activities */}
            {filteredUpcoming.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-[oklch(0.78_0.14_75)]" />
                  <h2 className="text-sm font-semibold text-[oklch(0.78_0.14_75)] uppercase tracking-wider">Bevorstehend</h2>
                  <span className="text-xs text-[oklch(0.40_0.02_255)]">({filteredUpcoming.length})</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <AnimatePresence>
                    {filteredUpcoming.map((activity) => (
                      <div key={activity.id} className="relative">
                        <ActivityCard
                          activity={activity}
                          currentMember={currentMember as any}
                          memberMap={memberMap}
                          activeTripId={activeTripId!}
                          onEdit={handleEditOpen}
                        />
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Past activities */}
            {filteredPast.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Check className="w-4 h-4 text-[oklch(0.45_0.02_255)]" />
                  <h2 className="text-sm font-semibold text-[oklch(0.45_0.02_255)] uppercase tracking-wider">Vergangen</h2>
                  <span className="text-xs text-[oklch(0.35_0.02_255)]">({filteredPast.length})</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <AnimatePresence>
                    {filteredPast.map((activity) => (
                      <div key={activity.id} className="relative">
                        <ActivityCard
                          activity={activity}
                          currentMember={currentMember as any}
                          memberMap={memberMap}
                          activeTripId={activeTripId!}
                          onEdit={handleEditOpen}
                        />
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {filteredUpcoming.length === 0 && filteredPast.length === 0 && (
              <div className="text-center py-16">
                <VoteIcon className="w-10 h-10 text-[oklch(0.30_0.02_255)] mx-auto mb-3" strokeWidth={1} />
                <p className="text-[oklch(0.45_0.02_255)]">Noch keine Aktivitäten. Schlage die erste vor!</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[oklch(0.14_0.025_255)] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Aktivität vorschlagen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[oklch(0.65_0.02_255)] text-xs">Titel *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Floating Market Bangkok"
                className="bg-[oklch(0.11_0.02_255)] border-white/10 text-white mt-1" />
            </div>
            <div>
              <Label className="text-[oklch(0.65_0.02_255)] text-xs">Beschreibung</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Details zur Aktivität..."
                className="bg-[oklch(0.11_0.02_255)] border-white/10 text-white mt-1 resize-none" rows={2} />
            </div>
            <div>
              <Label className="text-[oklch(0.65_0.02_255)] text-xs">Ort</Label>
              <PlacesAutocomplete
                value={location}
                onChange={setLocation}
                placeholder="Ort oder Adresse suchen..."
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[oklch(0.65_0.02_255)] text-xs">Datum <span className="text-[oklch(0.40_0.02_255)]">(optional)</span></Label>
                <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)}
                  className="bg-[oklch(0.11_0.02_255)] border-white/10 text-white mt-1" />
              </div>
              <div>
                <Label className="text-[oklch(0.65_0.02_255)] text-xs">Uhrzeit <span className="text-[oklch(0.40_0.02_255)]">(optional)</span></Label>
                <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)}
                  className="bg-[oklch(0.11_0.02_255)] border-white/10 text-white mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-[oklch(0.65_0.02_255)] text-xs">Website <span className="text-[oklch(0.40_0.02_255)]">(optional)</span></Label>
              <div className="relative mt-1">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[oklch(0.45_0.02_255)]" />
                <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://restaurant-website.com"
                  className="bg-[oklch(0.11_0.02_255)] border-white/10 text-white pl-8" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[oklch(0.65_0.02_255)] text-xs">Kategorie</Label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full mt-1 bg-[oklch(0.11_0.02_255)] border border-white/10 rounded-md text-white text-sm px-3 py-2">
                  {Object.keys(ACTIVITY_ICONS).map(k => (
                    <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-[oklch(0.65_0.02_255)] text-xs">Kosten (CHF)</Label>
                <Input type="number" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="0.00"
                  className="bg-[oklch(0.11_0.02_255)] border-white/10 text-white mt-1" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1 border-white/20 text-white hover:bg-white/10">
                Abbrechen
              </Button>
              <Button onClick={handleCreate} disabled={!title.trim() || createActivity.isPending}
                className="flex-1 bg-gold-gradient text-[oklch(0.11_0.02_255)] hover:opacity-90">
                {createActivity.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Vorschlagen"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editActivity} onOpenChange={(open) => !open && setEditActivity(null)}>
        <DialogContent className="bg-[oklch(0.14_0.025_255)] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Aktivität bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[oklch(0.65_0.02_255)] text-xs">Titel *</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                className="bg-[oklch(0.11_0.02_255)] border-white/10 text-white mt-1" />
            </div>
            <div>
              <Label className="text-[oklch(0.65_0.02_255)] text-xs">Beschreibung</Label>
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
                className="bg-[oklch(0.11_0.02_255)] border-white/10 text-white mt-1 resize-none" rows={2} />
            </div>
            <div>
              <Label className="text-[oklch(0.65_0.02_255)] text-xs">Ort</Label>
              <PlacesAutocomplete
                value={editLocation}
                onChange={setEditLocation}
                placeholder="Ort oder Adresse suchen..."
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[oklch(0.65_0.02_255)] text-xs">Datum <span className="text-[oklch(0.40_0.02_255)]">(optional)</span></Label>
                <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                  className="bg-[oklch(0.11_0.02_255)] border-white/10 text-white mt-1" />
              </div>
              <div>
                <Label className="text-[oklch(0.65_0.02_255)] text-xs">Uhrzeit <span className="text-[oklch(0.40_0.02_255)]">(optional)</span></Label>
                <Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)}
                  className="bg-[oklch(0.11_0.02_255)] border-white/10 text-white mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-[oklch(0.65_0.02_255)] text-xs">Website <span className="text-[oklch(0.40_0.02_255)]">(optional)</span></Label>
              <div className="relative mt-1">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[oklch(0.45_0.02_255)]" />
                <Input value={editWebsiteUrl} onChange={(e) => setEditWebsiteUrl(e.target.value)}
                  placeholder="https://restaurant-website.com"
                  className="bg-[oklch(0.11_0.02_255)] border-white/10 text-white pl-8" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[oklch(0.65_0.02_255)] text-xs">Kategorie</Label>
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full mt-1 bg-[oklch(0.11_0.02_255)] border border-white/10 rounded-md text-white text-sm px-3 py-2">
                  {Object.keys(ACTIVITY_ICONS).map(k => (
                    <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-[oklch(0.65_0.02_255)] text-xs">Kosten (CHF)</Label>
                <Input type="number" value={editCost} onChange={(e) => setEditCost(e.target.value)}
                  className="bg-[oklch(0.11_0.02_255)] border-white/10 text-white mt-1" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditActivity(null)} className="flex-1 border-white/20 text-white hover:bg-white/10">
                Abbrechen
              </Button>
              <Button onClick={handleEditSave} disabled={!editTitle.trim() || updateActivity.isPending}
                className="flex-1 bg-gold-gradient text-[oklch(0.11_0.02_255)] hover:opacity-90">
                {updateActivity.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Speichern"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
