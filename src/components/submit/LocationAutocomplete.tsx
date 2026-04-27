import { useState, useEffect, useRef } from 'react';
import { geocodeSearch, type GeocodeSuggestion } from '../../lib/geocode';

interface LocationResult {
  city: string;
  state: string | null;
  country: string;
  latitude: number;
  longitude: number;
}

interface LocationAutocompleteProps {
  onSelect: (location: LocationResult) => void;
  disabled?: boolean;
  value?: string;
  label?: string;
  placeholder?: string;
}

export default function LocationAutocomplete({
  onSelect,
  disabled,
  value: controlledValue,
  label = 'Location',
  placeholder = 'Start typing a city...',
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(controlledValue ?? '');
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Sync local query to controlledValue prop changes (setState-during-render pattern).
  const [prevControlled, setPrevControlled] = useState(controlledValue);
  if (prevControlled !== controlledValue) {
    setPrevControlled(controlledValue);
    if (controlledValue !== undefined) setQuery(controlledValue);
  }

  useEffect(() => {
    if (disabled) return;
    clearTimeout(timerRef.current);

    // Both branches happen inside a scheduled callback so setState fires
    // asynchronously, not in the effect body.
    const delay = query.length < 2 ? 0 : 300;
    timerRef.current = setTimeout(async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }
      const results = await geocodeSearch(query);
      setSuggestions(results);
      setOpen(true);
    }, delay);

    return () => clearTimeout(timerRef.current);
  }, [query, disabled]);

  return (
    <div className="relative">
      <label className="block text-sm font-sans font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:bg-gray-100 disabled:text-gray-500"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={() => {
                setQuery(s.place_name);
                setOpen(false);
                onSelect({
                  city: s.city,
                  state: s.state,
                  country: s.country,
                  latitude: s.latitude,
                  longitude: s.longitude,
                });
              }}
              className="px-3 py-2 text-sm font-sans hover:bg-surface cursor-pointer"
            >
              {s.place_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
