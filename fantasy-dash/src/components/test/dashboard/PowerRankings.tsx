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

// Utility function to generate unique colors
const getColor = (index: number, total: number) => {
  const hue = (index / total) * 360;
  return `hsl(${hue}, 100%, 50%)`; // Generates distinct colors using HSL
};

// Calculate cumulative scores (same as previous)
const calculateCumulativeScores = (data: PowerRankingsData): { [key: number]: number[] } => {
  const cumulativeScores: { [key: number]: number } = {};

  return data.reduce((acc, weekData, weekIndex) => {
    weekData.forEach(roster => {
      const pointsEarned = weekData.filter(r => r.points < roster.points).length;
      cumulativeScores[roster.roster_id] = (cumulativeScores[roster.roster_id] || 0) + pointsEarned;

      if (!acc[roster.roster_id]) {
        acc[roster.roster_id] = [];
      }
      acc[roster.roster_id][weekIndex] = cumulativeScores[roster.roster_id];
    });

    return acc;
  }, {} as { [key: number]: number[] });
};

// Calculate rankings (same as previous)
const calculateRankings = (cumulativeScores: { [key: number]: number[] }): { [key: number]: number[] } => {
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
      rankings[roster.rosterId][week] = index + 1; // Ranks start at 1
    });
  }

  return rankings;
};

const PowerRankingsChart: React.FC<PowerRankingsChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const newData = Object.values(data)[0];
    const cumulativeScores = calculateCumulativeScores(newData);
    const rankings = calculateRankings(cumulativeScores);

    const datasets = Object.entries(rankings).map(([rosterId, ranks], index, array) => ({
      label: getRosterOwnerName(Number(rosterId)),
      data: ranks.map((rank, weekIndex) => ({
        x: weekIndex + 1,
        y: rank,
        score: cumulativeScores[Number(rosterId)][weekIndex],
        rosterId: Number(rosterId),
      })),
      borderColor: getColor(index, array.length), // Unique color for each line
      borderWidth: 20, // Thicker lines
      fill: false,
      tension: 0, // Smooth lines
      hoverBorderWidth:30,
      pointBorderWidth:21,
      stepped:false,
      borderJoinStyle:'round',
      borderCapStyle: 'round'
    }));

    return {
      labels: rankings[Object.keys(rankings)[0]].map((_, index) => `Week ${index + 1}`),
      datasets,
    };
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio:false,
    interaction: {
      mode: 'nearest',
      intersect: false, // Allow interaction when hovering near points
    },
    plugins: {
      
      legend: {
        position: 'bottom',
        title: { display: true, padding: -20 },
        labels: {
          color: 'white',
          padding: 50,
          boxWidth: 10,
          
          fullSize:true, // Change legend text color to white
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
          color:'white',
          padding:20,
        },
        grid: {
          color: 'rgba(128, 128, 128, 0.5)', // Gray grid line color
      },
      },
      y: {
        title: {
          display: true,
          text: 'Rank',
        },
        reverse: true, // Invert the Y-axis so rank 1 is at the top
        ticks: {
          stepSize: 1,
          padding:20,
          color:'white',
        },
        grid: {
          color: 'rgba(128, 128, 128, 0.5)', // Gray grid line color
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
