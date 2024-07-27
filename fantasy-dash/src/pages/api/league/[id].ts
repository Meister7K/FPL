// pages/api/league/[id].ts

import type { NextApiRequest, NextApiResponse } from "next";

type LeagueData = {
  league_id: string;
  name: string;
  // Add other league properties as needed
};

type RosterData = {
  roster_id: number;
  owner_id: string;
  // Add other roster properties as needed
};

type MatchupData = {
  week: number;
  matchups: any[]; // Replace 'any' with a more specific type if you know the structure
};

type LeagueDetailsData = {
  league: LeagueData;
  rosters: RosterData[];
  matchups: Record<number, any[]>;
};

const fetchMatchups = async (leagueId: string) => {
  const weeks = Array.from({ length: 17 }, (_, i) => i + 1);

  const matchupPromises = weeks.map(async (week) => {
    const response = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`);
    if (!response.ok) {
      if (response.status === 404) {
        // If data for this week doesn't exist yet, return an empty array
        return { week, matchups: [] };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { week, matchups: data };
  });

  const matchupData: MatchupData[] = await Promise.all(matchupPromises);

  // Condense the data into a single object
  const condensedMatchupData = matchupData.reduce((acc, { week, matchups }) => {
    if (matchups.length > 0) {
      acc[week] = matchups;
    }
    return acc;
  }, {} as Record<number, any[]>);

  return condensedMatchupData;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LeagueDetailsData | { error: string }>
) {
  if (req.method === 'GET') {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'League ID is required' });
    }

    try {
      // Fetch league data
      const leagueResponse = await fetch(`https://api.sleeper.app/v1/league/${id}`);
      const leagueData: LeagueData = await leagueResponse.json();

      if (!leagueData.league_id) {
        return res.status(404).json({ error: 'League not found' });
      }

      // Fetch rosters for the league
      const rostersResponse = await fetch(`https://api.sleeper.app/v1/league/${id}/rosters`);
      const rostersData: RosterData[] = await rostersResponse.json();

      // Fetch all matchup data
      const matchupData = await fetchMatchups(id);

      const leagueDetailsData: LeagueDetailsData = { 
        league: leagueData, 
        rosters: rostersData,
        matchups: matchupData
      };

      // Return combined data
      res.status(200).json(leagueDetailsData);
    } catch (error) {
      res.status(500).json({ error: `Error fetching data from Sleeper API: ${error}` });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}