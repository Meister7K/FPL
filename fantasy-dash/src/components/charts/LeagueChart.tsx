// @ts-nocheck
"use client";

import { RosterData } from "@/types";
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
import { useEffect, useState } from "react";
import { fetchLeagueManagers } from "@/utils/fetchManagers";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface LeagueChartProps {
  rosterData: RosterData[];
  leagueId: string; // Add leagueId as a prop
}

type SortOption = "alphabetical" | "fpts" | "fptsAgainst";

const LeagueChart: React.FC<LeagueChartProps> = ({ rosterData, leagueId }) => {
  const [sortOption, setSortOption] = useState<SortOption>("fpts");
  const [managerNames, setManagerNames] = useState<{ [ownerId: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const managers = await fetchLeagueManagers(leagueId);
        const managerMap: { [ownerId: string]: string } = {};
        managers.forEach((manager) => {
          managerMap[manager.user_id] = manager.username;
        });
        setManagerNames(managerMap);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch manager names");
        setLoading(false);
      }
    };

    fetchManagers();
  }, [leagueId]);

  const sortData = (data: RosterData[]): RosterData[] => {
    switch (sortOption) {
      case "alphabetical":
        return [...data].sort((a, b) =>
          (managerNames[a.owner_id] || "").localeCompare(managerNames[b.owner_id] || "")
        );
      case "fpts":
        return [...data].sort((a, b) => b.settings.fpts - a.settings.fpts);
      case "fptsAgainst":
        return [...data].sort((a, b) => b.settings.fpts_against - a.settings.fpts_against);
      default:
        return data;
    }
  };

  const sortedData = sortData(rosterData);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
          grid: {
              color: '#222222'
            },}},
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "League Points",
      },
    },
  };

  const labels = sortedData.map((roster) => managerNames[roster.owner_id] || `Team ${roster.owner_id}`);
  const data = {
    labels,
    datasets: [
      {
        label: "Points For",
        data: sortedData.map((roster) => roster.settings.fpts),
        backgroundColor: "rgba(53, 162, 255, 0.7)",
        stack: 0,
      },
      {
        label: "Points Against",
        data: sortedData.map((roster) => -roster.settings.fpts_against),
        backgroundColor: "rgba(255, 70, 90, 0.7)",
        stack: 0,
      },
    ],
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="mx-auto max-w-full items-center my-10 max-w-screen-lg">
      <h2 className="w-full text-center">FPTS Chart</h2>
      <div className="mb-4 flex items-center pt-10 w-full justify-center">
        <label htmlFor="sort-select" >
          Sort by:
        </label>
        <select
          id="sort-select"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as SortOption)}
          className="m-2 border rounded bg-stone-900"
        >
          <option value="alphabetical">Alphabetical</option>
          <option value="fpts">FPTS (Descending)</option>
          <option value="fptsAgainst">FPTS Against (Descending)</option>
        </select>
      </div>
      <div className="relative w-full min-h-96 lg:h-auto overflow-x-visible box-border mx-auto">
        <Bar options={options} data={data} />
      </div>
    </div>
  );
};

export default LeagueChart;
