import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
  addresstype?: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (location: string, lat: number, lon: number) => void;
  className?: string;
}

export const LocationAutocomplete = ({ value, onChange, className }: LocationAutocompleteProps) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchLocations = async (q: string) => {
    if (q.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=8&addressdetails=1&featuretype=city`,
        { headers: { "Accept-Language": "en" } },
      );
      // If city-only search returns nothing, fall back to broader search
      let data: LocationResult[] = await res.json();
      if (data.length === 0) {
        const fallback = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`,
          { headers: { "Accept-Language": "en" } },
        );
        data = await fallback.json();
        // Filter out amenities/shops/restaurants - only keep places
        data = data.filter((r) =>
          ["city", "town", "village", "state", "country", "county", "municipality"].includes(r.addresstype || ""),
        );
      }

      setResults(data);
      setIsOpen(data.length > 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocations(val), 400);
  };

  const handleSelect = (result: LocationResult) => {
    const name = result.display_name;
    setQuery(name);
    setIsOpen(false);
    onChange(name, parseFloat(result.lat), parseFloat(result.lon));
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Start typing your city..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={(e) => {
            // Select all so typing replaces auto-filled labels like "Your current location"
            e.currentTarget.select();
            if (results.length > 0) setIsOpen(true);
          }}
          className={`pl-10 ${className}`}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(r)}
              className="w-full text-left px-4 py-3 text-sm hover:bg-accent transition-colors border-b border-border/50 last:border-0 text-foreground"
            >
              <span className="line-clamp-1">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
