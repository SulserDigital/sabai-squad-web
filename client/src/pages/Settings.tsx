import { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  Settings as SettingsIcon, User, Camera, Copy, Share2, Save, Check, Pencil,
  Bell, Globe, Palette, Shield, LogOut, ChevronRight, FileText,
  Cat, Bird, Fish, TreePalm, Waves, Martini, Bike, Compass, Anchor,
  Sun, Moon, Mountain, Flame, Crown, Diamond, Rocket, Zap, Star, Heart,
  Smile, Coffee, Music, Camera as CameraIcon, Leaf, Snowflake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ── Avatar icons ─────────────────────────────────────────────────────────────
const AVATAR_ICONS = [
  { name: "Cat", Icon: Cat, label: "Katze" },
  { name: "Bird", Icon: Bird, label: "Vogel" },
  { name: "Fish", Icon: Fish, label: "Fisch" },
  { name: "TreePalm", Icon: TreePalm, label: "Palme" },
  { name: "Waves", Icon: Waves, label: "Wellen" },
  { name: "Martini", Icon: Martini, label: "Cocktail" },
  { name: "Bike", Icon: Bike, label: "Fahrrad" },
  { name: "Compass", Icon: Compass, label: "Kompass" },
  { name: "Anchor", Icon: Anchor, label: "Anker" },
  { name: "Sun", Icon: Sun, label: "Sonne" },
  { name: "Moon", Icon: Moon, label: "Mond" },
  { name: "Mountain", Icon: Mountain, label: "Berg" },
  { name: "Flame", Icon: Flame, label: "Flamme" },
  { name: "Crown", Icon: Crown, label: "Krone" },
  { name: "Diamond", Icon: Diamond, label: "Diamant" },
  { name: "Rocket", Icon: Rocket, label: "Rakete" },
  { name: "Zap", Icon: Zap, label: "Blitz" },
  { name: "Star", Icon: Star, label: "Stern" },
  { name: "Heart", Icon: Heart, label: "Herz" },
  { name: "Smile", Icon: Smile, label: "Smiley" },
  { name: "Coffee", Icon: Coffee, label: "Kaffee" },
  { name: "Music", Icon: Music, label: "Musik" },
  { name: "Camera", Icon: CameraIcon, label: "Kamera" },
  { name: "Leaf", Icon: Leaf, label: "Blatt" },
  { name: "Snowflake", Icon: Snowflake, label: "Schneeflocke" },
];

const AVATAR_COLORS = [
  "#C9A84C", "#E07B54", "#E05454", "#9B59B6",
  "#3498DB", "#1ABC9C", "#2ECC71", "#F39C12",
  "#E74C3C", "#34495E", "#16A085", "#8E44AD",
];

export default function Settings() {
  const { isAuthenticated, user, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarEditing, setAvatarEditing] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const { data: trips } = trpc.trips.list.useQuery(undefined, { enabled: isAuthenticated });
  const activeTripId = trips?.[0]?.id ?? null;
  const activeTrip = trips?.find(t => t.id === activeTripId);

  const { data: members } = trpc.members.list.useQuery(
    { tripId: activeTripId! },
    { enabled: !!activeTripId }
  );

  const utils = trpc.useUtils();

  const currentMember = useMemo(() => {
    if (!members || !user) return null;
    return members.find(m => m.userId === user.id) ?? null;
  }, [members, user]);

  const currentIcon = (currentMember as any)?.avatarIcon as string | null;
  const currentColor = (currentMember as any)?.avatarColor as string || "#C9A84C";
  const currentAvatarUrl = (currentMember as any)?.avatarUrl as string | null;

  const updateAvatar = trpc.members.updateAvatar.useMutation({
    onSuccess: () => {
      utils.members.list.invalidate();
      toast.success("Avatar aktualisiert!");
    },
    onError: () => toast.error("Avatar-Update fehlgeschlagen"),
  });

  const updateDisplayName = trpc.members.updateDisplayName.useMutation({
    onSuccess: () => {
      utils.members.list.invalidate();
      toast.success("Name aktualisiert!");
      setEditingName(false);
    },
    onError: () => toast.error("Name-Update fehlgeschlagen"),
  });

  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });

  const handleIconSelect = (iconName: string) => {
    if (!currentMember) return;
    updateAvatar.mutate({ memberId: currentMember.id, avatarIcon: iconName, avatarUrl: null });
  };

  const handleColorSelect = (color: string) => {
    if (!currentMember) return;
    updateAvatar.mutate({ memberId: currentMember.id, avatarColor: color });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentMember) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Bild zu gross (max. 5 MB)"); return; }
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
      if (!response.ok) throw new Error("Upload fehlgeschlagen");
      const { url } = await response.json();
      updateAvatar.mutate({ memberId: currentMember.id, avatarUrl: url, avatarIcon: null });
    } catch {
      toast.error("Avatar-Upload fehlgeschlagen");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCopyInvite = () => {
    if (activeTrip?.inviteCode) {
      const link = `${window.location.origin}/join?code=${activeTrip.inviteCode}`;
      navigator.clipboard.writeText(link);
      toast.success("Einladungslink kopiert!");
    }
  };

  const handleSaveName = () => {
    if (!currentMember || !nameInput.trim()) return;
    updateDisplayName.mutate({ memberId: currentMember.id, displayName: nameInput.trim() });
  };

  const startEditingName = () => {
    setNameInput(currentMember?.displayName || "");
    setEditingName(true);
  };

  const SelectedIconEntry = AVATAR_ICONS.find(i => i.name === currentIcon);

  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[oklch(0.11_0.02_255)] flex items-center justify-center">
        <div className="text-center glass-card p-8 rounded-2xl max-w-sm">
          <SettingsIcon className="w-10 h-10 text-[oklch(0.78_0.14_75)] mb-4 mx-auto" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-white mb-2">Login erforderlich</h2>
          <a href="/login" className="inline-block px-6 py-3 rounded-xl bg-gold-gradient text-[oklch(0.11_0.02_255)] font-semibold text-sm">
            Einloggen
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(0.11_0.02_255)]">
      <div className="max-w-2xl mx-auto px-4 pt-20 pb-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <SettingsIcon className="w-6 h-6 text-[oklch(0.78_0.14_75)]" strokeWidth={1.5} />
            <h1 className="text-2xl font-bold text-white">Einstellungen</h1>
          </div>
          <p className="text-sm text-[oklch(0.55_0.02_255)] ml-9">Profil, Reise & App-Einstellungen</p>
        </motion.div>

        {/* ── Avatar Section ────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="glass-card p-6 rounded-2xl mb-5">
          <div className="flex items-center gap-2 mb-5">
            <Camera className="w-5 h-5 text-[oklch(0.78_0.14_75)]" strokeWidth={1.5} />
            <h3 className="font-semibold text-white">Mein Avatar</h3>
          </div>

          {/* Current avatar preview */}
          <div className="flex items-center gap-4 mb-5">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border-2 shrink-0"
              style={{ borderColor: currentColor, backgroundColor: currentAvatarUrl ? "transparent" : `${currentColor}20` }}
            >
              {currentAvatarUrl ? (
                <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : SelectedIconEntry ? (
                <SelectedIconEntry.Icon className="w-9 h-9" style={{ color: currentColor }} strokeWidth={1.5} />
              ) : (
                <User className="w-9 h-9" style={{ color: currentColor }} strokeWidth={1.5} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-lg truncate">{currentMember?.displayName || user?.name || "—"}</p>
              <p className="text-xs text-[oklch(0.55_0.02_255)] mt-0.5">{user?.email || ""}</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="text-xs text-[oklch(0.78_0.14_75)] hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[oklch(0.78_0.14_75/10%)] hover:bg-[oklch(0.78_0.14_75/20%)]"
                >
                  <Camera className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                  {avatarUploading ? "Lädt..." : "Foto hochladen"}
                </button>
                <button
                  onClick={() => setAvatarEditing(!avatarEditing)}
                  className="text-xs text-white/60 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[oklch(1_0_0/5%)] hover:bg-[oklch(1_0_0/10%)]"
                >
                  <Pencil className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                  Icon & Farbe
                </button>
              </div>
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

          {/* Icon Gallery + Color Picker (collapsible) */}
          {avatarEditing && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}>
              <div className="mb-5 pt-4 border-t border-white/10">
                <p className="text-xs text-[oklch(0.55_0.02_255)] mb-3 uppercase tracking-wider font-medium">Icon wählen</p>
                <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                  {AVATAR_ICONS.map(({ name, Icon, label }) => (
                    <button
                      key={name}
                      onClick={() => handleIconSelect(name)}
                      title={label}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 border-2 ${
                        currentIcon === name && !currentAvatarUrl
                          ? "border-white bg-[oklch(1_0_0/15%)] scale-105"
                          : "border-transparent bg-[oklch(1_0_0/5%)] hover:border-white/30 hover:bg-[oklch(1_0_0/10%)]"
                      }`}
                    >
                      <Icon className="w-5 h-5" style={{ color: currentIcon === name ? currentColor : "oklch(0.55 0.02 255)" }} strokeWidth={1.5} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <p className="text-xs text-[oklch(0.55_0.02_255)] mb-3 uppercase tracking-wider font-medium">Farbe wählen</p>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorSelect(color)}
                      className={`w-8 h-8 rounded-lg transition-all hover:scale-110 border-2 flex items-center justify-center ${
                        currentColor === color ? "border-white scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {currentColor === color && <Check className="w-4 h-4 text-white drop-shadow" strokeWidth={2.5} />}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setAvatarEditing(false)}
                className="text-xs text-[oklch(0.72_0.14_185)] hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[oklch(0.72_0.14_185/10%)] hover:bg-[oklch(0.72_0.14_185/20%)]"
              >
                <Check className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                Fertig
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* ── Display Name ──────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="glass-card p-6 rounded-2xl mb-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-[oklch(0.78_0.14_75)]" strokeWidth={1.5} />
            <h3 className="font-semibold text-white">Anzeigename</h3>
          </div>
          {editingName ? (
            <div className="flex gap-2">
              <Input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                className="bg-[oklch(1_0_0/5%)] border-white/20 text-white placeholder:text-white/30 flex-1"
                placeholder="Dein Name..."
                autoFocus
                maxLength={50}
              />
              <Button
                onClick={handleSaveName}
                disabled={updateDisplayName.isPending || !nameInput.trim()}
                size="sm"
                className="bg-gold-gradient text-[oklch(0.11_0.02_255)] font-semibold shrink-0"
              >
                <Save className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button
                onClick={() => setEditingName(false)}
                variant="outline"
                size="sm"
                className="border-white/20 text-white/60 shrink-0"
              >
                ✕
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{currentMember?.displayName || user?.name || "—"}</p>
                <p className="text-xs text-[oklch(0.55_0.02_255)] mt-0.5">Wird in der Gruppe angezeigt</p>
              </div>
              <button
                onClick={startEditingName}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white bg-[oklch(1_0_0/5%)] hover:bg-[oklch(1_0_0/10%)] transition-colors"
              >
                <Pencil className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                Bearbeiten
              </button>
            </div>
          )}
        </motion.div>

        {/* ── Invite Code ───────────────────────────────────────────────────── */}
        {activeTrip?.inviteCode && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }} className="glass-card-gold p-6 rounded-2xl mb-5 border border-[oklch(0.78_0.14_75/30%)]">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="w-5 h-5 text-[oklch(0.78_0.14_75)]" strokeWidth={1.5} />
              <h3 className="font-semibold text-white">Reise einladen</h3>
            </div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-[oklch(0.55_0.02_255)] mb-1">Einladungscode</p>
                <p className="text-2xl font-mono font-bold text-[oklch(0.78_0.14_75)] tracking-widest">
                  {activeTrip.inviteCode}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCopyInvite}
                  variant="outline"
                  size="sm"
                  className="border-[oklch(0.78_0.14_75/40%)] text-[oklch(0.78_0.14_75)] hover:bg-[oklch(0.78_0.14_75/10%)]"
                >
                  <Copy className="w-4 h-4 mr-1 shrink-0" /> Link kopieren
                </Button>
                <Button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `Tritt ${activeTrip.name} bei!`,
                        text: `Einladungscode: ${activeTrip.inviteCode}`,
                        url: `${window.location.origin}/join?code=${activeTrip.inviteCode}`,
                      });
                    } else {
                      handleCopyInvite();
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="border-[oklch(0.78_0.14_75/40%)] text-[oklch(0.78_0.14_75)] hover:bg-[oklch(0.78_0.14_75/10%)]"
                >
                  <Share2 className="w-4 h-4 shrink-0" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-[oklch(0.55_0.02_255)]">
              Teile diesen Code, damit andere der Reise "{activeTrip.name}" beitreten können.
            </p>
          </motion.div>
        )}

        {/* ── Placeholder Settings ──────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="glass-card rounded-2xl mb-5 overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <p className="text-xs text-[oklch(0.55_0.02_255)] uppercase tracking-wider font-medium">App-Einstellungen</p>
          </div>
          {[
            { icon: Bell, label: "Benachrichtigungen", desc: "Push-Nachrichten & Alerts" },
            { icon: Globe, label: "Sprache", desc: "Deutsch" },
            { icon: Palette, label: "Theme", desc: "Dark Mode" },
            { icon: Shield, label: "Datenschutz", desc: "Daten & Berechtigungen" },
          ].map(({ icon: Icon, label, desc }) => (
            <button
              key={label}
              onClick={() => toast.info(`${label} – coming soon`)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[oklch(1_0_0/5%)] transition-colors border-b border-white/5 last:border-0"
            >
              <div className="w-9 h-9 rounded-xl bg-[oklch(1_0_0/8%)] flex items-center justify-center shrink-0">
                <Icon className="w-4.5 h-4.5 text-[oklch(0.78_0.14_75)]" strokeWidth={1.5} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-[oklch(0.55_0.02_255)]">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30 shrink-0" strokeWidth={1.5} />
            </button>
          ))}
        </motion.div>

        {/* ── Account ───────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-2xl overflow-hidden mb-8">
          <div className="p-4 border-b border-white/10">
            <p className="text-xs text-[oklch(0.55_0.02_255)] uppercase tracking-wider font-medium">Account</p>
          </div>
          <div className="px-5 py-4 border-b border-white/5">
            <p className="text-xs text-[oklch(0.55_0.02_255)] mb-0.5">Eingeloggt als</p>
            <p className="text-sm text-white font-medium">{user?.name || "—"}</p>
            <p className="text-xs text-[oklch(0.55_0.02_255)]">{user?.email || ""}</p>
          </div>
          <button
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[oklch(1_0_0/5%)] transition-colors text-red-400 hover:text-red-300"
          >
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <LogOut className="w-4.5 h-4.5" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-medium">Ausloggen</span>
          </button>
        </motion.div>

        {/* ── Rechtliches ───────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl overflow-hidden mb-8">
          <div className="p-4 border-b border-white/10">
            <p className="text-xs text-[oklch(0.55_0.02_255)] uppercase tracking-wider font-medium">Rechtliches</p>
          </div>
          <Link href="/legal">
            <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[oklch(1_0_0/5%)] transition-colors">
              <div className="w-9 h-9 rounded-xl bg-[oklch(1_0_0/8%)] flex items-center justify-center shrink-0">
                <FileText className="w-4.5 h-4.5 text-[oklch(0.78_0.14_75)]" strokeWidth={1.5} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-white">Datenschutz, Impressum &amp; AGB</p>
                <p className="text-xs text-[oklch(0.55_0.02_255)]">nDSG konform &middot; Sulser Digital</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30 shrink-0" strokeWidth={1.5} />
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
