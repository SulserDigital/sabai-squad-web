// Dictionary & Translator – Thai Phrasebook + LLM Translation via tRPC
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Hand, UtensilsCrossed, Car, ShoppingBag, ShieldAlert, Hash,
  Search, X, Languages, ArrowRight, Lightbulb, Bot,
  Volume2, Plus, Pencil, Trash2, Star, Check, BookOpen
} from "lucide-react";
import { usePlausible } from "@/hooks/usePlausible";

const categories = [
  { id: "basics", label: "Grüsse", icon: Hand, color: "oklch(0.78_0.14_75)" },
  { id: "food", label: "Essen", icon: UtensilsCrossed, color: "oklch(0.72_0.18_150)" },
  { id: "transport", label: "Transport", icon: Car, color: "oklch(0.65_0.22_250)" },
  { id: "shopping", label: "Shopping", icon: ShoppingBag, color: "oklch(0.65_0.15_300)" },
  { id: "emergency", label: "Notfall", icon: ShieldAlert, color: "oklch(0.70_0.20_25)" },
  { id: "numbers", label: "Zahlen", icon: Hash, color: "oklch(0.72_0.14_185)" },
  { id: "custom", label: "Eigene", icon: Star, color: "oklch(0.78_0.14_75)" },
];

const LANGUAGES = [
  { code: "th", name: "Thai" },
  { code: "en", name: "English" },
  { code: "de", name: "Deutsch" },
  { code: "fr", name: "Français" },
  { code: "es", name: "Español" },
  { code: "it", name: "Italiano" },
  { code: "zh", name: "中文" },
  { code: "ja", name: "日本語" },
];

const phrases: Record<string, Array<{ de: string; th: string; phonetic: string; note?: string }>> = {
  basics: [
    { de: "Hallo", th: "สวัสดี", phonetic: "sa-wat-dee", note: "Männer: +ครับ (krap), Frauen: +ค่ะ (ka)" },
    { de: "Danke", th: "ขอบคุณ", phonetic: "kop-khun" },
    { de: "Ja", th: "ใช่", phonetic: "chai" },
    { de: "Nein", th: "ไม่", phonetic: "mai" },
    { de: "Entschuldigung", th: "ขอโทษ", phonetic: "kor-toht" },
    { de: "Wie geht es dir?", th: "สบายดีไหม", phonetic: "sa-bai-dee-mai" },
    { de: "Mir geht es gut", th: "สบายดี", phonetic: "sa-bai-dee" },
    { de: "Ich verstehe nicht", th: "ไม่เข้าใจ", phonetic: "mai-kao-jai" },
    { de: "Sprechen Sie Englisch?", th: "พูดภาษาอังกฤษได้ไหม", phonetic: "puut paa-saa ang-grit dai mai" },
    { de: "Kein Problem", th: "ไม่เป็นไร", phonetic: "mai-bpen-rai" },
  ],
  food: [
    { de: "Speisekarte bitte", th: "ขอเมนูหน่อย", phonetic: "kor menu noi" },
    { de: "Nicht scharf", th: "ไม่เผ็ด", phonetic: "mai-pet" },
    { de: "Sehr lecker!", th: "อร่อยมาก", phonetic: "a-roi-maak" },
    { de: "Rechnung bitte", th: "เช็คบิลด้วย", phonetic: "check-bin-duay" },
    { de: "Wasser", th: "น้ำ", phonetic: "naam" },
    { de: "Bier", th: "เบียร์", phonetic: "bia" },
    { de: "Pad Thai", th: "ผัดไทย", phonetic: "pat-tai", note: "Gebratene Reisnudeln – DAS Thai-Gericht" },
    { de: "Tom Yum Suppe", th: "ต้มยำ", phonetic: "tom-yam", note: "Sauer-scharfe Suppe mit Garnelen" },
  ],
  transport: [
    { de: "Wie viel kostet es?", th: "ราคาเท่าไหร่", phonetic: "ra-ka-tao-rai" },
    { de: "Zu teuer!", th: "แพงไป", phonetic: "paeng-bpai" },
    { de: "Bitte hierhin fahren", th: "ไปที่นี่", phonetic: "bpai-tee-nee" },
    { de: "Hier anhalten", th: "จอดที่นี่", phonetic: "jot-tee-nee" },
    { de: "Flughafen", th: "สนามบิน", phonetic: "sa-naam-bin" },
    { de: "Hotel", th: "โรงแรม", phonetic: "rohng-raem" },
  ],
  shopping: [
    { de: "Wie viel?", th: "เท่าไหร่", phonetic: "tao-rai" },
    { de: "Zu teuer", th: "แพงไป", phonetic: "paeng-bpai" },
    { de: "Günstiger bitte", th: "ลดหน่อยได้ไหม", phonetic: "lot-noi-dai-mai" },
    { de: "Ich nehme es", th: "เอาอันนี้", phonetic: "ao-an-nee" },
    { de: "Nur schauen", th: "ดูเฉยๆ", phonetic: "duu-choey-choey" },
  ],
  emergency: [
    { de: "Hilfe!", th: "ช่วยด้วย", phonetic: "chuay-duay" },
    { de: "Polizei", th: "ตำรวจ", phonetic: "tam-ruat" },
    { de: "Krankenhaus", th: "โรงพยาบาล", phonetic: "rohng-pa-ya-baan" },
    { de: "Ich bin krank", th: "ไม่สบาย", phonetic: "mai-sa-bai" },
    { de: "Notruf Thailand", th: "191", phonetic: "191", note: "Polizei: 191, Touristenpolizei: 1155" },
  ],
  numbers: [
    { de: "1", th: "หนึ่ง", phonetic: "nueng" },
    { de: "2", th: "สอง", phonetic: "song" },
    { de: "3", th: "สาม", phonetic: "saam" },
    { de: "5", th: "ห้า", phonetic: "haa" },
    { de: "10", th: "สิบ", phonetic: "sip" },
    { de: "100", th: "ร้อย", phonetic: "roi" },
    { de: "1000", th: "พัน", phonetic: "pan" },
  ],
  custom: [],
};

