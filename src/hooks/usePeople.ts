import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Person } from '../types';

export function usePeople() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPeople = useCallback(async () => {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching people:', error);
    } else {
      setPeople((data as Person[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Initial fetch — guarded against unmount with `cancelled`.
    (async () => {
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (error) console.error('Error fetching people:', error);
      else setPeople((data as Person[]) ?? []);
      setLoading(false);
    })();

    // Realtime: refetch whenever any row changes.
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

  return { people, loading, refetch: fetchPeople };
}
