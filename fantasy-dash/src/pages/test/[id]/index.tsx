import { useRouter } from 'next/router';
import useLeagueStore from '../../../store/testStore';
import Link from 'next/link';
import {getRosterOwnerName} from '@/utils/usernameUtil'

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

  console.log(leagueData)

  return (
    <div className="p-4">
        <Link className='border px-2 py-1 rounded-md' href={`/test/${id}/draft`}>Draft</Link>
        <Link className='border px-2 py-1 rounded-md' href={`/test/${id}/rosters`}>rosters</Link>
        <Link className='border px-2 py-1 rounded-md' href={`/test/${id}/matchups`}>matchups</Link>
        <Link className='border px-2 py-1 rounded-md' href={`/test/${id}/transactions`}>transactions</Link>
      <h1 className="text-2xl font-bold mb-4">League Details for {leagueData[0].name} {leagueData[0].season}</h1>

      

      {selectedLeagueData ? (
        <div>
          <h2 className="text-xl font-semibold mb-2">Current Roster:</h2>
          <ul className=" list-inside flex gap-4 flex-wrap justify-evenly">
            {currentRoster.map((roster) => (
              <li key={roster.roster_id}>
                <span className="font-bold text-xl"> {getRosterOwnerName(roster.roster_id)}</span>
                <br />
                <span className="font-bold">Owner ID:</span> {roster.owner_id}
                {/* Add more fields as necessary */}
              </li>
            ))}
          </ul>
          <div>
            {leagueData[0].roster_positions}
          </div>
          <div>
            {JSON.stringify(leagueData[0].scoring_settings)}
          </div>

        </div>
      ) : (
        <p>No data found for this league.</p>
      )}
    </div>
  );
};

export default LeagueDetailsPage;
