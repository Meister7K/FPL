// @ts-nocheck
import { useState } from 'react';
import useLeagueStore from '../store/testStore';

interface LeagueData {
  league_id: string;
  season: string;
  total_rosters: number;
}

interface BracketMatch {
  r: number;
  m: number;
  t1: number | null;
  t2: number | null;
  w: number | null;
  l: number | null;
  t1_from?: { w?: number; l?: number };
  t2_from?: { w?: number; l?: number };
  p?: number;
}

interface Bracket {
  winners: BracketMatch[];
  losers: BracketMatch[];
}

interface ProcessedBracketEntry {
  roster_id: number;
  place: number;
  season: string;
}

const useFetchLeagueBrackets = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processBracketData = (bracket: Bracket, leagueData: LeagueData): ProcessedBracketEntry[] => {
    const processedData: ProcessedBracketEntry[] = [];
    const totalTeams = leagueData.total_rosters;

    // Process winners bracket
    bracket.winners.forEach((match) => {
      if (match.p !== undefined) {
        if (match.w !== null) {
          processedData.push({ roster_id: match.w, place: match.p, season: leagueData.season });
        }
        if (match.l !== null) {
          processedData.push({ roster_id: match.l, place: match.p + 1, season: leagueData.season });
        }
      }
    });

    // Process losers bracket
    bracket.losers.forEach((match) => {
      if (match.p !== undefined) {
        if (match.w !== null) {
          processedData.push({ 
            roster_id: match.w, 
            place: totalTeams - match.p + 1, 
            season: leagueData.season 
          });
        }
        if (match.l !== null) {
          processedData.push({ 
            roster_id: match.l, 
            place: totalTeams - match.p, 
            season: leagueData.season 
          });
        }
      }
    });

    return processedData;
  };

  const fetchLeagueBrackets = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    const allBrackets: { [leagueId: string]: ProcessedBracketEntry[] } = {};

    try {
      const leagueData = useLeagueStore.getState().leagueData;

      for (const league of leagueData) {
        const leagueId = league.league_id;
        const season= league.season
        
        const winnersResponse = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/winners_bracket`);
        const winnersBracket: BracketMatch[] = await winnersResponse.json();

        const losersResponse = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/losers_bracket`);
        const losersBracket: BracketMatch[] = await losersResponse.json();

        const processedBracket = processBracketData(
          { winners: winnersBracket, losers: losersBracket },
          { 
            league_id: leagueId, 
            season: season, 
            total_rosters: league.total_rosters 
          }
        );
        allBrackets[season] = processedBracket;
      }

      // Update the store with the processed brackets
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