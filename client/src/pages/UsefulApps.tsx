// Nützliche Apps für Thailand – Download-Links und Anleitungen
import { motion } from "framer-motion";
import { ExternalLink, Smartphone, ShieldCheck, AlertTriangle, Download } from "lucide-react";

const APPS = [
  {
    name: "7-Eleven TH",
    description: "Bestellen, Punkte sammeln, Promotions. Die offizielle App des thailändischen 7-Eleven.",
    android: {
      label: "APK via APKPure",
      url: "https://apkpure.com/7-eleven-th/com.cp.cecilmobile",
    },
    ios: {
      label: "App Store (Region TH)",
      url: "https://apps.apple.com/th/app/7-eleven-th/id1107781301",
    },
    color: "#4CAF50",
    emoji: "🏪",
  },
  {
    name: "Grab",
    description: "Taxi, Food Delivery, Mart (Alternative zu 7-Eleven Lieferung). Das Super-App für Südostasien.",
    android: {
      label: "Google Play",
      url: "https://play.google.com/store/apps/details?id=com.grabtaxi.passenger",
    },
    ios: {
      label: "App Store",
      url: "https://apps.apple.com/app/grab-taxi-food-delivery/id647268330",
    },
    color: "#00B14F",
    emoji: "🚗",
  },
  {
    name: "Bolt",
    description: "Günstige Taxi-Alternative zu Grab. Oft bessere Preise in Bangkok und Pattaya.",
    android: {
      label: "Google Play",
      url: "https://play.google.com/store/apps/details?id=ee.mtakso.client",
    },
    ios: {
      label: "App Store",
      url: "https://apps.apple.com/app/bolt-request-a-ride/id675033630",
    },
    color: "#34D186",
    emoji: "⚡",
  },
  {
    name: "LINE MAN",
    description: "Food Delivery #1 in Thailand. Mehr Restaurants als Grab Food, oft günstiger.",
    android: {
      label: "Google Play",
      url: "https://play.google.com/store/apps/details?id=com.lineman.th",
    },
    ios: {
      label: "App Store",
      url: "https://apps.apple.com/th/app/line-man/id1304703299",
    },
    color: "#00C300",
    emoji: "🍜",
  },
  {
    name: "LINE",
    description: "DER Messenger in Thailand. Jeder Thai nutzt LINE statt WhatsApp. Auch für Business-Kontakte.",
    android: {
      label: "Google Play",
      url: "https://play.google.com/store/apps/details?id=jp.naver.line.android",
    },
    ios: {
      label: "App Store",
      url: "https://apps.apple.com/app/line/id443904275",
    },
    color: "#06C755",
    emoji: "💬",
  },
  {
    name: "Grab Mart",
    description: "Lebensmittel und Convenience-Artikel direkt geliefert. Auch 7-Eleven Produkte verfügbar.",
    android: {
      label: "Web-App",
      url: "https://food.grab.com/th/en/",
    },
    ios: {
      label: "Web-App",
      url: "https://food.grab.com/th/en/",
    },
    color: "#00B14F",
    emoji: "🛒",
  },
];

export default function UsefulApps() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Header */}
      <div className="sticky top-16 z-20 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3">
        <h1 className="text-xl font-bold">Nützliche Apps</h1>
        <p className="text-sm text-muted-foreground">Download-Links und Anleitungen für Thailand</p>
      </div>

      <div className="px-4 py-4 space-y-6 max-w-lg mx-auto">
        {/* Android APK Hinweis */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-200 text-sm">Android APK Installation</h3>
              <ol className="text-xs text-amber-200/80 mt-2 space-y-1 list-decimal list-inside">
                <li>APK von APKPure herunterladen</li>
                <li>Einstellungen → Google Play Protect → <strong>deaktivieren</strong></li>
                <li>APK installieren (Unbekannte Quellen erlauben)</li>
                <li>Play Protect wieder <strong>aktivieren</strong></li>
              </ol>
            </div>
          </div>
        </motion.div>

        {/* iOS Region-Wechsel Hinweis */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4"
        >
          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-200 text-sm">iOS App Store Region wechseln</h3>
              <ol className="text-xs text-blue-200/80 mt-2 space-y-1 list-decimal list-inside">
                <li>App Store → Profil → Land/Region → <strong>Thailand</strong></li>
                <li>Zahlungsmethode: "Keine" wählen</li>
                <li>App herunterladen</li>
                <li>Region zurück auf <strong>Schweiz</strong> wechseln</li>
              </ol>
            </div>
          </div>
        </motion.div>

        {/* App Cards */}
        <div className="space-y-3">
          {APPS.map((app, i) => (
            <motion.div
              key={app.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="rounded-xl border border-border/50 bg-card p-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: `${app.color}20` }}
                >
                  {app.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{app.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{app.description}</p>
                  <div className="flex gap-2 mt-3">
                    <a
                      href={app.android.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 text-xs font-medium hover:bg-green-500/25 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {app.android.label}
                    </a>
                    <a
                      href={app.ios.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 text-xs font-medium hover:bg-blue-500/25 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {app.ios.label}
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Security Note */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border border-border/30 bg-card/50 p-4"
        >
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-sm">Sicherheitshinweis</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Lade Apps nur von offiziellen Quellen (Play Store, App Store, APKPure). 
                Aktiviere Play Protect nach der Installation wieder. Gib niemals dein Passwort in Drittanbieter-Apps ein.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
