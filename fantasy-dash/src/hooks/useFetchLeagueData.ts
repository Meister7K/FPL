// @ts-nocheck
import { useState } from 'react';
import useLeagueStore from '../store/testStore';


const useFetchLeagueData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeagueData = async (leagueId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    const leagueDataArray = [];

    try {
      let currentLeagueId = leagueId;
      while (currentLeagueId) {
        const response = await fetch(`https://api.sleeper.app/v1/league/${currentLeagueId}`);
        const leagueData = await response.json();

      
        leagueDataArray.push({
          ...leagueData,
          season: leagueData.season, 
        });

     
        currentLeagueId = leagueData.previous_league_id;
      }

   
      useLeagueStore.getState().setLeagueData(leagueDataArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { fetchLeagueData, loading, error };
};

export default useFetchLeagueData;
