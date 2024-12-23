// @ts-nocheck
import React, { useMemo } from 'react';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type RosterData = {
  custom_points: number | null;
  matchup_id: number;
  players: string[];
  players_points: { [key: string]: number };
  points: number;
  roster_id: number;
  starters: string[];
  starters_points: number[];
};

type WeekData = RosterData[];

type PowerRankingsData = WeekData[];

type PowerRankingsChartProps = {
  data: PowerRankingsData;
};

const getColor = (index: number, total: number) => {
  const hue = (index / total) * 360;
  return `hsl(${hue}, 100%, 50%)`;
};


const calculateCumulativeScores = (data: PowerRankingsData): { 
  scores: { [key: number]: number[] },
  validWeeks: number[] 
} => {
  const cumulativeScores: { [key: number]: number } = {};
  const validWeeks: number[] = [];
  const filteredScores: { [key: number]: number[] } = {};

  data.forEach((weekData, weekIndex) => {
  
    const hasNonZeroPoints = weekData.some(roster => roster.points > 0);
    
    if (hasNonZeroPoints) {
      validWeeks.push(weekIndex + 1); 
      
      weekData.forEach(roster => {
        const pointsEarned = weekData.filter(r => r.points < roster.points).length;
        cumulativeScores[roster.roster_id] = (cumulativeScores[roster.roster_id] || 0) + pointsEarned;

        if (!filteredScores[roster.roster_id]) {
          filteredScores[roster.roster_id] = [];
        }
        filteredScores[roster.roster_id].push(cumulativeScores[roster.roster_id]);
      });
    }
  });

  return {
    scores: filteredScores,
    validWeeks
  };
};


const calculateRankings = (
  cumulativeScores: { [key: number]: number[] }
): { [key: number]: number[] } => {
  const weekCount = Math.max(...Object.values(cumulativeScores).map(scores => scores.length));
  const rankings: { [key: number]: number[] } = {};

  for (let week = 0; week < weekCount; week++) {
    const weekScores = Object.entries(cumulativeScores).map(([rosterId, scores]) => ({
      rosterId: Number(rosterId),
      score: scores[week] || 0,
    }));

    const sortedRosters = weekScores.sort((a, b) => b.score - a.score);

    sortedRosters.forEach((roster, index) => {
      if (!rankings[roster.rosterId]) {
        rankings[roster.rosterId] = [];
      }
      rankings[roster.rosterId][week] = index + 1;
    });
  }

  return rankings;
};

const PowerRankingsChart: React.FC<PowerRankingsChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const newData = Object.values(data)[0];
    const { scores: cumulativeScores, validWeeks } = calculateCumulativeScores(newData);
    const rankings = calculateRankings(cumulativeScores);

    const datasets = Object.entries(rankings).map(([rosterId, ranks], index, array) => ({
      label: getRosterOwnerName(Number(rosterId)),
      data: ranks.map((rank, weekIndex) => ({
        x: validWeeks[weekIndex],
        y: rank,
        score: cumulativeScores[Number(rosterId)][weekIndex],
        rosterId: Number(rosterId),
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
      labels: validWeeks.map(week => `Week ${week}`),
      datasets,
    };
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom',
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
          label: (context) => {
            const rosterId = context.raw.rosterId;
            return `${getRosterOwnerName(rosterId)} - Rank: ${context.raw.y}, Score: ${context.raw.score}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Week',
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
    <div className="w-full h-[600px] border border-stone-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-stone-800 border-b border-stone-900">
        <h2 className="text-xl font-semibold text-stone-200">Power Rankings</h2>
      </div>
      <div className="h-[calc(100%-60px)]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default PowerRankingsChart;