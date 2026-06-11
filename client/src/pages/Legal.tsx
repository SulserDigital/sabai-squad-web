import { useState } from "react";
import { Shield, Building2, FileText, ChevronRight } from "lucide-react";
import { Link } from "wouter";

type Tab = "datenschutz" | "impressum" | "agb";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "datenschutz", label: "Datenschutz", icon: <Shield className="w-4 h-4" /> },
  { id: "impressum", label: "Impressum", icon: <Building2 className="w-4 h-4" /> },
  { id: "agb", label: "Nutzungsbedingungen", icon: <FileText className="w-4 h-4" /> },
];

export default function Legal() {
  const [activeTab, setActiveTab] = useState<Tab>("datenschutz");

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
          <Link href="/"><span className="hover:text-foreground cursor-pointer transition-colors">Start</span></Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">Rechtliches</span>
        </nav>

        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Rechtliches
        </h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Letzte Aktualisierung: Juni 2025 &middot; SabaiSquad ist ein Produkt von Sulser Digital
        </p>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 bg-muted/30 p-1 rounded-xl border border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-[oklch(0.78_0.14_75)] text-[oklch(0.11_0.02_255)] shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-sm max-w-none">
          {activeTab === "datenschutz" && <Datenschutz />}
          {activeTab === "impressum" && <Impressum />}
          {activeTab === "agb" && <AGB />}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-white/10">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3 text-sm">{children}</div>
    </section>
  );
}

function Datenschutz() {
  return (
    <div>
      <div className="bg-[oklch(0.78_0.14_75)]/10 border border-[oklch(0.78_0.14_75)]/20 rounded-xl p-4 mb-8 text-sm text-[oklch(0.78_0.14_75)]">
        <strong>Kurzfassung:</strong> SabaiSquad speichert nur die Daten, die für den Betrieb der App notwendig sind. Es werden keine Daten an Dritte verkauft. Analytics sind cookiefrei (Plausible). Fehler-Tracking ist optional (Sentry).
      </div>

      <Section title="1. Verantwortliche Stelle">
        <p>
          Verantwortlich für die Datenverarbeitung im Sinne des Schweizer Datenschutzgesetzes (nDSG) ist:
        </p>
        <p className="bg-muted/30 rounded-lg p-3 font-mono text-xs">
          Sulser Digital<br />
          Sandro Sulser<br />
          Einzelunternehmen, Schweiz<br />
          Industriestrasse 40, 8112 Otelfingen<br />
          Kanton Zürich, Schweiz<br />
          admin@sulserdigital.ch
        </p>
      </Section>

      <Section title="2. Welche Daten werden gespeichert?">
        <p>SabaiSquad verarbeitet folgende Datenkategorien:</p>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 pr-4 text-foreground font-medium">Datentyp</th>
              <th className="text-left py-2 pr-4 text-foreground font-medium">Zweck</th>
              <th className="text-left py-2 text-foreground font-medium">Speicherdauer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr>
              <td className="py-2 pr-4">Manus-Account (Name, ID)</td>
              <td className="py-2 pr-4">Authentifizierung via Manus OAuth</td>
              <td className="py-2">Bis Kontolöschung</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">Reisedaten (Ziele, Termine)</td>
              <td className="py-2 pr-4">Reiseplanung und -koordination</td>
              <td className="py-2">Bis Löschung durch User</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">Finanzdaten (Ausgaben, Splits)</td>
              <td className="py-2 pr-4">Kostenaufteilung in der Gruppe</td>
              <td className="py-2">Bis Löschung durch User</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">Chat-Nachrichten, Medien</td>
              <td className="py-2 pr-4">Gruppenkommunikation</td>
              <td className="py-2">Bis Löschung durch User</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">Vault-Dokumente</td>
              <td className="py-2 pr-4">Sichere Dokumentenablage</td>
              <td className="py-2">Bis Löschung durch User</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section title="3. Rechtsgrundlage">
        <p>
          Die Datenverarbeitung erfolgt auf Basis der Vertragserfüllung (Art. 31 Abs. 2 lit. a nDSG) sowie des berechtigten Interesses (Art. 31 Abs. 1 nDSG) am sicheren Betrieb der Anwendung.
        </p>
      </Section>

      <Section title="4. Datenweitergabe an Dritte">
        <p>
          Es werden <strong className="text-foreground">keine personenbezogenen Daten an Dritte verkauft oder zu Werbezwecken weitergegeben</strong>. Folgende technische Dienstleister werden eingesetzt:
        </p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li><strong className="text-foreground">Manus Platform</strong> – Hosting, Datenbank, Authentifizierung (Schweiz/EU-Rechenzentren)</li>
          <li><strong className="text-foreground">Plausible Analytics</strong> – Cookiefreie, anonyme Nutzungsstatistiken (kein Tracking, kein Fingerprinting, DSGVO/nDSG-konform). Betrieben von Plausible Insights OÜ, Estland.</li>
          <li><strong className="text-foreground">Sentry</strong> – Fehler-Tracking zur Qualitätssicherung. Es werden keine Nutzerinhalte übermittelt, nur technische Fehlerdetails. Betrieben von Functional Software Inc., USA (SCCs vorhanden).</li>
        </ul>
      </Section>

      <Section title="5. Cookies und Tracking">
        <p>
          SabaiSquad verwendet <strong className="text-foreground">keine Tracking-Cookies</strong>. Die Authentifizierung erfolgt über ein sicheres Session-Cookie (HttpOnly, SameSite=Strict), das ausschliesslich für den Login notwendig ist. Plausible Analytics arbeitet vollständig ohne Cookies.
        </p>
      </Section>

      <Section title="6. Ihre Rechte (nDSG)">
        <p>Sie haben folgende Rechte gemäss Schweizer Datenschutzgesetz:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Auskunft über gespeicherte Daten (Art. 25 nDSG)</li>
          <li>Berichtigung unrichtiger Daten (Art. 32 nDSG)</li>
          <li>Löschung Ihrer Daten (Art. 32 nDSG)</li>
          <li>Datenübertragbarkeit (Art. 28 nDSG)</li>
          <li>Widerspruch gegen die Verarbeitung</li>
        </ul>
        <p>
          Für Anfragen wenden Sie sich an:{" "}
          <a href="mailto:admin@sulserdigital.ch" className="text-[oklch(0.78_0.14_75)] hover:underline">
            admin@sulserdigital.ch
          </a>
        </p>
      </Section>

      <Section title="7. Datensicherheit">
        <p>
          Alle Daten werden verschlüsselt übertragen (HTTPS/TLS). Passwörter werden nicht gespeichert (OAuth-Authentifizierung). Datenbankzugriffe sind auf autorisierte Systeme beschränkt.
        </p>
      </Section>

      <Section title="8. Änderungen dieser Datenschutzerklärung">
        <p>
          Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen. Die aktuelle Version ist stets unter /legal abrufbar. Bei wesentlichen Änderungen werden registrierte Nutzer informiert.
        </p>
      </Section>
    </div>
  );
}

