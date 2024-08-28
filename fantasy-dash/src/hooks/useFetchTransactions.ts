import { useState, useCallback } from 'react';
import useLeagueStore from '../store/testStore';

const useFetchTransactions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setLeagueTransactions = useLeagueStore((state) => state.setLeagueTransactions);

  const fetchTransactions = useCallback(async (leagueId: string, season: string) => {
    setLoading(true);
    setError(null);
    const transactions: any[] = [];

    try {
      for (let round = 1; round <= 17; round++) {
        const response = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/transactions/${round}`);
        if (!response.ok) throw new Error(`Failed to fetch transactions for round ${round}`);
        const roundTransactions = await response.json();
        transactions.push(...roundTransactions);
      }

      setLeagueTransactions({ [leagueId]: { [season]: transactions } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [setLeagueTransactions]);

  return { loading, error, fetchTransactions };
};

export default useFetchTransactions;