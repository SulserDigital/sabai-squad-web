// Thai Night Market – Dark Luxury Design
// Destinations: Thailand Content Pack mit Bangkok, Pattaya, Koh Samui, Phuket
import { motion } from "framer-motion";
import { useState } from "react";
import { Package, Star, Lightbulb } from "lucide-react";

const IMAGES = {
  bangkokNight: "https://d2xsxph8kpxj0f.cloudfront.net/310519663033361397/H9SSu9MkhmZonqEs9Fn2Bi/hero_bangkok_night-cm8qRFmnVc8KEEstajuwnz.webp",
  thaiBeach: "https://d2xsxph8kpxj0f.cloudfront.net/310519663033361397/H9SSu9MkhmZonqEs9Fn2Bi/hero_thai_beach-kivtW5PAmjoQQK7Yu9bsxU.webp",
  streetFood: "https://d2xsxph8kpxj0f.cloudfront.net/310519663033361397/H9SSu9MkhmZonqEs9Fn2Bi/thai_street_food-Mhjv8dDMMagUmBHUyUpqnK.webp",
};

const destinations = [
  {
    id: "bangkok",
    name: "Bangkok",
    thai: "กรุงเทพมหานคร",
    subtitle: "Die Stadt der Engel",
    image: IMAGES.bangkokNight,
    days: "16.–20. Juli",
    duration: "4 Nächte",
    highlights: [
      { name: "Grand Palace & Wat Phra Kaew", type: "Tempel", rating: 4.8 },
      { name: "Chatuchak Weekend Market", type: "Shopping", rating: 4.6 },
      { name: "Khao San Road", type: "Nachtleben", rating: 4.2 },
      { name: "Sky Bar (Lebua)", type: "Rooftop", rating: 4.7 },
      { name: "Chinatown (Yaowarat)", type: "Street Food", rating: 4.9 },
    ],
    tips: ["BTS Skytrain ist das schnellste Transportmittel", "Tempel nur mit bedeckten Knien besuchen", "Grab-App für günstige Taxis nutzen"],
    budget: "CHF 120–180/Tag",
  },
  {
    id: "pattaya",
    name: "Pattaya",
    thai: "พัทยา",
    subtitle: "Beach & Entertainment",
    image: IMAGES.thaiBeach,
    days: "20.–22. Juli",
    duration: "2 Nächte",
    highlights: [
      { name: "Jomtien Beach", type: "Strand", rating: 4.3 },
      { name: "Sanctuary of Truth", type: "Tempel", rating: 4.5 },
      { name: "Coral Island (Koh Larn)", type: "Insel", rating: 4.6 },
      { name: "Walking Street", type: "Nachtleben", rating: 4.0 },
    ],
    tips: ["Songthaew (Sammeltaxi) für 10 THB durch die Stadt", "Koh Larn Fähre ab Bali Hai Pier", "Wochenende meiden – sehr voll"],
    budget: "CHF 80–130/Tag",
  },
  {
    id: "kohsamui",
    name: "Koh Samui",
    thai: "เกาะสมุย",
    subtitle: "Tropisches Inselparadies",
    image: IMAGES.thaiBeach,
    days: "22.–28. Juli",
    duration: "6 Nächte",
    highlights: [
      { name: "Chaweng Beach", type: "Strand", rating: 4.5 },
      { name: "Ang Thong Marine Park", type: "Natur", rating: 4.9 },
      { name: "Big Buddha Temple", type: "Tempel", rating: 4.4 },
      { name: "Fisherman's Village", type: "Markt", rating: 4.6 },
      { name: "Na Muang Waterfall", type: "Natur", rating: 4.2 },
    ],
    tips: ["Roller mieten für Flexibilität", "Ang Thong Tour früh buchen", "Regenzeit beachten (Nov–Dez)"],
    budget: "CHF 100–160/Tag",
  },
  {
    id: "phuket",
    name: "Phuket",
    thai: "ภูเก็ต",
    subtitle: "Die Perle des Andaman",
    image: IMAGES.streetFood,
    days: "28. Jul – 2. Aug",
    duration: "5 Nächte",
    highlights: [
      { name: "Phi Phi Islands", type: "Insel", rating: 4.8 },
      { name: "Patong Beach", type: "Strand", rating: 4.1 },
      { name: "Old Phuket Town", type: "Kultur", rating: 4.5 },
      { name: "Big Buddha Phuket", type: "Tempel", rating: 4.6 },
      { name: "Phang Nga Bay", type: "Natur", rating: 4.9 },
    ],
    tips: ["Phi Phi Tagestour mit Speedboot", "Patong ist touristisch – Kata/Karon ruhiger", "Sonnenuntergang am Promthep Cape"],
    budget: "CHF 110–170/Tag",
  },
];

