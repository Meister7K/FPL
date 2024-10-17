// @ts-nocheck
import React, { useMemo, useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { getRosterOwnerName } from '@/utils/usernameUtil';
import useLeagueStore from '@/store/testStore';
import historic from '@/db/history.json';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface RosterData {
  roster_id: number | string;
  owner_id: string;
  settings: {
    wins: number;
    losses: number;
    ties?: number;
    fpts: number;
    fpts_decimal: number;
    fpts_against?: number;
    fpts_against_decimal?: number;
    ppts: number;
    ppts_decimal: number;
  };
  standings?: {
    place: number;
    season: string;
  };
}

interface SeasonData {
  season: string;
  rosters: RosterData[];
}

interface HistoricalRankingsChartProps {
  data: SeasonData[];
  brackets: Record<string, any[]>;
}

const getColor = (index: number, total: number) => {
  const hue = (index / total) * 360;
  return `hsl(${hue}, 100%, 50%)`;
};



const HistoricalRankingsChart: React.FC<HistoricalRankingsChartProps> = ({ data, brackets }) => {
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

  const chartData = useMemo(() => {
    let combinedData = [...data];


    if (selectedLeague?.name === "Fantasy Premier League" && historyData.length > 0) {
      historyData.forEach(yearData => {
        const existingSeasonIndex = combinedData.findIndex(d => d.season === yearData.year.toString());
        if (existingSeasonIndex !== -1) {
          combinedData[existingSeasonIndex].rosters = combinedData[existingSeasonIndex].rosters.map(roster => {
            const historicalStanding = yearData.season_data.find(s => s.roster_id.toString() === roster.roster_id.toString());
            if (historicalStanding) {
              return {
                ...roster,
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


    const ownerData: { [key: string]: { seasons: string[], ranks: number[] } } = {};

    combinedData.forEach(seasonData => {
      seasonData.rosters.forEach(roster => {
        if (roster.standings) {
          const ownerId = roster.owner_id;
          if (!ownerData[ownerId]) {
            ownerData[ownerId] = { seasons: [], ranks: [] };
          }
          ownerData[ownerId].seasons.push(seasonData.season);
          ownerData[ownerId].ranks.push(roster.standings.place);
        }
      });
    });

    const seasons = combinedData.map(d => d.season);

    const datasets = Object.entries(ownerData).map(([ownerId, data], index, array) => ({
      label: getRosterOwnerName(ownerId),
      data: data.ranks.map((rank, i) => ({
        x: data.seasons[i],
        y: rank,
        ownerId,
        // rosterId,
      })),
      borderColor: getColor(index, array.length),
      borderWidth: 10,
      fill: false,
      tension: 0,
      hoverBorderWidth: 15,
      pointBorderWidth: 11,
      stepped: false,
      borderJoinStyle: 'round',
      borderCapStyle: 'round'
    }));

    return {
      labels: seasons,
      datasets,
    };
  }, [data, historyData, selectedLeague]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        title: { display: true, padding: -20 },
        labels: {
          color: 'white',
          padding: 50,
          boxWidth: 10,
          fullSize: true,
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const ownerId = context.raw.ownerId;
            const rosterId = context.raw.rosterId;
          
            return `${getRosterOwnerName(ownerId, rosterId)} - Rank: ${context.raw.y}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Season',
        },
        ticks: {
          color: 'white',
          padding: 20,
        },
        grid: {
          color: 'rgba(128, 128, 128, 0.5)',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Rank',
        },
        reverse: true,
        ticks: {
          stepSize: 1,
          padding: 20,
          color: 'white',
        },
        grid: {
          color: 'rgba(128, 128, 128, 0.5)',
        },
      },
    },
  };

  return (
    <div className="w-full h-[600px] border border-stone-800 rounded-lg shadow-md overflow-hidden ">
      <div className="p-4 bg-stone-800 border-b border-stone-900">
        <h2 className="text-xl font-semibold text-stone-200">Historical Rankings</h2>
      </div>
      <div className="h-[calc(100%-60px)]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default HistoricalRankingsChart;