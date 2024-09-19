import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

import 'chart.js/auto';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const PlayerPointsChart = ({ projections, stats }) => {
  const [chartMetric, setChartMetric] = useState('pts_half_ppr');

  const filterNullValues = (data) => {
    return Object.entries(data)
      .filter(([_, value]) => value !== null && value.stats)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  };

  const filteredProjections = filterNullValues(projections);
  const filteredStats = filterNullValues(stats);

  const totalProjectedPoints = useMemo(() => {
    return filteredProjections.reduce((sum, [_, week]) => sum + (week.stats[chartMetric] || 0), 0);
  }, [filteredProjections, chartMetric]);

  const totalActualPoints = useMemo(() => {
    return filteredStats.reduce((sum, [_, week]) => sum + (week.stats[chartMetric] || 0), 0);
  }, [filteredStats, chartMetric]);

  const projectedAveragePoints = useMemo(() => {
    return filteredProjections.length > 0 ? totalProjectedPoints / filteredProjections.length : 0;
  }, [totalProjectedPoints, filteredProjections]);

  const actualAveragePoints = useMemo(() => {
    return filteredStats.length > 0 ? totalActualPoints / filteredStats.length : 0;
  }, [totalActualPoints, filteredStats]);

  const allWeeks = useMemo(() => {
    const weeks = new Set();
    [...Object.values(projections), ...Object.values(stats)].forEach(week => {
      if (week && week.week) weeks.add(week.week);
    });
    return Array.from(weeks).sort((a, b) => a - b);
  }, [projections, stats]);

  const chartData = {
    labels: allWeeks.map(week => `Week ${week}`),
    datasets: [
      {
        label: `Projections`,
        data: allWeeks.map(week => {
          const weekData = filteredProjections.find(([_, data]) => data.week === week);
          return {
            x: `Week ${week}`,
            y: weekData ? weekData[1].stats[chartMetric] || 0 : 0,
            opponent: weekData ? weekData[1].opponent : 'N/A'
          };
        }),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1
      },
      {
        label: `Actual`,
        data: allWeeks.map(week => {
          const weekData = filteredStats.find(([_, data]) => data.week === week);
          return {
            x: `Week ${week}`,
            y: weekData ? weekData[1].stats[chartMetric] || null : null,
            opponent: weekData ? weekData[1].opponent : 'N/A'
          };
        }),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        intersect: false,
        mode: 'nearest'
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Player Stats and Projections',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            const opponent = context.raw.opponent || 'N/A';
            return `${label}: ${value.toFixed(2)} (vs ${opponent})`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  return (
    <div className="mt-4 max-h-96 mb-12 w-full">
      <div className="mb-4 flex justify-between items-center">
        <select
          value={chartMetric}
          onChange={(e) => setChartMetric(e.target.value)}
          className="bg-stone-700 text-white p-2 rounded"
        >
          <option value="pts_half_ppr">Half PPR</option>
          <option value="pts_std">Standard</option>
          <option value="pts_ppr">PPR</option>
        </select>
        <div className="text-sm">
          <p>Total Projected Points: <span className="font-bold">{totalProjectedPoints.toFixed(2)}</span></p>
          <p>Total Actual Points: <span className="font-bold">{totalActualPoints.toFixed(2)}</span></p>
          <p>Projected PPG: <span className="font-bold">{projectedAveragePoints.toFixed(2)}</span></p>
          <p>Avg PPG: <span className="font-bold">{actualAveragePoints.toFixed(2)}</span></p>
        </div>
      </div>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default PlayerPointsChart;