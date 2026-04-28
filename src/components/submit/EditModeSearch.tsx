import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { GROUPING_ENABLED, GROUP_LABEL } from '../../lib/constants';
import type { Person } from '../../types';

interface EditModeSearchProps {
  onSelect: (person: Person) => void;
}

export default function EditModeSearch({ onSelect }: EditModeSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Person[]>([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(timerRef.current);
    const delay = query.length < 2 ? 0 : 300;
    timerRef.current = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      const { data } = await supabase
        .from('people')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(5);
      if (data) {
        setResults(data as Person[]);
        setOpen(true);
      }
    }, delay);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  return (
    <div className="relative mb-6">
      <label className="block text-sm font-sans font-medium text-gray-700 mb-1">
        Search your name
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder="Type your name to find your entry..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {results.map((person) => (
            <li
              key={person.id}
              onMouseDown={() => onSelect(person)}
              className="px-3 py-2 text-sm font-sans hover:bg-surface cursor-pointer"
            >
              <span className="font-medium">{person.name}</span>
              {GROUPING_ENABLED && person.group_value && (
                <span className="text-gray-400 ml-2">
                  {GROUP_LABEL} {person.group_value}
                </span>
              )}
              {person.locations[0]?.city && (
                <span className="text-gray-400 ml-1">· {person.locations[0].city}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {query.length >= 2 && results.length === 0 && (
        <p className="text-xs text-gray-400 font-sans mt-1">
          No matching entries found. Try a different spelling or submit a new entry.
        </p>
      )}
    </div>
  );
}
