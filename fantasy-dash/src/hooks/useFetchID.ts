// @ts-nocheck
import { useState } from 'react';
import useLeagueStore from '../store/testStore';

const useFetchUserId = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserId = async (username: string): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://api.sleeper.app/v1/user/${username}`);
      const data = await response.json();
      if (!data.user_id) throw new Error("User ID not found");

      useLeagueStore.getState().setUserId(data.user_id);
      return data.user_id;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchUserId, loading, error };
};

export default useFetchUserId;
