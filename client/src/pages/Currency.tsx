// Currency Converter – Live Exchange Rates via tRPC
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { UtensilsCrossed, Train, Sparkles, Beer, Car, Droplets, Landmark, Lightbulb, ArrowUpDown } from "lucide-react";

const CURRENCIES = [
  { code: "CHF", name: "Schweizer Franken", flag: "CH", symbol: "Fr." },
  { code: "EUR", name: "Euro", flag: "EU", symbol: "€" },
  { code: "USD", name: "US Dollar", flag: "US", symbol: "$" },
  { code: "THB", name: "Thai Baht", flag: "TH", symbol: "฿" },
  { code: "GBP", name: "Britisches Pfund", flag: "GB", symbol: "£" },
  { code: "JPY", name: "Japanischer Yen", flag: "JP", symbol: "¥" },
  { code: "AUD", name: "Australischer Dollar", flag: "AU", symbol: "A$" },
  { code: "SGD", name: "Singapur Dollar", flag: "SG", symbol: "S$" },
];

const PRICE_ICONS: Record<string, typeof UtensilsCrossed> = {
  food: UtensilsCrossed, train: Train, spa: Sparkles, beer: Beer,
  car: Car, water: Droplets, taxi: Car, temple: Landmark,
};
const priceExamples = [
  { item: "Pad Thai (Street Food)", thb: 60, iconKey: "food" },
  { item: "BTS Skytrain Ticket", thb: 44, iconKey: "train" },
  { item: "Thai Massage (1h)", thb: 300, iconKey: "spa" },
  { item: "Singha Bier (Bar)", thb: 120, iconKey: "beer" },
  { item: "Tuk-Tuk Kurzstrecke", thb: 100, iconKey: "car" },
  { item: "7-Eleven Wasser", thb: 7, iconKey: "water" },
  { item: "Taxi Flughafen → City", thb: 400, iconKey: "taxi" },
  { item: "Tempel-Eintritt", thb: 200, iconKey: "temple" },
];

