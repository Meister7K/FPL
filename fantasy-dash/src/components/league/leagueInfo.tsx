'use client'
import { useFPLStore } from '../../store/fplStore';
import { useState, useEffect } from 'react';

interface BracketResult {
  roster_id: number;
  rank: number;
}

const LeagueInfo = () => {
  const leagueData = useFPLStore(state => state.leagueData);
  const managers = useFPLStore(state => state.managers);
  const leagueId = useFPLStore(state => state.leagueId);
  const [rankings, setRankings] = useState<BracketResult[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: string }>({ key: '', direction: '' });

  useEffect(() => {
    const fetchBracketResults = async () => {
      if (!leagueId) return;

      try {
        const [winnersResponse, losersResponse] = await Promise.all([
          fetch(`https://api.sleeper.app/v1/league/${leagueId}/winners_bracket`),
          fetch(`https://api.sleeper.app/v1/league/${leagueId}/losers_bracket`)
        ]);

        const winnersData = await winnersResponse.json();
        const losersData = await losersResponse.json();

        console.log(winnersData);
        console.log(losersData);

        let lastPlace;
        let secondLast;

        for (let i = 0; i < losersData.length; i++) {
          lastPlace = losersData[i].w;
          secondLast = losersData[i].l;
        }

        let firstPlace;
        let secondPlace;
        let thirdPlace;
        let fourthPlace;
        let fifthPlace;
        let sixthPlace;

        for (let i = 0; i < winnersData.length; i++) {
          if (i === winnersData.length - 1) {
            thirdPlace = winnersData[i].w;
            fourthPlace = winnersData[i].l;
          } else if (i === winnersData.length - 2) {
            firstPlace = winnersData[i].w;
            secondPlace = winnersData[i].l;
          } else if (i === winnersData.length - 3) {
            fifthPlace = winnersData[i].w;
            sixthPlace = winnersData[i].l;
          }
        }

        setRankings([
          { roster_id: firstPlace, rank: 1 },
          { roster_id: secondPlace, rank: 2 },
          { roster_id: thirdPlace, rank: 3 },
          { roster_id: fourthPlace, rank: 4 },
          { roster_id: fifthPlace, rank: 5 },
          { roster_id: sixthPlace, rank: 6 },
          { roster_id: secondLast, rank: managers.length - 1 },
          { roster_id: lastPlace, rank: managers.length }
        ]);

      } catch (error) {
        console.error("Error fetching bracket results:", error);
      }
    };

    fetchBracketResults();
  }, [leagueId]);

  if (!leagueData || !managers || managers.length === 0 || rankings.length === 0) {
    return <div>Loading league data...</div>;
  }

  const getRowStyle = (rank: number, totalTeams: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-700 font-bold'; // 1st place
      case 2:
        return 'bg-gray-700 font-bold'; // 2nd place
      case 3:
        return 'bg-amber-900 font-bold'; // 3rd place
      case totalTeams:
        return 'bg-yellow-950 font-bold'; // Last place
      default:
        return '';
    }
  };

  const handleSort = (key: string) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedManagers = [...managers].sort((a, b) => {
    const rankA = rankings.find(r => r.roster_id === parseInt(a.roster.roster_id))?.rank || Infinity;
    const rankB = rankings.find(r => r.roster_id === parseInt(b.roster.roster_id))?.rank || Infinity;

    if (sortConfig.key === 'rank') {
      return sortConfig.direction === 'ascending' ? rankA - rankB : rankB - rankA;
    } else if (sortConfig.key === 'wins') {
      return sortConfig.direction === 'ascending' ? a.roster.wins - b.roster.wins : b.roster.wins - a.roster.wins;
    } else if (sortConfig.key === 'losses') {
      return sortConfig.direction === 'ascending' ? a.roster.losses - b.roster.losses : b.roster.losses - a.roster.losses;
    } else if (sortConfig.key === 'ties') {
      return sortConfig.direction === 'ascending' ? a.roster.ties - b.roster.ties : b.roster.ties - a.roster.ties;
    } else if (sortConfig.key === 'fpts') {
      return sortConfig.direction === 'ascending' ? a.roster.fpts - b.roster.fpts : b.roster.fpts - a.roster.fpts;
    } else if (sortConfig.key === 'fpts_against') {
      return sortConfig.direction === 'ascending' ? a.roster.fpts_against - b.roster.fpts_against : b.roster.fpts_against - a.roster.fpts_against;
    } else {
      return rankA - rankB;
    }
  });

  return (
    <div className='mx-auto max-w-screen-xl box-border w-full'>
      <h2 className="text-xl font-bold mb-4 text-center">{leagueData.name}</h2>
      <h3 className="text-lg font-semibold mb-2 text-center">Standings</h3>
      <table className="w-full items-center text-center">
        <thead className='border'>
          <tr>
            <th onClick={() => handleSort('rank')}>Rank</th>
            <th>Team</th>
            <th onClick={() => handleSort('wins')}>Wins</th>
            <th onClick={() => handleSort('losses')}>Losses</th>
            <th onClick={() => handleSort('ties')}>Ties</th>
            <th onClick={() => handleSort('fpts')}>Points For</th>
            <th onClick={() => handleSort('fpts_against')}>Points Against</th>
          </tr>
        </thead>
        <tbody className='border'>
          {sortedManagers.map((manager) => {
            const rank = rankings.find(r => r.roster_id === parseInt(manager.roster.roster_id))?.rank || 0;
            return (
              <tr
                className={`border ${getRowStyle(rank, managers.length)}`}
                key={manager.user_id}
              >
                <td className='border'>{rank}</td>
                <td className='text-start'>{manager.username}</td>
                <td className='border'>{manager.roster.wins}</td>
                <td className='border'>{manager.roster.losses}</td>
                <td className='border'>{manager.roster.ties}</td>
                <td className='border'>{manager.roster.fpts ? manager.roster.fpts.toFixed(2) : "0"}</td>
                <td className='border'>{manager.roster.fpts_against ? manager.roster.fpts_against.toFixed(2) : "0"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LeagueInfo;
