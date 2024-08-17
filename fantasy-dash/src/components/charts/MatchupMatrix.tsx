"use client";

import { useState, useEffect } from 'react';
import { MatchupData, RosterData } from '@/types';
import { fetchLeagueManagers } from '@/utils/fetchManagers';
import { fetchMatchupData } from '../../utils/fetchMatchups';

interface MatrixProps {
  leagueId: string;
}

interface WeekRecord {
  week: number;
  record: { [roster_id: number]: string };
}

interface Team {
  team_id: number;
  name: string;
}

const MatchupMatrix: React.FC<MatrixProps> = ({ leagueId }) => {
  const [managers, setManagers] = useState<{ [ownerId: string]: string }>({});
  const [matchupData, setMatchupData] = useState<{ [week: string]: { points: number; roster_id: number; matchup_id: number }[] }>({});
  const [weekRecords, setWeekRecords] = useState<WeekRecord[]>([]);
  const [displayTeams, setDisplayTeams] = useState<Team[]>([]);
  const [filterWeek, setFilterWeek] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rosterToTeamMapping, setRosterToTeamMapping] = useState<{[key: number]: number}>({});

  useEffect(() => {
    const fetchManagersAndMatchups = async () => {
      try {
        const managers = await fetchLeagueManagers(leagueId);
        const managerMap: { [ownerId: string]: string } = {};
        managers.forEach((manager) => {
          managerMap[manager.user_id] = manager.username;
        });
        setManagers(managerMap);

        const matchups = await fetchMatchupData(leagueId);
        setMatchupData(matchups);

        const teams: Team[] = Object.entries(managerMap).map(([ownerId, name]) => ({
          team_id: parseInt(ownerId),
          name,
        }));
        setDisplayTeams(teams);

        const mapping = createRosterToTeamMapping(matchups, teams);
        setRosterToTeamMapping(mapping);

        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchManagersAndMatchups();
  }, [leagueId]);

  useEffect(() => {
    if (Object.keys(matchupData).length > 0) {
      const calculatedRecords = calculateWeekRecords(matchupData);
      setWeekRecords(calculatedRecords);
      console.log("Calculated weekRecords:", calculatedRecords);
    }
  }, [matchupData]);

  const createRosterToTeamMapping = (matchupData: { [week: string]: { roster_id: number }[] }, teams: Team[]) => {
    const mapping: {[key: number]: number} = {};
    const rosterIds = new Set(Object.values(matchupData).flatMap(week => week.map(match => match.roster_id)));
    
    Array.from(rosterIds).forEach((rosterId, index) => {
      if (teams[index]) {
        mapping[rosterId] = teams[index].team_id;
      }
    });

    return mapping;
  };

  const calculateWeekRecords = (data: { [week: string]: { points: number; roster_id: number; matchup_id: number }[] }) => {
    const records: WeekRecord[] = [];

    for (const [week, matches] of Object.entries(data)) {
      const weekNumber = parseInt(week);
      console.log(`Processing Week ${weekNumber}:`, matches);

      const weekRecord: { [roster_id: number]: string } = {};

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
        console.log(`Team ${roster_id}: ${winCount}-${lossCount}`);
      });

      console.log(`Week ${weekNumber} record:`, weekRecord);
      records.push({ week: weekNumber, record: weekRecord });
    }

    console.log("Final records:", records);
    return records;
  };

  const calculateTotalRecords = () => {
    const totals: { [team_id: number]: { wins: number; losses: number } } = {};

    displayTeams.forEach((team) => {
      totals[team.team_id] = { wins: 0, losses: 0 };
      const rosterId = Object.keys(rosterToTeamMapping).find(key => rosterToTeamMapping[parseInt(key)] === team.team_id);

      if (rosterId) {
        weekRecords.forEach((record) => {
          const teamRecord = record.record[parseInt(rosterId)];
          if (teamRecord) {
            const [wins, losses] = teamRecord.split('-').map(Number);
            totals[team.team_id].wins += wins;
            totals[team.team_id].losses += losses;
          }
        });
      }
    });

    return totals;
  };

  const sortTeamsByWins = () => {
    const totalRecords = calculateTotalRecords();
    const sorted = [...displayTeams].sort((a, b) => {
      const aWins = totalRecords[a.team_id]?.wins || 0;
      const bWins = totalRecords[b.team_id]?.wins || 0;
      return bWins - aWins;
    });

    setDisplayTeams(sorted);
    setFilterWeek(null);
  };

  const sortTeamsByLosses = () => {
    const totalRecords = calculateTotalRecords();
    const sorted = [...displayTeams].sort((a, b) => {
      const aLosses = totalRecords[a.team_id]?.losses || 0;
      const bLosses = totalRecords[b.team_id]?.losses || 0;
      return bLosses - aLosses;
    });

    setDisplayTeams(sorted);
    setFilterWeek(null);
  };

  const filterTeamsByMostWinsInWeek = (week: number) => {
    const weekRecord = weekRecords.find((record) => record.week === week);

    if (weekRecord) {
      const sorted = [...displayTeams].sort((a, b) => {
        const aRosterId = Object.keys(rosterToTeamMapping).find(key => rosterToTeamMapping[parseInt(key)] === a.team_id);
        const bRosterId = Object.keys(rosterToTeamMapping).find(key => rosterToTeamMapping[parseInt(key)] === b.team_id);
        const aWins = aRosterId ? parseInt(weekRecord.record[parseInt(aRosterId)]?.split('-')[0]) || 0 : 0;
        const bWins = bRosterId ? parseInt(weekRecord.record[parseInt(bRosterId)]?.split('-')[0]) || 0 : 0;
        return bWins - aWins;
      });

      setDisplayTeams(sorted);
      setFilterWeek(week);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const totalRecords = calculateTotalRecords();

  return (
    <div className='pb-20'>
      <h2 className="text-center text-2xl mx-auto p-10 box-border">Matchup Matrix</h2>
      <div>
        <button className="border rounded-md hover:bg-stone-800 margin-4" onClick={sortTeamsByWins}>
          Sort by Total Wins
        </button>
        <button className="border rounded-md hover:bg-stone-800 margin-4" onClick={sortTeamsByLosses}>
          Sort by Total Losses
        </button>
      </div>

      <table border={1} className="w-full border p-20 box-border">
        <thead>
          <tr className="border">
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
            <tr className="border" key={team.team_id}>
              <td>{team.name}</td>
              {Array.from({ length: 17 }, (_, i) => {
                const weekNumber = i + 1;
                const weekRecord = weekRecords.find(record => record.week === weekNumber);
                const rosterId = Object.keys(rosterToTeamMapping).find(key => rosterToTeamMapping[parseInt(key)] === team.team_id);
                const teamRecord = rosterId && weekRecord ? weekRecord.record[parseInt(rosterId)] : undefined;
                return (
                  <td className="text-center" key={weekNumber}>
                    {teamRecord || '-'}
                  </td>
                );
              })}
              <td className="text-center">
                {totalRecords[team.team_id] 
                  ? `${totalRecords[team.team_id].wins}-${totalRecords[team.team_id].losses}` 
                  : '-'}
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