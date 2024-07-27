// pages/api/league.ts
import type { NextApiRequest, NextApiResponse } from 'next';

type MatchupData = {
  week: number;
  matchups: any[]; // Replace 'any' with a more specific type if you know the structure
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
  res: NextApiResponse
) {
  const { userId, year } = req.query;

  try {
    // Fetch league data
    const leagueResponse = await fetch(`https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${year}`);
    const leagues = await leagueResponse.json();

    if (!leagueResponse.ok) {
      throw new Error('Failed to fetch league data');
    }

    // Assuming the user is in only one league, take the first one
    const league = leagues.find((league: { name: string; }) => league.name === "Fantasy Premier League");

    // Fetch league rosters
    const rostersResponse = await fetch(`https://api.sleeper.app/v1/league/${league.league_id}/rosters`);
    const rosters = await rostersResponse.json();

    if (!rostersResponse.ok) {
      throw new Error('Failed to fetch roster data');
    }

    // Fetch league matchups
    const matchupData = await fetchMatchups(league.league_id);

    // Process rosters to get standings
    // const standings = rosters.map((roster: any) => ({
    //   user_id: roster.owner_id,
    //   display_name: roster.display_name,
    //   wins: roster.settings.wins,
    //   losses: roster.settings.losses,
    //   points_for: roster.settings.fpts,
    // }));

    // Sort standings by wins (descending)
    // standings.sort((a: any, b: any) => b.wins - a.wins);

    const responseData = {
      league:league,
      rosters: rosters, // or use the processed standings if you uncomment that part

      matchupData: matchupData
    };

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred fetching league data' });
  }
}