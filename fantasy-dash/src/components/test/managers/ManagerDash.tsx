// @ts-nocheck
import React, { useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import useLeagueStore from '../../../store/testStore';
import ManagerMatchups from './ManagerMatchups';
import ManagerTransactions from './ManagerTransactions';
import CurrentMatchup from './CurrentMatchup';
import RosterTab from './RosterTab';
import ProjectionsTab from './ProjectionsTab';

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
  starters,
  user_id
}) => {
  const [activeTab, setActiveTab] = useState('roster');

  const leagueData = useLeagueStore((state) => state.leagueData);
  const leagueTransactions = useLeagueStore((state) => state.leagueTransactions);

  const leagueYears = leagueData.map(league => league.season);
  const leagueIDs = leagueData.map(league => league.league_id);

  const filteredTransactions = Object.keys(leagueTransactions)
    .filter(leagueId => leagueIDs.includes(leagueId))
    .reduce((obj, leagueId) => {
      obj[leagueId] = leagueTransactions[leagueId];
      return obj;
    }, {});

  const HistoryTab = () => (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-3">History</h2>
      <p>This feature is coming soon.</p>
    </div>
  );

  const MatchupsTab = () => (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-3">Matchups</h2>
      <CurrentMatchup roster_id={roster_id}/>
      <ManagerMatchups roster_id={roster_id} />
    </div>
  );

  const TransactionsTab = () => (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-3">Transactions</h2>
      <ManagerTransactions 
        transactions={filteredTransactions}
        currentUserId={user_id}
        currentRosterId={roster_id}
      />
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'roster':
        return <RosterTab players={players} starters={starters} leagueData={leagueData} />;
      case 'transactions':
        return <TransactionsTab />;
      case 'history':
        return <HistoryTab />;
      case 'matchups':
        return <MatchupsTab />;
      case 'projections':
        return <ProjectionsTab players={players} starters={starters} leagueData={leagueData} />;
      default:
        return <RosterTab players={players} starters={starters} leagueData={leagueData} />;
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
            {['roster', 'projections', 'history', 'transactions', 'matchups'].map((tab) => (
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