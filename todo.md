# SabaiSquad Web-App TODO

## Phase A1: Backend & Auth
- [x] Full-Stack Upgrade (tRPC + Manus Auth + Database)
- [x] Datenbankschema (trips, tripMembers, expenses, expenseSplits, activities, activityVotes, chatMessages, vaultDocuments, translations)
- [x] tRPC Router (trips, members, expenses CRUD)
- [x] Dashboard mit echter Trip-Erstellung und Mitglieder-Verwaltung
- [x] Finance-Seite mit flexiblem Splitting (individuell pro Ausgabe)
- [x] Vitest Tests für Backend-Routen

## Phase A2: Finance-Modul (funktionsfähig)
- [x] Ausgaben erfassen mit flexiblem Teilnehmer-Auswahl
- [x] Automatische Schulden-Berechnung (Balance-Matrix)
- [ ] Ausgaben bearbeiten und löschen
- [ ] PDF-Export der Abrechnung

## Phase A3: Live-APIs
- [ ] Währungsrechner mit echten Live-Kursen (ExchangeRate-API)
- [ ] Translator mit LLM-Integration
- [ ] Wörterbuch offline-fähig (IndexedDB Cache)

## Phase A4: Realtime-Chat
- [ ] Chat-Nachrichten via tRPC (Polling/Realtime)
- [ ] Medien-Upload (Fotos)
- [ ] Automatische Übersetzung im Chat

## Phase A5: Secure Vault
- [ ] AES-256 Verschlüsselung im Browser (Web Crypto API)
- [ ] Dokument-Upload und verschlüsselte Speicherung
- [ ] Biometrischer Zugang (WebAuthn)

## Design & UX
- [x] Thai Night Market Dark Luxury Design
- [x] Landing Page mit Hero, Features, Destinations, Pricing
- [x] Glassmorphism Cards und Gold/Teal-Akzente
- [x] Framer Motion Animationen
- [x] Responsive Navigation (Navbar + Footer)

## Phase A6: Neue Features (User Request)
- [x] Invite-System: Einladungs-Code/Share-Link für Trips
- [x] Persönlicher Bereich vs. Gruppen-Dashboard
- [x] Individuelle An-/Abreisedaten pro Mitglied
- [x] Kartenansicht (Google Maps) – wer ist wo
- [x] Chat.tsx mit tRPC verdrahten (echte Nachrichten)
- [x] Activities.tsx mit tRPC verdrahten (echtes Voting)
- [x] Vault.tsx mit tRPC verdrahten (Dokument-Upload)

## Phase A7: Korrekturen & neue Features (User Request 2)
- [x] Footer: "Sulser Digital" ohne "GmbH" (Einzelfirma)
- [x] Währungsrechner mit Live-Kursen (CHF/EUR/THB)
- [x] Übersetzer/Wörterbuch Thai funktionsfähig
- [x] Vault: Datei-Upload funktioniert end-to-end
- [x] Itinerary-System: Mehrere Destinationen pro Reise
- [x] Itinerary-System: Mehrere Hotels (auch verschiedene in gleicher Stadt)
- [x] Itinerary-System: Aktivitäten pro Tag/Zeitraum
- [x] Itinerary-System: Transporte (Flüge, Transfers, Züge, Fähren)
- [x] Itinerary-System: Chronologische Zeitleiste
- [x] Kartenansicht basierend auf Itinerary-Einträgen
- [x] Deployment als Owner

## Phase A8: Sichtbarkeit & Funktionalität (User Request 3)
- [x] Itinerary/Reiseverlauf als eigener sichtbarer Screen in Navigation
- [x] Währungsrechner als eigener sichtbarer Screen in Navigation
- [x] Übersetzer/Wörterbuch als eigener sichtbarer Screen in Navigation
- [x] Vault (Dokumentenablage) als eigener sichtbarer Screen in Navigation
- [x] Chat: Medien-Upload (Bilder, Videos, Dokumente)
- [x] Avatar-System: Profilbild-Upload oder Avatar-Auswahl, konsistent überall
- [x] Deployment als Owner

## Phase A9: UI-Korrekturen – Icons & Layout
- [x] Dictionary: Emojis durch einfarbige Lucide Outline-Icons ersetzen
- [x] Dictionary: Kategorie-Buttons Layout fixen (Text unter Icon, vollständig lesbar)
- [x] Gesamte App: Alle Emojis durch einfarbige Outline-Icons ersetzen (konsistent)
- [x] Deployment als Owner

