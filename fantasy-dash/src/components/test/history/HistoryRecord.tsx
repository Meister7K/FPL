import React, { useState, useMemo, useEffect } from 'react';
import { getRosterOwnerName } from '@/utils/usernameUtil';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { decimalToPercentage } from '@/utils/toPercent';
import useLeagueStore from '@/store/testStore';
import historic from'@/db/history.json'

interface RosterSettings {
  wins: number;
  losses: number;
  ties?: number;
  fpts: number;
  fpts_decimal: number;
  fpts_against?: number;
  fpts_against_decimal?: number;
  ppts: number;
  ppts_decimal: number;
}

interface RosterData {
  roster_id: number | string;
  owner_id: string;
  settings: RosterSettings;
}

interface SeasonData {
  season: string;
  rosters: RosterData[];
}

interface HistoryRecordProps {
  data: SeasonData[];
}

interface Column {
  key: string;
  label: string;
}

type SortDirection = 'asc' | 'desc' | null;

const HistoryRecord: React.FC<HistoryRecordProps> = ({ data }) => {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedYear, setSelectedYear] = useState<string>('All');

  const selectedLeague = useLeagueStore(state => state.selectedLeague);
  const [historyData, setHistoryData] = useState<any[]>([]);

  useEffect(() => {
    const fetchHistoryData = async () => {
      if (selectedLeague?.name === "Fantasy Premier League") {
        try {
            setHistoryData(historic)
        //   const response = await fetch('/history.json');
        //   const jsonData = await response.json();
        //   setHistoryData(jsonData);
        //   if(jsonData.length === 0){
        //     setHistoryData(historic)
        //   }
        } catch (error) {
          console.error("Failed to fetch history data:", error);
        }
      }
    };

    fetchHistoryData();
  }, [selectedLeague]);

  const columns: Column[] = [
    { key: 'rank', label: 'Rank' },
    { key: 'team', label: 'Team' },
    { key: 'wins', label: 'Wins' },
    { key: 'losses', label: 'Losses' },
    { key: 'ties', label: 'Ties' },
    { key: 'fpts', label: 'FPTS' },
    { key: 'manager_score', label: 'Manager Score' },
    { key: 'fpts_against', label: 'FPTS Against' },
    { key: 'win_percentage', label: 'Win %' },
    { key: 'ppg', label: 'Avg. PPG' },
  ];

  const years = useMemo(() => {
    const allYears = new Set([...data.map(d => d.season)]);
    if (selectedLeague?.name === "Fantasy Premier League" && historyData.length > 0) {
      historyData.forEach(d => allYears.add(d.year.toString()));
    }
    return ['All', ...Array.from(allYears).sort()];
  }, [data, historyData, selectedLeague]);

  const processedData = useMemo(() => {
    let combinedData = [...data];

    if (selectedLeague?.name === "Fantasy Premier League" && historyData.length > 0) {
      historyData.forEach(yearData => {
        const existingSeasonIndex = combinedData.findIndex(d => d.season === yearData.year.toString());
        
        if (existingSeasonIndex !== -1) {
          // Merge historical data with existing season data
          combinedData[existingSeasonIndex].rosters = combinedData[existingSeasonIndex].rosters.map(roster => {
            const historicalStanding = yearData.season_standings.find(s => s.roster_id.toString() === roster.roster_id.toString());
            if (historicalStanding) {
              return {
                ...roster,
                settings: {
                  ...roster.settings,
                  wins: historicalStanding.wins,
                  losses: historicalStanding.losses,
                  ties: historicalStanding.ties || 0,
                  fpts: historicalStanding.fpts,
                  fpts_against: historicalStanding.fpts_against || roster.settings.fpts_against,
                }
              };
            }
            return roster;
          });
        } else {
          // Add new season data from historical data
          combinedData.push({
            season: yearData.year.toString(),
            rosters: yearData.season_standings.map(standing => ({
              roster_id: standing.roster_id.toString(),
              owner_id: standing.owner_id,
              settings: {
                wins: standing.wins,
                losses: standing.losses,
                ties: standing.ties || 0,
                fpts: standing.fpts,
                fpts_decimal: 0,
                fpts_against: standing.fpts_against || 0,
                fpts_against_decimal: 0,
                ppts: 0,
                ppts_decimal: 0
              }
            }))
          });
        }
      });
    }

    const filteredData = selectedYear === 'All' ? combinedData : combinedData.filter(d => d.season === selectedYear);

    const cumulativeStats = filteredData.flatMap(seasonData => 
      seasonData.rosters.map(roster => ({
        season: seasonData.season,
        ...roster
      }))
    ).reduce((acc, curr) => {
      const existingTeam = acc.find(team => team.owner_id === curr.owner_id);
      if (existingTeam) {
        existingTeam.settings.wins += curr.settings.wins;
        existingTeam.settings.losses += curr.settings.losses;
        existingTeam.settings.ties = (existingTeam.settings.ties || 0) + (curr.settings.ties || 0);
        existingTeam.settings.fpts += curr.settings.fpts + curr.settings.fpts_decimal / 100;
        existingTeam.settings.fpts_against = (existingTeam.settings.fpts_against || 0) + 
          (curr.settings.fpts_against ? curr.settings.fpts_against + curr.settings.fpts_against_decimal / 100 : 0);
        existingTeam.settings.ppts += curr.settings.ppts + curr.settings.ppts_decimal / 100;
        existingTeam.seasons.push(curr.season);
      } else {
        acc.push({
          ...curr,
          settings: {
            ...curr.settings,
            fpts: curr.settings.fpts + curr.settings.fpts_decimal / 100,
            fpts_against: curr.settings.fpts_against ? curr.settings.fpts_against + curr.settings.fpts_against_decimal / 100 : 0,
            ppts: curr.settings.ppts + curr.settings.ppts_decimal / 100,
          },
          seasons: [curr.season]
        });
      }
      return acc;
    }, []);

    return cumulativeStats.map(item => {
      const totalGames = item.settings.wins + item.settings.losses + (item.settings.ties || 0);
      const teamName = getRosterOwnerName(item.owner_id);
      
      return {
        team: teamName === 'Unknown' ? `ID: ${item.owner_id}` : teamName,
        owner_id: item.owner_id,
        wins: item.settings.wins.toFixed(0),
        losses: item.settings.losses.toFixed(0),
        ties: item.settings.ties.toFixed(0) || 0,
        fpts: item.settings.fpts,
        manager_score: item.settings.ppts> 0 ?((item.settings.fpts / item.settings.ppts) * 100).toFixed(2) :null,
        fpts_against: item.settings.fpts_against,
        win_percentage: totalGames > 0 ? decimalToPercentage(Number((item.settings.wins / totalGames).toFixed(4))) : 0,
        ppg: totalGames > 0 ? Number((item.settings.fpts / totalGames).toFixed(2)) : 0,
        seasons: item.seasons.join(', ')
      };
    }).sort((a, b) => {
      if (b.wins === a.wins) {
        return b.fpts - a.fpts;
      }
      return b.wins - a.wins;
    }).map((item, index) => ({ ...item, rank: (index + 1).toFixed(0) }));
  }, [data, selectedYear, historyData, selectedLeague]);

  const sortedAndFilteredData = useMemo(() => {
    let result = processedData.filter(row =>
      Object.entries(filters).every(([key, value]) =>
        row[key].toString().toLowerCase().includes(value.toLowerCase())
      )
    );

    if (sortColumn) {
      result.sort((a, b) => {
        if (a[sortColumn] < b[sortColumn]) return sortDirection === 'asc' ? -1 : 1;
        if (a[sortColumn] > b[sortColumn]) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [processedData, filters, sortColumn, sortDirection]);

  const handleFilterChange = (column: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc');
      if (sortDirection === 'desc') {
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="mb-4">
        <select 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-2 py-1 border rounded bg-stone-800 text-stone-200"
        >
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
      <table className="min-w-full bg-stone-900 border border-stone-700 rounded-md">
        <caption className='text-center w-full mx-auto text-xl p-5'>
          Cumulative Standings {selectedYear !== 'All' ? `for ${selectedYear}` : ''}
        </caption>
        <thead>
          <tr className="bg-stone-900">
            {columns.map(column => (
              <th key={column.key} className="px-4 py-2 text-left text-sm font-semibold text-stone-400">
                <div className="flex items-center cursor-pointer" onClick={() => handleSort(column.key)}>
                  {column.label}
                  {sortColumn === column.key && (
                    sortDirection === 'asc' ? <ChevronUp className="ml-1" size={16} /> : <ChevronDown className="ml-1" size={16} />
                  )}
                </div>
                {column.key !== 'rank' && (
                  <input
                    type="text"
                    placeholder={`Filter ${column.label}`}
                    value={filters[column.key] || ''}
                    onChange={(e) => handleFilterChange(column.key, e.target.value)}
                    className="mt-1 w-full px-2 py-1 text-sm border rounded focus:outline-none focus:border-rose-500 bg-stone-800 text-stone-200"
                  />
                )}
              </th>
            ))}
            <th className="px-4 py-2 text-left text-sm font-semibold text-stone-400">Seasons</th>
          </tr>
        </thead>
        <tbody>
          {sortedAndFilteredData.map((row, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-stone-800' : 'bg-stone-700'}>
              {columns.map(column => (
                <td key={column.key} className="px-4 py-2 text-sm text-stone-200 text-center">
                  {column.key === 'team' ? (
                    <span title={`Owner ID: ${row.owner_id}`}>
                      {row[column.key]}
                    </span>
                  ) : (
                    row[column.key] !== null ? 
                      typeof row[column.key] === 'number' ? 
                        Number(row[column.key]).toFixed(2) : 
                        row[column.key] 
                      : 'N/A'
                  )}
                </td>
              ))}
              <td className="px-4 py-2 text-sm text-stone-200 text-center">{row.seasons}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HistoryRecord;