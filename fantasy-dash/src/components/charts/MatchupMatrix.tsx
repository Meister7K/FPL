"use client";

import { useState } from 'react';
import { MatchupData } from '@/types';
import fplDB from '../../db/fplDB.json';

interface MatrixProps {
  matchupData: { [week: string]: { points: number; roster_id: number; matchup_id: number }[] };
}

interface WeekRecord {
  week: number;
  record: { [team_id: number]: string }; // Win/Loss record for each team
}

const MatchupMatrix: React.FC<MatrixProps> = ({ matchupData }) => {
  const [sortedTeams, setSortedTeams] = useState<{ team_id: number; name: string }[]>([]);
  const [filterWeek, setFilterWeek] = useState<number | null>(null);

  // Collect teams information
  const teams: { team_id: number; name: string }[] = fplDB.map((team) => ({
    team_id: team.roster_id,
    name: team.display_name,
  }));

  // Process matchup data and calculate win/loss record for each week
  const calculateWeekRecords = (data: { [week: string]: { points: number; roster_id: number }[] }) => {
    const records: WeekRecord[] = [];

    for (const [week, matches] of Object.entries(data)) {
      const weekNumber = parseInt(week);

      const weekRecord: { [team_id: number]: string } = {};

      matches.forEach(({ roster_id, points }) => {
        let winCount = 0;
        let lossCount = 0;

        matches.forEach(({ roster_id: opponentId, points: opponentPoints }) => {
          if (roster_id !== opponentId) {
            if (points > opponentPoints) {
              winCount++;
            } else if (points < opponentPoints) {
              lossCount++;
            }
          }
        });

        weekRecord[roster_id] = `${winCount}-${lossCount}`;
      });

      records.push({ week: weekNumber, record: weekRecord });
    }

    return records;
  };

  const weekRecords = calculateWeekRecords(matchupData);

  // Calculate total win/loss record for each team
  const calculateTotalRecords = () => {
    const totals: { [team_id: number]: { wins: number; losses: number } } = {};

    teams.forEach((team) => {
      totals[team.team_id] = { wins: 0, losses: 0 };

      weekRecords.forEach((record) => {
        const teamRecord = record.record[team.team_id];
        if (teamRecord) {
          const [wins, losses] = teamRecord.split('-').map(Number);
          totals[team.team_id].wins += wins;
          totals[team.team_id].losses += losses;
        }
      });
    });

    return totals;
  };

  const totalRecords = calculateTotalRecords();

  // Sort teams based on total wins
  const sortTeamsByWins = () => {
    const sorted = [...teams].sort((a, b) => {
      const aWins = totalRecords[a.team_id].wins;
      const bWins = totalRecords[b.team_id].wins;
      return bWins - aWins; // Sort descending by wins
    });

    setSortedTeams(sorted);
    setFilterWeek(null); // Clear week filter when sorting by total wins
  };

  // Sort teams based on total losses
  const sortTeamsByLosses = () => {
    const sorted = [...teams].sort((a, b) => {
      const aLosses = totalRecords[a.team_id].losses;
      const bLosses = totalRecords[b.team_id].losses;
      return bLosses - aLosses; // Sort descending by losses
    });

    setSortedTeams(sorted);
    setFilterWeek(null); // Clear week filter when sorting by total losses
  };

  // Filter teams by most wins in a specific week
  const filterTeamsByMostWinsInWeek = (week: number) => {
    const weekRecord = weekRecords.find((record) => record.week === week);

    if (weekRecord) {
      const sorted = [...teams].sort((a, b) => {
        const aWins = parseInt(weekRecord.record[a.team_id]?.split('-')[0]) || 0;
        const bWins = parseInt(weekRecord.record[b.team_id]?.split('-')[0]) || 0;
        return bWins - aWins; // Sort descending by wins in that week
      });

      setSortedTeams(sorted);
      setFilterWeek(week);
    }
  };

  // Sort teams if not sorted yet, otherwise use sorted teams
  const displayTeams = sortedTeams.length ? sortedTeams : teams;

  return (
    <div>
        <h2 className='text-center text-2xl'>Matchup Matrix</h2>
      <div>
        <button className='border rounded-md hover:bg-stone-800 margin-4' onClick={sortTeamsByWins}>Sort by Total Wins</button>
        <button className='border rounded-md hover:bg-stone-800 margin-4' onClick={sortTeamsByLosses}>Sort by Total Losses</button>
      </div>

      <table border={1} className='w-full border p-20 box-border'>
        <thead>
          <tr className='border'>
            <th>Teams</th>
            {Array.from({ length: 17 }, (_, i) => (
              <th
                key={i + 1}
                className={filterWeek === i + 1 ? 'bg-stone-800 text-white cursor-pointer' : 'cursor-pointer'}
                onClick={() => filterTeamsByMostWinsInWeek(i + 1)}
              >
                Week {i + 1}
              </th>
            ))}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {displayTeams.map((team) => (
            <tr className='border' key={team.team_id}>
              <td>{team.name}</td>
              {weekRecords.map((record) => (
                <td className='text-center' key={record.week}>
                  {record.record[team.team_id] || 'N/A'}
                </td>
              ))}
              <td className='text-center'>
                {totalRecords[team.team_id].wins}-{totalRecords[team.team_id].losses}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filterWeek && (
        <div>
          <p>Showing teams sorted by most wins in Week {filterWeek}</p>
        </div>
      )}
    </div>
  );
};

export default MatchupMatrix;
