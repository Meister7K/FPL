// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import useLeagueStore from '@/store/testStore';
import { getPlayerName, getPlayerPosition, getPlayerTeam } from '@/utils/playerUtils';
import DraftBoardCard from './DraftBoardCard'; // Adjust the path as necessary
import Loader from '../loader/Loader';
import CheckDraftStatus from './CheckDraftStatus';

const DraftBoard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const draftPicks = useLeagueStore((state) => state.draftPicks);
  const leagueUsers = useLeagueStore((state) => state.leagueUsers);
  const setDraftPicks = useLeagueStore((state) => state.setDraftPicks);
  const leagueData = useLeagueStore((state) => state.leagueData);

  const fetchDraftPicks = useCallback(async (draftId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://api.sleeper.app/v1/draft/${draftId}/picks`);
      if (!response.ok) throw new Error('Network response was not ok');
      const draftPicksData = await response.json();
      setDraftPicks(draftPicksData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [setDraftPicks]);

  useEffect(() => {
    if (leagueData.length > 0 && leagueData[0].draft_id) {
      fetchDraftPicks(leagueData[0].draft_id);
    }
  }, [leagueData, fetchDraftPicks]);


  //! useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (leagueData.length > 0 && leagueData[0].draft_id) {
  //       fetchDraftPicks(leagueData[0].draft_id);
  //     }
  //   }, 1000);

  //   return () => clearInterval(interval);
  // }, [leagueData, fetchDraftPicks]);

  const getBackgroundColor = (position: string) => {
    const colors: { [key: string]: string } = {
      'QB': 'bg-rose-700',
      'RB': 'bg-green-600',
      'WR': 'bg-blue-600',
      'TE': 'bg-yellow-700',
      'K': 'bg-slate-500',
      'DEF': 'bg-orange-500',

    };
    return colors[position] || 'bg-gray-300';
  };


  const sortedDraftPicks = draftPicks?.sort((a, b) => a.pick_no - b.pick_no) || [];


  const userOrder = Array.from(new Set(sortedDraftPicks.map(pick => pick.picked_by)))
    .map(userId => ({
      userId,
      picks: sortedDraftPicks.filter(pick => pick.picked_by === userId),
    }));

  return (
    <div>
    {leagueData.length > 0 && <CheckDraftStatus leagueId={leagueData[0].league_id} />}
    <div className='grid grid-flow-col auto-cols-auto gap-2 w-full overflow-scroll min-w-fit'>
      {userOrder.map((userOrderEntry) => {
        const user = leagueUsers.find(u => u.user_id === userOrderEntry.userId);
          
          return (
            <div key={userOrderEntry.userId} className="flex flex-col min-w-fit whitespace-nowrap">
              <div className="text-center font-bold mb-2">{user?.display_name}</div>
              {userOrderEntry.picks.map((pick) => (
                <DraftBoardCard 
                  key={pick.pick_no} 
                  pick={pick} 
                  getBackgroundColor={getBackgroundColor} 
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DraftBoard;
