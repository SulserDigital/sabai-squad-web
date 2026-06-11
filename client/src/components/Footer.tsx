// Thai Night Market – Dark Luxury Design
// Footer: Sulser Digital Branding, Links, Social
import { Link } from "wouter";
import { Palmtree, Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[oklch(0.09_0.02_255)] border-t border-white/10 py-12">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center">
                <Palmtree className="w-4 h-4 text-[oklch(0.11_0.02_255)]" strokeWidth={2} />
              </div>
              <span
                className="text-xl font-bold text-gold-gradient"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                SabaiSquad
              </span>
            </div>
            <p className="text-sm text-[oklch(0.55_0.02_255)] leading-relaxed">
              Der ultimative Reisebegleiter für Gruppenreisen nach Thailand. Koordiniere, teile Kosten und entdecke das Land des Lächelns.
            </p>
            <div className="mt-4 text-xs text-[oklch(0.45_0.02_255)]">
              Ein Produkt von{" "}
              <a
                href="https://sulser.digital"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[oklch(0.78_0.14_75)] hover:underline"
              >
                Sulser Digital
              </a>
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Features</h4>
            <ul className="space-y-2 text-sm text-[oklch(0.55_0.02_255)]">
              <li><Link href="/dashboard"><span className="hover:text-[oklch(0.78_0.14_75)] transition-colors cursor-pointer">Dashboard</span></Link></li>
              <li><Link href="/timeline"><span className="hover:text-[oklch(0.78_0.14_75)] transition-colors cursor-pointer">Reise-Timeline</span></Link></li>
              <li><Link href="/finance"><span className="hover:text-[oklch(0.78_0.14_75)] transition-colors cursor-pointer">Kosten-Splitting</span></Link></li>
              <li><Link href="/activities"><span className="hover:text-[oklch(0.78_0.14_75)] transition-colors cursor-pointer">Aktivitäten-Voting</span></Link></li>
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Tools</h4>
            <ul className="space-y-2 text-sm text-[oklch(0.55_0.02_255)]">
              <li><Link href="/chat"><span className="hover:text-[oklch(0.78_0.14_75)] transition-colors cursor-pointer">Gruppen-Chat</span></Link></li>
              <li><Link href="/dictionary"><span className="hover:text-[oklch(0.78_0.14_75)] transition-colors cursor-pointer">Thai-Wörterbuch</span></Link></li>
              <li><Link href="/currency"><span className="hover:text-[oklch(0.78_0.14_75)] transition-colors cursor-pointer">Währungsrechner</span></Link></li>
              <li><Link href="/vault"><span className="hover:text-[oklch(0.78_0.14_75)] transition-colors cursor-pointer">Secure Vault</span></Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Rechtliches</h4>
            <ul className="space-y-2 text-sm text-[oklch(0.55_0.02_255)]">
              <li><Link href="/legal"><span className="hover:text-[oklch(0.78_0.14_75)] transition-colors cursor-pointer">Datenschutz</span></Link></li>
              <li><Link href="/legal"><span className="hover:text-[oklch(0.78_0.14_75)] transition-colors cursor-pointer">Impressum</span></Link></li>
              <li><Link href="/legal"><span className="hover:text-[oklch(0.78_0.14_75)] transition-colors cursor-pointer">AGB</span></Link></li>
              <li>
                <a
                  href="https://github.com/SulserDigital/SabaiSquad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[oklch(0.78_0.14_75)] transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[oklch(0.45_0.02_255)]">
            &copy; 2025 Sulser Digital &middot; SabaiSquad &middot; Alle Rechte vorbehalten
          </p>
          <div className="flex items-center gap-4 text-xs text-[oklch(0.45_0.02_255)]">
            <span className="flex items-center gap-1">
              <span className="font-medium">CH</span> Made in Switzerland
            </span>
            <span>&middot;</span>
            <span className="flex items-center gap-1">
              <span className="font-medium">TH</span> For Thailand
            </span>
            <span>&middot;</span>
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" strokeWidth={1.5} />
              DSGVO / nDSG konform
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