// Language code → BCP-47 locale mapping for TTS
const LANG_TO_BCP47: Record<string, string> = {
  th: "th-TH",
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  it: "it-IT",
  zh: "zh-CN",
  ja: "ja-JP",
};

// TTS helper using Web Speech API – supports all languages
function speakText(text: string, langCode = "th") {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG_TO_BCP47[langCode] ?? "th-TH";
  utterance.rate = 0.85;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

export default function Dictionary() {
  const { isAuthenticated, user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("basics");
  const [search, setSearch] = useState("");
  const [translateText, setTranslateText] = useState("");
  const [targetLang, setTargetLang] = useState("th");
  const [translationResult, setTranslationResult] = useState<{ translation: string; phonetic: string; original: string; targetLang: string } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Custom phrase form state
  const [newGerman, setNewGerman] = useState("");
  const [newPhonetic, setNewPhonetic] = useState("");
  const [newThai, setNewThai] = useState("");
  const [newCategory, setNewCategory] = useState("Eigene");
  const [newNote, setNewNote] = useState("");

  // Edit form state
  const [editGerman, setEditGerman] = useState("");
  const [editPhonetic, setEditPhonetic] = useState("");
  const [editThai, setEditThai] = useState("");
  const [editNote, setEditNote] = useState("");

  // Get current trip
  const { data: trips } = trpc.trips.list.useQuery(undefined, { enabled: isAuthenticated });
  const currentTrip = trips?.[0];

  // Custom phrases from DB
  const { data: customPhrasesData, refetch: refetchPhrases } = trpc.customPhrases.list.useQuery(
    { tripId: currentTrip?.id ?? 0 },
    { enabled: !!currentTrip?.id }
  );

  const createPhrase = trpc.customPhrases.create.useMutation({
    onSuccess: () => { refetchPhrases(); setShowAddForm(false); resetForm(); },
  });
  const updatePhrase = trpc.customPhrases.update.useMutation({
    onSuccess: () => { refetchPhrases(); setEditingId(null); },
  });
  const deletePhrase = trpc.customPhrases.delete.useMutation({
    onSuccess: () => refetchPhrases(),
  });

  const resetForm = () => {
    setNewGerman(""); setNewPhonetic(""); setNewThai(""); setNewCategory("Eigene"); setNewNote("");
  };

  // Translation mutation via tRPC
  const translateMutation = trpc.translator.translate.useMutation({
    onSuccess: (data) => setTranslationResult({
      translation: data.translation,
      phonetic: data.phonetic,
      original: data.original,
      targetLang: data.targetLang,
    }),
  });

  const activePhrases = activeCategory === "custom"
    ? (customPhrasesData ?? []).map(p => ({ de: p.german, th: p.thai, phonetic: p.phonetic, note: p.note || undefined, id: p.id }))
    : phrases[activeCategory] || [];

  const filteredPhrases = search
    ? activePhrases.filter(
        (p) =>
          p.de.toLowerCase().includes(search.toLowerCase()) ||
          p.phonetic.toLowerCase().includes(search.toLowerCase()) ||
          p.th.includes(search)
      )
    : activePhrases;

  const { trackEvent } = usePlausible();

  const handleTranslate = () => {
    if (!translateText.trim()) return;
    if (!isAuthenticated) { window.location.href = "/login"; return; }
    trackEvent("Translator Used", { targetLang });
    translateMutation.mutate({ text: translateText, targetLang });
  };

  const handleSpeak = (text: string, id: string, langCode = "th") => {
    setSpeakingId(id);
    if (!("speechSynthesis" in window)) {
      console.warn("Web Speech API not supported");
      setSpeakingId(null);
      return;
    }
    speakText(text, langCode);
    setTimeout(() => setSpeakingId(null), 2000);
  };

  const handleCopyTranslation = () => {
    if (!translationResult) return;
    const text = translationResult.phonetic
      ? `${translationResult.phonetic} (${translationResult.translation})`
      : translationResult.translation;
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback('Kopiert!');
      setTimeout(() => setCopyFeedback(null), 2000);
    }).catch(() => {
      console.error('Failed to copy');
    });
  };

  const handleAddPhrase = () => {
    if (!newGerman.trim() || !newPhonetic.trim() || !currentTrip) return;
    createPhrase.mutate({
      tripId: currentTrip.id,
      german: newGerman.trim(),
      phonetic: newPhonetic.trim(),
      thai: newThai.trim(),
      category: newCategory,
      note: newNote.trim(),
    });
  };

  const startEdit = (phrase: { id: number; de: string; th: string; phonetic: string; note?: string }) => {
    setEditingId(phrase.id);
    setEditGerman(phrase.de);
    setEditPhonetic(phrase.phonetic);
    setEditThai(phrase.th);
    setEditNote(phrase.note ?? "");
  };

  const handleSaveEdit = () => {
    if (!editingId || !editGerman.trim() || !editPhonetic.trim()) return;
    updatePhrase.mutate({
      id: editingId,
      german: editGerman.trim(),
      phonetic: editPhonetic.trim(),
      thai: editThai.trim(),
      note: editNote.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-[oklch(0.11_0.02_255)]">
      <div className="container mx-auto px-4 lg:px-8 pt-20 pb-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <span className="text-[oklch(0.78_0.14_75)] text-sm font-medium uppercase tracking-widest">Offline verfügbar</span>
          <h1 className="text-3xl md:text-4xl font-bold text-white mt-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Thai-<span className="text-gold-gradient">Wörterbuch</span>
          </h1>
          <p className="text-[oklch(0.55_0.02_255)] mt-1">Phrasen, Aussprache und KI-Übersetzer</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: KI-Translator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 order-2 lg:order-1"
          >
            <div className="glass-card p-6 rounded-2xl lg:sticky lg:top-24">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5 text-[oklch(0.72_0.14_185)]" />
                <span>KI-Übersetzer</span>
              </h3>

              <div className="mb-3">
                <label className="text-xs text-[oklch(0.50_0.02_255)] mb-1.5 block">Zielsprache</label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full bg-[oklch(1_0_0/8%)] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="text-xs text-[oklch(0.50_0.02_255)] mb-1.5 block">Text eingeben</label>
                <textarea
                  value={translateText}
                  onChange={(e) => setTranslateText(e.target.value)}
                  placeholder="z.B. Wo ist der nächste Tempel?"
                  rows={3}
                  className="w-full bg-[oklch(1_0_0/8%)] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none resize-none focus:border-[oklch(0.78_0.14_75/50%)] transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTranslate(); }
                  }}
                />
              </div>

              <button
                onClick={handleTranslate}
                disabled={translateMutation.isPending || !translateText.trim()}
                className="w-full py-3 rounded-xl bg-gold-gradient text-[oklch(0.11_0.02_255)] font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {translateMutation.isPending ? "Übersetze..." : (
                  <><Languages className="w-4 h-4" />Übersetzen<ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              {/* Translation Result */}
              {translationResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-xl bg-[oklch(0.72_0.14_185/10%)] border border-[oklch(0.72_0.14_185/30%)]"
                >
                  <div className="text-xs text-[oklch(0.72_0.14_185)] mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-1"><Languages className="w-3 h-3" />Übersetzung</span>
                    <div className="flex items-center gap-2">
                      {/* TTS button – use translation text for all languages */}
                      {translationResult.translation && (
                        <button
                          onClick={() => handleSpeak(translationResult.translation, "translation", targetLang)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                            speakingId === "translation"
                              ? "bg-[oklch(0.78_0.14_75/30%)] text-[oklch(0.78_0.14_75)]"
                              : "bg-[oklch(1_0_0/8%)] text-[oklch(0.55_0.02_255)] hover:text-white"
                          }`}
                          title="Vorlesen"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={handleCopyTranslation}
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-[oklch(1_0_0/8%)] text-[oklch(0.55_0.02_255)] hover:text-white transition-all"
                        title="Kopieren"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* Phonetic first (large, gold) – only for languages that need it */}
                  {translationResult.phonetic && (
                    <div className="text-2xl font-bold text-[oklch(0.78_0.14_75)] mb-2 leading-relaxed">
                      {translationResult.phonetic}
                    </div>
                  )}
                  {/* Translation in target script */}
                  {translationResult.translation && (
                    <div className={`leading-relaxed ${
                      translationResult.phonetic
                        ? "text-sm text-[oklch(0.55_0.02_255)] mb-2" // secondary when phonetic shown
                        : "text-2xl font-bold text-white mb-2"        // primary when no phonetic
                    }`}>
                      {translationResult.translation}
                    </div>
                  )}
                </motion.div>
              )}

              {translateMutation.isError && (
                <div className="mt-3 text-xs text-red-400">
                  Fehler bei der Übersetzung. Bitte erneut versuchen.
                </div>
              )}

              {!isAuthenticated && (
                <p className="text-xs text-[oklch(0.45_0.02_255)] mt-3 text-center">
                  Login erforderlich für den KI-Übersetzer
                </p>
              )}
            </div>
          </motion.div>

          {/* Right: Phrasebook */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2 order-1 lg:order-2"
          >
            {/* Search */}
            <div className="mb-4">
              <div className="glass-card p-3 rounded-2xl flex items-center gap-3">
                <Search className="w-4 h-4 text-[oklch(0.50_0.02_255)] shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Suche auf Deutsch, Thai oder Phonetisch..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-[oklch(0.40_0.02_255)] outline-none"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="text-[oklch(0.55_0.02_255)] hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Categories */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-6">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveCategory(cat.id); setSearch(""); }}
                    className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? "bg-[oklch(0.78_0.14_75/15%)] border border-[oklch(0.78_0.14_75/40%)]"
                        : "glass-card hover:bg-[oklch(1_0_0/8%)]"
                    }`}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: isActive ? cat.color : "oklch(0.55 0.02 255)" }}
                      strokeWidth={1.5}
                    />
                    <span
                      className="text-center leading-tight"
                      style={{ color: isActive ? cat.color : "oklch(0.65 0.02 255)" }}
                    >
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom phrases: Add button */}
            {activeCategory === "custom" && isAuthenticated && currentTrip && (
              <div className="mb-4">
                {!showAddForm ? (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="w-full py-3 rounded-xl border border-dashed border-[oklch(0.78_0.14_75/40%)] text-[oklch(0.78_0.14_75)] text-sm font-medium hover:bg-[oklch(0.78_0.14_75/8%)] transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Eigene Phrase hinzufügen
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-4 rounded-2xl border border-[oklch(0.78_0.14_75/30%)]"
                  >
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[oklch(0.78_0.14_75)]" />
                      Neue Phrase
                    </h4>
                    <div className="space-y-2">
                      <input
                        value={newGerman}
                        onChange={(e) => setNewGerman(e.target.value)}
                        placeholder="Deutsch (z.B. Wo ist die Toilette?)"
                        className="w-full bg-[oklch(1_0_0/8%)] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[oklch(0.78_0.14_75/50%)] transition-colors placeholder:text-[oklch(0.40_0.02_255)]"
                      />
                      <input
                        value={newPhonetic}
                        onChange={(e) => setNewPhonetic(e.target.value)}
                        placeholder="Phonetisch (z.B. hong-naam yuu-tee-nai)"
                        className="w-full bg-[oklch(1_0_0/8%)] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[oklch(0.78_0.14_75/50%)] transition-colors placeholder:text-[oklch(0.40_0.02_255)]"
                      />
                      <input
                        value={newThai}
                        onChange={(e) => setNewThai(e.target.value)}
                        placeholder="Thai-Schrift (optional, z.B. ห้องน้ำอยู่ที่ไหน)"
                        className="w-full bg-[oklch(1_0_0/8%)] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[oklch(0.78_0.14_75/50%)] transition-colors placeholder:text-[oklch(0.40_0.02_255)]"
                      />
                      <input
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Notiz (optional, z.B. Slang von Local gelernt)"
                        className="w-full bg-[oklch(1_0_0/8%)] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[oklch(0.78_0.14_75/50%)] transition-colors placeholder:text-[oklch(0.40_0.02_255)]"
                      />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleAddPhrase}
                        disabled={!newGerman.trim() || !newPhonetic.trim() || createPhrase.isPending}
                        className="flex-1 py-2.5 rounded-xl bg-gold-gradient text-[oklch(0.11_0.02_255)] font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Speichern
                      </button>
                      <button
                        onClick={() => { setShowAddForm(false); resetForm(); }}
                        className="px-4 py-2.5 rounded-xl bg-[oklch(1_0_0/8%)] text-[oklch(0.55_0.02_255)] hover:text-white text-sm transition-colors"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Phrases */}
            <div className="space-y-3">
              {filteredPhrases.map((phrase, i) => {
                const phraseId = `${activeCategory}-${i}`;
                const isEditing = activeCategory === "custom" && "id" in phrase && editingId === (phrase as any).id;

                return (
                  <motion.div
                    key={phraseId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="glass-card p-4 rounded-2xl hover:border-[oklch(0.78_0.14_75/30%)] border border-transparent transition-colors"
                  >
                    {isEditing ? (
                      /* Edit mode */
                      <div className="space-y-2">
                        <input
                          value={editGerman}
                          onChange={(e) => setEditGerman(e.target.value)}
                          className="w-full bg-[oklch(1_0_0/8%)] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[oklch(0.78_0.14_75/50%)]"
                          placeholder="Deutsch"
                        />
                        <input
                          value={editPhonetic}
                          onChange={(e) => setEditPhonetic(e.target.value)}
                          className="w-full bg-[oklch(1_0_0/8%)] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[oklch(0.78_0.14_75/50%)]"
                          placeholder="Phonetisch"
                        />
                        <input
                          value={editThai}
                          onChange={(e) => setEditThai(e.target.value)}
                          className="w-full bg-[oklch(1_0_0/8%)] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[oklch(0.78_0.14_75/50%)]"
                          placeholder="Thai-Schrift (optional)"
                        />
                        <input
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          className="w-full bg-[oklch(1_0_0/8%)] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[oklch(0.78_0.14_75/50%)]"
                          placeholder="Notiz (optional)"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            disabled={!editGerman.trim() || !editPhonetic.trim()}
                            className="flex-1 py-2 rounded-xl bg-gold-gradient text-[oklch(0.11_0.02_255)] font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />Speichern
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2 rounded-xl bg-[oklch(1_0_0/8%)] text-[oklch(0.55_0.02_255)] hover:text-white text-sm transition-colors"
                          >
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display mode */
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* 1. Deutsch */}
                          <div className="text-white font-medium text-sm">{phrase.de}</div>
                          {/* 2. Phonetisch – GROSS, gold */}
                          <div className="text-xl font-semibold mt-1.5 text-[oklch(0.78_0.14_75)]">
                            {phrase.phonetic}
                          </div>
                          {/* 3. Thai-Schrift – klein, grau */}
                          {phrase.th && (
                            <div className="text-sm text-[oklch(0.45_0.02_255)] mt-0.5">
                              {phrase.th}
                            </div>
                          )}
                          {phrase.note && (
                            <div className="text-xs text-[oklch(0.50_0.02_255)] mt-2 flex items-start gap-1.5">
                              <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0 text-[oklch(0.78_0.14_75)]" />
                              <span>{phrase.note}</span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* TTS Button */}
                          {phrase.th && (
                            <button
                              onClick={() => handleSpeak(phrase.th, phraseId)}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                                speakingId === phraseId
                                  ? "bg-[oklch(0.78_0.14_75/30%)] text-[oklch(0.78_0.14_75)] scale-95"
                                  : "bg-[oklch(1_0_0/8%)] text-[oklch(0.55_0.02_255)] hover:text-white hover:bg-[oklch(1_0_0/15%)]"
                              }`}
                              title="Thai vorlesen"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit/Delete for custom phrases */}
                          {activeCategory === "custom" && "id" in phrase && (
                            <>
                              <button
                                onClick={() => startEdit(phrase as any)}
                                className="w-9 h-9 rounded-xl bg-[oklch(1_0_0/8%)] flex items-center justify-center text-[oklch(0.55_0.02_255)] hover:text-white transition-colors"
                                title="Bearbeiten"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deletePhrase.mutate({ id: (phrase as any).id })}
                                className="w-9 h-9 rounded-xl bg-[oklch(0.70_0.20_25/15%)] flex items-center justify-center text-[oklch(0.70_0.20_25)] hover:bg-[oklch(0.70_0.20_25/25%)] transition-colors"
                                title="Löschen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Empty state */}
            {filteredPhrases.length === 0 && (
              <div className="text-center py-12 text-[oklch(0.45_0.02_255)]">
                {activeCategory === "custom" ? (
                  <>
                    <Star className="w-8 h-8 mx-auto mb-3 text-[oklch(0.40_0.02_255)]" />
                    <p className="font-medium text-[oklch(0.55_0.02_255)]">Noch keine eigenen Phrasen</p>
                    <p className="text-xs mt-2">Füge Phrasen hinzu, die du von Locals gelernt hast!</p>
                  </>
                ) : (
                  <>
                    <Search className="w-8 h-8 mx-auto mb-3 text-[oklch(0.40_0.02_255)]" />
                    <p>Keine Ergebnisse für "{search}"</p>
                    <p className="text-xs mt-2">Nutze den KI-Übersetzer für freie Übersetzungen</p>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
