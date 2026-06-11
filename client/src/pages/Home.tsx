// Thai Night Market – Dark Luxury Design
// Home.tsx: Landing Page mit Hero, Features, Destinations, BKK Gang, Pricing
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import {
  MapPin, Wallet, Package, MessageCircle, BookOpen, ArrowLeftRight,
  Vote, Lock, Compass, UtensilsCrossed, Camera, PiggyBank,
  Smartphone, RefreshCw, Zap, Palmtree, Users, Check
} from "lucide-react";

// Image URLs (compressed webp)
const IMAGES = {
  bangkokNight: "https://d2xsxph8kpxj0f.cloudfront.net/310519663033361397/H9SSu9MkhmZonqEs9Fn2Bi/hero_bangkok_night-cm8qRFmnVc8KEEstajuwnz.webp",
  thaiBeach: "https://d2xsxph8kpxj0f.cloudfront.net/310519663033361397/H9SSu9MkhmZonqEs9Fn2Bi/hero_thai_beach-kivtW5PAmjoQQK7Yu9bsxU.webp",
  bkkGang: "https://d2xsxph8kpxj0f.cloudfront.net/310519663033361397/H9SSu9MkhmZonqEs9Fn2Bi/bkk_gang_travel-AoQotXAdK5eW5YEFcR9sAM.webp",
  streetFood: "https://d2xsxph8kpxj0f.cloudfront.net/310519663033361397/H9SSu9MkhmZonqEs9Fn2Bi/thai_street_food-Mhjv8dDMMagUmBHUyUpqnK.webp",
};

const features = [
  {
    icon: MapPin,
    title: "Trip-Koordination",
    desc: "Plane Routen, Stopps und Aktivitäten gemeinsam. Alle sehen denselben Stand in Echtzeit.",
    color: "gold",
  },
  {
    icon: Wallet,
    title: "Kosten-Splitting",
    desc: "Ausgaben erfassen, aufteilen und abrechnen. Wer schuldet wem wie viel – immer transparent.",
    color: "teal",
  },
  {
    icon: Package,
    title: "Content Packs",
    desc: "Offline-Reisepakete mit Karten, Tipps, Phrasen und Highlights für jede Destination.",
    color: "gold",
  },
  {
    icon: MessageCircle,
    title: "Gruppen-Chat",
    desc: "Integrierter Chat mit Medien-Sharing, Umfragen und Echtzeit-Übersetzung.",
    color: "teal",
  },
  {
    icon: BookOpen,
    title: "Thai-Wörterbuch",
    desc: "Offline-Wörterbuch mit Aussprache, Phrasen und kulturellen Hinweisen.",
    color: "gold",
  },
  {
    icon: ArrowLeftRight,
    title: "Währungsrechner",
    desc: "CHF/EUR/THB Umrechnung mit Live-Kursen und Offline-Cache.",
    color: "teal",
  },
  {
    icon: Vote,
    title: "Aktivitäten-Voting",
    desc: "Demokratisch entscheiden: Alle stimmen ab, was als nächstes auf dem Programm steht.",
    color: "gold",
  },
  {
    icon: Lock,
    title: "Secure Vault",
    desc: "Reisedokumente AES-256 verschlüsselt speichern. Biometrischer Zugang, DSGVO-konform.",
    color: "teal",
  },
];

