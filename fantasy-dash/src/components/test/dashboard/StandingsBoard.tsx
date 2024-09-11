import React, { useState, useMemo } from 'react';
import { getRosterOwnerName } from '@/utils/usernameUtil';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { decimalToPercentage } from '@/utils/toPercent';

interface RosterSettings {
  wins: number;
  losses: number;
  ties?: number;
  fpts: number;
  fpts_against?: number;
}

interface RosterData {
  roster_id: number | string;
  owner_id: string;
  settings: RosterSettings;
}

interface StandingsBoardProps {
  data: RosterData[];
}

interface Column {
  key: string;
  label: string;
}

type SortDirection = 'asc' | 'desc' | null;

const StandingsBoard: React.FC<StandingsBoardProps> = ({ data }) => {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

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
    { key: 'ppg', label: 'PPG' },
  ];

  const processedData = useMemo(() => {
    const dataWithRank = data.map((item, index) => {
      const totalGames = (item.settings.wins || 0) + (item.settings.losses || 0) + (item.settings.ties || 0);
      const teamName = getRosterOwnerName(item.roster_id);
      const trueFpts = `${item.settings.fpts}.${item.settings.fpts_decimal}`
      const trueFpts_against = `${item.settings.fpts_against}.${item.settings.fpts_against_decimal}`


      return {
        team: teamName === 'Unknown' ? `Team ${index + 1}` : teamName,
        owner_id: item.owner_id,
        wins: item.settings.wins || 0,
        losses: item.settings.losses || 0,
        ties: item.settings.ties || 0,
        fpts: trueFpts || 0,
        manager_score: (item.settings.fpts/item.settings.ppts).toFixed(2)*100,
        fpts_against: trueFpts_against || null,
        win_percentage: totalGames > 0 ? decimalToPercentage(Number(((item.settings.wins || 0) / totalGames).toFixed(4))) : 0,
        ppg: totalGames > 0 ? Number(((trueFpts || 0) / totalGames).toFixed(2)) : 0,
      };
    });

    dataWithRank.sort((a, b) => {
      if (b.wins === a.wins) {
        return b.fpts - a.fpts;
      }
      return b.wins - a.wins;
    });

    return dataWithRank.map((item, index) => ({ ...item, rank: index + 1 }));
  }, [data]);

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
      <table className="min-w-full bg-stone-900 border border-stone-700 rounded-md">
        <caption className='text-center w-full mx-auto text-xl p-5'>Standings</caption>
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
                    className="mt-1 w-full px-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500 bg-stone-800 text-stone-200"
                  />
                )}
              </th>
            ))}
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
                    row[column.key] !== null ? row[column.key] : 'N/A'
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StandingsBoard;
