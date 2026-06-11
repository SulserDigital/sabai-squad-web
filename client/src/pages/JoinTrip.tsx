// JoinTrip: Einladungs-Code eingeben und einer Reise beitreten
import { useState } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useLocation, useSearch } from "wouter";
import { Loader2, Users, Plane, Link2, PartyPopper, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function JoinTrip() {
  const { isAuthenticated, user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const urlCode = new URLSearchParams(searchString).get("code") || "";
  const [inviteCode, setInviteCode] = useState(urlCode);
  const [displayName, setDisplayName] = useState("");
  const [avatarColor, setAvatarColor] = useState("#C9A84C");
  const [step, setStep] = useState<"code" | "details">("code");

  // Look up trip by invite code
  const { data: tripPreview, isLoading: lookingUp, refetch } = trpc.trips.getByInviteCode.useQuery(
    { inviteCode: inviteCode.trim().toUpperCase() },
    { enabled: false }
  );

  const joinMutation = trpc.trips.join.useMutation({
    onSuccess: (result) => {
      if (result.alreadyMember) {
        toast.info("Du bist bereits Mitglied dieser Reise!");
      } else {
        toast.success("Willkommen in der Gruppe!");
      }
      setLocation("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleLookup = async () => {
    if (!inviteCode.trim()) return;
    const result = await refetch();
    if (result.data) {
      setStep("details");
      setDisplayName(user?.name || "");
    } else {
      toast.error("Kein Trip mit diesem Code gefunden.");
    }
  };

  const handleJoin = () => {
    if (!displayName.trim()) return;
    joinMutation.mutate({
      inviteCode: inviteCode.trim().toUpperCase(),
      displayName: displayName.trim(),
      emoji: avatarColor,
    });
  };

  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[oklch(0.11_0.02_255)] flex items-center justify-center">
        <div className="text-center glass-card p-8 rounded-2xl max-w-sm">
          <Link2 className="w-10 h-10 text-[oklch(0.78_0.14_75)] mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-white mb-2">Login erforderlich</h2>
          <p className="text-sm text-[oklch(0.55_0.02_255)] mb-4">Melde dich an, um einer Reise beizutreten.</p>
          <a href="/login" className="inline-block px-6 py-3 rounded-xl bg-gold-gradient text-[oklch(0.11_0.02_255)] font-semibold text-sm">
            Einloggen
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(0.11_0.02_255)] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card-gold p-8 rounded-3xl max-w-md w-full mx-4 border border-[oklch(0.78_0.14_75/30%)]"
      >
        {step === "code" ? (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[oklch(0.78_0.14_75/15%)] flex items-center justify-center text-3xl mx-auto mb-4">
                <Users className="w-8 h-8 text-[oklch(0.78_0.14_75)]" />
              </div>
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                Reise <span className="text-gold-gradient">beitreten</span>
              </h2>
              <p className="text-sm text-[oklch(0.55_0.02_255)] mt-2">
                Gib den Einladungscode ein, den du von deiner Gruppe erhalten hast.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-[oklch(0.65_0.02_255)]">Einladungscode</Label>
                <Input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="z.B. A3K9F2"
                  className="bg-[oklch(1_0_0/8%)] border-white/10 text-white mt-1 text-center text-lg tracking-widest font-mono"
                  maxLength={8}
                />
              </div>
              <Button
                onClick={handleLookup}
                disabled={!inviteCode.trim() || lookingUp}
                className="w-full bg-gold-gradient text-[oklch(0.11_0.02_255)] hover:opacity-90"
              >
                {lookingUp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plane className="w-4 h-4 mr-2" />}
                Reise suchen
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[oklch(0.65_0.22_150/15%)] flex items-center justify-center mx-auto mb-4">
                <PartyPopper className="w-8 h-8 text-[oklch(0.65_0.22_150)]" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-bold text-white">
                {tripPreview?.name}
              </h2>
              <p className="text-sm text-[oklch(0.55_0.02_255)] mt-1">
                {tripPreview?.destination} · {tripPreview?.currency}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-[oklch(0.65_0.02_255)]">Dein Anzeigename</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Wie sollen dich die anderen sehen?"
                  className="bg-[oklch(1_0_0/8%)] border-white/10 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-[oklch(0.65_0.02_255)]">Deine Farbe</Label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {["#C9A84C", "#4ECDC4", "#FF6B6B", "#A78BFA", "#F59E0B", "#10B981", "#EC4899", "#6366F1", "#14B8A6", "#F97316"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setAvatarColor(c)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2 ${
                        avatarColor === c
                          ? "border-white scale-110"
                          : "border-transparent hover:border-white/30"
                      }`}
                      style={{ backgroundColor: `${c}30` }}
                    >
                      <span style={{ color: c }} className="font-bold text-sm">{displayName.charAt(0).toUpperCase() || "?"}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleJoin}
                disabled={!displayName.trim() || joinMutation.isPending}
                className="w-full bg-gold-gradient text-[oklch(0.11_0.02_255)] hover:opacity-90"
              >
                {joinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                <UserPlus className="w-4 h-4 mr-2" /> Beitreten
              </Button>
              <button
                onClick={() => setStep("code")}
                className="w-full text-sm text-[oklch(0.55_0.02_255)] hover:text-white transition-colors"
              >
                ← Anderen Code eingeben
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
