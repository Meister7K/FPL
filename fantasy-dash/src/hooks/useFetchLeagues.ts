import { useState } from 'react';
import useLeagueStore from '../store/testStore';

const useFetchLeagues = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeagues = async (userId: string, year: string): Promise<any[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${year}`);
      const leagues = await response.json();
      if (!leagues || leagues.length === 0) throw new Error("No leagues found");

      useLeagueStore.getState().setLeagues(leagues);
      return leagues;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { fetchLeagues, loading, error };
};

export default useFetchLeagues;
