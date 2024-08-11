"use client";
import { RosterData } from "@/types";
import fplDB from '../../db/fplDB.json';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Tooltip,
  BarElement,
  Title,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useState } from 'react';
import { plugin } from "postcss";
import { color } from "chart.js/helpers";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface LeagueChartProps {
  rosterData: RosterData[];
}

type SortOption = 'alphabetical' | 'fpts' | 'fptsAgainst';

const LeagueChart: React.FC<LeagueChartProps> = ({ rosterData }) => {
  const [sortOption, setSortOption] = useState<SortOption>('alphabetical');

  const getDisplayName = (ownerId: string) => {
    const user = fplDB.find(user => user.user_id === ownerId);
    return user ? user.display_name : `Team ${ownerId}`;
  };

  const sortData = (data: RosterData[]): RosterData[] => {
    switch (sortOption) {
      case 'alphabetical':
        return [...data].sort((a, b) => getDisplayName(a.owner_id).localeCompare(getDisplayName(b.owner_id)));
      case 'fpts':
        return [...data].sort((a, b) => b.settings.fpts - a.settings.fpts);
      case 'fptsAgainst':
        return [...data].sort((a, b) => b.settings.fpts_against - a.settings.fpts_against);
      default:
        return data;
    }
  };

  const sortedData = sortData(rosterData);

  const options = {
    responsive: true,
   maintainAspectRatio: false,
  
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'League Points',
      },
    },
  };

  const labels = sortedData.map(roster => getDisplayName(roster.owner_id));
  const data = {
    labels,
    datasets: [
      {
        label: 'Points For',
        data: sortedData.map(roster => roster.settings.fpts),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        stack:0,
      },
      {
        label: 'Points Against',
        data: sortedData.map(roster => -roster.settings.fpts_against),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        stack: 0,
      },
    ],
  };

  return (
    <div className=" mx-auto max-w-full items-center">
      <div className="mb-4 flex items-center pt-10">
        <label htmlFor="sort-select" className="mx-auto ">Sort by:</label>
        <select
          id="sort-select"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as SortOption)}
          className="m-2 border rounded  bg-stone-900"
        >
          <option value="alphabetical">Alphabetical</option>
          <option value="fpts">FPTS (Descending)</option>
          <option value="fptsAgainst">FPTS Against (Descending)</option>
        </select>
      </div>
      <div className="relative w-full h-96 lg:h-auto min-h-10 overflow-x-visible box-border mx-auto">
        <Bar options={options} data={data}/>
      </div>
      
    </div>
  );
}

export default LeagueChart;