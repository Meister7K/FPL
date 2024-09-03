import { useState } from 'react';
import useLeagueStore from '../store/testStore';

interface Matchup {
  matchup_id: number;
  roster_id: number;
  points: number;
  // Add other relevant matchup fields here
}

const useFetchLeagueMatchups = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeagueMatchups = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    const allMatchups: { [leagueId: string]: Matchup[][] } = {};

    try {
      const leagueData = useLeagueStore.getState().leagueData;

      for (const league of leagueData) {
        const leagueId = league.league_id;
        allMatchups[leagueId] = [];

        for (let week = 1; week <= 18; week++) {
          const response = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`);
          const matchups: Matchup[] = await response.json();
          allMatchups[leagueId][week - 1] = matchups;
        }
      }

      // Update the store with the fetched matchups
      useLeagueStore.getState().setLeagueMatchups(allMatchups);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { fetchLeagueMatchups, loading, error };
};

export default useFetchLeagueMatchups;