const destinations = [
  {
    name: "Bangkok",
    subtitle: "Die Stadt der Engel",
    desc: "Tempel, Nachtmärkte, Rooftop-Bars und die pulsierendste Metropole Südostasiens.",
    image: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800&q=80",
    tags: ["Tempel", "Nachtleben", "Street Food", "Shopping"],
    days: "3–5 Tage",
  },
  {
    name: "Pattaya",
    subtitle: "Beach & Entertainment",
    desc: "Sonnige Strände, Wassersport und das lebhafte Nachtleben der Ostküste.",
    image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80",
    tags: ["Strand", "Wassersport", "Nachtleben", "Tagesausflüge"],
    days: "2–3 Tage",
  },
  {
    name: "Koh Samui",
    subtitle: "Tropisches Inselparadies",
    desc: "Kristallklares Wasser, Luxusresorts und unberührte Natur auf der Kokosnussinsel.",
    image: "https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=800&q=80",
    tags: ["Strand", "Schnorcheln", "Wellness", "Natur"],
    days: "4–6 Tage",
  },
  {
    name: "Phuket",
    subtitle: "Die Perle des Andaman",
    desc: "Traumstrände, Phi Phi Islands und das kosmopolitische Patong Beach Flair.",
    image: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800&q=80",
    tags: ["Strand", "Tauchen", "Inseln", "Nightlife"],
    days: "4–7 Tage",
  },
];

const bkkGangMembers = [
  { name: "Alex", role: "Trip-Planer", icon: Compass, paid: "CHF 1'240" },
  { name: "Sarah", role: "Food-Scout", icon: UtensilsCrossed, paid: "CHF 890" },
  { name: "Marco", role: "Fotograf", icon: Camera, paid: "CHF 1'050" },
  { name: "Lena", role: "Budget-Queen", icon: PiggyBank, paid: "CHF 780" },
  { name: "Tim", role: "Abenteurer", icon: Palmtree, paid: "CHF 1'120" },
];

const pricingPlans = [
  {
    name: "Free",
    price: "0",
    period: "für immer",
    desc: "Perfekt zum Ausprobieren",
    features: [
      "1 aktive Reise",
      "Bis zu 4 Mitglieder",
      "Basis-Kosten-Splitting",
      "Thai-Wörterbuch (offline)",
      "Währungsrechner",
    ],
    cta: "Kostenlos starten",
    highlight: false,
  },
  {
    name: "Plus",
    price: "4.90",
    period: "pro Monat",
    desc: "Für regelmässige Reisende",
    features: [
      "5 aktive Reisen",
      "Bis zu 10 Mitglieder",
      "Vollständiges Kosten-Splitting",
      "Content Packs (1 Land)",
      "Gruppen-Chat",
      "Aktivitäten-Voting",
      "Secure Vault (5 Dokumente)",
    ],
    cta: "Plus wählen",
    highlight: true,
  },
  {
    name: "Premium",
    price: "9.90",
    period: "pro Monat",
    desc: "Für Vielreisende & Gruppen",
    features: [
      "Unbegrenzte Reisen",
      "Unbegrenzte Mitglieder",
      "Alle Content Packs",
      "Echtzeit-Übersetzung",
      "Secure Vault (unbegrenzt)",
      "Prioritäts-Support",
      "Offline-Modus (alles)",
    ],
    cta: "Premium wählen",
    highlight: false,
  },
];

