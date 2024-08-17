'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useFPLStore } from "../../store/fplStore"
import UserInfo from '../../components/users/userInfo';
import LeagueInfo from '../../components/league/leagueInfo';
import MatchupInfo from '../../components/league/matchupInfo';
import LeagueChart from '../../components/charts/LeagueChart';
import MatchupMatrix from '@/components/charts/MatchupMatrix';

const Dashboard = () => {
  const router = useRouter();
  const { userData, leagueData, matchupData, rosterData, leagueId } = useFPLStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userData || !leagueData || !matchupData || !rosterData) {
      router.push('/');
    } else {
      setIsLoading(false);
    }
  }, [userData, leagueData, matchupData, rosterData, leagueId, router]);

  if (isLoading) {
    return <div>Loading dashboard data...</div>;
  }

  return (
    <div>
      <UserInfo userData={userData} />
      <LeagueInfo leagueData={leagueData} />
      <LeagueChart rosterData={rosterData} leagueId={leagueId} />
      <MatchupMatrix leagueId={leagueId } />
      <MatchupInfo matchupData={matchupData} />
    </div>
  );
};

export default Dashboard;