'use client';

import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import { useFPLStore } from '../../store/fplStore';
import 'chart.js/auto';

ChartJS.register(LineElement, CategoryScale, LinearScale, Title, Tooltip, Legend);


// Function to generate a color based on a unique string
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

const FPTSLineChart = () => {
    const historicalData = useFPLStore((state) => state.historicalData);

    // State for year visibility
    const [visibleYears, setVisibleYears] = useState<string[]>([]);
    // Mapping of manager names to colors
    const [colorMap, setColorMap] = useState<Record<string, { borderColor: string; backgroundColor: string }>>({});

    useEffect(() => {
        if (historicalData.length > 0) {
            const allYears = historicalData.map(data => data.year.toString()).reverse(); // Reverse the years
            setVisibleYears(allYears);

            // Create color map for managers
            const managers = new Set<string>();
            historicalData.forEach(yearData => {
                yearData.managers.forEach(manager => {
                    managers.add(manager.username);
                });
            });

            const colorMap = Array.from(managers).reduce((map, manager) => {
                map[manager] = generateColor(manager);
                return map;
            }, {} as Record<string, { borderColor: string; backgroundColor: string }>);

            setColorMap(colorMap);
        }
    }, [historicalData]);

    // Toggle visibility of a year
    const toggleYear = (year: string) => {
        setVisibleYears(prev =>
            prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
        );
    };

    // Prepare data for the chart
    const labels: string[] = [];
    const datasets: { label: string; data: (number | null)[]; borderColor: string; backgroundColor: string; }[] = [];

    historicalData.forEach(yearData => {
        if (!labels.includes(yearData.year.toString())) {
            labels.push(yearData.year.toString());
        }

        yearData.managers.forEach(manager => {
            let dataset = datasets.find(ds => ds.label === manager.username);
            if (!dataset) {
                dataset = {
                    label: manager.username,
                    data: Array(labels.length).fill(null),
                    ...colorMap[manager.username] // Use the color map
                };
                datasets.push(dataset);
            }

            const yearIndex = labels.indexOf(yearData.year.toString());
            if (yearIndex !== -1) {
                dataset.data[yearIndex] = manager.fpts || null;
            }
        });
    });

    // Sort labels and filter data to include only visible years
    const sortedLabels = labels.sort((a, b) => parseInt(a) - parseInt(b));
    const filteredLabels = sortedLabels.filter(label => visibleYears.includes(label));
    const filteredDatasets = datasets.map(dataset => ({
        ...dataset,
        data: filteredLabels.map(year => {
            const yearData = historicalData.find(d => d.year.toString() === year);
            const manager = yearData?.managers.find(m => m.username === dataset.label);
            return manager ? (manager.fpts || null) : null;
        }),
    }));

    // Define chart data and options
    const data = {
        labels: filteredLabels,
        datasets: filteredDatasets,
    };

    const options = {
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
                    label: (context: any) => `${context.dataset.label}: ${context.raw}`,
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
        <div className="mb-96 md:mb-40 min-h-fit h-3/4 md:h-2/5 max-h-screen w-full">
            <h2 className="text-xl font-semibold text-center">FPTS Over the Years</h2>
            <div className="flex flex-wrap justify-center mb-4">
                {historicalData.slice().reverse().map(yearData => (
                    <button
                        key={yearData.year}
                        onClick={() => toggleYear(yearData.year.toString())}
                        className={`px-4 py-2 m-2 border rounded ${visibleYears.includes(yearData.year.toString()) ? 'bg-stone-800 hover:bg-stone-500  text-white' : 'bg-gray-200 text-black'}`}
                    >
                        {yearData.year}
                    </button>
                ))}
            </div>
           
            <Line data={data} options={options} />
        </div>
    );
};

export default FPTSLineChart;