// @ts-nocheck
import { useRouter } from 'next/router';
import useLeagueStore from '../../../store/testStore';
import Link from 'next/link';
import {getRosterOwnerName} from '@/utils/usernameUtil'
import StandingsBoard from '@/components/test/dashboard/StandingsBoard';
import LeagueChart from '@/components/charts/LeagueChart';
import FPTSSeasonChart from '@/components/charts/FPTSSeasonChart';
import PowerRankingsChart from '@/components/test/dashboard/PowerRankings';

const LeagueDetailsPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query; // Get the league ID from the URL
  const leagueData = useLeagueStore((state) => state.leagueData);
  const currentRoster = useLeagueStore((state) => state.currentRoster);
  const rosterHistory = useLeagueStore((state) => state.rosterHistory);
  const leagueUsers = useLeagueStore((state)=>state.leagueUsers)
const leagueBrackets = useLeagueStore((state)=>state.leagueBrackets)
const leagueTransactions = useLeagueStore((state)=>state.leagueTransactions)
const leagueMatchups = useLeagueStore((state)=>state.leagueMatchups)

  const selectedLeagueData = leagueData.find((league) => league.league_id === id);

  console.log(selectedLeagueData)

  return (
    <div className="p-4">
       
      {leagueData ? <h1 className="text-2xl font-bold my-2 text-center">Welcome the the {leagueData[0].season} {leagueData[0].name} </h1> : null}

      

      {selectedLeagueData ? (
        <div>
        
          <StandingsBoard data={currentRoster}/>
          <FPTSSeasonChart currentRosterData={currentRoster} matchupData={leagueMatchups}/>
          <LeagueChart leagueId={leagueData[0].league_id} rosterData={currentRoster}/>
          <PowerRankingsChart data={leagueMatchups}/>

        </div>
      ) : (
        <p>No data found for this league.</p>
      )}
    </div>
  );
};

export default LeagueDetailsPage;
