// Gruppen-Taskliste / Aufgabenverteilung
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Loader2, Plus, CheckSquare, Circle, Clock, CheckCircle2, Trash2, X, User, Calendar, Lock, Users
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MemberAvatar from "@/components/MemberAvatar";

type TaskFilter = "all" | "mine" | "group" | "open" | "done";
type TaskStatus = "open" | "in_progress" | "done";

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; Icon: typeof Circle }> = {
  open: { label: "Offen", color: "text-muted-foreground", Icon: Circle },
  in_progress: { label: "In Arbeit", color: "text-amber-400", Icon: Clock },
  done: { label: "Erledigt", color: "text-green-400", Icon: CheckCircle2 },
};

export default function TaskList() {
  const { isAuthenticated, loading, user } = useAuth();
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  // Queries
  const { data: trips } = trpc.trips.list.useQuery(undefined, { enabled: isAuthenticated });
  const activeTripId = trips?.[0]?.id ?? null;

  const { data: tasks, isLoading } = trpc.tasks.list.useQuery(
    { tripId: activeTripId! },
    { enabled: !!activeTripId }
  );

  const { data: members } = trpc.members.list.useQuery(
    { tripId: activeTripId! },
    { enabled: !!activeTripId }
  );

  const utils = trpc.useUtils();

  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      setTitle(""); setDescription(""); setAssignedTo(null); setDueDate("");
      setShowForm(false);
      toast.success("Aufgabe erstellt!");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateStatus = trpc.tasks.updateStatus.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
    },
  });

  const deleteTask = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      toast.success("Aufgabe gelöscht");
    },
  });

  const currentMember = members?.find(m => m.userId === user?.id);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    switch (filter) {
      case "mine": return tasks.filter(t => t.createdBy === currentMember?.id || t.assignedTo === currentMember?.id);
      case "group": return tasks.filter(t => !t.isPrivate);
      case "open": return tasks.filter(t => t.status !== "done");
      case "done": return tasks.filter(t => t.status === "done");
      default: return tasks; // "all" = meine privaten + alle Gruppen-Tasks (already filtered by backend)
    }
  }, [tasks, filter, currentMember]);

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

  const getMemberName = (memberId: number | null) => {
    if (!memberId) return "Nicht zugewiesen";
    const m = members?.find(mem => mem.id === memberId);
    return m?.displayName ?? "Unbekannt";
  };

  const cycleStatus = (taskId: number, current: TaskStatus) => {
    const next: TaskStatus = current === "open" ? "in_progress" : current === "in_progress" ? "done" : "open";
    updateStatus.mutate({ id: taskId, status: next });
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Header */}
      <div className="sticky top-16 z-20 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              Aufgaben
            </h1>
            <p className="text-sm text-muted-foreground">Wer macht was?</p>
          </div>
          <Button size="sm" onClick={() => setShowForm(true)} className="bg-[oklch(0.78_0.14_75)] text-black hover:bg-[oklch(0.72_0.14_75)]">
            <Plus className="w-4 h-4 mr-1" /> Neue Aufgabe
          </Button>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {(["all", "mine", "group", "open", "done"] as TaskFilter[]).map((f) => {
            const labels: Record<TaskFilter, string> = { all: "Alle", mine: "Meine", group: "Gruppe", open: "Offen", done: "Erledigt" };
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? "bg-[oklch(0.78_0.14_75)] text-black"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {labels[f]}
                {f === "all" && tasks ? ` (${tasks.length})` : ""}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto">
        {/* New Task Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
                <Input
                  placeholder="Aufgabe (z.B. 'Taxi zum Flughafen buchen')"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
                <Input
                  placeholder="Beschreibung (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Zuweisen an</label>
                    <select
                      value={assignedTo ?? ""}
                      onChange={(e) => setAssignedTo(e.target.value ? Number(e.target.value) : null)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Niemand</option>
                      {members?.map(m => (
                        <option key={m.id} value={m.id}>{m.displayName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Fällig bis</label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>
                {/* Private Toggle */}
                <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Privat</p>
                      <p className="text-xs text-muted-foreground">Nur du siehst diese Aufgabe</p>
                    </div>
                  </div>
                  <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!title.trim()) return;
                      createTask.mutate({
                        tripId: activeTripId!,
                        title: title.trim(),
                        description: description.trim() || undefined,
                        assignedTo: assignedTo ?? undefined,
                        dueDate: dueDate || undefined,
                        isPrivate,
                      });
                    }}
                    disabled={!title.trim() || createTask.isPending}
                    className="bg-[oklch(0.78_0.14_75)] text-black"
                  >
                    Erstellen
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                    Abbrechen
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task List */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {filteredTasks.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <CheckSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Keine Aufgaben</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Erstelle eine Aufgabe für die Gruppe</p>
          </div>
        )}

        <div className="space-y-2">
          <AnimatePresence>
            {filteredTasks.map((task, i) => {
              const statusConf = STATUS_CONFIG[task.status as TaskStatus];
              const StatusIcon = statusConf.Icon;
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.03 }}
                  className={`rounded-xl border ${task.isPrivate ? "border-amber-500/30 bg-amber-500/5" : "border-border/50 bg-card"} p-4 ${task.status === "done" ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Status Toggle */}
                    <button
                      onClick={() => cycleStatus(task.id, task.status as TaskStatus)}
                      className={`mt-0.5 shrink-0 ${statusConf.color} hover:opacity-80 transition-opacity`}
                      title={`Status: ${statusConf.label} (klicken zum Ändern)`}
                    >
                      <StatusIcon className="w-5 h-5" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className={`font-medium text-sm ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                          {task.title}
                        </h3>
                        {task.isPrivate && (
                          <Lock className="w-3 h-3 text-amber-400 shrink-0" aria-label="Privat" />
                        )}
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {task.assignedTo && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            {getMemberName(task.assignedTo)}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString("de-CH")}
                          </span>
                        )}
                        <span className={`text-xs ${statusConf.color}`}>
                          {statusConf.label}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteTask.mutate({ id: task.id })}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