function Impressum() {
  return (
    <div>
      <Section title="Angaben gemäss Art. 3 lit. s UWG / OR">
        <div className="bg-muted/30 rounded-xl p-5 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Unternehmen</p>
            <p className="text-foreground font-medium">Sulser Digital</p>
            <p className="text-xs text-muted-foreground">Einzelunternehmen</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Inhaber</p>
            <p className="text-foreground">Sandro Sulser</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Adresse</p>
            <p className="text-foreground">Industriestrasse 40</p>
            <p className="text-foreground">8112 Otelfingen, Kanton Zürich</p>
            <p className="text-foreground">Schweiz</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Kontakt</p>
            <a href="mailto:admin@sulserdigital.ch" className="text-[oklch(0.78_0.14_75)] hover:underline block">
              admin@sulserdigital.ch
            </a>
            <p className="text-foreground">+41 79 796 02 97</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Website</p>
            <a href="https://sulser.digital" target="_blank" rel="noopener noreferrer" className="text-[oklch(0.78_0.14_75)] hover:underline">
              sulser.digital
            </a>
          </div>
        </div>
      </Section>

      <Section title="Produkt">
        <p>
          <strong className="text-foreground">SabaiSquad</strong> ist eine Web-Applikation für die Koordination von Gruppenreisen nach Thailand. Die App befindet sich in der Beta-Phase und wird laufend weiterentwickelt.
        </p>
      </Section>

      <Section title="Haftungsausschluss">
        <p>
          Sulser Digital übernimmt keine Gewähr für die Richtigkeit, Vollständigkeit und Aktualität der bereitgestellten Informationen. Externe Links werden zum Zeitpunkt der Verlinkung geprüft; für spätere Änderungen auf verlinkten Seiten wird keine Verantwortung übernommen.
        </p>
      </Section>

      <Section title="Urheberrecht">
        <p>
          Alle Inhalte dieser Applikation (Texte, Grafiken, Code) sind urheberrechtlich geschützt. Eine Verwendung ohne ausdrückliche schriftliche Genehmigung von Sulser Digital ist nicht gestattet.
        </p>
      </Section>

      <Section title="Streitbeilegung">
        <p>
          Sulser Digital ist nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen. Bei Streitigkeiten gilt Schweizer Recht; Gerichtsstand ist der Sitz von Sulser Digital.
        </p>
      </Section>
    </div>
  );
}

