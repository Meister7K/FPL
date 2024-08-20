'use client';

import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, Title, Tooltip, Legend, PointElement } from 'chart.js';
import { useFPLStore } from '../../store/fplStore';
import 'chart.js/auto';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Function to generate a color based on a unique string
const generateColor = (str: string) => {
    const hash = Array.from(str).reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    const r = (hash & 0xFF0000) >> 16;
    const g = (hash & 0x00FF00) >> 8;
    const b = hash & 0x0000FF;
    return {
        backgroundColor: `rgba(${r}, ${g}, ${b}, 0.2)`,
        borderColor: `rgba(${r}, ${g}, ${b}, 1)`
    };
};

const FPTSSeasonChart: React.FC = () => {
    const { matchupData, managers } = useFPLStore(state => ({
        matchupData: state.matchupData,
        managers: state.managers,
    }));

    const [chartData, setChartData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [visibleWeeks, setVisibleWeeks] = useState<string[]>([]);
    const [colorMap, setColorMap] = useState<Record<string, { borderColor: string; backgroundColor: string }>>({});

    useEffect(() => {
        if (matchupData && managers) {
            prepareChartData();
            setLoading(false);
        }
    }, [matchupData, managers]);

    const prepareChartData = () => {
        if (!matchupData || !managers) return;

        const labels: string[] = Object.keys(matchupData).map(week => `Week ${week}`);
        const datasets: any = {};

        // Create color map for managers
        const newColorMap = managers.reduce((map, manager) => {
            map[manager.user_id] = generateColor(manager.username);
            return map;
        }, {} as Record<string, { borderColor: string; backgroundColor: string }>);
        setColorMap(newColorMap);

        Object.entries(matchupData).forEach(([week, weekData]) => {
            weekData.forEach((matchup: any) => {
                const { roster_id, points } = matchup;
                const manager = managers.find(m => m.roster.roster_id === roster_id);
                const username = manager ? manager.username : `Unknown (${roster_id})`;

                if (!datasets[username]) {
                    datasets[username] = {
                        label: username,
                        data: Array(labels.length).fill(null),
                        ...newColorMap[manager?.user_id || roster_id],
                    };
                }

                const weekIndex = parseInt(week) - 1;
                datasets[username].data[weekIndex] = points;
            });
        });

        setChartData({
            labels,
            datasets: Object.values(datasets),
        });

        // Initialize visible weeks
        setVisibleWeeks(labels);
    };

    const toggleWeek = (week: string) => {
        setVisibleWeeks(prev =>
            prev.includes(week) ? prev.filter(w => w !== week) : [...prev, week]
        );
    };

    if (loading) {
        return <p>Loading chart data...</p>;
    }

    if (!chartData) {
        return <p>No data available for the chart</p>;
    }

    // Filter data based on visible weeks
    const filteredData = {
        labels: chartData.labels.filter((label: string) => visibleWeeks.includes(label)),
        datasets: chartData.datasets.map((dataset: any) => ({
            ...dataset,
            data: dataset.data.filter((_: any, index: number) => visibleWeeks.includes(chartData.labels[index])),
        })),
    };

    return (
        <div className="mb-96 md:mb-40 min-h-fit h-3/4 md:h-4/5 max-h-screen w-full">
            <h2 className="text-xl font-semibold text-center">FPTS by Week</h2>
            <div className="flex flex-wrap justify-center mb-4">
                {chartData.labels.map((week: string) => (
                    <button
                        key={week}
                        onClick={() => toggleWeek(week)}
                        className={`px-4 py-2 m-2 border rounded ${visibleWeeks.includes(week) ? 'bg-stone-800 hover:bg-stone-500 text-white' : 'bg-gray-200 text-black'}`}
                    >
                        {week}
                    </button>
                ))}
            </div>
            <Line
                data={filteredData}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'nearest'
                    },
                    plugins: {
                        legend: {
                            position: 'top' as const,
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => `${context.dataset.label}: ${context.parsed.y} points`,
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
                                text: 'Week'
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
                        },
                    },
                }}
            />
        </div>
    );
};

export default FPTSSeasonChart;