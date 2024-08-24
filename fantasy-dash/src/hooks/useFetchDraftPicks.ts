import { useState, useEffect } from 'react';
import useLeagueStore from '../store/testStore';

interface DraftPick {
  player_id: string;
  picked_by: string;
  round: number;
  draft_slot: number;
  pick_no: number;
  // Add other relevant fields
}

const useFetchDraftPicks = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const leagueData = useLeagueStore((state) => state.leagueData);

  const fetchDraftPicks = async (draftId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://api.sleeper.app/v1/draft/${draftId}/picks`);
      const draftPicks: DraftPick[] = await response.json();

      const sortedDraftPicks = draftPicks.sort((a, b) => a.pick_no - b.pick_no);

      // Update the store with the fetched draft picks
      useLeagueStore.getState().setDraftPicks(sortedDraftPicks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

//   useEffect(() => {
//     if (leagueData.length > 0 && leagueData[0].draft_id) {
//       // Fetch draft picks every second
//       const intervalId = setInterval(() => {
//         fetchDraftPicks(leagueData[0].draft_id);
//       }, 1000);

//       // Clear the interval when the component unmounts or draftId changes
//       return () => clearInterval(intervalId);
//     }
//   }, [leagueData]);

  return { loading, error };
};

export default useFetchDraftPicks;