function AGB() {
  return (
    <div>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8 text-sm text-amber-400">
        <strong>Beta-Hinweis:</strong> SabaiSquad befindet sich in der Beta-Phase. Die Nutzung erfolgt auf eigene Verantwortung. Es wird keine Garantie für Verfügbarkeit oder Fehlerfreiheit übernommen.
      </div>

      <Section title="1. Geltungsbereich">
        <p>
          Diese Nutzungsbedingungen gelten für die Nutzung der Web-Applikation SabaiSquad, betrieben von Sulser Digital, Sandro Sulser, Einzelunternehmen, Schweiz. Mit der Nutzung der App akzeptieren Sie diese Bedingungen.
        </p>
      </Section>

      <Section title="2. Leistungsbeschreibung">
        <p>
          SabaiSquad stellt digitale Werkzeuge für die Planung und Koordination von Gruppenreisen bereit. Dies umfasst insbesondere: Reiseplanung, Kostensplitting, Gruppen-Chat, Dokumentenverwaltung, Wörterbuch und Kartenintegration.
        </p>
        <p>
          Die App wird als Prototyp für eine geschlossene Nutzergruppe betrieben. Sulser Digital behält sich vor, Funktionen jederzeit zu ändern, einzuschränken oder einzustellen.
        </p>
      </Section>

      <Section title="3. Nutzungsbedingungen">
        <p>Die Nutzung der App ist nur für volljährige Personen gestattet. Folgende Nutzungen sind untersagt:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Rechtswidrige Inhalte hochladen oder teilen</li>
          <li>Die App für kommerzielle Zwecke ohne Genehmigung nutzen</li>
          <li>Sicherheitsmassnahmen umgehen oder die Infrastruktur belasten</li>
          <li>Andere Nutzer belästigen oder schädigen</li>
        </ul>
      </Section>

      <Section title="4. Haftungsausschluss">
        <p>
          Sulser Digital übernimmt <strong className="text-foreground">keine Haftung</strong> für:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Datenverlust durch technische Fehler oder höhere Gewalt</li>
          <li>Fehler in Übersetzungen, Währungskursen oder Reiseinformationen</li>
          <li>Schäden, die durch die Nutzung oder Nichtnutzung der App entstehen</li>
          <li>Ausfälle oder Unterbrechungen des Dienstes</li>
        </ul>
        <p>
          Die Haftung ist auf Fälle von grobem Verschulden oder Vorsatz beschränkt, soweit gesetzlich zulässig.
        </p>
      </Section>

      <Section title="5. Datenspeicherung und Verantwortung">
        <p>
          Nutzer sind selbst verantwortlich für die Inhalte, die sie in der App speichern. Sulser Digital empfiehlt, keine hochsensiblen Daten (z.B. Passwörter, Kreditkartennummern) in der App zu speichern, auch wenn der Vault-Bereich verschlüsselt übertragen wird.
        </p>
      </Section>

      <Section title="6. Verfügbarkeit">
        <p>
          Sulser Digital strebt eine hohe Verfügbarkeit an, garantiert diese jedoch nicht. Wartungsarbeiten und technische Störungen können die Verfügbarkeit einschränken. Es besteht kein Anspruch auf ununterbrochene Nutzung.
        </p>
      </Section>

      <Section title="7. Änderungen der Nutzungsbedingungen">
        <p>
          Sulser Digital behält sich vor, diese Nutzungsbedingungen jederzeit anzupassen. Änderungen werden in der App kommuniziert. Die fortgesetzte Nutzung nach Bekanntgabe von Änderungen gilt als Zustimmung.
        </p>
      </Section>

      <Section title="8. Anwendbares Recht und Gerichtsstand">
        <p>
          Es gilt Schweizer Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand ist der Sitz von Sulser Digital, soweit gesetzlich zulässig.
        </p>
      </Section>
    </div>
  );
}
