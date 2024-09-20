// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import { getRosterOwnerName } from '@/utils/usernameUtil';
import useLeagueStore from '@/store/testStore';
import historic from '@/db/history.json';
import 'chart.js/auto';

ChartJS.register(LineElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

interface RosterSettings {
  fpts: number;
  fpts_decimal: number;
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

interface FPTSHistoricLineChartProps {
  data: SeasonData[];
}

const generateColor = (str: string) => {
  const hash = Array.from(str).reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const r = (hash >> 0) & 0xFF;
  const g = (hash >> 8) & 0xFF;
  const b = (hash >> 16) & 0xFF;
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.2)`,
    borderColor: `rgba(${r}, ${g}, ${b}, 1)`
  };
};

const FPTSHistoricLineChart: React.FC<FPTSHistoricLineChartProps> = ({ data }) => {
  const [visibleYears, setVisibleYears] = useState<string[]>([]);
  const [colorMap, setColorMap] = useState<Record<string, { borderColor: string; backgroundColor: string }>>({});
  const selectedLeague = useLeagueStore(state => state.selectedLeague);

  const processedData = useMemo(() => {
    let combinedData = [...data];

    if (selectedLeague?.name === "Fantasy Premier League" && historic.length > 0) {
      historic.forEach(yearData => {
        const existingSeasonIndex = combinedData.findIndex(d => d.season === yearData.year.toString());
        if (existingSeasonIndex !== -1) {
          combinedData[existingSeasonIndex].rosters = combinedData[existingSeasonIndex].rosters.map(roster => {
            const historicalStanding = yearData.season_data.find(s => s.roster_id.toString() === roster.roster_id.toString());
            if (historicalStanding) {
              return {
                ...roster,
                settings: {
                  ...roster.settings,
                  fpts: historicalStanding.fpts,
                  fpts_decimal: 0,
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
                fpts: standing.fpts,
                fpts_decimal: 0,
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

    const fptsData = combinedData.flatMap(seasonData => 
      seasonData.rosters.map(roster => ({
        season: seasonData.season,
        owner_id: roster.owner_id,
        fpts: roster.settings.fpts + roster.settings.fpts_decimal / 100,
      }))
    );

    const managerMap = fptsData.reduce((acc, curr) => {
      if (!acc[curr.owner_id]) {
        acc[curr.owner_id] = [];
      }
      acc[curr.owner_id].push({ season: curr.season, fpts: curr.fpts });
      return acc;
    }, {} as Record<string, { season: string; fpts: number }[]>);

    return Object.entries(managerMap).map(([owner_id, data]) => ({
      owner_id,
      name: getRosterOwnerName(owner_id),
      data: data.sort((a, b) => Number(a.season) - Number(b.season))
    }));
  }, [data, selectedLeague]);

  const { leagueAverage, seasonAverages } = useMemo(() => {
    let totalPoints = 0;
    let totalEntries = 0;
    const seasonAverages: Record<string, number> = {};

    visibleYears.forEach(year => {
      const yearData = processedData.flatMap(manager => 
        manager.data.filter(d => d.season === year).map(d => d.fpts)
      );
      seasonAverages[year] = yearData.reduce((sum, fpts) => sum + fpts, 0) / yearData.length;
      
      totalPoints += yearData.reduce((sum, fpts) => sum + fpts, 0);
      totalEntries += yearData.length;
    });

    const leagueAverage = totalEntries > 0 ? totalPoints / totalEntries : 0;

    return { leagueAverage, seasonAverages };
  }, [processedData, visibleYears]);

  useEffect(() => {
    if (processedData.length > 0) {
      const allYears = Array.from(new Set(processedData.flatMap(manager => manager.data.map(d => d.season)))).sort();
      setVisibleYears(allYears);

      const colorMap = processedData.reduce((map, manager) => {
        map[manager.owner_id] = generateColor(manager.name);
        return map;
      }, {} as Record<string, { borderColor: string; backgroundColor: string }>);

      setColorMap(colorMap);
    }
  }, [processedData]);

  const toggleYear = (year: string) => {
    setVisibleYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };



  const chartData = {
    labels: visibleYears,
    datasets: [
      ...processedData.map(manager => ({
        label: manager.name,
        data: visibleYears.map(year => {
          const yearData = manager.data.find(d => d.season === year);
          return yearData ? yearData.fpts : null;
        }),
        ...colorMap[manager.owner_id]
      })),
      {
        label: 'League Average',
        data: visibleYears.map(() => leagueAverage),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderWidth: 2,
        borderDash: [5, 5],
      },
      {
        label: 'Season Average',
        data: visibleYears.map(year => seasonAverages[year]),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderWidth: 2,
        borderDash: [10, 5],
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'nearest' as const
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            if (context.dataset.label === 'League Average') {
              return `League Average: ${leagueAverage.toFixed(2)}`;
            }
            return `${context.dataset.label}: ${context.raw.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: '#222222'
        },
        title: {
          display: true,
          text: 'Year'
        },
        ticks: {
          autoSkip: true,
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        grid: {
          color: '#222222'
        },
        title: {
          display: true,
          text: 'FPTS'
        },
        ticks: {
          callback: (value: number) => value === 0 ? null : value,
        }
      },
    },
  };

  return (
    <div className="my-10 md:mb-40 min-h-fit h-3/4 md:h-2/5 max-h-screen w-full">
      <h2 className="text-xl font-semibold text-center">FPTS Over the Years</h2>
      <div className="flex flex-wrap justify-center mb-4">
        {visibleYears.map(year => (
          <button
            key={year}
            onClick={() => toggleYear(year)}
            className={`px-4 py-2 m-2 border rounded ${visibleYears.includes(year) ? 'bg-stone-800 hover:bg-stone-500 text-white' : 'bg-gray-200 text-black'}`}
          >
            {year}
          </button>
        ))}
      </div>
      
      <Line data={chartData} options={options} />
    </div>
  );
};

export default FPTSHistoricLineChart;