import { useRouter } from 'next/router';
import useLeagueStore from '../../../store/testStore';
import Link from 'next/link';
import {getRosterOwnerName} from '@/utils/usernameUtil'
import StandingsBoard from '@/components/test/dashboard/StandingsBoard';
import LeagueChart from '@/components/charts/LeagueChart';
import FPTSSeasonChart from '@/components/charts/FPTSSeasonChart';

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

  // console.log(leagueData)

  return (
    <div className="p-4">
        <Link className='border px-2 py-1 rounded-md' href={`/test/${id}/draft`}>Draft</Link>
        <Link className='border px-2 py-1 rounded-md' href={`/test/${id}/rosters`}>rosters</Link>
        <Link className='border px-2 py-1 rounded-md' href={`/test/${id}/matchups`}>matchups</Link>
        <Link className='border px-2 py-1 rounded-md' href={`/test/${id}/transactions`}>transactions</Link>
      {leagueData ? <h1 className="text-2xl font-bold mb-4 text-center">Welcome the the {leagueData[0].season} {leagueData[0].name} </h1> : null}

      

      {selectedLeagueData ? (
        <div>
        
          <StandingsBoard data={currentRoster}/>
          <FPTSSeasonChart currentRosterData={currentRoster} matchupData={leagueMatchups}/>
          <LeagueChart leagueId={leagueData[0].league_id} rosterData={currentRoster}/>

        </div>
      ) : (
        <p>No data found for this league.</p>
      )}
    </div>
  );
};

export default LeagueDetailsPage;
