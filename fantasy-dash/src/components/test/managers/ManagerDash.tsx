import React, { useState, useEffect } from 'react';
import usePlayerData from '@/hooks/useFetchStatsProjections';
// import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import PlayerPointsChart from '@/components/charts/PlayerPointsChart';
import useLeagueStore from '../../../store/testStore';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ManagerDash = ({
    username,
    teamName,
    wins,
    losses,
    pointsFor,
    pointsAgainst,
    avatar,
    players,
    starters
  }) => {
    const [starterPlayers, setStarterPlayers] = useState([]);
    const [benchPlayers, setBenchPlayers] = useState([]);
    const [expandedPlayer, setExpandedPlayer] = useState(null);

    const leagueData = useLeagueStore((state) => state.leagueData);
    
    console.log(leagueData[0].season)
  
    const { data: playerData, loading: playerLoading, error: playerError } = usePlayerData(expandedPlayer, leagueData[0].season);
  
    useEffect(() => {
      const starterIds = new Set(starters);
      const starterPlayersArray = players.filter(player => starterIds.has(player.player_id));
      const benchPlayersArray = players.filter(player => !starterIds.has(player.player_id));
      
      setStarterPlayers(starterPlayersArray);
      setBenchPlayers(benchPlayersArray);
    }, [players, starters]);
  
    const togglePlayerExpand = (playerId) => {
      setExpandedPlayer(expandedPlayer === playerId ? null : playerId);
    };
  
    const renderPlayerStats = () => {
      if (playerLoading) return <p>Loading player data...</p>;
      if (playerError) return <p>Error loading player data</p>;
      if (!playerData.stats || !playerData.projections) return <p>No data available</p>;

      console.log(playerData.stats)

       // Convert projections object to array and sort by week
    const projectionsArray = Object.values(playerData.projections)
    .filter(week => week !== null)  // Remove any null entries
    .sort((a, b) => a.week - b.week);
  
      return (
        <div className="mt-2 p-2 bg-stone-900 rounded transition-all delay-200">
          <PlayerPointsChart projections={projectionsArray} stats={playerData.stats}/>
          <h4 className="font-semibold mt-4">Stats</h4>
          {/* <pre className="text-xs overflow-x-auto">{JSON.stringify(playerData.stats, null, 2)}</pre>
          <h4 className="font-semibold mt-2">Projections</h4>
          <pre className="text-xs overflow-x-auto">{JSON.stringify(playerData.projections, null, 2)}</pre> */}
        </div>
      );
    };
  
    const renderPlayerTable = (playerList, title) => (
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-3">{title}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-800">
                <th></th>
                <th className="p-2">Name</th>
                <th className="p-2">Position</th>
                <th className="p-2">Team</th>
              </tr>
            </thead>
            <tbody>
              {playerList.map((player) => (
                <React.Fragment key={player.player_id}>
                  <tr className="border-b cursor-pointer" onClick={() => togglePlayerExpand(player.player_id)}>
                    <td><img src={`https://sleepercdn.com/content/nfl/players/${player.player_id}.jpg`} width={50} alt={player.full_name}/></td>
                    <td className="p-2">{player.full_name}</td>
                    <td className="p-2">{player.position}</td>
                    <td className="p-2">{player.team}</td>
                  </tr>
                  {expandedPlayer === player.player_id && (
                    <tr>
                      <td colSpan={4}>
                        {renderPlayerStats()}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  
    return (
      <div className="bg-stone-900 shadow-lg rounded-lg overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex items-center mb-4">
            <img
              src={avatar || '/api/placeholder/100/100'}
              alt={username}
              width={100}
              height={100}
              className="rounded-full mr-4"
            />
            <div>
              <h1 className="text-2xl font-bold">{username}</h1>
              <p className="text-stone-400">{teamName}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-stone-700 p-3 rounded">
              <p className="text-sm font-semibold text-stone-400">Record</p>
              <p className="text-xl font-bold">{wins} - {losses}</p>
            </div>
            <div className="bg-stone-700 p-3 rounded">
              <p className="text-sm font-semibold text-stone-400">Points For</p>
              <p className="text-xl font-bold">{pointsFor.toFixed(2)}</p>
            </div>
            <div className="bg-stone-700 p-3 rounded">
              <p className="text-sm font-semibold text-stone-400">Points Against</p>
              <p className="text-xl font-bold">{pointsAgainst.toFixed(2)}</p>
            </div>
          </div>
          
          {renderPlayerTable(starterPlayers, "Starting Lineup")}
          {renderPlayerTable(benchPlayers, "Bench")}
        </div>
      </div>
    );
  };
  
  export default ManagerDash;