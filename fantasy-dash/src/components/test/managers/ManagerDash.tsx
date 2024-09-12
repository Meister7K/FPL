import React, { useState, useEffect } from 'react';
import usePlayerData from '@/hooks/useFetchStatsProjections';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import PlayerPointsChart from '@/components/charts/PlayerPointsChart';
import useLeagueStore from '../../../store/testStore';
import ManagerMatchups from './ManagerMatchups';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ManagerDash = ({
  username,
  roster_id,
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
  const [activeTab, setActiveTab] = useState('roster');

  const leagueData = useLeagueStore((state) => state.leagueData);
  const { data: playerData, loading: playerLoading, error: playerError } = usePlayerData(expandedPlayer, leagueData[0].season);

  useEffect(() => {
    const starterIds = new Set(starters);
    const rosterPositions = leagueData[0].roster_positions;
    
    // Helper function to find the next available player of specified positions
    const findNextAvailablePlayer = (availablePlayers, positions) => {
      return availablePlayers.find(player => positions.includes(player.position));
    };

    // Sort starters based on roster_positions
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
    
    // Set bench players without sorting
    setBenchPlayers(players.filter(player => !starterIds.has(player.player_id)));
  }, [players, starters, leagueData]);

  const togglePlayerExpand = (playerId) => {
    setExpandedPlayer(expandedPlayer === playerId ? null : playerId);
  };

  const renderPlayerStats = () => {
    if (playerLoading) return <p>Loading player data...</p>;
    if (playerError) return <p>Error loading player data</p>;
    if (!playerData.stats || !playerData.projections) return <p>No data available</p>;

    const projectionsArray = Object.values(playerData.projections)
      .filter(week => week !== null)
      .sort((a, b) => a.week - b.week);

    return (
      <div className="mt-2 p-2 bg-stone-900 rounded transition-all delay-200">
        <PlayerPointsChart projections={projectionsArray} stats={playerData.stats}/>
        <h4 className="font-semibold mt-4">Stats</h4>
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

  const RosterTab = () => (
    <>
      {renderPlayerTable(starterPlayers, "Starting Lineup", true)}
      {renderPlayerTable(benchPlayers, "Bench")}
    </>
  );

  const HistoryTab = () => (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-3">History</h2>
      <p>This feature is coming soon.</p>
    </div>
  );

  const MatchupsTab = () => (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-3">Matchups</h2>
      <ManagerMatchups roster_id={roster_id} />
    </div>
  );
  const TransactionsTab = () => (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-3">Transactions</h2>
      <p>This feature is coming soon.</p>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'roster':
        return <RosterTab />;
    case 'transactions':
        return <TransactionsTab />;
      case 'history':
        return <HistoryTab />;
      case 'matchups':
        return <MatchupsTab />;
      default:
        return <RosterTab />;
    }
  };

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
        
        <div className="border-b border-stone-700 mb-4">
          <nav className="-mb-px flex">
            {['roster', 'history','transactions', 'matchups'].map((tab) => (
              <button
                key={tab}
                className={`mr-8 py-2 px-1 border-b-2 font-medium text-sm leading-5 focus:outline-none transition duration-150 ease-in-out ${
                  activeTab === tab
                    ? 'border-rose-500 text-rose-600'
                    : 'border-transparent text-stone-500 hover:text-stone-300 hover:border-stone-300'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
        
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default ManagerDash;