## Phase A10: Destinations-Bilder, Offline-Download, Icons
- [x] Bangkok: Korrektes eigenes Bild (Skyline/Wat Arun/Tuk-Tuk)
- [x] Pattaya: Korrektes eigenes Bild (Skyline am Strand/Walking Street)
- [x] Koh Samui: Korrektes eigenes Bild (Big Buddha/Palmen)
- [x] Phuket: Korrektes eigenes Bild (Patong Beach/Old Town)
- [x] Offline-Download-Button pro Destination
- [x] Gesamte App: Alle Emojis durch Lucide Outline-Icons ersetzen
- [x] Deployment als Owner

## Phase A11: Scroll-to-Top und Google Places

- [x] Scroll-to-Top bei jedem Route-Wechsel
- [x] Google Places Autocomplete bei Aktivitaeten-Erstellung
- [x] TripMap.tsx: Emojis durch Lucide Icons ersetzen
- [x] Finance.tsx: Verbleibende Emojis ersetzen
- [x] Activities.tsx: Verbleibende Emojis ersetzen
- [x] Deployment als Owner

## Phase A12: Avatar-System Overhaul

- [x] Schema: avatarIcon + avatarColor Felder zu tripMembers hinzufügen
- [x] Backend: updateAvatar Procedure für Icon+Farbe+Bild
- [x] MyTrip: Icon-Galerie (25+ Lucide Icons) im Grid mit Farbwahl
- [x] MemberAvatar Komponente: Icon/Farbe/Bild konsistent anzeigen
- [x] Konsistente Anzeige in Chat, Karte, Timeline, Dashboard, Mitgliederliste
- [x] Deployment als Owner

## Phase A13: Karte Overhaul + Aktivitäten Edit/Delete

- [x] Karte: Datums-Slider/Timeline-Leiste (Tag für Tag scrollen)
- [x] Karte: Kategorien mit Lucide Icons (Standort grün, vergangen grau, zukünftig halbtransparent, Hotels Bed, Aktivitäten Star, Transporte Plane)
- [x] Karte: Filter-Legende ein-/ausblendbar (Toggle pro Kategorie)
- [x] Karte: Chronologische Route (durchgezogen vergangen, gestrichelt zukünftig)
- [x] Karte: Per-Person ein-/ausblenden (Filter-Chips pro Mitglied)
- [x] Aktivitäten: Löschen mit Bestätigungsdialog
- [x] Aktivitäten: Bearbeiten (Datum, Text, Ort, Beschreibung)
- [x] Aktivitäten: Timeline-Trennung (Bevorstehend vs. Vergangen, chronologisch sortiert)
- [x] Deployment als Owner
- [x] Aktivitäten: Datum + Uhrzeit (datetime-local Input)
- [x] Aktivitäten: Erweitertes Voting mit Kommentarfeld pro Mitglied
- [x] Aktivitäten: Kommentare als Mini-Diskussionsfaden anzeigen

## Phase A14: Activities URL & optionales Datum

- [x] Schema: websiteUrl Feld zu activities hinzufügen
- [x] Backend: websiteUrl in create/update Prozeduren
- [x] Activities: URL-Feld beim Erstellen/Bearbeiten
- [x] Activities: Klickbarer Link in der Karte (ExternalLink-Icon)
- [x] Activities: Datum/Uhrzeit optional, "Noch kein Datum" anzeigen
- [x] Deployment als Owner

## Phase A15: Finance Kategorie-Tags

- [x] Schema: category enum aktualisiert (food, party, transport, accommodation, flights, shopping, activities, other)
- [x] Backend: category in create Prozedur mit neuem Enum
- [x] Frontend: Kategorie-Auswahl als 4x2 Icon-Button-Grid (Lucide Icons)
- [x] Frontend: Kategorie-Icon in Ausgaben-Liste anzeigen
- [x] Frontend: Filter nach Kategorie (Chip-Buttons im Ausgaben-Tab)
- [x] Deployment als Owner
- [x] GitHub Push auf main

## Phase A16: Finance-Erweiterung (Wise, Personal/Group, GoCardless)

- [x] "In Wise öffnen"-Button (Deep Link wise:// + Fallback wise.com)
- [x] "Wer hat bezahlt?" prominent mit Avatar + Name in Ausgabenliste
- [x] Schema: is_personal Boolean-Feld zu expenses hinzufügen
- [x] Backend: Persönliche Ausgaben nur für Ersteller sichtbar (Filterung)
- [x] Frontend: Toggle "Persönlich" vs "Gruppe" beim Erstellen
- [x] Frontend: Tab/Filter für persönliche vs. Gruppen-Ausgaben
- [x] GoCardless-Vorbereitung: "Wise-Konto verbinden" Platzhalter-UI mit Info-Modal
- [x] Deployment als Owner
- [x] GitHub Push auf main

## Bugfixes: Finance (Post-A16)

- [x] Bug 1: Wise-Link auf https://wise.com ändern (kein wise:// Deep Link)
- [x] Bug 2: Persönliche Ausgaben korrekt filtern (nicht in Gruppe anzeigen)
- [x] Bug 3: Ausgaben löschen mit Bestätigungsdialog (nur Ersteller)
- [x] Deployment als Owner
- [x] GitHub Push auf main

## Bugfixes: Finance Round 2

- [x] Fix 1: Wise-Button als Modal mit App-Link (https://wise.com/app)
- [x] Fix 2: Edit/Delete-Buttons direkt sichtbar in Ausgaben-Zeile (nicht im Expand versteckt)
- [x] Backend: updateExpense Prozedur hinzugefügt
- [x] Deployment als Owner
- [x] GitHub Push auf main

## Phase A17: Thailand Best Practices / Insider-Tipps

- [x] Schema: tips Tabelle (id, tripId, category, title, description, createdByUserId, createdAt, updatedAt)
- [x] Backend: getTips, createTip, updateTip, deleteTip tRPC Routes
- [x] Backend: Seed-Daten (alle vordefinierten Tipps) beim ersten Laden
- [x] Frontend: Neue Seite /tips mit Lightbulb-Icon in Navigation
- [x] Frontend: Kategorien-Filter (Tabs/Chips)
- [x] Frontend: Textsuche über alle Tipps
- [x] Frontend: Tipp hinzufügen (Dialog mit Titel, Beschreibung, Kategorie)
- [x] Frontend: Tipp bearbeiten (Pencil-Icon, vorausgefülltes Formular)
- [x] Frontend: Tipp löschen (Trash-Icon mit Bestätigungsdialog)
- [x] Navigation: Menüpunkt "Tipps" mit Lightbulb-Icon
- [x] Deployment als Owner
- [x] GitHub Push auf main

## Phase A18: Unterkünfte / Buchungen

- [x] Schema: accommodations Tabelle + accommodation_contacts Tabelle
- [x] Backend: CRUD Routes (getAccommodations, create, update, delete, addContact, removeContact)
- [x] Frontend: Deep-Link-Suche (Booking.com, Agoda, Airbnb)
- [x] Frontend: Buchung hinzufügen (vollständiges Formular)
- [x] Frontend: Unterkunft-Karten (Zugangscode, WLAN, Kontakte, Bewohner)
- [x] Frontend: Kontaktpersonen pro Unterkunft (Name, Rolle, Telefon, LINE)
- [x] Frontend: Gruppen-Kontaktliste Tab
- [x] Navigation: Menüpunkt "Unterkünfte" mit Building2-Icon
- [x] Deployment als Owner
- [x] GitHub Push auf main

## Bugfixes: Tips Page

- [x] Fix: Tips edit/delete buttons sichtbar und funktional auf jeder Tip-Karte
- [x] Fix: Header-Overlap auf Tips-Seite (Insider-Tipps Titel überlappt mit SabaiSquad Logo)
- [x] Deployment als Owner
- [x] GitHub Push auf main

## Phase A18b: Erweiterte Buchungssuche-Filter

- [x] Neue Filter: Schlafzimmer, Badezimmer (Stepper)
- [x] Neue Filter: Unterkunftstyp (Multi-Select: Villa, Apartment, Hotel, Hostel, Haus)
- [x] Neue Filter: Amenities Toggle-Chips (Pool, AC, WLAN, Küche, Parkplatz, Waschmaschine, Balkon, Meerblick)
- [x] Neue Filter: Stadtteil/Region (Freitext)
- [x] Neue Filter: Preisbereich (Min/Max)
- [x] Neue Filter: Sortierung (Dropdown)
- [x] UI: Collapsible "Erweiterte Filter" Bereich
- [x] Deep Links: Booking.com mit nflt-Parametern, order, price_min/max
- [x] Deep Links: Airbnb mit amenities[], property_type_id[], min_bedrooms, min_bathrooms, price, sort
- [x] Deep Links: Agoda mit erweiterten Parametern
- [x] Deployment als Owner
- [x] GitHub Push auf main

## Bugfixes: UI/UX Round 3

- [x] Fix 1: Header-Overlap auf Tips + Accommodations (pt-20 + sticky top-20)
- [x] Fix 2: Tips Edit-Modus (Bearbeiten-Toggle, Icons standardmässig versteckt)
- [x] Fix 3: Intelligente Datepicker (min-Attribut auf Checkout-Felder)
- [x] Fix 4: Avatar einklappen in MyTrip (Pencil/Fertig-Toggle)
- [x] Fix 5: "Mein Standort" → "Geplante Aufenthalte", "Aktueller Ort" → "Aufenthaltsort"
- [x] Deployment als Owner
- [x] GitHub Push auf main

## Bugfixes: UI/UX Round 4

- [x] Fix 1: Tips Kategorie-Chips grösser mit vollem Text (scrollbar, whitespace-nowrap, text-sm+, gold aktiv)
- [x] Fix 2a: plannedStays DB-Tabelle + CRUD (Basis)
- [x] Fix 2b: Gruppen-Tagging Backend (taggedMemberIds bei create, accept/decline mit eigenen Daten)
- [ ] Fix 2b-UI: MyTrip Multi-Select Gruppenmitglieder, Einladungs-Cards (Bestätigen/Ablehnen + eigene Daten)
- [ ] Fix 2b-Status: Status-Anzeige beim Ersteller (bestätigt/ausstehend/abgelehnt)
- [ ] Fix 2d: Zentrale Timeline (Aufenthalte + Unterkünfte + Aktivitäten + Transport, chronologisch nach Tag)
- [ ] Fix 3: Unterkünfte + Aufenthalte als Marker auf TripMap mit Legende-Toggle
- [ ] Deployment als Owner
- [ ] GitHub Push auf main

## Sprint: 7-Eleven, Shopping List, Task List

- [x] Feature 1: 7-Eleven / Nützliche Apps Seite (Links, APK-Anleitung, Grab, Bolt, LINE MAN)
- [x] Feature 2a: DB-Schema shoppingLists + shoppingItems
- [x] Feature 2b: Backend CRUD für Einkaufslisten (Listen, Items, Foto-Upload, abhaken)
- [x] Feature 2c: Frontend Einkaufsliste (Listen, Items, Foto, "Ich gehe einkaufen"-Button)
- [x] Feature 3a: DB-Schema tasks
- [x] Feature 3b: Backend CRUD für Aufgaben (erstellen, zuweisen, Status ändern)
- [x] Feature 3c: Frontend Aufgabenliste (erstellen, zuweisen, Filter, Status)
- [x] Navigation: Neue Menüpunkte (Einkaufsliste, Aufgaben, Apps)
- [x] Foto-Upload für Shopping-Items (Backend upload + Frontend Camera/Galerie)
- [x] "Ich gehe einkaufen"-Button mit Hinweis-Toast
- [x] Deployment als Owner (c6b1dcc)
- [x] GitHub Push auf main (c6b1dcc)

## Feature: Task Private Mode

- [x] DB: isPrivate Feld in tasks-Tabelle (Boolean, default false)
- [x] Backend: Private Tasks nur für Ersteller sichtbar (Filter in list-Procedure)
- [x] Frontend: Private Toggle beim Erstellen/Bearbeiten, Schloss-Icon, Filter "Gruppe"
- [x] Deployment als Owner (aac721cc)
- [x] GitHub Push auf main (aac721cc)

## Feature: Gruppen-Tagging vervollständigen

- [x] Backend: accept-Procedure mit individuellen Daten (fromDate, toDate, accommodationId)
- [x] Backend: Status-Query für Ersteller (confirmed/pending/declined pro Mitglied)
- [x] Frontend: Accept-Dialog mit eigenen Daten + Unterkunft-Auswahl
- [x] Frontend: Status-Badges beim Ersteller (✓ / ⏳ / ✗ + individuelle Daten sichtbar)
- [x] Frontend: Übersicht wer wann da ist (MemberOverview Tabelle mit individuellen Daten)
- [x] Deployment als Owner (0852ef7)
- [x] GitHub Push auf main (0852ef7)

## Sprint: Transport-Buchungen + Kontaktliste

- [ ] DB: transports Tabelle (type, from, to, date, time, price, bookingRef, notes, contactId, tripId)
- [ ] DB: contacts Tabelle (name, phone, instagram, line, whatsapp, category, note, photoUrl, isPrivate, tripId)
- [ ] Backend: CRUD für transports (list, create, update, delete)
- [ ] Backend: CRUD für contacts (list, create, update, delete)
- [ ] Frontend: Transport-Seite (/transport) mit Formular, Deep Links (Skyscanner, Google Flights, Grab, Bolt, Booking Transfer)
- [ ] Frontend: Transport-Liste mit Icons pro Typ, Edit/Delete
- [ ] Frontend: Kontakte-Seite (/contacts) mit Formular, Foto-Upload, Suche, Kategorie-Filter
- [ ] Frontend: Kontakt-Karten mit Foto, Social Links, Kategorie-Badge
- [ ] Navigation: Menüpunkte "Transport" (Plane-Icon) + "Kontakte" (Users-Icon)
- [ ] Timeline: Transporte als Einträge (bereits vorhanden, prüfen ob neue Tabelle integriert)
- [ ] TripMap: Transport-Marker (Von/Nach als Linie oder Marker)
- [ ] Deployment als Owner
- [ ] GitHub Push auf main

## Bugfixes: UI/UX Round 5 (Spacing, Edit, Tabs)

- [x] Fix 1: Excess Spacing – pt-16/pt-20 von allen Page-Root-Divs entfernt (App.tsx main hat pt-16, Pages nicht mehr)
- [x] Fix 1b: Tips + Accommodations sticky headers von top-20 auf top-16 korrigiert
- [x] Fix 2: Einkaufsliste Inline-Edit – Artikel anklicken öffnet Inline-Edit (Name + Menge), Pencil-Icon, Save/Cancel
- [x] Fix 2b: Backend updateItem Procedure hinzugefügt (shopping.updateItem)
- [x] Fix 3: Transport Typ-Tabs – shrink-0 + scrollbar-hide, kein Overlap mehr
- [x] Fix 3b: Alle horizontalen Tab-Leisten (TaskList, Contacts, Vault, Dashboard, Destinations) mit scrollbar-hide
- [x] scrollbar-hide CSS Utility zu index.css hinzugefügt
- [x] Deployment als Owner (206a4007)
- [x] GitHub Push auf main (206a4007)

## Bugfixes: UI/UX Round 6 (Currency Width, Vault Tabs)

- [x] Fix 1: Currency – overflow-x-hidden auf Root-Div, body overflow-x:hidden global in index.css
- [x] Fix 2: Vault Kategorie-Tabs – shrink-0 auf alle Tab-Buttons
- [x] Fix 3: Dashboard Tab-Buttons – shrink-0 hinzugefügt
- [x] Fix 4: Navbar Desktop-Nav – shrink-0 auf Nav-Items
- [x] Vollständiger App-Audit: alle whitespace-nowrap ohne shrink-0 behoben
- [x] Deployment als Owner (fb1f5644)
- [x] GitHub Push auf main (fb1f5644)

## Feature: Reisevorbereitung-Seite

- [x] DB: packingItems Tabelle (id, tripId, category, name, checked, createdBy, isDefault, sortOrder)
- [x] Backend: packingList.getItems, packingList.toggleItem, packingList.addItem, packingList.deleteItem procedures
- [x] Seite: Thailand Digital Arrival Card Section (Link + Erklärung + 72h Hinweis)
- [x] Seite: Visa-Informationen Section (60 Tage CH, Verlängerung, Reisepass, Rückflug)
- [x] Seite: Einreisebestimmungen Section (Dokumente, Zoll, Verbote)
- [x] Seite: Packliste mit Kategorien (Dokumente, Kleidung, Medizin, Technik, Sonstiges)
- [x] Packliste: Checkboxen abhaken (persistent in DB)
- [x] Packliste: Eigene Items hinzufügen
- [x] Packliste: Items löschen (eigene)
- [x] Packliste: Default-Items mit Thailand-spezifischen Vorschlägen
- [x] Navbar: "Reisevorbereitung" Menüpunkt hinzufügen
- [x] App.tsx: Route /preparation hinzufügen
- [x] Deployment als Owner (15292ddd)
- [x] GitHub Push auf main (15292ddd)

## Feature: News/Infos-Seite

- [x] DB: newsItems Tabelle (id, tripId, title, content, category, severity, createdBy, createdAt, isPinned, isDefault)
- [x] Backend: news.list, news.create, news.delete procedures
- [x] Seite: Cards mit Kategorie-Tags (Warnung, Info, Feiertag, Wetter)
- [x] Seite: Farbcodierung (Rot=Warnung, Amber=Hinweis, Grün=Tipp, Blau=Info)
- [x] Seite: Default-News (Alkoholverbot, Feiertage 2026, Visa, Sicherheit, Wetter)
- [x] Seite: Admin kann neue News hinzufügen
- [x] Navbar: "Infos" Menüpunkt mit Icon
- [x] App.tsx: Route /news hinzufügen
- [x] Fix: Reisevorbereitung Icon (shrink-0 auf Icon im Mobile Menu)
- [x] Deployment als Owner (de8a8bb7)
- [x] GitHub Push auf main (de8a8bb7)

## Feature: Navbar Umstrukturierung (5 Kategorien)
- [x] Navbar: 5 aufklappbare Hauptkategorien (Reise, Unterwegs, Gruppe, Finanzen, Profil)
- [x] Navbar: Sanfte Aufklapp-Animation (max 200ms)
- [x] Navbar: Aktive Seite hervorgehoben
- [x] Navbar: Mehrere Kategorien gleichzeitig offen
- [x] Navbar: Dark-Theme konsistent (amber/gold Akzente)
- [x] Deployment als Owner (13a413a4)
- [x] GitHub Push auf main (13a413a4)

## Feature: MyTrip Cleanup + Settings Seite
- [ ] MyTrip: Avatar/Profilbild entfernen
- [ ] MyTrip: Einladungscode entfernen
- [ ] MyTrip: Nur reisebezogene Fakten (Daten, Destination, Teilnehmer, Aufenthalte)
- [ ] Settings: Avatar/Profilbild mit Upload-Möglichkeit
- [ ] Settings: Einladungscode mit Copy-Button
- [ ] Settings: Benutzername/Anzeigename editierbar
- [ ] Settings: Platzhalter für Sprache, Benachrichtigungen, Theme
- [ ] Settings: Route /settings in App.tsx vorhanden
- [ ] Deployment als Owner
- [ ] GitHub Push auf main

## Feature: MyTrip Cleanup + Settings Seite
- [x] MyTrip: Avatar Section entfernt
- [x] MyTrip: Einladungscode entfernt
- [x] Settings: Avatar Upload + Icon/Farbe Auswahl
- [x] Settings: Anzeigename bearbeiten
- [x] Settings: Einladungscode mit Copy + Share
- [x] Settings: Platzhalter für Benachrichtigungen, Sprache, Theme, Datenschutz
- [x] Settings: Account-Sektion mit Logout
- [x] App.tsx: Route /settings hinzugefügt
- [x] Deployment als Owner (6bed254a)
- [x] GitHub Push auf main (6bed254a)

## Feature: Wörterbuch-Verbesserungen
- [ ] DB: customPhrases Tabelle (id, tripId, createdByUserId, german, phonetic, thai, category, note, createdAt)
- [ ] Backend: customPhrases.list, create, update, delete procedures
- [ ] Dictionary: Layout umdrehen (Phonetisch GROSS amber, Thai klein grau, Deutsch bold weiss)
- [ ] Dictionary: Speaker-Button bei jeder Phrase (Web Speech API, th-TH)
- [ ] Dictionary: "Eigene Phrase hinzufügen" Button + Formular (Deutsch, Phonetisch, Thai, Kategorie, Notiz)
- [ ] Dictionary: Eigene Phrasen mit Badge markiert, bearbeiten + löschen
- [ ] Translator: Speaker-Button für übersetzte Ergebnisse
- [ ] Deployment als Owner
- [ ] GitHub Push auf main

## Feature: Wörterbuch-Verbesserungen

- [x] Layout: Phonetisch GROSS (gold), Thai klein (grau), Deutsch bold
- [x] TTS-Button (Volume2 Icon) für Thai-Aussprache (Web Speech API, th-TH)
- [x] TTS im Übersetzer-Ergebnis (wenn Zielsprache Thai)
- [x] Kategorie "Eigene" mit Star-Icon
- [x] DB: customPhrases Tabelle (id, tripId, german, phonetic, thai, category, note, createdByUserId)
- [x] Backend: customPhrases.list, .create, .update, .delete
- [x] Add-Formular mit Deutsch, Phonetisch, Thai, Notiz
- [x] Edit/Delete für eigene Phrasen
- [x] Deployment als Owner
- [x] GitHub Push auf main

## Bugfixes: TTS, Übersetzer-Format, Navbar Active State
- [x] Fix: Navbar Active State – aktuellen Pfad korrekt verwenden (war bereits korrekt)
- [x] Fix: TTS-Button – Web Speech API korrekt implementieren (th-TH) + Fallback
- [x] Fix: KI-Übersetzer Ergebnis-Format – JSON mit thai + phonetic Feldern
- [x] Copy-to-Clipboard Button für Übersetzungsergebnis
- [x] Deployment als Owner (6c532446)
- [x] GitHub Push auf main (6c532446)

## Bugfixes: Wörterbuch Round 2
- [x] Fix: TTS für alle Zielsprachen (en-US, fr-FR, de-DE, th-TH etc.) – lang-Parameter dynamisch
- [x] Fix: Refresh-Button bei vordefinierten Phrasen entfernen (nur Speaker-Button bleibt)
- [x] Deployment als Owner (4bf5e8c7)
- [x] GitHub Push auf main (4bf5e8c7)

## Bugfixes: KI-Übersetzer Mehrsprachigkeit
- [x] Fix: Translator-Prompt generisch für alle Sprachen (nicht nur Thai-spezifisch)
- [x] Fix: JSON-Response für alle Sprachen konsistent (translation, phonetic, original)
- [x] Fix: Dropdown-Sprachen (th, en, de, fr, zh, ja) alle funktionsfähig
- [x] Fix: Frontend zeigt Ergebnis für alle Zielsprachen korrekt an
- [x] Deployment als Owner (6f340575)
- [x] GitHub Push auf main (6f340575)

## Feature: Finance Verbesserungen (Schulden-Übersicht + Als bezahlt markieren)
- [x] DB: debtPayments Tabelle (id, tripId, fromMemberId, toMemberId, amount, currency, note, paidAt)
- [x] Backend: debtPayments.list, .create (markAsPaid), .delete procedures
- [x] Backend: Netto-Schulden-Berechnung (A schuldet B 500, B schuldet A 200 → A schuldet B 300)
- [x] Frontend: "Wer schuldet wem was" Übersicht (Netto-Berechnung, rot/grün Farben)
- [x] Frontend: "Als bezahlt markieren" Button pro Schuld mit optionaler Notiz
- [x] Frontend: Bezahlte Schulden durchgestrichen oder in "Erledigt"-Sektion
- [x] Deployment als Owner (5b7905ed)
- [x] GitHub Push auf main (5b7905ed)

## Punkt 1: Karte – Unterkünfte/Aufenthalte als Marker
- [x] Backend: Accommodations + PlannedStays + Activities + Transports per Trip laden (für Karte)
- [x] Frontend: Marker für Unterkünfte (Bed-Icon, blau), Aktivitäten (Star-Icon, gold), Transport (Plane/Car, grün)
- [x] Frontend: Popup bei Marker-Klick (Name, Datum, kurze Info)
- [x] Frontend: Legende für Marker-Typen (Unterkunft blau, Aufenthalt grün)
- [x] Deployment + GitHub Push (c8d42880)

## Punkt 2: Zentrale Timeline im Reiseverlauf
- [x] Frontend: Vertikale Timeline-Ansicht im Reiseverlauf (Itinerary)
- [x] Frontend: Chronologisch sortiert: Aufenthalte + Unterkünfte + Aktivitäten + Transport
- [x] Frontend: Verschiedene Icons pro Typ (Hotel, Flug, Aktivität, Transport, Unterkunft, Aufenthalt)
- [x] Frontend: Datums-Marker als Trenner zwischen Tagen
- [x] Deployment + GitHub Push (860d4f25)

## Punkt 3: Gruppen-Tagging UI verfeinern
- [x] Frontend: Multi-Select für Teilnehmer verbessern (Avatar-Chips mit Farbe + Check-Icon)
- [x] Frontend: Einladungs-Cards neu gestalten (Card mit Header, Inviter-Avatar, Split-Buttons)
- [x] Frontend: Status-Anzeige (Bestätigt/Ausständig/Abgelehnt) klärer darstellen (Avatar + Name + Farbpunkt)
- [x] Deployment + GitHub Push (94e2885c)

## Punkt 4: Chat prüfen und verbessern
- [x] Testen: Nachrichten senden/empfangen (funktioniert, 200 OK)
- [x] Testen: Medien-Upload (funktioniert via /api/upload + S3)
- [x] UI-Verbesserungen: eigene Nachrichten rechts, Datumstrenner, Avatar nur für andere, bessere Bubbles
- [x] Deployment + GitHub Push (527a4b7c)

## Punkt 5: Finanzen – Persönlich vs. Gruppe Split + Zahlungsmethode
- [x] Frontend: Ausgabe splitten in Gruppe + Persönlich (z.B. 700 THB → 500 Gruppe + 200 Persönlich)
- [x] Frontend: Zahlungsmethode wählbar (Wise-Karte / Bargeld / Andere)
- [x] DB: personalAmount + paymentMethod Felder in expenses Tabelle (Migration 0022)
- [x] Frontend: Persönliches Budget – Übersicht nach Zahlungsmethode (Wise, Bargeld, aus Gruppe)
- [x] Deployment + GitHub Push (13504bb2)

## Punkt 1: Security-Audit
- [x] Alle tRPC-Routen auf protectedProcedure geprüft – nur me/logout/rates/convert/phrasebook/getByInviteCode public (korrekt)
- [x] Input-Validierung mit Zod verschärft (max-length, regex, trim auf alle kritischen Felder)
- [x] Rate-Limiting: OAuth 20/15min, Invite 10/10min, API allgemein 200/min (express-rate-limit)
- [x] Upload-Endpoint: Auth-Check via sdk.authenticateRequest + Filename-Sanitization
- [x] Security-Headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy
- [x] HTTPS: Manus-Hosting erzwingt HTTPS automatisch
- [x] tRPC onError-Logging für Server-Fehler
- [x] Deployment + Checkpoint (266b4728)

## Punkt 2: Stabilität
- [x] Globaler Error-Boundary in React: bereits vorhanden und in App.tsx eingebunden
- [x] Loading-States: alle Seiten nutzen isLoading-Guards (57 Stellen), Loader2-Spinner
- [x] Netzwerkfehler-Toast: useNetworkStatus Hook + NetworkStatusWatcher in App.tsx (offline/online Toast)
- [x] PWA Service Worker: vite-plugin-pwa mit NetworkFirst-Cache für tRPC-Calls
- [x] Health-Endpoint: /api/health (status, timestamp, uptime, env) für UptimeRobot
- [x] Deployment + Checkpoint (32aa976a)

## Punkt 3: Plausible Analytics
- [x] Plausible Analytics Script in index.html (tagged-events, data-domain: sabaquad-h9ssu9mk.manus.space)
- [x] usePlausible Hook erstellt (typsicherer Wrapper, silent fail bei Ad-Blocker)
- [x] Custom Events: Translator Used (mit targetLang), Chat Message Sent (mit type)
- [ ] Deployment + Checkpoint

## Punkt 4: Sentry Error-Tracking
- [x] Sentry SDK Frontend (@sentry/react): client/src/lib/sentry.ts + initSentry() in main.tsx
- [x] Sentry SDK Backend (@sentry/node): server/_core/sentry.ts + initSentryServer() in index.ts
- [x] ErrorBoundary captureException + tRPC onError captureServerException
- [x] No-op wenn VITE_SENTRY_DSN / SENTRY_DSN nicht gesetzt (sicher für Prod ohne Key)
- [x] Health-Endpoint /api/health bereits vorhanden (Punkt 2)
- [x] Deployment + Checkpoint (5a786dbd)

## Punkt 5: Legal-Seite
- [x] Neue Seite /legal mit Tabs: Datenschutz / Impressum / AGB
- [x] Datenschutzerklärung (nDSG Schweiz): Daten, Zweck, Plausible, Sentry, keine Drittgabe
- [x] Impressum: Sulser Digital, Einzelunternehmen Schweiz (Platzhalter für Adresse/Kontakt)
- [x] AGB light: Haftungsausschluss, Beta-Status, keine Garantie
- [x] Link im Footer (Datenschutz/Impressum/AGB → /legal) + Settings-Seite (Card mit Link)
- [x] Deployment + Checkpoint (3c8b38de)

## Punkt 6: UI-Feinschliff
- [x] Header-Overlap gefixt: Dashboard, Finance, Chat, Settings auf pt-20 umgestellt (alle anderen waren bereits korrekt)
- [x] Mobile Touch-Targets: Hamburger-Button auf w-11 h-11, Navbar-Links auf py-3 (44px+)
- [x] Finance Tab-Bar: overflow-x-auto + whitespace-nowrap für Mobile
- [x] TripMap Höhe: h-[50vh] md:h-[65vh] für bessere Mobile-Darstellung
- [x] Globale Mobile-CSS: safe-area-inset, scrollbar-hide, touch-action, -webkit-tap-highlight-color
- [x] Loading-States: 57 Stellen in der App mit isLoading-Guards, Loader2-Spinner
- [x] Deployment + Checkpoint (ef86e5ec)

## Legal-Seite: Echte Firmendaten
- [x] Datenschutz Abschnitt 1: Sandro Sulser, Industriestrasse 40, 8112 Otelfingen, Kanton Zürich, admin@sulserdigital.ch
- [x] Datenschutz Abschnitt 6: Kontakt-E-Mail admin@sulserdigital.ch (klickbarer mailto-Link)
- [x] Impressum: Inhaber Sandro Sulser, Adresse Industriestrasse 40, 8112 Otelfingen, Kanton Zürich, Schweiz
- [x] Impressum: Kontakt admin@sulserdigital.ch + Telefon +41 79 796 02 97
- [x] AGB Abschnitt 1: Betreiber Sulser Digital, Sandro Sulser
