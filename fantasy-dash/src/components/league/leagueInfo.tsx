import { useFPLStore } from '../../store/fplStore';
import { useMemo } from 'react';

const LeagueInfo = () => {
  const leagueData = useFPLStore(state => state.leagueData);
  const managers = useFPLStore(state => state.managers);

  console.log("LeagueData in LeagueInfo:", leagueData);
  console.log("Managers in LeagueInfo:", managers);

  const sortedManagers = useMemo(() => {
    if (!managers) return [];
    return [...managers].sort((a, b) => {
      if (a.roster.wins !== b.roster.wins) {
        return b.roster.wins - a.roster.wins;
      }
      return b.roster.fpts - a.roster.fpts;
    });
  }, [managers]);

  if (!leagueData || !managers || managers.length === 0) {
    return <div>Loading league data...</div>;
  }

  const getNameColor = (index: number) => {
    switch (index) {
      case 0:
        return 'text-yellow-400'; // Gold for 1st
      case 1:
        return 'text-gray-400'; // Silver for 2nd
      case 2:
        return 'text-amber-600'; // Bronze for 3rd
      case sortedManagers.length - 1:
        return 'text-red-500'; // Red for last
      default:
        return '';
    }
  };

  return (
    <div className='mx-auto max-w-full box-border'>
      <h2 className="text-xl font-bold mb-4 text-center">{leagueData.name}</h2>
      <h3 className="text-lg font-semibold mb-2 text-center">Standings</h3>
      <table className="w-full items-center text-center">
        <thead className='border'>
          <tr>
            <th>Rank</th>
            <th>Team</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>Ties</th>
            <th>Points For</th>
            <th>Points Against</th>
          </tr>
        </thead>
        <tbody className='border'>
          {sortedManagers.map((manager, index) => (
            <tr className='border' key={manager.user_id}>
              <td className='border'>{index + 1}</td>
              <td className={`text-start ${getNameColor(index)}`}>{manager.username}</td>
              <td className='border'>{manager.roster.wins}</td>
              <td className='border'>{manager.roster.losses}</td>
              <td className='border'>{manager.roster.ties}</td>
              <td className='border'>{manager.roster.fpts.toFixed(2)}</td>
              <td className='border'>{manager.roster.fpts_against.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeagueInfo;