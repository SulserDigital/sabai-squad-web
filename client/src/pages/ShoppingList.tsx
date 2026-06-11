// Kollaborative Einkaufsliste
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Loader2, Plus, ShoppingCart, Check, Trash2, X, Archive, Image as ImageIcon, Package, Camera, Bell, Pencil, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ShoppingList() {
  const { isAuthenticated, loading } = useAuth();
  const [newListName, setNewListName] = useState("");
  const [showNewList, setShowNewList] = useState(false);
  const [activeListId, setActiveListId] = useState<number | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Inline edit state
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemQty, setEditItemQty] = useState("");

  // Queries
  const { data: trips } = trpc.trips.list.useQuery(undefined, { enabled: isAuthenticated });
  const activeTripId = trips?.[0]?.id ?? null;

  const { data: lists, isLoading } = trpc.shopping.lists.useQuery(
    { tripId: activeTripId! },
    { enabled: !!activeTripId }
  );

  const { data: items, isLoading: itemsLoading } = trpc.shopping.items.useQuery(
    { listId: activeListId! },
    { enabled: !!activeListId }
  );

  const utils = trpc.useUtils();

  const createList = trpc.shopping.createList.useMutation({
    onSuccess: () => {
      utils.shopping.lists.invalidate();
      setNewListName("");
      setShowNewList(false);
      toast.success("Liste erstellt!");
    },
    onError: (err) => toast.error(err.message),
  });

  const archiveList = trpc.shopping.archiveList.useMutation({
    onSuccess: () => {
      utils.shopping.lists.invalidate();
      setActiveListId(null);
      toast.success("Liste archiviert");
    },
  });

  const deleteList = trpc.shopping.deleteList.useMutation({
    onSuccess: () => {
      utils.shopping.lists.invalidate();
      setActiveListId(null);
      toast.success("Liste gelöscht");
    },
  });

  const addItem = trpc.shopping.addItem.useMutation({
    onSuccess: () => {
      utils.shopping.items.invalidate({ listId: activeListId! });
      setNewItemName("");
      setNewItemQty("");
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleItem = trpc.shopping.toggleItem.useMutation({
    onSuccess: () => {
      utils.shopping.items.invalidate({ listId: activeListId! });
    },
  });

  const deleteItem = trpc.shopping.deleteItem.useMutation({
    onSuccess: () => {
      utils.shopping.items.invalidate({ listId: activeListId! });
    },
  });

  const updateItem = trpc.shopping.updateItem.useMutation({
    onSuccess: () => {
      utils.shopping.items.invalidate({ listId: activeListId! });
      setEditingItemId(null);
      toast.success("Artikel aktualisiert");
    },
    onError: (err) => toast.error(err.message),
  });

  const startEdit = (item: { id: number; name: string; quantity?: string | null }) => {
    setEditingItemId(item.id);
    setEditItemName(item.name);
    setEditItemQty(item.quantity ?? "");
  };

  const saveEdit = () => {
    if (!editItemName.trim() || editingItemId === null) return;
    updateItem.mutate({
      id: editingItemId,
      name: editItemName.trim(),
      quantity: editItemQty.trim() || undefined,
    });
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditItemName("");
    setEditItemQty("");
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

  const activeList = lists?.find(l => l.id === activeListId);
  const uncheckedItems = items?.filter(i => !i.isChecked) ?? [];
  const checkedItems = items?.filter(i => i.isChecked) ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Header */}
      <div className="sticky top-16 z-20 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeListId && (
              <button onClick={() => setActiveListId(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                {activeList ? activeList.name : "Einkaufslisten"}
              </h1>
              {!activeListId && (
                <p className="text-sm text-muted-foreground">Gemeinsam einkaufen planen</p>
              )}
            </div>
          </div>
          {!activeListId && (
            <Button size="sm" onClick={() => setShowNewList(true)} className="bg-[oklch(0.78_0.14_75)] text-black hover:bg-[oklch(0.72_0.14_75)]">
              <Plus className="w-4 h-4 mr-1" /> Neue Liste
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto">
        {/* New List Dialog */}
        <AnimatePresence>
          {showNewList && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <Input
                  placeholder="Listenname (z.B. '7-Eleven Run')"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="mb-3"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newListName.trim()) {
                      createList.mutate({ tripId: activeTripId!, name: newListName.trim() });
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => createList.mutate({ tripId: activeTripId!, name: newListName.trim() })}
                    disabled={!newListName.trim() || createList.isPending}
                    className="bg-[oklch(0.78_0.14_75)] text-black"
                  >
                    Erstellen
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowNewList(false)}>
                    Abbrechen
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List of Shopping Lists */}
        {!activeListId && (
          <div className="space-y-3">
            {isLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {lists?.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Noch keine Einkaufslisten</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Erstelle eine Liste für den nächsten Einkauf</p>
              </div>
            )}
            {lists?.map((list, i) => (
              <motion.div
                key={list.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setActiveListId(list.id)}
                className="rounded-xl border border-border/50 bg-card p-4 cursor-pointer hover:border-[oklch(0.78_0.14_75)]/50 transition-colors active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{list.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(list.createdAt).toLocaleDateString("de-CH")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); archiveList.mutate({ id: list.id }); }}
                      className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteList.mutate({ id: list.id }); }}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Active List Items */}
        {activeListId && (
          <div className="space-y-4">
            {/* Add Item Form */}
            <div className="flex gap-2">
              <Input
                placeholder="Artikel hinzufügen..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newItemName.trim()) {
                    addItem.mutate({
                      listId: activeListId,
                      name: newItemName.trim(),
                      quantity: newItemQty.trim() || undefined,
                    });
                  }
                }}
              />
              <Input
                placeholder="Menge"
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
                className="w-20"
              />
              <Button
                size="icon"
                onClick={() => {
                  if (newItemName.trim()) {
                    addItem.mutate({
                      listId: activeListId,
                      name: newItemName.trim(),
                      quantity: newItemQty.trim() || undefined,
                    });
                  }
                }}
                disabled={!newItemName.trim() || addItem.isPending}
                className="bg-[oklch(0.78_0.14_75)] text-black shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Photo Upload + Ich gehe einkaufen */}
            <div className="flex gap-2">
              <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted/50 text-muted-foreground text-xs font-medium cursor-pointer hover:bg-muted transition-colors">
                <Camera className="w-4 h-4" />
                <span>Foto</span>
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
                      formData.append("folder", "shopping");
                      const res = await fetch("/api/upload", { method: "POST", body: formData });
                      const { url } = await res.json();
                      if (url) {
                        addItem.mutate({
                          listId: activeListId,
                          name: file.name.replace(/\.[^.]+$/, "") || "Foto-Artikel",
                          imageUrl: url,
                        });
                        toast.success("Foto hochgeladen!");
                      }
                    } catch {
                      toast.error("Upload fehlgeschlagen");
                    } finally {
                      setUploadingPhoto(false);
                      e.target.value = "";
                    }
                  }}
                />
                {uploadingPhoto && <Loader2 className="w-3 h-3 animate-spin" />}
              </label>
              <button
                onClick={() => toast.info("🚶 Du gehst einkaufen! Die Gruppe wurde benachrichtigt.", { description: "Andere können jetzt Artikel zur Liste hinzufügen." })}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500/15 text-green-400 text-xs font-medium hover:bg-green-500/25 transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span>Ich gehe einkaufen!</span>
              </button>
            </div>

            {/* Unchecked Items */}
            {itemsLoading && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
            <div className="space-y-2">
              <AnimatePresence>
                {uncheckedItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="rounded-xl border border-border/50 bg-card p-3"
                  >
                    {editingItemId === item.id ? (
                      /* ── Inline Edit Mode ── */
                      <div className="flex items-center gap-2">
                        <Input
                          value={editItemName}
                          onChange={(e) => setEditItemName(e.target.value)}
                          className="flex-1 h-8 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                        <Input
                          value={editItemQty}
                          onChange={(e) => setEditItemQty(e.target.value)}
                          placeholder="Menge"
                          className="w-20 h-8 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                        <button
                          onClick={saveEdit}
                          disabled={!editItemName.trim() || updateItem.isPending}
                          className="p-1.5 rounded-lg bg-[oklch(0.78_0.14_75)]/15 text-[oklch(0.78_0.14_75)] hover:bg-[oklch(0.78_0.14_75)]/25 disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      /* ── Normal View Mode ── */
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleItem.mutate({ id: item.id, isChecked: true })}
                          className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 hover:border-green-400 transition-colors shrink-0"
                        />
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => startEdit(item)}
                        >
                          <span className="text-sm font-medium">{item.name}</span>
                          {item.quantity && (
                            <span className="text-xs text-muted-foreground ml-2">({item.quantity})</span>
                          )}
                        </div>
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt="" className="w-8 h-8 rounded object-cover" />
                        )}
                        <button
                          onClick={() => startEdit(item)}
                          className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteItem.mutate({ id: item.id })}
                          className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Checked Items */}
            {checkedItems.length > 0 && (
              <div className="mt-6">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Erledigt ({checkedItems.length})
                </h4>
                <div className="space-y-1">
                  {checkedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg p-2 opacity-50"
                    >
                      <button
                        onClick={() => toggleItem.mutate({ id: item.id, isChecked: false })}
                        className="w-6 h-6 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center shrink-0"
                      >
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      </button>
                      <span className="text-sm line-through text-muted-foreground">{item.name}</span>
                      {item.quantity && (
                        <span className="text-xs text-muted-foreground/60">({item.quantity})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uncheckedItems.length === 0 && checkedItems.length === 0 && !itemsLoading && (
              <div className="text-center py-8">
                <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Liste ist leer</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
