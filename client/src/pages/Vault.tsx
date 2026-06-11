// Vault: Secure Document Storage mit tRPC Backend
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Lock, Unlock, Shield, BookOpen, FileText, ShieldCheck, Plane, Hotel, File, FolderOpen } from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const documentTypes: { id: string; label: string; icon: LucideIcon; color: string }[] = [
  { id: "passport", label: "Reisepass", icon: BookOpen, color: "oklch(0.78 0.14 75)" },
  { id: "visa", label: "Visum", icon: FileText, color: "oklch(0.72 0.14 185)" },
  { id: "insurance", label: "Versicherung", icon: ShieldCheck, color: "oklch(0.65 0.22 150)" },
  { id: "ticket", label: "Flugticket", icon: Plane, color: "oklch(0.72 0.14 185)" },
  { id: "hotel", label: "Hotelbuchung", icon: Hotel, color: "oklch(0.78 0.14 75)" },
  { id: "other", label: "Sonstiges", icon: File, color: "oklch(0.55 0.02 255)" },
];

export default function Vault() {
  const { isAuthenticated, loading } = useAuth();
  const [unlocked, setUnlocked] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<"passport" | "insurance" | "visa" | "ticket" | "hotel" | "other">("other");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Queries
  const { data: documents, isLoading } = trpc.vault.list.useQuery(undefined, {
    enabled: isAuthenticated && unlocked,
  });

  const utils = trpc.useUtils();

  // Mutations
  const createDoc = trpc.vault.create.useMutation({
    onSuccess: () => {
      utils.vault.list.invalidate();
      setShowCreate(false);
      setTitle(""); setDocType("other"); setNotes(""); setSelectedFile(null);
      toast.success("Dokument gespeichert!");
    },
    onError: (err) => toast.error("Fehler: " + err.message),
  });

  const deleteDoc = trpc.vault.delete.useMutation({
    onSuccess: () => {
      utils.vault.list.invalidate();
      toast.success("Dokument gelöscht");
    },
    onError: (err) => toast.error("Fehler: " + err.message),
  });

  const handleUpload = async () => {
    if (!title.trim()) return;
    setUploading(true);

    try {
      let fileKey: string | undefined;
      let fileUrl: string | undefined;
      let mimeType: string | undefined;

      if (selectedFile) {
        // Upload file to server
        const formData = new FormData();
        formData.append("file", selectedFile);
        const resp = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || "Upload fehlgeschlagen");
        }
        const data = await resp.json();
        fileKey = data.key;
        fileUrl = data.url;
        mimeType = selectedFile.type;
      }

      createDoc.mutate({
        title: title.trim(),
        documentType: docType,
        notes: notes.trim() || undefined,
        fileKey,
        fileUrl,
        mimeType,
      });
    } catch {
      toast.error("Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  const filteredDocs = selectedType
    ? (documents ?? []).filter(d => d.documentType === selectedType)
    : (documents ?? []);

  // Not authenticated
  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[oklch(0.11_0.02_255)] flex items-center justify-center">
        <div className="text-center glass-card p-8 rounded-2xl max-w-sm">
          <Lock className="w-10 h-10 text-[oklch(0.78_0.14_75)] mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-white mb-2">Login erforderlich</h2>
          <p className="text-sm text-[oklch(0.55_0.02_255)] mb-4">Melde dich an, um den Vault zu nutzen.</p>
          <a href="/login" className="inline-block px-6 py-3 rounded-xl bg-gold-gradient text-[oklch(0.11_0.02_255)] font-semibold text-sm">
            Einloggen
          </a>
        </div>
      </div>
    );
  }

  // Lock screen
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[oklch(0.11_0.02_255)] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card-gold p-8 rounded-3xl max-w-sm w-full mx-4 text-center border border-[oklch(0.78_0.14_75/30%)]"
        >
          <div className="w-20 h-20 rounded-full bg-[oklch(0.78_0.14_75/15%)] flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-[oklch(0.78_0.14_75)]" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Secure Vault
          </h2>
          <p className="text-sm text-[oklch(0.55_0.02_255)] mb-6">
            Deine Reisedokumente sind sicher gespeichert. Entsperre um darauf zuzugreifen.
          </p>
          <button
            onClick={() => setUnlocked(true)}
            className="w-full py-3.5 rounded-xl bg-gold-gradient text-[oklch(0.11_0.02_255)] font-semibold glow-gold hover:opacity-90 transition-opacity"
          >
            <Unlock className="w-4 h-4 inline mr-2" />
            Vault entsperren
          </button>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[oklch(0.45_0.02_255)]">
            <Shield className="w-3 h-3" />
            <span>Sichere Cloud-Speicherung</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(0.11_0.02_255)]">
      <div className="container mx-auto px-4 lg:px-8 pt-20 pb-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[oklch(0.65_0.22_150)] text-sm flex items-center gap-1">
                  <Unlock className="w-3 h-3" /> Entsperrt
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.65_0.22_150)]" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                Secure <span className="text-gold-gradient">Vault</span>
              </h1>
              <p className="text-[oklch(0.55_0.02_255)] mt-1">{documents?.length ?? 0} Dokumente gespeichert</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowCreate(true)}
                className="bg-gold-gradient text-[oklch(0.11_0.02_255)] hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-1" /> Hinzufügen
              </Button>
              <button
                onClick={() => setUnlocked(false)}
                className="px-4 py-2 rounded-xl glass-card border border-[oklch(0.65_0.22_25/30%)] text-[oklch(0.65_0.22_25)] text-sm font-medium hover:bg-[oklch(0.65_0.22_25/10%)] transition-colors"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Document Types Filter */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          <button
            onClick={() => setSelectedType(null)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-all ${
              !selectedType
                ? "bg-[oklch(0.78_0.14_75/20%)] text-[oklch(0.78_0.14_75)] border border-[oklch(0.78_0.14_75/40%)]"
                : "glass-card text-[oklch(0.60_0.02_255)] hover:text-white"
            }`}
          >
            Alle
          </button>
          {documentTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(selectedType === type.id ? null : type.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-all ${
                selectedType === type.id
                  ? "bg-[oklch(0.78_0.14_75/20%)] text-[oklch(0.78_0.14_75)] border border-[oklch(0.78_0.14_75/40%)]"
                  : "glass-card text-[oklch(0.60_0.02_255)] hover:text-white"
              }`}
            >
              {(() => { const I = type.icon; return <I className="w-4 h-4" strokeWidth={1.5} />; })()}
              <span>{type.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Documents Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[oklch(0.55_0.02_255)]" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl">
            <FolderOpen className="w-10 h-10 text-[oklch(0.55_0.02_255)] mb-3" strokeWidth={1.5} />
            <p className="text-[oklch(0.55_0.02_255)]">Noch keine Dokumente gespeichert.</p>
            <p className="text-xs text-[oklch(0.40_0.02_255)] mt-1">Füge dein erstes Dokument hinzu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredDocs.map((doc, i) => {
                const type = documentTypes.find(t => t.id === doc.documentType);
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card p-5 rounded-2xl hover:border-[oklch(0.78_0.14_75/30%)] border border-transparent transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `color-mix(in oklch, ${type?.color || "white"} 15%, transparent)`, color: type?.color || "white" }}>
                        {(() => { const I = type?.icon || File; return <I className="w-5 h-5" strokeWidth={1.5} />; })()}
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.isEncrypted && (
                          <span className="text-xs text-[oklch(0.65_0.22_150)] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.65_0.22_150)]" />
                            Sicher
                          </span>
                        )}
                        <button
                          onClick={() => deleteDoc.mutate({ docId: doc.id })}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-medium text-white text-sm mb-1">{doc.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[oklch(0.50_0.02_255)]">{type?.label || doc.documentType}</span>
                      {doc.expiryDate && (
                        <span className="text-xs text-[oklch(0.55_0.02_255)]">
                          Gültig bis: {new Date(doc.expiryDate).toLocaleDateString("de-CH")}
                        </span>
                      )}
                    </div>
                    {doc.notes && (
                      <p className="text-xs text-[oklch(0.45_0.02_255)] mt-2 line-clamp-2">{doc.notes}</p>
                    )}
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block text-xs text-[oklch(0.72_0.14_185)] hover:underline"
                      >
                        Datei anzeigen →
                      </a>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Document Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[oklch(0.14_0.025_255)] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Dokument hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-[oklch(0.65_0.02_255)]">Titel *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Reisepass Alex"
                className="bg-[oklch(1_0_0/8%)] border-white/10 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-[oklch(0.65_0.02_255)]">Dokumenttyp</Label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as typeof docType)}
                className="w-full bg-[oklch(1_0_0/8%)] border border-white/10 rounded-md px-3 py-2 text-white text-sm mt-1 outline-none"
              >
                {documentTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-[oklch(0.65_0.02_255)]">Datei (optional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                className="w-full bg-[oklch(1_0_0/8%)] border border-white/10 rounded-md px-3 py-2 text-white text-sm mt-1 file:bg-[oklch(0.78_0.14_75/20%)] file:border-0 file:text-[oklch(0.78_0.14_75)] file:text-xs file:rounded file:mr-2"
              />
              {selectedFile && (
                <p className="text-xs text-[oklch(0.55_0.02_255)] mt-1">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)</p>
              )}
            </div>
            <div>
              <Label className="text-[oklch(0.65_0.02_255)]">Notizen</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optionale Notizen..."
                rows={2}
                className="w-full bg-[oklch(1_0_0/8%)] border border-white/10 rounded-md px-3 py-2 text-white text-sm mt-1 outline-none resize-none"
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={!title.trim() || uploading || createDoc.isPending}
              className="w-full bg-gold-gradient text-[oklch(0.11_0.02_255)] hover:opacity-90"
            >
              {(uploading || createDoc.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Sicher speichern
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
