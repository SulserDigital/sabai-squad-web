// PlacesAutocomplete – Google Places search with autocomplete suggestions
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { MapPin, Loader2, ExternalLink, Star } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PlaceResult {
  description: string;
  placeId: string;
  mainText: string;
  secondaryText: string;
}

interface PlaceDetails {
  name: string;
  address: string;
  lat: number;
  lng: number;
  mapsUrl: string;
  website: string;
  rating: number | null;
}

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: PlaceDetails) => void;
  placeholder?: string;
  className?: string;
}

export function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Ort suchen...",
  className = "",
}: PlacesAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autocomplete query
  const { data: suggestions, isLoading } = trpc.places.autocomplete.useQuery(
    { input: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 && showSuggestions && !selectedPlaceId }
  );

  // Place details query
  const { data: placeDetails } = trpc.places.details.useQuery(
    { placeId: selectedPlaceId! },
    { enabled: !!selectedPlaceId }
  );

  // When place details arrive, notify parent
  useEffect(() => {
    if (placeDetails && selectedPlaceId) {
      onPlaceSelect?.(placeDetails);
      setSelectedPlaceId(null);
    }
  }, [placeDetails, selectedPlaceId]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleInputChange = (val: string) => {
    setQuery(val);
    onChange(val);
    setSelectedPlaceId(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.length >= 2) {
        setDebouncedQuery(val);
        setShowSuggestions(true);
      } else {
        setDebouncedQuery("");
        setShowSuggestions(false);
      }
    }, 300);
  };

  const handleSelect = (place: PlaceResult) => {
    setQuery(place.mainText);
    onChange(place.mainText);
    setShowSuggestions(false);
    setSelectedPlaceId(place.placeId);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="bg-[oklch(1_0_0/8%)] border-white/10 text-white pl-9"
        />
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.55_0.02_255)]" strokeWidth={1.5} />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.55_0.02_255)] animate-spin" />
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-[oklch(0.14_0.025_255)] border border-white/10 rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((place) => (
            <button
              key={place.placeId}
              onClick={() => handleSelect(place)}
              className="w-full text-left px-4 py-3 hover:bg-[oklch(1_0_0/8%)] transition-colors flex items-start gap-3 border-b border-white/5 last:border-0"
            >
              <MapPin className="w-4 h-4 text-[oklch(0.78_0.14_75)] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
              <div className="min-w-0">
                <p className="text-sm text-white font-medium truncate">{place.mainText}</p>
                <p className="text-xs text-[oklch(0.50_0.02_255)] truncate">{place.secondaryText}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected place info */}
      {placeDetails && (
        <div className="mt-2 p-3 rounded-xl bg-[oklch(0.78_0.14_75/10%)] border border-[oklch(0.78_0.14_75/20%)]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-white font-medium truncate">{placeDetails.name}</p>
              <p className="text-xs text-[oklch(0.55_0.02_255)] truncate">{placeDetails.address}</p>
              {placeDetails.rating && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 text-[oklch(0.78_0.14_75)]" fill="currentColor" />
                  <span className="text-xs text-[oklch(0.78_0.14_75)]">{placeDetails.rating}</span>
                </div>
              )}
            </div>
            {placeDetails.mapsUrl && (
              <a
                href={placeDetails.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 p-1.5 rounded-lg bg-[oklch(0.78_0.14_75/20%)] text-[oklch(0.78_0.14_75)] hover:bg-[oklch(0.78_0.14_75/30%)] transition-colors"
                title="In Google Maps öffnen"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
