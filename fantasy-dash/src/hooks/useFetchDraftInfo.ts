import { useState, useCallback } from 'react';
import useLeagueStore from '../store/testStore';

const useFetchDraftInfo = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const draftId = useLeagueStore((state) => state.leagueData); // Retrieve draftId from store
  const setDraftInfo = useLeagueStore((state) => state.setDraftInfo);

  const fetchDraftInfo = useCallback(async () => {
    if (!draftId) {
      console.log("No draftId provided to fetchDraftInfo.");
      return;
    }

    console.log("Starting to fetch draft info for draftId:", draftId);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://api.sleeper.app/v1/draft/${draftId}`);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const draftData = await response.json();
      console.log("Draft Data Fetched:", draftData);

      setDraftInfo({
        draft_id: draftData.draft_id,
        draft_order: draftData.draft_order,
        season: draftData.season,
        start_time: draftData.start_time,
        status: draftData.status,
      });
    } catch (err) {
      console.error("Error fetching draft info:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
      console.log("Finished fetching draft info.");
    }
  }, [draftId, setDraftInfo]);

  return { loading, error, fetchDraftInfo };
};

export default useFetchDraftInfo;
