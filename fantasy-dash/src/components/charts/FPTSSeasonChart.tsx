// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, Title, Tooltip, Legend, PointElement } from 'chart.js';
import 'chart.js/auto';
import { getRosterOwnerName } from '@/utils/usernameUtil';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);


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
    const [weeklyAverages, setWeeklyAverages] = useState<(number | null)[]>([]);
    const [matchupPairs, setMatchupPairs] = useState<Record<number, { matchup_id: number; roster_ids: { id: number; points: number }[] }[]>>({});
    const [rosterIdMap, setRosterIdMap] = useState<Record<string, number>>({});

    useEffect(() => {
        if (matchupData && currentRosterData) {
            prepareChartData();
            prepareMatchupPairs();
            setLoading(false);
        }
    }, [matchupData, currentRosterData]);

    const prepareMatchupPairs = () => {
        const pairs: Record<number, { matchup_id: number; roster_ids: { id: number; points: number }[] }[]> = {};
        const idMap: Record<string, number> = {};

        const matchupWeeks = Object.values(matchupData)[0] as any[][];

        matchupWeeks.forEach((week, weekIndex) => {
            pairs[weekIndex] = [];
            week.forEach((rosterData: any) => {
                const { roster_id, points, matchup_id } = rosterData;
                const existingPair = pairs[weekIndex].find(p => p.matchup_id === matchup_id);

                if (existingPair) {
                    existingPair.roster_ids.push({ id: roster_id, points });
                } else {
                    pairs[weekIndex].push({
                        matchup_id,
                        roster_ids: [{ id: roster_id, points }],
                    });
                }

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
            let weekHasNonZeroPoints = false;
            week.forEach((rosterData: any) => {
                const { roster_id, points } = rosterData;

                if (points > 0) {
                    weekHasNonZeroPoints = true;
                }

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
                        tooltipCallback: (context: any) => {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            const rosterId = rosterIdMap[label];
                            const matchupPair = matchupPairs[context.dataIndex]?.find((pair) =>
                                pair.roster_ids.some((r) => r.id === rosterId)
                            );
                            const pairedRoster = matchupPair?.roster_ids.find((r) => r.id !== rosterId);
                            const pairedRosterOwnerName = pairedRoster
                                ? getRosterOwnerName(pairedRoster.id)
                                : 'N/A';

                            return [
                                `${label}: ${value?.toFixed(2) ?? 'N/A'} points`,
                                pairedRoster
                                    ? `Matchup: ${pairedRosterOwnerName}: ${pairedRoster.points.toFixed(2)} points`
                                    : 'Matchup: N/A'
                            ];
                        }
                    };
                }

                datasets[username].data[weekIndex] = points > 0 ? points : null;

                if (points > 0) {
                    weeklyPoints[weekIndex] += points;
                    weeklyCounts[weekIndex]++;
                }
            });

            if (!weekHasNonZeroPoints) {
                Object.values(datasets).forEach((dataset: any) => {
                    dataset.data[weekIndex] = null;
                });
            }
        });


        const calculatedWeeklyAverages = weeklyPoints.map((total, index) => 
            weeklyCounts[index] > 0 ? total / weeklyCounts[index] : null
        );
        setWeeklyAverages(calculatedWeeklyAverages);


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

        setVisibleWeeks(labels);
    };

    const toggleWeek = (week: string) => {
        setVisibleWeeks(prev =>
            prev.includes(week) ? prev.filter(w => w !== week) : [...prev, week]
        );
    };


    const dynamicSeasonAverage = useMemo(() => {
        if (!chartData || visibleWeeks.length === 0) return 0;
        const visibleWeekIndices = visibleWeeks.map(week => parseInt(week.split(' ')[1]) - 1);
        const visibleAverages = weeklyAverages.filter((avg, index) => 
            visibleWeekIndices.includes(index) && avg !== null
        );
        return visibleAverages.length > 0
            ? visibleAverages.reduce((sum, avg) => sum + (avg ?? 0), 0) / visibleAverages.length
            : 0;
    }, [chartData, visibleWeeks, weeklyAverages]);

    if (loading) {
        return <p>Loading chart data...</p>;
    }

    if (!chartData) {
        return <p>No data available for the chart</p>;
    }


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

    const updateTooltipOnHover = (event: React.MouseEvent<HTMLCanvasElement>, active: any[]) => {
        if (active && active.length > 0) {
            filteredData.datasets.forEach((dataset) => {
                dataset.borderWidth = 2;
                dataset.pointRadius = 3;
            });
            (event.chart as ChartJS).update();
        } else {
            filteredData.datasets.forEach((dataset) => {
                dataset.borderWidth = 2;
                dataset.pointRadius = 3;
            });
            (event.chart as ChartJS).update();
        }
    };

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
                    onHover: updateTooltipOnHover,
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
                                    const matchupPair = matchupPairs[context.dataIndex]?.find((pair) =>
                                        pair.roster_ids.some((r) => r.id === rosterId)
                                    );
                                    const pairedRoster = matchupPair?.roster_ids.find((r) => r.id !== rosterId);
                                    const pairedRosterOwnerName = pairedRoster
                                        ? getRosterOwnerName(pairedRoster.id)
                                        : 'N/A';

                                    return [
                                        `${label}: ${value?.toFixed(2) ?? 'N/A'} points`,
                                        pairedRoster
                                            ? `Matchup: ${pairedRosterOwnerName}: ${pairedRoster.points.toFixed(2)} points`
                                            : 'Matchup: N/A'
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
                }}
            />
        </div>
    );
};

export default FPTSSeasonChart;