import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal, AwaitedReactNode } from 'react';
import { League } from '../../types';

interface LeagueInfoProps {
  leagueData: League;
}

const LeagueInfo = ({ leagueData }: LeagueInfoProps) => {

  // console.log(leagueData);
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">League Information</h2>
      <h3 className="text-lg font-semibold mb-2">Standings</h3>
      <table className="w-full">
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
              <td>{team.owner_id}</td>
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