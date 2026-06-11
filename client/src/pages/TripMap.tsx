// TripMap: Kartenansicht mit zeitlicher Dimension, Kategorien, Filter und Routen
import { useRef, useMemo, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { MapView } from "@/components/Map";
import {
  Loader2, MapPin, Plane, Hotel, Star, Clock, CheckCircle2,
  ChevronLeft, ChevronRight, Calendar, Eye, EyeOff, Filter, Route
} from "lucide-react";
import MemberAvatar from "@/components/MemberAvatar";

// Known Thai locations for geocoding fallback
const THAI_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  bangkok: { lat: 13.7563, lng: 100.5018 },
  pattaya: { lat: 12.9236, lng: 100.8825 },
  phuket: { lat: 7.8804, lng: 98.3923 },
  "chiang mai": { lat: 18.7883, lng: 98.9853 },
  "koh samui": { lat: 9.5120, lng: 100.0136 },
  "koh phangan": { lat: 9.7500, lng: 100.0333 },
  krabi: { lat: 8.0863, lng: 98.9063 },
  "hua hin": { lat: 12.5684, lng: 99.9577 },
  "koh lanta": { lat: 7.5000, lng: 99.0500 },
  "koh tao": { lat: 10.0956, lng: 99.8403 },
  "phi phi": { lat: 7.7407, lng: 98.7784 },
  ayutthaya: { lat: 14.3692, lng: 100.5877 },
  sukhothai: { lat: 17.0070, lng: 99.8265 },
  "chiang rai": { lat: 19.9105, lng: 99.8406 },
  pai: { lat: 19.3622, lng: 98.4409 },
  rayong: { lat: 12.6814, lng: 101.2816 },
  "koh chang": { lat: 12.0500, lng: 102.3500 },
  kanchanaburi: { lat: 14.0227, lng: 99.5328 },
  "khao sok": { lat: 8.9167, lng: 98.5333 },
  "ao nang": { lat: 8.0350, lng: 98.8238 },
  "koh lipe": { lat: 6.5000, lng: 99.3000 },
  "surat thani": { lat: 9.1382, lng: 99.3217 },
  "hat yai": { lat: 7.0036, lng: 100.4747 },
  "nakhon ratchasima": { lat: 14.9799, lng: 102.0978 },
  zürich: { lat: 47.3769, lng: 8.5417 },
  zurich: { lat: 47.3769, lng: 8.5417 },
};

type EventCategory = "hotel" | "activity" | "transport" | "member";

const CATEGORY_CONFIG: Record<EventCategory, { label: string; color: string; Icon: typeof MapPin }> = {
  hotel: { label: "Hotels", color: "#4ADE80", Icon: Hotel },
  activity: { label: "Aktivitäten", color: "#C9A84C", Icon: Star },
  transport: { label: "Transporte", color: "#A855F7", Icon: Plane },
  member: { label: "Mitglieder", color: "#4ECDC4", Icon: MapPin },
};

function getLocationCoords(locationStr: string): { lat: number; lng: number } | null {
  const lower = locationStr.toLowerCase().trim();
  for (const [key, coords] of Object.entries(THAI_LOCATIONS)) {
    if (lower.includes(key)) return coords;
  }
  return null;
}

function getEventCategory(eventType: string): EventCategory {
  if (eventType === "hotel") return "hotel";
  if (eventType === "flight" || eventType === "transport") return "transport";
  return "activity";
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("de-CH", { day: "2-digit", month: "short" });
}

