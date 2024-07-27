'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useFPLStore } from "../store/fplStore"
import UserInfo from '../components/users/userInfo';
import LeagueInfo from '../components/league/leagueInfo';
import MatchupInfo from '../components/league/matchupInfo';

const Dashboard = () => {
  const router = useRouter();
  const { userData, leagueData, matchupData } = useFPLStore();

  useEffect(() => {
    if (!userData || !leagueData) {
      router.push('/');
    }
  }, [userData, leagueData, router]);

  if (!userData || !leagueData) {
    return <div>Loading...</div>;
  }

  console.log(userData);
  console.log(leagueData)

  return (
    <div className="flex">
      <div className="w-1/2">
        <UserInfo userData={userData} />
      </div>
      <div className="w-1/2">
        <LeagueInfo leagueData={leagueData} />
      </div>
      <div className="mt-8">
        <MatchupInfo matchupData={matchupData} />
      </div>
    </div>
  );
};

export default Dashboard;