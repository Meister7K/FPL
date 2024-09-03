import React, { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, Title, Tooltip, Legend, PointElement } from 'chart.js';
import 'chart.js/auto';
import { getRosterOwnerName } from '@/utils/usernameUtil';

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

interface FPTSSeasonChartProps {
    matchupData: Record<string, any[]>;
    currentRosterData: any;
}

const FPTSSeasonChart: React.FC<FPTSSeasonChartProps> = ({ matchupData, currentRosterData }) => {
    const [chartData, setChartData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [visibleWeeks, setVisibleWeeks] = useState<string[]>([]);
    const [weeklyAverages, setWeeklyAverages] = useState<number[]>([]);
    const [matchupPairs, setMatchupPairs] = useState<Record<string, string>>({});
    const [rosterIdMap, setRosterIdMap] = useState<Record<string, number>>({});

    useEffect(() => {
        if (matchupData && currentRosterData) {
            prepareChartData();
            prepareMatchupPairs();
            setLoading(false);
        }
    }, [matchupData, currentRosterData]);

    const prepareMatchupPairs = () => {
        const pairData = Object.values(matchupData)[0] as any[][];
        console.log(pairData)
        const pairs: Record<string, string> = {};
        const idMap: Record<string, number> = {};
        pairData.forEach((week: any[], weekIndex) => {
            week.forEach((rosterData: any) => {
                const { roster_id, matchup_id } = rosterData;
                pairs[roster_id] = matchup_id;
                if (weekIndex === 0) {
                    idMap[getRosterOwnerName(roster_id)] = roster_id;
                }
            });
        });
        setMatchupPairs(pairs);
        setRosterIdMap(idMap);
    };

    const prepareChartData = () => {
        if (!matchupData || !currentRosterData) return;

        const matchData = Object.values(matchupData)[0] as any[][];
        const labels: string[] = matchData.map((_, index) => `Week ${index + 1}`);
        const datasets: any = {};
        const weeklyPoints: number[] = Array(labels.length).fill(0);
        const weeklyCounts: number[] = Array(labels.length).fill(0);

        matchData.forEach((week, weekIndex) => {
            week.forEach((rosterData: any) => {
                const { roster_id, points } = rosterData;

                const currentRoster = currentRosterData.find(r => r.roster_id === roster_id);
                
                const isCurrentRoster = roster_id === currentRoster.roster_id;

                const username = isCurrentRoster 
                    ? `${getRosterOwnerName(currentRoster.roster_id)}`
                    : `Roster ${roster_id}`;

                if (!datasets[username]) {
                    const color = generateColor(username);
                    datasets[username] = {
                        label: username,
                        data: Array(labels.length).fill(null),
                        borderColor: color.borderColor,
                        backgroundColor: color.backgroundColor,
                        borderWidth: 2,
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        fill: false,
                    };
                }

                datasets[username].data[weekIndex] = points;

                weeklyPoints[weekIndex] += points;
                weeklyCounts[weekIndex]++;
            });
        });

        // Compute weekly averages
        const calculatedWeeklyAverages = weeklyPoints.map((total, index) => total / (weeklyCounts[index] || 1));
        setWeeklyAverages(calculatedWeeklyAverages);

        // Add weekly average dataset
        datasets['Weekly Average'] = {
            label: 'Weekly Average',
            data: calculatedWeeklyAverages,
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
        };

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

    // Dynamically calculate season average based on visible weeks
    const dynamicSeasonAverage = useMemo(() => {
        if (!chartData || visibleWeeks.length === 0) return 0;
        const visibleWeekIndices = visibleWeeks.map(week => parseInt(week.split(' ')[1]) - 1);
        const visibleAverages = weeklyAverages.filter((_, index) => visibleWeekIndices.includes(index));
        return visibleAverages.reduce((sum, avg) => sum + avg, 0) / visibleAverages.length;
    }, [chartData, visibleWeeks, weeklyAverages]);

    if (loading) {
        return <p>Loading chart data...</p>;
    }

    if (!chartData) {
        return <p>No data available for the chart</p>;
    }

    // Filter data based on visible weeks
    const filteredData = {
        labels: chartData.labels.filter((label: string) => visibleWeeks.includes(label)),
        datasets: chartData.datasets.map((dataset: any) => {
            if (dataset.label === 'Season Average') {
                return {
                    ...dataset,
                    data: Array(visibleWeeks.length).fill(dynamicSeasonAverage),
                };
            }
            return {
                ...dataset,
                data: dataset.data.filter((_: any, index: number) => visibleWeeks.includes(chartData.labels[index])),
            };
        }),
    };

    // Add or update the Season Average dataset
    const seasonAverageDataset = filteredData.datasets.find((ds: any) => ds.label === 'Season Average');
    if (seasonAverageDataset) {
        seasonAverageDataset.data = Array(visibleWeeks.length).fill(dynamicSeasonAverage);
    } else {
        filteredData.datasets.push({
            label: 'Season Average',
            data: Array(visibleWeeks.length).fill(dynamicSeasonAverage),
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderWidth: 2,
            borderDash: [10, 5],
            pointRadius: 0,
            fill: false,
        });
    }

    return (
        <div className="mb-96 md:mb-40 min-h-28 h-1/2 md:h-3/5 max-h-96 w-full">
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
                                label: (context) => {
                                    const label = context.dataset.label || '';
                                    const value = context.parsed.y;
                                    const rosterId = rosterIdMap[label];
                                    const matchupId = matchupPairs[rosterId];
                                    const pairedRosterId = Object.keys(matchupPairs).find(
                                        key => matchupPairs[key] === matchupId && key !== rosterId
                                    );
                                    const pairedLabel = Object.keys(rosterIdMap).find(
                                        key => rosterIdMap[key] === pairedRosterId
                                    );
                                    const pairedValue = filteredData.datasets.find(
                                        ds => ds.label === pairedLabel
                                    )?.data[context.dataIndex];

                                    return [
                                        `${label}: ${value.toFixed(2)} points`,
                                        `Matchup: ${pairedLabel}: ${pairedValue?.toFixed(2) || 'N/A'} points`
                                    ];
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
                    onHover: (event, activeElements) => {
                        if (activeElements && activeElements.length > 0) {
                            const hoveredElement = activeElements[0];
                            const hoveredDatasetLabel = filteredData.datasets[hoveredElement.datasetIndex].label;
                            const hoveredRosterId = rosterIdMap[hoveredDatasetLabel];
                            const hoveredMatchupId = matchupPairs[hoveredRosterId];
                            
                            filteredData.datasets.forEach((dataset, index) => {
                                const currentRosterId = rosterIdMap[dataset.label];
                                if (matchupPairs[currentRosterId] === hoveredMatchupId) {
                                    dataset.borderWidth = 4;
                                    dataset.pointRadius = 6;
                                } else {
                                    dataset.borderWidth = 2;
                                    dataset.pointRadius = 3;
                                }
                            });
                        } else {
                            filteredData.datasets.forEach(dataset => {
                                dataset.borderWidth = 2;
                                dataset.pointRadius = 3;
                            });
                        }
                        (event.chart as ChartJS).update();
                    },
                }}
            />
        </div>
    );
};

export default FPTSSeasonChart;