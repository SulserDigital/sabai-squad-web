// Chat: Gruppen-Chat mit tRPC Backend + Medien-Upload
import { motion } from "framer-motion";
import { useState, useRef, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Send, Loader2, Image, Paperclip, X, FileText, Film, MessageSquare, TreePalm, LogIn, MapPin, Download } from "lucide-react";
import MemberAvatar from "@/components/MemberAvatar";
import { usePlausible } from "@/hooks/usePlausible";

export default function Chat() {
  const { isAuthenticated, user, loading } = useAuth();
  const { trackEvent } = usePlausible();
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: string; name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get trips to find active trip
  const { data: trips } = trpc.trips.list.useQuery(undefined, { enabled: isAuthenticated });
  const activeTripId = trips?.[0]?.id ?? null;

  // Get members for this trip
  const { data: members } = trpc.members.list.useQuery(
    { tripId: activeTripId! },
    { enabled: !!activeTripId }
  );

  // Get chat messages (poll every 5 seconds)
  const { data: messages, isLoading: messagesLoading } = trpc.chat.messages.useQuery(
    { tripId: activeTripId!, limit: 100 },
    { enabled: !!activeTripId, refetchInterval: 5000 }
  );

  const utils = trpc.useUtils();

  // Find current user's member record
  const currentMember = useMemo(() => {
    if (!members || !user) return null;
    return members.find(m => m.userId === user.id) ?? members[0] ?? null;
  }, [members, user]);

  // Member lookup map
  const memberMap = useMemo(() => {
    const map = new Map<number, { displayName: string; avatarUrl: string | null; avatarIcon: string | null; avatarColor: string | null }>();
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

  // Send message mutation
  const sendMessage = trpc.chat.send.useMutation({
    onSuccess: () => {
      setNewMessage("");
      setMediaPreview(null);
      utils.chat.messages.invalidate({ tripId: activeTripId! });
    },
    onError: (err) => toast.error("Fehler: " + err.message),
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Datei zu gross (max. 10 MB)");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) throw new Error("Upload fehlgeschlagen");

      const { url } = await response.json();

      // Determine type
      let type = "file";
      if (file.type.startsWith("image/")) type = "image";
      else if (file.type.startsWith("video/")) type = "video";

      setMediaPreview({ url, type, name: file.name });
      toast.success("Datei hochgeladen!");
    } catch (err) {
      toast.error("Upload fehlgeschlagen");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = () => {
    if ((!newMessage.trim() && !mediaPreview) || !activeTripId || !currentMember) return;

    const messageType = mediaPreview?.type === "image" ? "image" as const : "text" as const;
    const content = mediaPreview
      ? (newMessage.trim() || (mediaPreview.type === "image" ? "[Bild]" : `[${mediaPreview.name}]`))
      : newMessage.trim();

    trackEvent("Chat Message Sent", { type: messageType });
    sendMessage.mutate({
      tripId: activeTripId,
      memberId: currentMember.id,
      content,
      messageType,
      mediaUrl: mediaPreview?.url,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render message content (text or media)
  const renderMessageContent = (msg: { content: string; messageType: string; mediaUrl?: string | null }) => {
    if (msg.mediaUrl) {
      if (msg.messageType === "image" || msg.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return (
          <div>
            <img
              src={msg.mediaUrl}
              alt="Geteiltes Bild"
              className="max-w-[280px] max-h-[200px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(msg.mediaUrl!, "_blank")}
            />
            {msg.content && msg.content !== "[Bild]" && (
              <p className="text-sm text-[oklch(0.85_0.01_80)] leading-relaxed mt-2">{msg.content}</p>
            )}
          </div>
        );
      }
      if (msg.mediaUrl.match(/\.(mp4|webm|mov)$/i)) {
        return (
          <div>
            <video
              src={msg.mediaUrl}
              controls
              className="max-w-[280px] max-h-[200px] rounded-xl"
            />
            {msg.content && !msg.content.startsWith("[") && (
              <p className="text-sm text-[oklch(0.85_0.01_80)] leading-relaxed mt-2">{msg.content}</p>
            )}
          </div>
        );
      }
      // Generic file
      return (
        <div>
          <a
            href={msg.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[oklch(1_0_0/8%)] hover:bg-[oklch(1_0_0/12%)] transition-colors"
          >
            <FileText className="w-5 h-5 text-[oklch(0.78_0.14_75)]" />
            <span className="text-sm text-white underline">{msg.content || "Datei"}</span>
          </a>
        </div>
      );
    }
    return <p className="text-sm text-[oklch(0.85_0.01_80)] leading-relaxed">{msg.content}</p>;
  };

  // Not authenticated
  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[oklch(0.11_0.02_255)] flex items-center justify-center">
        <div className="text-center glass-card p-8 rounded-2xl max-w-sm">
          <MessageSquare className="w-10 h-10 text-[oklch(0.78_0.14_75)] mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-white mb-2">Login erforderlich</h2>
          <p className="text-sm text-[oklch(0.55_0.02_255)] mb-4">Melde dich an, um den Gruppen-Chat zu nutzen.</p>
          <a href="/login" className="inline-block px-6 py-3 rounded-xl bg-gold-gradient text-[oklch(0.11_0.02_255)] font-semibold text-sm">
            Einloggen
          </a>
        </div>
      </div>
    );
  }

  // No trip yet
  if (!activeTripId && !loading) {
    return (
      <div className="min-h-screen bg-[oklch(0.11_0.02_255)] flex items-center justify-center">
        <div className="text-center glass-card p-8 rounded-2xl max-w-sm">
          <TreePalm className="w-10 h-10 text-[oklch(0.65_0.22_150)] mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-white mb-2">Keine Reise vorhanden</h2>
          <p className="text-sm text-[oklch(0.55_0.02_255)]">Erstelle zuerst eine Reise im Dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(0.11_0.02_255)] flex flex-col">
      <div className="container mx-auto px-4 lg:px-8 pt-20 pb-4 flex-1 flex flex-col max-h-[calc(100vh-4rem)]">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 rounded-2xl mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[oklch(0.78_0.14_75/20%)] flex items-center justify-center"><MessageSquare className="w-5 h-5 text-[oklch(0.78_0.14_75)]" strokeWidth={1.5} /></div>
            <div>
              <h1 className="font-semibold text-white">BKK Gang Chat</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.65_0.22_150)] animate-pulse" />
                <span className="text-xs text-[oklch(0.55_0.02_255)]">
                  {members?.length ?? 0} Mitglieder · Live
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {members?.slice(0, 5).map((m) => (
                <MemberAvatar
                  key={m.id}
                  avatarUrl={(m as any).avatarUrl}
                  avatarIcon={(m as any).avatarIcon}
                  avatarColor={(m as any).avatarColor}
                  displayName={m.displayName}
                  size="xs"
                  className="border-2 border-[oklch(0.14_0.025_255)]"
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto pb-4 pr-1">
          {messagesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[oklch(0.55_0.02_255)]" />
            </div>
          ) : messages && messages.length > 0 ? (
            <>
              {messages.map((msg, i) => {
                const member = memberMap.get(msg.memberId);
                const isOwn = currentMember && msg.memberId === currentMember.id;
                const prevMsg = i > 0 ? messages[i - 1] : null;
                const isFirst = !prevMsg || prevMsg.memberId !== msg.memberId;
                // Date separator
                const msgDate = new Date(msg.createdAt).toDateString();
                const prevDate = prevMsg ? new Date(prevMsg.createdAt).toDateString() : null;
                const showDateSep = !prevDate || prevDate !== msgDate;
                return (
                  <div key={msg.id}>
                    {/* Date separator */}
                    {showDateSep && (
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-[oklch(0.22_0.02_255)]" />
                        <span className="text-[10px] text-[oklch(0.45_0.02_255)] px-2 py-0.5 rounded-full bg-[oklch(0.16_0.02_255)] border border-[oklch(0.22_0.02_255)]">
                          {new Date(msg.createdAt).toLocaleDateString("de-CH", { weekday: "short", day: "2-digit", month: "short" })}
                        </span>
                        <div className="flex-1 h-px bg-[oklch(0.22_0.02_255)]" />
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.015, 0.4) }}
                      className={`flex items-end gap-2 ${isFirst ? "mt-3" : "mt-0.5"} ${isOwn ? "flex-row-reverse" : ""}`}
                    >
                      {/* Avatar – only for others, only on first in group */}
                      {!isOwn && (
                        isFirst ? (
                          <MemberAvatar
                            avatarUrl={member?.avatarUrl}
                            avatarIcon={member?.avatarIcon}
                            avatarColor={member?.avatarColor}
                            displayName={member?.displayName || "?"}
                            size="xs"
                            className="mb-1 shrink-0"
                          />
                        ) : (
                          <div className="w-6 shrink-0" />
                        )
                      )}
                      <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[78%]`}>
                        {/* Name + time – only on first in group */}
                        {isFirst && (
                          <div className={`flex items-center gap-1.5 mb-0.5 ${isOwn ? "flex-row-reverse" : ""}`}>
                            {!isOwn && (
                              <span className="text-[11px] font-semibold" style={{ color: member?.avatarColor || "#C9A84C" }}>
                                {member?.displayName || "Unbekannt"}
                              </span>
                            )}
                            <span className="text-[10px] text-[oklch(0.40_0.02_255)]">
                              {new Date(msg.createdAt).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        )}
                        {/* Bubble */}
                        <div className={`px-3.5 py-2.5 ${
                          isOwn
                            ? "bg-[oklch(0.78_0.14_75/18%)] border border-[oklch(0.78_0.14_75/25%)] rounded-2xl rounded-br-sm"
                            : "bg-[oklch(1_0_0/7%)] rounded-2xl rounded-bl-sm"
                        }`}>
                          {renderMessageContent(msg)}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="w-10 h-10 text-[oklch(0.55_0.02_255)] mb-3" strokeWidth={1.5} />
              <p className="text-[oklch(0.55_0.02_255)]">Noch keine Nachrichten.</p>
              <p className="text-xs text-[oklch(0.40_0.02_255)] mt-1">Starte die Konversation!</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Media Preview */}
        {mediaPreview && (
          <div className="glass-card p-3 rounded-xl mb-2 flex items-center gap-3">
            {mediaPreview.type === "image" ? (
              <img src={mediaPreview.url} alt="" className="w-12 h-12 rounded-lg object-cover" />
            ) : mediaPreview.type === "video" ? (
              <div className="w-12 h-12 rounded-lg bg-[oklch(1_0_0/10%)] flex items-center justify-center">
                <Film className="w-5 h-5 text-[oklch(0.78_0.14_75)]" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-[oklch(1_0_0/10%)] flex items-center justify-center">
                <FileText className="w-5 h-5 text-[oklch(0.78_0.14_75)]" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{mediaPreview.name}</p>
              <p className="text-xs text-[oklch(0.50_0.02_255)]">Bereit zum Senden</p>
            </div>
            <button onClick={() => setMediaPreview(null)} className="p-1.5 rounded-lg hover:bg-[oklch(1_0_0/10%)] text-[oklch(0.55_0.02_255)]">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-3 rounded-2xl flex items-center gap-2">
          {/* File upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 rounded-xl hover:bg-[oklch(1_0_0/8%)] text-[oklch(0.55_0.02_255)] hover:text-[oklch(0.78_0.14_75)] transition-colors disabled:opacity-50"
            title="Bild, Video oder Dokument anhängen"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
          </button>
          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = "image/*";
                fileInputRef.current.click();
                // Reset accept after click
                setTimeout(() => { if (fileInputRef.current) fileInputRef.current.accept = "image/*,video/*,.pdf,.doc,.docx,.txt"; }, 100);
              }
            }}
            disabled={uploading}
            className="p-2 rounded-xl hover:bg-[oklch(1_0_0/8%)] text-[oklch(0.55_0.02_255)] hover:text-[oklch(0.78_0.14_75)] transition-colors disabled:opacity-50"
            title="Bild senden"
          >
            <Image className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentMember ? `Nachricht als ${currentMember.displayName}...` : "Nachricht..."}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-[oklch(0.40_0.02_255)] outline-none"
            disabled={!currentMember}
          />
          <button
            onClick={handleSend}
            disabled={(!newMessage.trim() && !mediaPreview) || sendMessage.isPending || !currentMember}
            className="px-4 py-2 rounded-xl bg-gold-gradient text-[oklch(0.11_0.02_255)] text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