export default function Destinations() {
  const [selected, setSelected] = useState<string | null>(null);
  const activeDestination = destinations.find((d) => d.id === selected);

  return (
    <div className="min-h-screen bg-[oklch(0.11_0.02_255)]">
      <div className="container mx-auto px-4 lg:px-8 pt-20 pb-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <span className="text-[oklch(0.72_0.14_185)] text-sm font-medium uppercase tracking-widest">Content Pack · Thailand</span>
          <h1 className="text-3xl md:text-4xl font-bold text-white mt-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Unsere <span className="text-gold-gradient">Destinationen</span>
          </h1>
          <p className="text-[oklch(0.55_0.02_255)] mt-1">4 Destinationen · 18 Tage · Offline verfügbar</p>
        </motion.div>

        {/* Route Overview */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card p-4 rounded-2xl mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {destinations.map((dest, i) => (
              <div key={dest.id} className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setSelected(selected === dest.id ? null : dest.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selected === dest.id
                      ? "bg-[oklch(0.78_0.14_75/20%)] text-[oklch(0.78_0.14_75)] border border-[oklch(0.78_0.14_75/40%)]"
                      : "bg-[oklch(1_0_0/5%)] text-[oklch(0.65_0.02_255)] hover:text-white"
                  }`}
                >
                  {dest.name}
                </button>
                {i < destinations.length - 1 && <span className="text-[oklch(0.40_0.02_255)]">→</span>}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Destination Detail */}
        {activeDestination ? (
          <motion.div key={activeDestination.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Hero */}
            <div className="relative rounded-2xl overflow-hidden h-64">
              <img src={activeDestination.image} alt={activeDestination.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.08_0.02_255/95%)] via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6">
                <div className="text-xs text-[oklch(0.78_0.14_75)] mb-1">{activeDestination.days} · {activeDestination.duration}</div>
                <h2 className="text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{activeDestination.name}</h2>
                <p className="text-sm text-[oklch(0.65_0.02_255)]">{activeDestination.thai} · {activeDestination.subtitle}</p>
              </div>
              <div className="absolute top-4 right-4 glass-card px-3 py-1.5 rounded-xl">
                <span className="text-xs text-[oklch(0.72_0.14_185)] flex items-center gap-1"><Package className="w-3 h-3" strokeWidth={1.5} /> Offline Pack</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Highlights */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="font-semibold text-white mb-4">Top Highlights</h3>
                <div className="space-y-2">
                  {activeDestination.highlights.map((h) => (
                    <div key={h.name} className="flex items-center justify-between p-3 rounded-xl bg-[oklch(1_0_0/5%)]">
                      <div>
                        <div className="text-sm font-medium text-white">{h.name}</div>
                        <div className="text-xs text-[oklch(0.50_0.02_255)]">{h.type}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-[oklch(0.78_0.14_75)]" strokeWidth={1.5} />
                        <span className="text-sm text-[oklch(0.78_0.14_75)] font-medium">{h.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips & Budget */}
              <div className="space-y-6">
                <div className="glass-card p-6 rounded-2xl">
                  <h3 className="font-semibold text-white mb-4">Insider-Tipps</h3>
                  <div className="space-y-2">
                    {activeDestination.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-[oklch(0.65_0.02_255)]">
                        <Lightbulb className="w-4 h-4 text-[oklch(0.78_0.14_75)] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glass-card-gold p-6 rounded-2xl">
                  <h3 className="font-semibold text-[oklch(0.78_0.14_75)] mb-2">Tagesbudget</h3>
                  <div className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {activeDestination.budget}
                  </div>
                  <div className="text-xs text-[oklch(0.55_0.02_255)] mt-1">inkl. Unterkunft, Essen, Transport, Aktivitäten</div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {destinations.map((dest, i) => (
              <motion.div
                key={dest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelected(dest.id)}
                className="group relative rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-300"
              >
                <img src={dest.image} alt={dest.name} className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.08_0.02_255/95%)] via-[oklch(0.08_0.02_255/30%)] to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-xs text-[oklch(0.78_0.14_75)]">{dest.days} · {dest.duration}</div>
                      <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{dest.name}</h3>
                      <p className="text-xs text-[oklch(0.65_0.02_255)]">{dest.subtitle}</p>
                    </div>
                    <div className="glass-card px-3 py-1.5 rounded-xl">
                      <span className="text-xs text-[oklch(0.72_0.14_185)]">{dest.highlights.length} Spots</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
