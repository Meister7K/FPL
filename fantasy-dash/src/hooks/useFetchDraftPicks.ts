import { useState, useCallback } from 'react';
import useLeagueStore from '../store/testStore';

const useFetchDraftPicks = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setDraftPicks = useLeagueStore((state) => state.setDraftPicks);

  const fetchDraftPicks = useCallback(async (draftId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://api.sleeper.app/v1/draft/${draftId}/picks`);
      if (!response.ok) throw new Error('Network response was not ok');
      const draftPicks = await response.json();

      const sortedDraftPicks = draftPicks.sort((a: any, b: any) => a.pick_no - b.pick_no);
      setDraftPicks(sortedDraftPicks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [setDraftPicks]);

  return { loading, error, fetchDraftPicks };
};

export default useFetchDraftPicks;