export default function TripMap() {
  const { isAuthenticated, loading } = useAuth();
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  // View mode: "today" or "all"
  const [viewMode, setViewMode] = useState<"today" | "all">("all");
  // Date slider offset from today (0 = today, -1 = yesterday, +1 = tomorrow)
  const [dayOffset, setDayOffset] = useState(0);
  // Category filters
  const [visibleCategories, setVisibleCategories] = useState<Record<EventCategory, boolean>>({
    hotel: true,
    activity: true,
    transport: true,
    member: true,
  });
  // Per-member visibility
  const [hiddenMembers, setHiddenMembers] = useState<Set<number>>(new Set());
  // Show filter panel
  const [showFilters, setShowFilters] = useState(false);

  const { data: trips } = trpc.trips.list.useQuery(undefined, { enabled: isAuthenticated });
  const activeTripId = trips?.[0]?.id ?? null;

  const { data: members, isLoading: membersLoading } = trpc.members.list.useQuery(
    { tripId: activeTripId! },
    { enabled: !!activeTripId }
  );

  const { data: events, isLoading: eventsLoading } = trpc.timeline.list.useQuery(
    { tripId: activeTripId! },
    { enabled: !!activeTripId }
  );

  const { data: accommodations, isLoading: accommodationsLoading } = trpc.accommodations.list.useQuery(
    { tripId: activeTripId! },
    { enabled: !!activeTripId }
  );

  const { data: stays, isLoading: staysLoading } = trpc.plannedStays.list.useQuery(
    { tripId: activeTripId! },
    { enabled: !!activeTripId }
  );

  const isLoading = membersLoading || eventsLoading || accommodationsLoading || staysLoading;

  // Current selected date
  const selectedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [dayOffset]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Trip date range for slider bounds
  const tripDateRange = useMemo(() => {
    if (!events || events.length === 0) return { start: today, end: today, days: 1 };
    const dates = events
      .filter(e => e.startTime)
      .map(e => new Date(e.startTime!).getTime());
    if (dates.length === 0) return { start: today, end: today, days: 1 };
    const start = new Date(Math.min(...dates));
    const end = new Date(Math.max(...dates));
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    return { start, end, days };
  }, [events, today]);

  // Events with coordinates
  const allLocatedEvents = useMemo(() => {
    if (!events) return [];
    return events
      .filter(e => e.location)
      .map(e => ({
        ...e,
        coords: getLocationCoords(e.location!),
        category: getEventCategory(e.eventType),
        startDate: e.startTime ? new Date(e.startTime) : null,
        endDate: e.endTime ? new Date(e.endTime) : null,
      }))
      .filter(e => e.coords !== null);
  }, [events]);

  // Filter events based on date and category
  const filteredEvents = useMemo(() => {
    return allLocatedEvents.filter(e => {
      // Category filter
      if (!visibleCategories[e.category]) return false;
      // Date filter (only in "today" mode)
      if (viewMode === "today" && e.startDate) {
        const eventStart = new Date(e.startDate);
        eventStart.setHours(0, 0, 0, 0);
        const eventEnd = e.endDate ? new Date(e.endDate) : eventStart;
        eventEnd.setHours(23, 59, 59, 999);
        // Show if selected date falls within event range
        if (selectedDate < eventStart || selectedDate > eventEnd) return false;
      }
      return true;
    });
  }, [allLocatedEvents, visibleCategories, viewMode, selectedDate]);

  // Members with locations (filtered by visibility)
  const locatedMembers = useMemo(() => {
    if (!members || !visibleCategories.member) return [];
    return members
      .filter(m => m.currentLocation && !hiddenMembers.has(m.id))
      .map(m => ({
        ...m,
        coords: getLocationCoords(m.currentLocation!),
      }))
      .filter(m => m.coords !== null);
  }, [members, hiddenMembers, visibleCategories.member]);

  // Determine temporal status of an event
  const getTemporalStatus = useCallback((event: typeof allLocatedEvents[0]): "past" | "current" | "future" => {
    if (!event.startDate) return "current";
    const eventStart = new Date(event.startDate);
    eventStart.setHours(0, 0, 0, 0);
    const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;
    eventEnd.setHours(23, 59, 59, 999);
    if (today > eventEnd) return "past";
    if (today < eventStart) return "future";
    return "current";
  }, [today]);

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    // Clear previous markers and polylines
    markersRef.current.forEach(m => (m.map = null));
    markersRef.current = [];
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasMarkers = false;

    // Add member markers
    if (visibleCategories.member) {
      locatedMembers.forEach((member) => {
        if (!member.coords) return;

        const markerContent = document.createElement("div");
        const avatarUrl = (member as any).avatarUrl;
        const avatarColor = (member as any).avatarColor || "#4ECDC4";
        let avatarInner: string;
        if (avatarUrl) {
          avatarInner = `<img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
        } else {
          avatarInner = `<span style="font-weight:bold;color:white;">${member.displayName.charAt(0).toUpperCase()}</span>`;
        }
        markerContent.innerHTML = `
          <div style="
            background: ${avatarColor};
            border-radius: 50%;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            box-shadow: 0 3px 10px ${avatarColor}66;
            border: 3px solid white;
            overflow: hidden;
          ">${avatarInner}</div>
        `;

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: member.coords,
          title: `${member.displayName} – ${member.currentLocation}`,
          content: markerContent,
          zIndex: 100,
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 150px;">
              <strong>${member.displayName}</strong><br/>
              <span style="color: #666;">${member.currentLocation}</span><br/>
              ${member.locationFrom ? `<span style="color: #888; font-size: 12px;">Von: ${new Date(member.locationFrom).toLocaleDateString("de-CH")}</span><br/>` : ""}
              ${member.locationTo ? `<span style="color: #888; font-size: 12px;">Bis: ${new Date(member.locationTo).toLocaleDateString("de-CH")}</span>` : ""}
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open({ anchor: marker, map });
        });

        markersRef.current.push(marker);
        bounds.extend(member.coords);
        hasMarkers = true;
      });
    }

    // Add event markers with category-based styling
    filteredEvents.forEach((event) => {
      if (!event.coords) return;
      const temporal = getTemporalStatus(event);
      const catConfig = CATEGORY_CONFIG[event.category];
      const opacity = temporal === "past" ? 0.4 : temporal === "future" ? 0.6 : 1;
      const borderStyle = temporal === "future" ? "2px dashed" : "2px solid";

      const markerContent = document.createElement("div");
      const iconSvg = event.category === "hotel"
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>`
        : event.category === "transport"
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>`
        : event.category === "activity"
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

      markerContent.innerHTML = `
        <div style="
          opacity: ${opacity};
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          <div style="
            background: ${catConfig.color};
            border-radius: 50%;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: ${borderStyle} white;
            box-shadow: 0 2px 8px ${catConfig.color}44;
          ">${iconSvg}</div>
          <div style="
            background: rgba(20, 20, 40, 0.9);
            border-radius: 6px;
            padding: 2px 6px;
            font-size: 10px;
            color: white;
            font-weight: 500;
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          ">${event.title}</div>
        </div>
      `;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: event.coords!,
        title: event.title,
        content: markerContent,
        zIndex: temporal === "current" ? 50 : temporal === "future" ? 30 : 10,
      });

      const dateStr = event.startDate ? formatDate(event.startDate) : "";
      const endStr = event.endDate ? ` – ${formatDate(event.endDate)}` : "";
      const statusLabel = temporal === "past" ? "✓ Vergangen" : temporal === "future" ? "⏳ Geplant" : "● Aktuell";

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 180px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <span style="width:10px;height:10px;border-radius:50%;background:${catConfig.color};display:inline-block;"></span>
              <strong>${event.title}</strong>
            </div>
            <div style="font-size:12px;color:#666;">${event.location}</div>
            ${dateStr ? `<div style="font-size:11px;color:#888;margin-top:4px;">${dateStr}${endStr}</div>` : ""}
            <div style="font-size:11px;color:${temporal === 'past' ? '#999' : temporal === 'current' ? '#4ADE80' : '#C9A84C'};margin-top:2px;">${statusLabel}</div>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open({ anchor: marker, map });
      });

      markersRef.current.push(marker);
      bounds.extend(event.coords!);
      hasMarkers = true;
    });

    // Add accommodation markers
    if (accommodations) {
      accommodations.forEach((acc) => {
        const coords = getLocationCoords(acc.address || acc.name);
        if (!coords) return;

        const markerContent = document.createElement("div");
        markerContent.innerHTML = `
          <div style="
            background: #3B82F6;
            border-radius: 8px;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 3px 10px rgba(59, 130, 246, 0.6);
            border: 2px solid white;
          ">🏨</div>
        `;

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: coords,
          title: acc.name,
          content: markerContent,
          zIndex: 40,
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 150px;">
              <strong>${acc.name}</strong><br/>
              <span style="color: #666; font-size: 12px;">${acc.type}</span><br/>
              ${acc.checkinDate ? `<span style="color: #888; font-size: 11px;">Check-in: ${new Date(acc.checkinDate).toLocaleDateString("de-CH")}</span><br/>` : ""}
              ${acc.checkoutDate ? `<span style="color: #888; font-size: 11px;">Check-out: ${new Date(acc.checkoutDate).toLocaleDateString("de-CH")}</span>` : ""}
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open({ anchor: marker, map });
        });

        markersRef.current.push(marker);
        bounds.extend(coords);
        hasMarkers = true;
      });
    }

    // Add stay markers
    if (stays) {
      stays.forEach((stay) => {
        const coords = getLocationCoords(stay.location);
        if (!coords) return;

        const markerContent = document.createElement("div");
        markerContent.innerHTML = `
          <div style="
            background: #10B981;
            border-radius: 8px;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 3px 10px rgba(16, 185, 129, 0.6);
            border: 2px solid white;
          ">📍</div>
        `;

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: coords,
          title: stay.location,
          content: markerContent,
          zIndex: 35,
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 150px;">
              <strong>${stay.location}</strong><br/>
              <span style="color: #888; font-size: 11px;">${new Date(stay.fromDate).toLocaleDateString("de-CH")} – ${new Date(stay.toDate).toLocaleDateString("de-CH")}</span><br/>
              ${stay.note ? `<span style="color: #666; font-size: 11px;">${stay.note}</span>` : ""}
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open({ anchor: marker, map });
        });

        markersRef.current.push(marker);
        bounds.extend(coords);
        hasMarkers = true;
      });
    }

    // Draw route lines (chronological, split by past/future)
    if (filteredEvents.length > 1) {
      const sorted = [...filteredEvents]
        .filter(e => e.startDate)
        .sort((a, b) => (a.startDate!.getTime()) - (b.startDate!.getTime()));

      if (sorted.length > 1) {
        // Split into past and future segments
        const pastPath: google.maps.LatLngLiteral[] = [];
        const futurePath: google.maps.LatLngLiteral[] = [];
        let lastPastCoord: google.maps.LatLngLiteral | null = null;

        sorted.forEach(e => {
          const temporal = getTemporalStatus(e);
          if (temporal === "past" || temporal === "current") {
            pastPath.push(e.coords!);
            lastPastCoord = e.coords!;
          } else {
            if (futurePath.length === 0 && lastPastCoord) {
              futurePath.push(lastPastCoord); // Connect from last past point
            }
            futurePath.push(e.coords!);
          }
        });

        // Past route: solid line
        if (pastPath.length > 1) {
          const pastLine = new google.maps.Polyline({
            path: pastPath,
            geodesic: true,
            strokeColor: "#6B7280",
            strokeOpacity: 0.8,
            strokeWeight: 3,
            icons: [{
              icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, fillOpacity: 0.8 },
              offset: "50%",
              repeat: "150px",
            }],
            map,
          });
          polylinesRef.current.push(pastLine);
        }

        // Future route: dashed line
        if (futurePath.length > 1) {
          const futureLine = new google.maps.Polyline({
            path: futurePath,
            geodesic: true,
            strokeColor: "#C9A84C",
            strokeOpacity: 0,
            strokeWeight: 3,
            icons: [
              {
                icon: { path: "M 0,-1 0,1", strokeOpacity: 0.7, scale: 3, strokeColor: "#C9A84C" },
                offset: "0",
                repeat: "12px",
              },
              {
                icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, fillOpacity: 0.6, strokeColor: "#C9A84C" },
                offset: "50%",
                repeat: "150px",
              },
            ],
            map,
          });
          polylinesRef.current.push(futureLine);
        }
      }
    }

    // Fit bounds
    if (hasMarkers) {
      const totalPoints = filteredEvents.length + locatedMembers.length;
      if (totalPoints > 1) {
        map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
      } else {
        const firstCoords = filteredEvents[0]?.coords || locatedMembers[0]?.coords;
        if (firstCoords) {
          map.setCenter(firstCoords);
          map.setZoom(10);
        }
      }
    }
  }, [locatedMembers, filteredEvents, visibleCategories, getTemporalStatus, accommodations, stays]);

  const toggleCategory = (cat: EventCategory) => {
    setVisibleCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleMember = (memberId: number) => {
    setHiddenMembers(prev => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[oklch(0.11_0.02_255)] flex items-center justify-center">
        <div className="text-center glass-card p-8 rounded-2xl max-w-sm">
          <MapPin className="w-10 h-10 text-[oklch(0.78_0.14_75)] mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-white mb-2">Login erforderlich</h2>
          <a href="/login" className="inline-block px-6 py-3 rounded-xl bg-gold-gradient text-[oklch(0.11_0.02_255)] font-semibold text-sm">
            Einloggen
          </a>
        </div>
      </div>
    );
  }

  if (!activeTripId && !loading) {
    return (
      <div className="min-h-screen bg-[oklch(0.11_0.02_255)] flex items-center justify-center">
        <div className="text-center glass-card p-8 rounded-2xl max-w-sm">
          <MapPin className="w-10 h-10 text-[oklch(0.65_0.22_150)] mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-white mb-2">Keine Reise vorhanden</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(0.11_0.02_255)]">
      <div className="container mx-auto px-4 lg:px-8 pt-20 pb-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <span className="text-[oklch(0.78_0.14_75)] text-sm font-medium uppercase tracking-widest">Reiseroute</span>
          <h1 className="text-3xl md:text-4xl font-bold text-white mt-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Wer ist <span className="text-gold-gradient">wo?</span>
          </h1>
        </motion.div>

        {/* View Mode Toggle + Date Slider */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="mb-4 space-y-3">
          {/* View mode toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setViewMode("all"); setDayOffset(0); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                viewMode === "all"
                  ? "bg-[oklch(0.78_0.14_75/20%)] text-[oklch(0.78_0.14_75)] border border-[oklch(0.78_0.14_75/40%)]"
                  : "glass-card text-[oklch(0.55_0.02_255)] hover:text-white"
              }`}
            >
              <Route className="w-4 h-4 inline mr-1.5" />Gesamte Reise
            </button>
            <button
              onClick={() => { setViewMode("today"); setDayOffset(0); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                viewMode === "today"
                  ? "bg-[oklch(0.72_0.14_185/20%)] text-[oklch(0.72_0.14_185)] border border-[oklch(0.72_0.14_185/40%)]"
                  : "glass-card text-[oklch(0.55_0.02_255)] hover:text-white"
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-1.5" />Tag für Tag
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`ml-auto px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                showFilters
                  ? "bg-[oklch(0.55_0.14_285/20%)] text-[oklch(0.75_0.14_285)] border border-[oklch(0.75_0.14_285/40%)]"
                  : "glass-card text-[oklch(0.55_0.02_255)] hover:text-white"
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Date slider (only in "today" mode) */}
          {viewMode === "today" && (
            <div className="glass-card rounded-xl p-3 flex items-center gap-3">
              <button
                onClick={() => setDayOffset(prev => prev - 1)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-[oklch(0.65_0.02_255)] hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 text-center">
                <p className="text-white font-semibold text-sm">
                  {selectedDate.toLocaleDateString("de-CH", { weekday: "short", day: "2-digit", month: "long", year: "numeric" })}
                </p>
                <p className="text-[oklch(0.50_0.02_255)] text-xs mt-0.5">
                  {dayOffset === 0 ? "Heute" : dayOffset === -1 ? "Gestern" : dayOffset === 1 ? "Morgen" : `${Math.abs(dayOffset)} Tage ${dayOffset > 0 ? "in der Zukunft" : "vergangen"}`}
                </p>
              </div>
              <button
                onClick={() => setDayOffset(prev => prev + 1)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-[oklch(0.65_0.02_255)] hover:text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              {dayOffset !== 0 && (
                <button
                  onClick={() => setDayOffset(0)}
                  className="text-xs px-2 py-1 rounded-lg bg-[oklch(0.78_0.14_75/20%)] text-[oklch(0.78_0.14_75)] hover:bg-[oklch(0.78_0.14_75/30%)] transition-colors"
                >
                  Heute
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* Filter Panel (collapsible) */}
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4 glass-card rounded-xl p-4 space-y-4">
            {/* Category filters */}
            <div>
              <p className="text-xs text-[oklch(0.50_0.02_255)] uppercase tracking-wider mb-2 font-medium">Kategorien</p>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(CATEGORY_CONFIG) as [EventCategory, typeof CATEGORY_CONFIG[EventCategory]][]).map(([key, config]) => {
                  const IconComp = config.Icon;
                  const isActive = visibleCategories[key];
                  return (
                    <button
                      key={key}
                      onClick={() => toggleCategory(key)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? "border border-current"
                          : "border border-transparent opacity-40"
                      }`}
                      style={{ color: config.color, background: isActive ? `${config.color}15` : "transparent" }}
                    >
                      {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <IconComp className="w-3.5 h-3.5" />
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Per-member filters */}
            {members && members.filter(m => m.currentLocation).length > 0 && (
              <div>
                <p className="text-xs text-[oklch(0.50_0.02_255)] uppercase tracking-wider mb-2 font-medium">Personen ein-/ausblenden</p>
                <div className="flex flex-wrap gap-2">
                  {members.filter(m => m.currentLocation).map((m) => {
                    const isVisible = !hiddenMembers.has(m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => toggleMember(m.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isVisible
                            ? "bg-[oklch(0.72_0.14_185/15%)] text-[oklch(0.72_0.14_185)] border border-[oklch(0.72_0.14_185/30%)]"
                            : "bg-transparent text-[oklch(0.40_0.02_255)] border border-[oklch(0.25_0.02_255)] opacity-50"
                        }`}
                      >
                        <MemberAvatar
                          avatarUrl={(m as any).avatarUrl}
                          avatarIcon={(m as any).avatarIcon}
                          avatarColor={(m as any).avatarColor}
                          displayName={m.displayName}
                          size="xs"
                        />
                        {m.displayName}
                        {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Legend */}
            <div>
              <p className="text-xs text-[oklch(0.50_0.02_255)] uppercase tracking-wider mb-2 font-medium">Legende</p>
              <div className="flex flex-wrap gap-3 text-xs text-[oklch(0.60_0.02_255)]">
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#3B82F6] inline-flex items-center justify-center text-white" style={{fontSize: '8px'}}>H</span> Unterkunft (blau)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#10B981] inline-flex items-center justify-center text-white" style={{fontSize: '8px'}}>S</span> Aufenthalt (grün)
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#6B7280]" /> Vergangen (grau)
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#4ADE80]" /> Aktuell (farbig)
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#C9A84C]" /> Geplant (halbtransparent)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-6 h-0.5 bg-[#6B7280] inline-block rounded"></span> Vergangene Route
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-6 h-0.5 border-t-2 border-dashed border-[#C9A84C] inline-block"></span> Geplante Route
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }} className="flex flex-wrap gap-2 mb-4">
          <div className="glass-card px-3 py-1.5 rounded-full text-xs text-[oklch(0.65_0.02_255)] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[oklch(0.78_0.14_75)]" />
            {filteredEvents.length} Orte
          </div>
          <div className="glass-card px-3 py-1.5 rounded-full text-xs text-[oklch(0.65_0.02_255)] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[oklch(0.72_0.14_185)]" />
            {locatedMembers.length} Personen
          </div>
          {viewMode === "today" && (
            <div className="glass-card px-3 py-1.5 rounded-full text-xs text-[oklch(0.65_0.02_255)] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[oklch(0.75_0.14_285)]" />
              {formatDate(selectedDate)}
            </div>
          )}
        </motion.div>

        {/* Empty state */}
        {filteredEvents.length === 0 && locatedMembers.length === 0 && !isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 rounded-2xl mb-4 text-center">
            <MapPin className="w-8 h-8 text-[oklch(0.55_0.02_255)] mx-auto mb-2" />
            <p className="text-[oklch(0.55_0.02_255)]">
              {viewMode === "today"
                ? `Keine Einträge für ${formatDate(selectedDate)}. Versuche einen anderen Tag oder wechsle zur Gesamtansicht.`
                : "Noch keine Standorte. Erstelle Itinerary-Einträge oder trage deinen Standort unter \"Meine Reise\" ein."}
            </p>
          </motion.div>
        )}

        {/* Map */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-2xl overflow-hidden border border-white/10">
          {isLoading ? (
            <div className="h-[500px] flex items-center justify-center bg-[oklch(0.14_0.025_255)]">
              <Loader2 className="w-6 h-6 animate-spin text-[oklch(0.55_0.02_255)]" />
            </div>
          ) : (
            <MapView
              className="h-[350px] sm:h-[450px] md:h-[600px]"
              initialCenter={{ lat: 13.7563, lng: 100.5018 }}
              initialZoom={6}
              onMapReady={handleMapReady}
            />
          )}
        </motion.div>

        {/* Members without location */}
        {members && members.filter(m => !m.currentLocation).length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card p-4 rounded-2xl mt-4">
            <p className="text-xs text-[oklch(0.50_0.02_255)] mb-2">Noch ohne Standort:</p>
            <div className="flex flex-wrap gap-2">
              {members.filter(m => !m.currentLocation).map((m) => (
                <span key={m.id} className="text-xs bg-[oklch(1_0_0/8%)] px-2 py-1 rounded-lg text-[oklch(0.60_0.02_255)] flex items-center gap-1">
                  <MemberAvatar avatarUrl={(m as any).avatarUrl} avatarIcon={(m as any).avatarIcon} avatarColor={(m as any).avatarColor} displayName={m.displayName} size="xs" />
                  {m.displayName}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
