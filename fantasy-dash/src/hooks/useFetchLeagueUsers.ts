// @ts-nocheck
import { useState } from 'react';
import useLeagueStore from '../store/testStore';

interface LeagueUser {
  user_id: string;
  display_name: string;
  // Add other relevant user fields here
}

const useFetchLeagueUsers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeagueUsers = async (leagueId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`);
      const users: LeagueUser[] = await response.json();

      // Update the store with the fetched users
      useLeagueStore.getState().setLeagueUsers(users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { fetchLeagueUsers, loading, error };
};

export default useFetchLeagueUsers;