export default function Currency() {
  const [amount, setAmount] = useState("100");
  const [fromCurrency, setFromCurrency] = useState("CHF");
  const [toCurrency, setToCurrency] = useState("THB");

  const numAmount = useMemo(() => parseFloat(amount) || 0, [amount]);

  // Fetch live rates from backend (caches for 5 min)
  const { data: ratesData, isLoading } = trpc.currency.rates.useQuery(
    { base: fromCurrency },
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const rate = ratesData?.rates?.[toCurrency] ?? null;
  const converted = rate ? numAmount * rate : 0;
  const chfToThbRate = ratesData?.rates?.["THB"] ?? (fromCurrency === "CHF" ? rate : null);

  const swap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  // Quick conversion table
  const quickPairs = useMemo(() => {
    if (!ratesData?.rates) return [];
    return CURRENCIES
      .filter(c => c.code !== fromCurrency)
      .slice(0, 6)
      .map(c => ({
        ...c,
        rate: ratesData.rates[c.code] ?? 0,
        converted: numAmount * (ratesData.rates[c.code] ?? 0),
      }));
  }, [ratesData, fromCurrency, numAmount]);

  return (
    <div className="min-h-screen bg-[oklch(0.11_0.02_255)] overflow-x-hidden">
      <div className="container mx-auto px-4 lg:px-8 pt-20 pb-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[oklch(0.72_0.14_185)] text-sm font-medium uppercase tracking-widest">Live-Kurse</span>
            {isLoading ? (
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-green-400" />
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mt-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Währungs-<span className="text-gold-gradient">Rechner</span>
          </h1>
          <p className="text-[oklch(0.55_0.02_255)] mt-1">
            {ratesData?.lastUpdate
              ? `Aktualisiert: ${new Date(ratesData.lastUpdate).toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" })}`
              : "Lade Kurse..."}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Converter */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 rounded-2xl">
            <h3 className="font-semibold text-white mb-6">Umrechnung</h3>

            {/* From */}
            <div className="mb-4">
              <label className="text-xs text-[oklch(0.50_0.02_255)] mb-1.5 block">Von</label>
              <div className="flex gap-3">
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="bg-[oklch(1_0_0/8%)] border border-white/10 rounded-xl px-3 py-3 text-white text-sm outline-none"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 bg-[oklch(1_0_0/8%)] border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-semibold outline-none focus:border-[oklch(0.78_0.14_75/50%)] transition-colors"
                />
              </div>
            </div>

            {/* Swap */}
            <div className="flex justify-center my-3">
              <button
                onClick={swap}
                className="w-10 h-10 rounded-full glass-card-gold border border-[oklch(0.78_0.14_75/40%)] flex items-center justify-center text-[oklch(0.78_0.14_75)] hover:scale-110 transition-transform"
              >
                <ArrowUpDown className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            {/* To */}
            <div className="mb-6">
              <label className="text-xs text-[oklch(0.50_0.02_255)] mb-1.5 block">Nach</label>
              <div className="flex gap-3">
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="bg-[oklch(1_0_0/8%)] border border-white/10 rounded-xl px-3 py-3 text-white text-sm outline-none"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
                <div className="flex-1 bg-[oklch(0.78_0.14_75/10%)] border border-[oklch(0.78_0.14_75/30%)] rounded-xl px-4 py-3">
                  <div className="text-2xl font-bold text-[oklch(0.78_0.14_75)]" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {isLoading ? (
                      <span className="animate-pulse text-[oklch(0.55_0.02_255)]">...</span>
                    ) : (
                      converted.toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Rate info */}
            <div className="text-center text-sm text-[oklch(0.55_0.02_255)] bg-[oklch(1_0_0/5%)] rounded-xl p-3">
              {rate ? `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}` : "Lade..."}
            </div>
          </motion.div>

          {/* Quick Reference & Price Examples */}
          <div className="space-y-6">
            {/* Quick Multi-Currency Table */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6 rounded-2xl">
              <h3 className="font-semibold text-white mb-4">
                {numAmount > 0 ? numAmount.toLocaleString("de-CH") : "100"} {fromCurrency} in...
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[oklch(1_0_0/5%)] animate-pulse h-12" />
                  ))
                ) : (
                  quickPairs.map((pair) => (
                    <div
                      key={pair.code}
                      className="flex items-center justify-between p-3 rounded-xl bg-[oklch(1_0_0/5%)] hover:bg-[oklch(1_0_0/10%)] cursor-pointer transition-colors"
                      onClick={() => setToCurrency(pair.code)}
                    >
                      <span className="text-sm text-white font-medium">{pair.flag} {pair.code}</span>
                      <span className="text-sm text-[oklch(0.78_0.14_75)] font-semibold">
                        {pair.converted.toLocaleString("de-CH", { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Price Examples */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 rounded-2xl">
              <h3 className="font-semibold text-white mb-4">Typische Preise in Thailand</h3>
              <div className="space-y-2">
                {priceExamples.map((p) => {
                  // Convert THB to user's fromCurrency using inverse rate
                  const thbRate = ratesData?.rates?.["THB"];
                  const inUserCurrency = thbRate ? p.thb / thbRate : null;
                  return (
                    <div key={p.item} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[oklch(1_0_0/5%)] transition-colors">
                      <div className="flex items-center gap-2">
                        {(() => { const I = PRICE_ICONS[p.iconKey] ?? UtensilsCrossed; return <I className="w-4 h-4 text-[oklch(0.65_0.02_255)]" strokeWidth={1.5} />; })()}
                        <span className="text-sm text-[oklch(0.75_0.01_80)]">{p.item}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-[oklch(0.78_0.14_75)]">{p.thb} ฿</div>
                        <div className="text-xs text-[oklch(0.45_0.02_255)]">
                          {inUserCurrency !== null
                            ? `≈ ${inUserCurrency.toFixed(2)} ${fromCurrency}`
                            : `≈ ${(p.thb * 0.026).toFixed(2)} CHF`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Travel Tip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 glass-card-gold p-4 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-[oklch(0.78_0.14_75)] flex-shrink-0" strokeWidth={1.5} />
            <div>
              <div className="text-sm font-semibold text-[oklch(0.78_0.14_75)]">Reisetipp</div>
              <div className="text-xs text-[oklch(0.78_0.14_75/70%)] mt-1">
                In Thailand bekommst du den besten Wechselkurs bei SuperRich-Wechselstuben (grün oder orange).
                Vermeide Flughafen-Wechselstuben – dort sind die Kurse deutlich schlechter.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
