'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useFPLStore } from "../store/fplStore"
import UserInfo from '../components/users/userInfo';
import LeagueInfo from '../components/league/leagueInfo';
import MatchupInfo from '../components/league/matchupInfo';
import LeagueChart from '../components/charts/LeagueChart';


const Dashboard = () => {
  const router = useRouter();
  const { userData, leagueData, matchupData,rosterData } = useFPLStore();

  useEffect(() => {
    if (!userData || !leagueData) {
      router.push('/');
    }
  }, [userData, leagueData, router]);

  if (!userData || !leagueData) {
    return <div>Loading...</div>;
  }

  console.log('userData:', userData);
console.log('leagueData:', leagueData);
console.log('rosterData:', rosterData);

  return (
    <div className="flex flex-col md:flex-row md:justify-evenly md:items-start items-center w-full mx-auto box-border">
      <div className="md:w-1/4 box-border w-full mx-4">
        <UserInfo userData={userData} />
      </div>
      <div className="md:w-1/2 box-border w-full mx-4">
        <LeagueInfo leagueData={leagueData} />
        {rosterData && <LeagueChart rosterData={rosterData}  />}
      </div>
      <div className="mt-8 md:w-1/4 box-border w-full mx-4">
        <MatchupInfo matchupData={matchupData} />
      </div>
    </div>
  );
};

export default Dashboard;