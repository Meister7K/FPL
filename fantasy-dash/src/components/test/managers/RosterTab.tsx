// @ts-nocheck
import React, { useState, useEffect } from 'react';
import PlayerPointsChart from '@/components/charts/PlayerPointsChart';
import { fetchPlayerData } from '@/utils/playerDataFetcher';

const RosterTab = ({ players, starters, leagueData }) => {
  const [starterPlayers, setStarterPlayers] = useState([]);
  const [benchPlayers, setBenchPlayers] = useState([]);
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [totalStartersPPG, setTotalStartersPPG] = useState(0);
  const [totalStartersProjectedPPG, setTotalStartersProjectedPPG] = useState(0);
  const [playersPPG, setPlayersPPG] = useState({});
  const [playersProjectedPPG, setPlayersProjectedPPG] = useState({});
  const [playerData, setPlayerData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentSeason = leagueData[0].season;

  useEffect(() => {
    const fetchAllPlayersData = async () => {
      setLoading(true);
      setError(null);
      const ppgData = {};
      const projectedPpgData = {};
      const allPlayerData = {};

      try {
        await Promise.all(players.map(async (player) => {
          const data = await fetchPlayerData(player.player_id, currentSeason);
          allPlayerData[player.player_id] = data;

          const statsArray = Object.values(data.stats)
          .filter(entry => entry !== null && entry.stats) 
          .map(({ stats }) => stats);

          const projectionsArray = Object.values(data.projections)
          .filter(entry => entry !== null && entry.stats) 
          .map(({ stats }) => stats);

// console.log(data.projections)
  
          if (statsArray) {
            const totalPoints = statsArray.reduce((sum, week) => sum + (week.pts_half_ppr || 0), 0);
            
            const gamesPlayed = statsArray.filter(week => week.pts_half_ppr !== undefined).length;
            ppgData[player.player_id] = gamesPlayed > 0 ? totalPoints / gamesPlayed : 0;
          } else {
            ppgData[player.player_id] = 0;
          }

       
          if (projectionsArray) {
            const totalProjectedPoints = projectionsArray.reduce((sum, week) => sum + (week.pts_half_ppr || 0), 0);

            const projectedWeeks = projectionsArray.filter(week => week.pts_half_ppr !== undefined).length;
            projectedPpgData[player.player_id] = projectedWeeks > 0 ? totalProjectedPoints / projectedWeeks : 0;
          } else {
            projectedPpgData[player.player_id] = 0;
          }
        }));

        setPlayersPPG(ppgData);
        // console.log(ppgData)
        setPlayersProjectedPPG(projectedPpgData);
        setPlayerData(allPlayerData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPlayersData();
  }, [players, currentSeason]);

  useEffect(() => {
    const starterIds = new Set(starters);
    const rosterPositions = leagueData[0].roster_positions;
    
    const findNextAvailablePlayer = (availablePlayers, positions) => {
      return availablePlayers.find(player => positions.includes(player.position));
    };

    const sortedStarters = [];
    const availableStarters = players.filter(player => starterIds.has(player.player_id));

    rosterPositions.forEach(position => {
      if (position === 'FLEX') {
        const flexPlayer = findNextAvailablePlayer(availableStarters, ['WR', 'RB', 'TE']);
        if (flexPlayer) {
          sortedStarters.push(flexPlayer);
          availableStarters.splice(availableStarters.indexOf(flexPlayer), 1);
        }
      } else {
        const player = availableStarters.find(p => p.position === position);
        if (player) {
          sortedStarters.push(player);
          availableStarters.splice(availableStarters.indexOf(player), 1);
        }
      }
    });

    setStarterPlayers(sortedStarters);
    setBenchPlayers(players.filter(player => !starterIds.has(player.player_id)));

    const totalPPG = sortedStarters.reduce((total, player) => total + (playersPPG[player.player_id] || 0), 0);
    setTotalStartersPPG(totalPPG);

    const totalProjectedPPG = sortedStarters.reduce((total, player) => total + (playersProjectedPPG[player.player_id] || 0), 0);
    setTotalStartersProjectedPPG(totalProjectedPPG);
  }, [players, starters, leagueData, playersPPG, playersProjectedPPG]);

  const togglePlayerExpand = (playerId) => {
    setExpandedPlayer(expandedPlayer === playerId ? null : playerId);
  };

  const renderPlayerStats = (player) => {
    const data = playerData[player.player_id];
    if (!data) return <p>No data available</p>;

    const projectionsArray = Object.values(data.projections || {})
      .filter(week => week !== null)
      .sort((a, b) => a.week - b.week);

    return (
      <div className="mt-2 p-2 bg-stone-900 rounded transition-all delay-200">
        <PlayerPointsChart player_id={player} projections={projectionsArray} stats={data.stats}/>
        <h4 className="font-semibold mt-4">Stats</h4>
        {/* Add more detailed stats here if needed */}
      </div>
    );
  };

  const renderPlayerTable = (playerList, title, isStarters = false) => (
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
              <th className="p-2">Avg PPG</th>
              <th className="p-2">Projected PPG</th>
            </tr>
          </thead>
          <tbody>
            {playerList.map((player, index) => (
              <React.Fragment key={player.player_id}>
                <tr className="border-b cursor-pointer" onClick={() => togglePlayerExpand(player.player_id)}>
                  <td><img src={`https://sleepercdn.com/content/nfl/players/${player.player_id}.jpg`} width={50} alt={player.full_name}/></td>
                  <td className="p-2">{player.full_name}</td>
                  <td className="p-2">
                    {isStarters ? leagueData[0].roster_positions[index] : player.position}
                  </td>
                  <td className="p-2">{player.team}</td>
                  <td className="p-2">{playersPPG[player.player_id]?.toFixed(2) || 'N/A'}</td>
                  <td className="p-2">{playersProjectedPPG[player.player_id]?.toFixed(2) || 'N/A'}</td>
                </tr>
                {expandedPlayer === player.player_id && (
                  <tr>
                    <td colSpan={6}>
                      {renderPlayerStats(player)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {isStarters && (
              <tr className="font-bold bg-stone-700">
                <td colSpan={4} className="p-2 text-right">Total Starters:</td>
                <td className="p-2">{totalStartersPPG.toFixed(2)}</td>
                <td className="p-2">{totalStartersProjectedPPG.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) return <p>Loading player data...</p>;
  if (error) return <p>Error loading player data: {error}</p>;

  return (
    <>
      {renderPlayerTable(starterPlayers, "Starting Lineup", true)}
      {renderPlayerTable(benchPlayers, "Bench")}
    </>
  );
};

export default RosterTab;