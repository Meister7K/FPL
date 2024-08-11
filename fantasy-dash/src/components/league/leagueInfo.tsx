import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal, AwaitedReactNode } from 'react';
import { League } from '../../types';
import fplDB from '../../db/fplDB.json';

interface LeagueInfoProps {
  leagueData: League;
}

const LeagueInfo = ({ leagueData }: LeagueInfoProps) => {

  const getDisplayName = (ownerId: string) => {
    const user = fplDB.find(user => user.user_id === ownerId);
    return user ? user.display_name : `Team ${ownerId}`;
  };

  console.log(leagueData);
  return (
    <div className='mx-auto max-w-full box-border'>
      <h2 className="text-xl font-bold mb-4 text-center">{leagueData.league.name}</h2>
      <h3 className="text-lg font-semibold mb-2 text-center">Standings</h3>
      <table className="w-full items-center text-center">
        <thead>
          <tr>
            <th>Team</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>Points For</th>
            <th>Points Against</th>
          </tr>
        </thead>
        <tbody>
          {leagueData.rosters.map((team) => (
            <tr key={team.league_id}>
              <td className='text-start'>{getDisplayName(team.owner_id)}</td>
              <td>{team.settings.wins}</td>
              <td>{team.settings.losses}</td>
              <td>{team.settings.fpts}</td>
              <td>{team.settings.fpts_against}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeagueInfo;