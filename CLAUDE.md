# SabaiSquad App - Migration zu Supabase + Vercel

## Projektbeschreibung
SabaiSquad ist eine umfassende Gruppenreise-App, die ursprünglich auf dem Manus WebDev-Stack lief und nun auf **Supabase** (Backend/DB/Auth/Storage/Realtime) und **Vercel** (Frontend) migriert wurde. Die App bietet Funktionen für die Planung, Finanzverwaltung, Kommunikation und Dokumentenspeicherung für Gruppenreisen (mit Fokus auf Thailand-Reisen).

## Betreiber & Rechte
- **Betreiber:** Sulser Digital (Sandro Sulser, Industriestrasse 40, 8112 Otelfingen)
- **Hinweis:** NICHT Sulser Group (komplett andere Firma)
- **Datenschutz:** Schweizer Daten (Supabase Zürich, eu-central-2) – nDSG-konform
- **GitHub Repo:** SulserDigital

## Architektur & Tech-Stack
- **Frontend:** React 19 + Vite + TailwindCSS + wouter
- **State Management:** TanStack React Query v5
- **Backend/DB:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (Email, Magic Link, Google, Apple)
- **Storage:** Supabase Storage (mit clientseitiger Verschlüsselung für den Vault)
- **Realtime:** Supabase Realtime Subscriptions (für Chat)
- **Deployment:** Vercel (SPA-Konfiguration via `vercel.json`)
- **Zero DevOps:** Kein Docker, kein Server-Management

## Wichtige Features
1. **Dashboard & Trip-Management:** Erstellen und Beitreten von Reisen via Invite-Code
2. **Finance (Splitwise-Klon):** Ausgaben-Tracking, flexibles Splitting (Custom Shares) und automatischer Schuldenausgleich
3. **Chat (Realtime):** Live-Kommunikation in der Gruppe via Supabase Realtime
4. **Vault (Verschlüsselt):** Clientseitig verschlüsselte Dokumentenablage (AES-256-GCM)
5. **Timeline & Activities:** Reiseplanung, Events und Abstimmungen
6. **Accommodations & Transports:** Verwaltung von Unterkünften und Flügen/Transfers
7. **Shopping & Packing:** Gemeinsame Einkaufslisten und Packlisten
8. **Dictionary:** Benutzerdefiniertes Wörterbuch (Deutsch-Thai)

## Datenbank & Sicherheit (RLS)
Das Datenbankschema besteht aus 25 Tabellen. Die Sicherheit wird durch **Row Level Security (RLS)** in Supabase gewährleistet.
Jeder User hat nur Zugriff auf:
- Sein eigenes Profil
- Trips, in denen er Mitglied ist (`trip_members`)
- Daten, die zu seinen Trips gehören (Expenses, Chat, Timeline, etc.)
- Seine eigenen Vault-Dokumente

## Vault-Verschlüsselung
Der Vault nutzt **Client-Side Encryption** (Zero-Knowledge für den Betreiber):
1. User gibt ein Vault-Passwort ein (wird nur im `sessionStorage` gehalten)
2. PBKDF2 leitet einen AES-256-Key ab
3. Dateien werden im Browser via Web Crypto API verschlüsselt
4. Der verschlüsselte Blob und die IV (Initialization Vector) werden zu Supabase hochgeladen
5. Entschlüsselung passiert komplett lokal beim Download

## Lokale Entwicklung
1. Abhängigkeiten installieren: `pnpm install`
2. Environment-Variablen konfigurieren (`.env.local`):
   ```env
   VITE_SUPABASE_URL=https://maodnlvgriwsmowysyxp.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
3. Entwicklungsserver starten: `pnpm dev`
4. Build für Produktion: `pnpm build`

## Supabase Setup (Migrations)
Die komplette Datenbankstruktur, RLS-Policies und Indizes befinden sich in:
`supabase/migrations/001_initial_schema.sql`

Diese Datei kann direkt im Supabase SQL-Editor ausgeführt werden, um die Datenbank aufzusetzen.

## Migration von Manus (tRPC) zu Supabase
Um den bestehenden UI-Code so weit wie möglich zu erhalten, wurde ein **tRPC Compatibility Layer** (`client/src/lib/trpc.ts`) implementiert.
Dieser Layer mappt die alten `trpc.*.useQuery()` und `useMutation()` Aufrufe auf direkte Supabase-Client-Aufrufe via React Query.
Zusätzlich wurden dedizierte Supabase-Hooks (`hooks/useTrips.ts`, `useExpenses.ts`, etc.) für zukünftige Entwicklungen erstellt.
