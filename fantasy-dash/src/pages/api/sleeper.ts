import type { NextApiRequest, NextApiResponse } from "next";

type UserData = {
  user_id: string;
  username: string;

};

type LeagueData = {
  league_id: string;
  name: string;

};

type MemberData = {
  user_id: string;
  display_name: string;

};

type RosterData = {
  roster_id: number;
  owner_id: string;
  fpts: number;
  fpts_against: number;
  
};

type SleeperData = {
  user: UserData;
  leagues: LeagueData[];
  members: MemberData[];
  rosters: RosterData[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SleeperData | { error: string }>
) {
  if (req.method === 'GET') {
    const { username } = req.query;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }

    try {

      const userResponse = await fetch(`https://api.sleeper.app/v1/user/${username}`);
      const userData: UserData = await userResponse.json();
      
      if (!userData.user_id) {
        return res.status(404).json({ error: 'User not found' });
      }


      const leaguesResponse = await fetch(`https://api.sleeper.app/v1/user/${userData.user_id}/leagues/nfl/2023`);
      const leaguesData: LeagueData[] = await leaguesResponse.json();


      const membersResponse = await fetch(`https://api.sleeper.app/v1/league/${leaguesData[0].league_id}/users`);
      const membersData: MemberData[] = await membersResponse.json();

      const rosterResponse = await fetch(`https://api.sleeper.app/v1/league/${leaguesData[0].league_id}/rosters`);
const rosterData: RosterData[] = await rosterResponse.json();

const sleeperData: SleeperData = { user: userData, leagues: leaguesData, members: membersData, rosters: rosterData };


      res.status(200).json(sleeperData);
    } catch (error) {
      res.status(500).json({ error: `Error fetching data from Sleeper API: ${error}` });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}