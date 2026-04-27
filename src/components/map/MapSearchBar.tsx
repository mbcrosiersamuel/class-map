import { useState, useRef, useEffect, useCallback } from 'react';
import { geocodeSearch } from '../../lib/geocode';
import { PRIMARY_COLOR } from '../../lib/constants';

interface MapSearchBarProps {
  onFlyTo: (lat: number, lng: number) => void;
}

interface Suggestion {
  place_name: string;
  latitude: number;
  longitude: number;
}

export default function MapSearchBar({ onFlyTo }: MapSearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      const results = await geocodeSearch(q);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    } catch {
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const handleSelect = (suggestion: Suggestion) => {
    setQuery(suggestion.place_name);
    setSuggestions([]);
    setIsOpen(false);
    onFlyTo(suggestion.latitude, suggestion.longitude);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-auto absolute top-4 left-6 z-10 w-72 max-w-[calc(100%-3rem)]">
      <div className="relative">
        {/* Search emoji */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <span className="text-sm">🔍</span>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search for a city..."
          className="w-full rounded-lg border border-gray-200 bg-white/95 backdrop-blur-sm
                     py-2 pl-9 pr-9 text-sm shadow-md placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-offset-1
                     transition-shadow hover:shadow-lg"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        />

        {/* Clear button or loading spinner */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2.5">
          {loading ? (
            <div
              className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300"
              style={{ borderTopColor: PRIMARY_COLOR }}
            />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                setIsOpen(false);
              }}
              className="flex items-center justify-center w-5 h-5 rounded-full
                         bg-gray-200 hover:bg-gray-300 transition-colors"
              aria-label="Clear search"
            >
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          className="mt-1 max-h-60 overflow-auto rounded-lg border border-gray-200
                     bg-white/95 backdrop-blur-sm shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li key={`${s.place_name}-${i}`}>
              <button
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50
                           transition-colors border-b border-gray-100 last:border-b-0"
                style={{ fontFamily: '"DM Sans", sans-serif' }}
              >
                <span className="text-gray-700">{s.place_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
