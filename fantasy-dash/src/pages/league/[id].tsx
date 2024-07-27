"use client"
// pages/league/[id].tsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import userData from '../../db/fplDB.json';

type LeagueData = {
  league_id: string;
  name: string;
  metadata:Metadata[];
  // Add other league properties as needed
};

type RosterData = {
  roster_id: number;
  owner_id: string;
  settings: Settings[];
  // Add other roster properties as needed
};

type LeagueDetailsData = {
  league: LeagueData;
  rosters: RosterData[];
};

type Metadata={
  latest_league_winner_roster_id: string| number;
}
type Settings={
  wins: string;
  losses: string;
  fpts: string;
  ftps_against: string;
  ppts: string;
}

const LeagueDetails: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  const hardData = userData

  const [leagueData, setLeagueData] = useState<LeagueDetailsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchLeagueData();
    }
  }, [id]);

  const getUserName = (userId: string) => {
    const user = userData.find(u => u.user_id === userId);
    return user ? user.display_name : userId;
  };

  const fetchLeagueData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/league/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'An error occurred');
      }
      console.log(data)
      setLeagueData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!leagueData) return <div>No league data found</div>;

  return (
    <div>
      <Link href="/sleeper-stats">Back to Leagues</Link>
      <h1 className='text-6xl m-5'>{leagueData.league.name}</h1>
      <p>League ID: {leagueData.league.league_id}</p>

     <p>Current Champion: {userData[leagueData.league.metadata.latest_league_winner_roster_id-1].display_name}</p>

      <h2 className='text-4xl'>Teams</h2>
      <ul className='flex flex-row flex-wrap gap-8 mx-auto justify-evenly align-middle'>
      {leagueData.rosters.map((roster) => (
          <li key={roster.roster_id} className='border border-slate-200 p-6 box-border rounded-md'>
            {/* Roster ID: {roster.roster_id}, */}
            
            <Link className='text-xl ' href={`/user/${roster.owner_id}`}>
               {getUserName(roster.owner_id)}
            </Link>
            <p>
              Wins: {roster.settings.wins}
            </p>
            <p>
              Losses: {roster.settings.losses}
            </p>
            <p>
              Points For: {roster.settings.fpts}
            </p>
            <p>
              Points Against: {roster.settings.fpts_against}
            </p>
            <p>
              Total Possible Points: {roster.settings.ppts}
            </p>
          </li>
        ))}
      </ul>

      {/* matchup chart */}
    </div>
  );
};

export default LeagueDetails;