// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { getRosterOwnerName } from '@/utils/usernameUtil';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { decimalToPercentage } from '@/utils/toPercent';
import useLeagueStore from '@/store/testStore';
import historic from '@/db/history.json';

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
  standings?: {
    place: number;
    season: string;
  };
}

interface SeasonData {
  season: string;
  rosters: RosterData[];
}

interface HistoryRecordProps {
  data: SeasonData[];
  brackets: Record<string, any[]>;
}

interface Column {
  key: string;
  label: string;
}

type SortDirection = 'asc' | 'desc' | null;

const HistoryRecord: React.FC<HistoryRecordProps> = ({ data, brackets }) => {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [isCumulative, setIsCumulative] = useState<boolean>(false);

  const selectedLeague = useLeagueStore(state => state.selectedLeague);
  const [historyData, setHistoryData] = useState<any[]>([]);

  useEffect(() => {
    const fetchHistoryData = async () => {
      if (selectedLeague?.name === "Fantasy Premier League") {
        try {
          setHistoryData(historic);
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
    { key: 'avg_placement', label: 'Avg. Placement' },
    { key: 'championships', label: 'Championships' },
    { key: 'toilet_bowls', label: 'Toilet Bowls' },
  ];

  const mergeData = (standings, rosters) => {
    for (const roster of rosters) {
      const seasonStandings = standings[roster.season];
      if (seasonStandings) {
        for (const r of roster.rosters) {
          const matchingStanding = seasonStandings.find(standing => standing.roster_id === r.roster_id);
          if (matchingStanding) {
            r.standings = matchingStanding;
          }
        }
      }
    }
    return rosters;
  };

  const mergedResults = mergeData(brackets, data);

  const years = useMemo(() => {
    const allYears = new Set([...mergedResults.map(d => d.season)]);
    if (selectedLeague?.name === "Fantasy Premier League" && historyData.length > 0) {
      historyData.forEach(d => allYears.add(d.year.toString()));
    }
    return ['All', ...Array.from(allYears).sort()];
  }, [mergedResults, historyData, selectedLeague]);

  const processedData = useMemo(() => {
    let combinedData = [...mergedResults];

    if (selectedLeague?.name === "Fantasy Premier League" && historyData.length > 0) {
      historyData.forEach(yearData => {
        const existingSeasonIndex = combinedData.findIndex(d => d.season === yearData.year.toString());
        if (existingSeasonIndex !== -1) {
          combinedData[existingSeasonIndex].rosters = combinedData[existingSeasonIndex].rosters.map(roster => {
            const historicalStanding = yearData.season_data.find(s => s.roster_id.toString() === roster.roster_id.toString());
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
                },
                standings: {
                  place: historicalStanding.place,
                  season: yearData.year.toString()
                }
              };
            }
            return roster;
          });
        } else {
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
              },
              standings: {
                place: standing.place,
                season: yearData.year.toString()
              }
            }))
          });
        }
      });
    }

    combinedData.sort((a, b) => Number(a.season) - Number(b.season));

    const filteredData = isCumulative
      ? combinedData.filter(d => Number(d.season) <= Number(selectedYear))
      : selectedYear === 'All'
      ? combinedData
      : combinedData.filter(d => d.season === selectedYear);

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
        existingTeam.placements.push(curr.standings?.place || 0);
        
        if (curr.standings && curr.standings.place === 1) {
          existingTeam.championships = (existingTeam.championships || 0) + 1;
        }
        if (curr.standings && curr.standings.place === filteredData[0].rosters.length) {
          existingTeam.toilet_bowls = (existingTeam.toilet_bowls || 0) + 1;
        }
      } else {
        acc.push({
          ...curr,
          settings: {
            ...curr.settings,
            fpts: curr.settings.fpts + curr.settings.fpts_decimal / 100,
            fpts_against: curr.settings.fpts_against ? curr.settings.fpts_against + curr.settings.fpts_against_decimal / 100 : 0,
            ppts: curr.settings.ppts + curr.settings.ppts_decimal / 100,
          },
          seasons: [curr.season],
          placements: [curr.standings?.place || 0],
          championships: curr.standings && curr.standings.place === 1 ? 1 : 0,
          toilet_bowls: curr.standings && curr.standings.place === filteredData[0].rosters.length ? 1 : 0
        });
      }
      return acc;
    }, []);

    return cumulativeStats.map(item => {
      const totalGames = item.settings.wins + item.settings.losses + (item.settings.ties || 0);
      const teamName = getRosterOwnerName(item.owner_id);
      
      const sortedSeasons = item.seasons.sort((a, b) => Number(a) - Number(b));
      let seasonsDisplay = sortedSeasons.join(', ');
      if (sortedSeasons.length > 2) {
        seasonsDisplay = `${sortedSeasons[0]}-${sortedSeasons[sortedSeasons.length - 1]}`;
      }

      const avgPlacement = item.placements.filter(p => p !== 0).length > 0
        ? (item.placements.filter(p => p !== 0).reduce((a, b) => a + b, 0) / item.placements.filter(p => p !== 0).length).toFixed(1)
        : 'N/A';
     
      return {
        team: teamName === 'Unknown' ? `ID: ${item.owner_id}` : teamName,
        owner_id: item.owner_id,
        wins: item.settings.wins.toFixed(0),
        losses: item.settings.losses.toFixed(0),
        ties: item.settings.ties.toFixed(0) || 0,
        fpts: item.settings.fpts.toFixed(2),
        manager_score: item.settings.ppts > 0 ? ((item.settings.fpts / item.settings.ppts) * 100).toFixed(2) : null,
        fpts_against: item.settings.fpts_against.toFixed(2),
        win_percentage: totalGames > 0 ? decimalToPercentage(Number((item.settings.wins / totalGames).toFixed(4))) : 0,
        ppg: totalGames > 0 ? Number((item.settings.fpts / totalGames).toFixed(2)) : 0,
        avg_placement: avgPlacement,
        championships: item.championships || 0,
        toilet_bowls: item.toilet_bowls || 0,
        seasons: seasonsDisplay
      };
    }).sort((a, b) => {
      if (b.wins === a.wins) {
        return b.fpts - a.fpts;
      }
      return b.wins - a.wins;
    }).map((item, index) => ({ ...item, rank: (index + 1).toFixed(0) }));
  }, [data, selectedYear, historyData, selectedLeague, isCumulative]);

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
      <div className="mb-4 flex items-center space-x-4">
        <select 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-2 py-1 border rounded bg-stone-800 text-stone-200"
        >
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <label className="flex items-center space-x-2 text-stone-200">
          <input
            type="checkbox"
            checked={isCumulative}
            onChange={(e) => setIsCumulative(e.target.checked)}
            className="form-checkbox h-5 w-5 text-rose-600"
          />
          <span>Cumulative up to selected year</span>
        </label>
      </div>
      <table className="min-w-full bg-stone-900 border border-stone-700 rounded-md">
        <caption className='text-center w-full mx-auto text-xl p-5'>
          {isCumulative ? 'Cumulative' : ''} Standings 
          {selectedYear !== 'All' ? ` ${isCumulative ? 'up to' : 'for'} ${selectedYear}` : ''}
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
                        Number(row[column.key]) : 
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