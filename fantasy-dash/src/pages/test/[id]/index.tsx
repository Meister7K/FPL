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

  const selectedLeagueData = leagueData.find((league) => league.league_id === id);

  return (
    <div className="p-4">
        <Link className='border px-2 py-1 rounded-md' href={`/test/${id}/draft`}>Draft</Link>
        <Link className='border px-2 py-1 rounded-md' href={`/test/${id}/live`}>Live Draft Board</Link>
      <h1 className="text-2xl font-bold mb-4">League Details for ID: {id}</h1>

      {selectedLeagueData ? (
        <div>
          <h2 className="text-xl font-semibold mb-2">Current Roster:</h2>
          <ul className="list-disc list-inside">
            {currentRoster.map((roster) => (
              <li key={roster.roster_id}>
                <span className="font-bold"> {getRosterOwnerName(roster.roster_id)}</span>
                <br />
                <span className="font-bold">Owner ID:</span> {roster.owner_id}
                {/* Add more fields as necessary */}
              </li>
            ))}
          </ul>

          <h2 className="text-xl font-semibold mb-2">Roster History:</h2>
          {rosterHistory.map((rosters, index) => (
            <div key={index}>
              <h3 className="font-semibold">Season {rosters.season}</h3>
              <ul className="list-disc list-inside">
                {rosters.rosters.map((roster) => (
                  <li key={roster.roster_id}>
                    <span className="font-bold">{getRosterOwnerName(roster.roster_id)}</span> 
                    <br />
                    <span className="font-bold">Owner ID:</span> {roster.owner_id}
                   
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p>No data found for this league.</p>
      )}
    </div>
  );
};

export default LeagueDetailsPage;