function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${IMAGES.bangkokNight})` }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.11_0.02_255/70%)] via-[oklch(0.11_0.02_255/50%)] to-[oklch(0.11_0.02_255)]" />
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-gold mb-6 text-sm text-[oklch(0.78_0.14_75)]">
              <Palmtree className="w-4 h-4" strokeWidth={1.5} />
              <span>Thailand 2025 · BKK Gang</span>
              <span className="w-2 h-2 rounded-full bg-[oklch(0.72_0.14_185)] animate-pulse" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <span className="text-white">Reisen.</span>{" "}
            <span className="text-gold-gradient">Erleben.</span>
            <br />
            <span className="text-white">Gemeinsam.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-lg md:text-xl text-[oklch(0.80_0.01_80)] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            SabaiSquad ist der ultimative Reisebegleiter für Gruppenreisen nach Thailand.
            Koordiniere, teile Kosten, entdecke Destinationen – alles in einer App.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/dashboard">
              <span className="px-8 py-4 rounded-xl bg-gold-gradient text-[oklch(0.11_0.02_255)] font-semibold text-lg hover:opacity-90 transition-all glow-gold cursor-pointer inline-block">
                App Demo starten →
              </span>
            </Link>
            <Link href="#features">
              <span className="px-8 py-4 rounded-xl glass-card border-gold text-[oklch(0.78_0.14_75)] font-medium text-lg hover:bg-[oklch(0.78_0.14_75/10%)] transition-all cursor-pointer inline-block">
                Features entdecken
              </span>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="flex flex-wrap items-center justify-center gap-8 mt-16"
          >
            {[
              { value: "10+", label: "Features" },
              { value: "4", label: "Destinationen" },
              { value: "AES-256", label: "Verschlüsselung" },
              { value: "Offline", label: "First" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-gold-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {stat.value}
                </div>
                <div className="text-xs text-[oklch(0.55_0.02_255)] mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-6 h-10 rounded-full border-2 border-[oklch(0.78_0.14_75/40%)] flex items-start justify-center p-1"
          >
            <div className="w-1 h-2 rounded-full bg-[oklch(0.78_0.14_75)]" />
          </motion.div>
        </motion.div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="py-24 bg-[oklch(0.11_0.02_255)]">
        <div className="container mx-auto px-4 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-16">
              <span className="text-[oklch(0.78_0.14_75)] text-sm font-medium uppercase tracking-widest">Features</span>
              <h2
                className="text-4xl md:text-5xl font-bold text-white mt-3 mb-4"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Alles für deine{" "}
                <span className="text-gold-gradient">Traumreise</span>
              </h2>
              <p className="text-[oklch(0.60_0.02_255)] max-w-xl mx-auto">
                Von der Planung bis zur Abrechnung – SabaiSquad begleitet euch durch jeden Schritt eurer Gruppenreise.
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, i) => (
              <FadeInSection key={feature.title} delay={i * 0.07}>
                <div
                  className={`glass-card p-6 h-full hover:scale-[1.02] transition-transform duration-300 ${
                    feature.color === "gold" ? "hover:border-[oklch(0.78_0.14_75/40%)]" : "hover:border-[oklch(0.72_0.14_185/40%)]"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                      feature.color === "gold"
                        ? "bg-[oklch(0.78_0.14_75/15%)] text-[oklch(0.78_0.14_75)]"
                        : "bg-[oklch(0.72_0.14_185/15%)] text-[oklch(0.72_0.14_185)]"
                    }`}
                  >
                    <feature.icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-[oklch(0.60_0.02_255)] leading-relaxed">{feature.desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BKK GANG SECTION ===== */}
      <section className="py-24 bg-[oklch(0.13_0.025_255)]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <FadeInSection>
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src={IMAGES.bkkGang}
                  alt="BKK Gang in Bangkok"
                  className="w-full h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.11_0.02_255/80%)] to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="glass-card-gold px-4 py-3 inline-block rounded-xl">
                    <span className="text-[oklch(0.78_0.14_75)] font-semibold flex items-center gap-1.5"><Users className="w-4 h-4 inline" strokeWidth={1.5} /> BKK Gang · Thailand 2025</span>
                  </div>
                </div>
              </div>
            </FadeInSection>

            {/* Content */}
            <FadeInSection delay={0.2}>
              <div>
                <span className="text-[oklch(0.72_0.14_185)] text-sm font-medium uppercase tracking-widest">Gruppenkoordination</span>
                <h2
                  className="text-4xl md:text-5xl font-bold text-white mt-3 mb-6"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Für die{" "}
                  <span className="text-gold-gradient">BKK Gang</span>
                </h2>
                <p className="text-[oklch(0.65_0.02_255)] mb-8 leading-relaxed">
                  SabaiSquad wurde für genau solche Gruppen gebaut: Freunde, die gemeinsam Thailand entdecken wollen. Jeder sieht den aktuellen Stand, alle Ausgaben sind transparent, und Entscheidungen werden demokratisch getroffen.
                </p>

                {/* Members */}
                <div className="space-y-3 mb-8">
                  {bkkGangMembers.map((member, i) => (
                    <motion.div
                      key={member.name}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-between glass-card px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[oklch(0.78_0.14_75/15%)] flex items-center justify-center text-[oklch(0.78_0.14_75)]">
                          <member.icon className="w-5 h-5" strokeWidth={1.5} />
                        </div>
                        <div>
                          <div className="font-medium text-white text-sm">{member.name}</div>
                          <div className="text-xs text-[oklch(0.55_0.02_255)]">{member.role}</div>
                        </div>
                      </div>
                      <div className="text-[oklch(0.78_0.14_75)] font-semibold text-sm">{member.paid}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Total */}
                <div className="glass-card-gold p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-sm text-[oklch(0.78_0.14_75/70%)]">Gesamtausgaben</div>
                    <div className="text-2xl font-bold text-[oklch(0.78_0.14_75)]" style={{ fontFamily: "'Playfair Display', serif" }}>
                      CHF 5'080
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[oklch(0.78_0.14_75/70%)]">Pro Person</div>
                    <div className="text-xl font-bold text-white">CHF 1'016</div>
                  </div>
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* ===== DESTINATIONS SECTION ===== */}
      <section className="py-24 bg-[oklch(0.11_0.02_255)]">
        <div className="container mx-auto px-4 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-16">
              <span className="text-[oklch(0.72_0.14_185)] text-sm font-medium uppercase tracking-widest">Destinationen</span>
              <h2
                className="text-4xl md:text-5xl font-bold text-white mt-3 mb-4"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Thailand{" "}
                <span className="text-gold-gradient">Content Pack</span>
              </h2>
              <p className="text-[oklch(0.60_0.02_255)] max-w-xl mx-auto">
                Offline-Pakete mit Karten, Tipps, Phrasen und Highlights für jede Destination – auch ohne Internet verfügbar.
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map((dest, i) => (
              <FadeInSection key={dest.name} delay={i * 0.1}>
                <div className="group relative rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-300">
                  <img
                    src={dest.image}
                    alt={dest.name}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.08_0.02_255/95%)] via-[oklch(0.08_0.02_255/40%)] to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-[oklch(0.78_0.14_75)]">{dest.days}</div>
                      <button
                        onClick={(e) => { e.stopPropagation(); alert(`Content Pack "${dest.name}" wird offline gespeichert...`); }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[oklch(0.72_0.14_185/20%)] border border-[oklch(0.72_0.14_185/40%)] text-[oklch(0.72_0.14_185)] text-xs hover:bg-[oklch(0.72_0.14_185/30%)] transition-colors"
                        title="Offline verfügbar machen"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Offline
                      </button>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {dest.name}
                    </h3>
                    <p className="text-xs text-[oklch(0.65_0.02_255)] mb-3">{dest.subtitle}</p>
                    <div className="flex flex-wrap gap-1">
                      {dest.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full text-xs bg-[oklch(1_0_0/10%)] text-[oklch(0.85_0.01_80)] border border-white/10"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STREET FOOD / ATMOSPHERE SECTION ===== */}
      <section className="py-24 bg-[oklch(0.13_0.025_255)]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <FadeInSection delay={0.2}>
              <div>
                <span className="text-[oklch(0.78_0.14_75)] text-sm font-medium uppercase tracking-widest">Offline-First</span>
                <h2
                  className="text-4xl md:text-5xl font-bold text-white mt-3 mb-6"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Auch ohne{" "}
                  <span className="text-gold-gradient">Internet</span>
                </h2>
                <p className="text-[oklch(0.65_0.02_255)] mb-8 leading-relaxed">
                  Auf dem Nachtmarkt, am Strand oder im Tempel – SabaiSquad funktioniert überall. Content Packs werden lokal gecacht, Wörterbuch und Währungsrechner laufen offline.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: Smartphone, title: "Offline-Karten", desc: "Alle Destinationen auch ohne Daten verfügbar" },
                    { icon: RefreshCw, title: "Auto-Sync", desc: "Synchronisiert automatisch wenn wieder online" },
                    { icon: Zap, title: "Blitzschnell", desc: "Lokale Daten für sofortigen Zugriff" },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-4 glass-card p-4">
                      <div className="w-10 h-10 rounded-lg bg-[oklch(0.72_0.14_185/15%)] flex items-center justify-center text-[oklch(0.72_0.14_185)] flex-shrink-0">
                        <item.icon className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm">{item.title}</div>
                        <div className="text-xs text-[oklch(0.55_0.02_255)] mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeInSection>

            <FadeInSection>
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src={IMAGES.streetFood}
                  alt="Thai Street Food"
                  className="w-full h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.11_0.02_255/60%)] to-transparent" />
                <div className="absolute top-4 right-4">
                  <div className="glass-card px-3 py-2 rounded-xl flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[oklch(0.65_0.22_150)] animate-pulse" />
                    <span className="text-xs text-white">Offline verfügbar</span>
                  </div>
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* ===== PRICING SECTION ===== */}
      <section className="py-24 bg-[oklch(0.11_0.02_255)]">
        <div className="container mx-auto px-4 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-16">
              <span className="text-[oklch(0.78_0.14_75)] text-sm font-medium uppercase tracking-widest">Preise</span>
              <h2
                className="text-4xl md:text-5xl font-bold text-white mt-3 mb-4"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Einfache,{" "}
                <span className="text-gold-gradient">transparente Preise</span>
              </h2>
              <p className="text-[oklch(0.60_0.02_255)] max-w-xl mx-auto">
                Starte kostenlos und upgrade wenn du mehr brauchst. Keine versteckten Kosten.
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <FadeInSection key={plan.name} delay={i * 0.1}>
                <div
                  className={`relative rounded-2xl p-6 h-full flex flex-col ${
                    plan.highlight
                      ? "glass-card-gold glow-gold border border-[oklch(0.78_0.14_75/40%)]"
                      : "glass-card"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 rounded-full bg-gold-gradient text-[oklch(0.11_0.02_255)] text-xs font-bold">
                        Beliebteste Wahl
                      </span>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-xs text-[oklch(0.55_0.02_255)] mb-4">{plan.desc}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-[oklch(0.65_0.02_255)]">CHF</span>
                      <span
                        className={`text-4xl font-bold ${plan.highlight ? "text-gold-gradient" : "text-white"}`}
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {plan.price}
                      </span>
                    </div>
                    <div className="text-xs text-[oklch(0.50_0.02_255)]">{plan.period}</div>
                  </div>

                  <ul className="space-y-2 flex-1 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-[oklch(0.70_0.02_255)]">
                        <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? "text-[oklch(0.78_0.14_75)]" : "text-[oklch(0.72_0.14_185)]"}`} strokeWidth={2} />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                      plan.highlight
                        ? "bg-gold-gradient text-[oklch(0.11_0.02_255)] hover:opacity-90 glow-gold"
                        : "glass-card border border-white/20 text-white hover:bg-white/10"
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-24 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${IMAGES.thaiBeach})` }}
        />
        <div className="absolute inset-0 bg-[oklch(0.11_0.02_255/85%)]" />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <FadeInSection>
            <h2
              className="text-4xl md:text-6xl font-bold text-white mb-6"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Bereit für{" "}
              <span className="text-gold-gradient">Thailand?</span>
            </h2>
            <p className="text-[oklch(0.75_0.01_80)] text-lg mb-10 max-w-xl mx-auto">
              Starte jetzt mit SabaiSquad und plane eure nächste Gruppenreise wie die Profis.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard">
                <span className="px-10 py-4 rounded-xl bg-gold-gradient text-[oklch(0.11_0.02_255)] font-bold text-lg hover:opacity-90 transition-all glow-gold cursor-pointer inline-block">
                  Jetzt kostenlos starten →
                </span>
              </Link>
            </div>
            <p className="text-xs text-[oklch(0.45_0.02_255)] mt-6">
              Kein Kreditkarte erforderlich · DSGVO-konform · Made in Switzerland 🇨🇭
            </p>
          </FadeInSection>
        </div>
      </section>
    </div>
  );
}
