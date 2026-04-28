import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Person } from '../types';

export interface UsePeopleResult {
  people: Person[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePeople(): UsePeopleResult {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPeople = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('people')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message || 'Could not load classmates.');
    } else {
      setPeople((data as Person[]) ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error: fetchError } = await supabase
        .from('people')
        .select('*')
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message || 'Could not load classmates.');
      } else {
        setPeople((data as Person[]) ?? []);
        setError(null);
      }
      setLoading(false);
    })();

    const channel = supabase
      .channel('people-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'people' },
        () => {
          if (!cancelled) fetchPeople();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [fetchPeople]);

  return { people, loading, error, refetch: fetchPeople };
}
