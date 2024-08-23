import { useState } from 'react';
import useLeagueStore from '../store/testStore';

interface BracketMatch {
  r: number;
  m: number;
  t1: number;
  t2: number;
  w: number;
  l: number;
  t1_from: { w: number; l: number } | null;
  t2_from: { w: number; l: number } | null;
  p: number;
}

interface Bracket {
  [key: string]: BracketMatch;
}

const useFetchLeagueBrackets = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeagueBrackets = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    const allBrackets: { [leagueId: string]: { winners: Bracket, losers: Bracket } } = {};

    try {
      const leagueData = useLeagueStore.getState().leagueData;

      for (const league of leagueData) {
        const leagueId = league.league_id;
        
        const winnersResponse = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/winners_bracket`);
        const winnersBracket: Bracket = await winnersResponse.json();

        const losersResponse = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/losers_bracket`);
        const losersBracket: Bracket = await losersResponse.json();

        allBrackets[leagueId] = {
          winners: winnersBracket,
          losers: losersBracket
        };
      }

      // Update the store with the fetched brackets
      useLeagueStore.getState().setLeagueBrackets(allBrackets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { fetchLeagueBrackets, loading, error };
};

export default useFetchLeagueBrackets;