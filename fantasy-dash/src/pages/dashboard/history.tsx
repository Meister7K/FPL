'use client';
import { useState } from 'react';
import { useFPLStore } from '../../store/fplStore';
import FPTSLineChart from '../../components/charts/FPTSHistoryChart'

const HistoryPage = () => {
  const historicalData = useFPLStore((state) => state.historicalData);
  const totalDataFromStore = useFPLStore((state) => state.totalData);

  // State to manage sorting
  const [sortedData, setSortedData] = useState(totalDataFromStore);
  const [sortConfig, setSortConfig] = useState({
    key: 'username',
    direction: 'asc',
  });

  // Sort the data based on the current configuration
  const sortData = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    const sortedArray = [...sortedData].sort((a, b) => {
      if (key === 'username') {
        const nameA = a[key].toLowerCase();
        const nameB = b[key].toLowerCase();
        if (nameA < nameB) {
          return direction === 'asc' ? -1 : 1;
        }
        if (nameA > nameB) {
          return direction === 'asc' ? 1 : -1;
        }
      } else {
        if (a[key] < b[key]) {
          return direction === 'asc' ? -1 : 1;
        }
        if (a[key] > b[key]) {
          return direction === 'asc' ? 1 : -1;
        }
      }
      return 0;
    });

    setSortedData(sortedArray);
    setSortConfig({ key, direction });
  };


  // Table headers with onClick to sort by column
  const headers = [
    { label: 'Username', key: 'username' },
    { label: 'Total Wins', key: 'totalWins' },
    { label: 'Total Losses', key: 'totalLosses' },
    { label: 'Total FPTS', key: 'totalFpts' },
    { label: 'Total FPTS Against', key: 'totalFptsAgainst' },
    { label: 'Years Played', key: 'yearsPlayed' },
    { label: 'Avg FPTS/Year', key: 'averageFptsPerYear' },  // New column
    { label: 'Avg Win/Year', key: 'avgWinPerYear' },        // New column
    { label: 'Avg Loss/Year', key: 'avgLossPerYear' },      // New column
    { label: 'Win %', key: 'winPercentage' },               // New column
  ];


  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-center">League History</h1>

        {/* Total Data */}
        <div className="mt-8 overflow-x-scroll">
        <h2 className="text-xl font-semibold text-center">Total Data</h2>
        <table className="mt-4 w-full max-w-screen-2xl mx-auto">
          <thead className="border">
            <tr>
              {headers.map((header) => (
                <th
                  key={header.key}
                  className="cursor-pointer"
                  onClick={() => sortData(header.key)}
                >
                  {header.label} {sortConfig.key === header.key ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((manager) => (
              <tr key={manager.username}>
                <td className="text-start border">{manager.username}</td>
                <td className="text-center border">{manager.totalWins}</td>
                <td className="text-center border">{manager.totalLosses}</td>
                <td className="text-center border">{manager.totalFpts.toFixed(2)}</td>
                <td className="text-center border">{manager.totalFptsAgainst.toFixed(2)}</td>
                <td className="text-center border">{manager.yearsPlayed}</td>
                <td className="text-center border">{manager.averageFptsPerYear.toFixed(2)}</td>
                <td className="text-center border">{manager.avgWinPerYear.toFixed(2)}</td>
                <td className="text-center border">{manager.avgLossPerYear.toFixed(2)}</td>
                <td className="text-center border">{(manager.winPercentage * 100).toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FPTSLineChart />

      {/* Yearly Data */}
      <div className="mt-4">
        <h2 className="text-xl font-semibold text-center">Yearly Data</h2>
        {historicalData.map((yearData) => {
          const sortedManagers = yearData.managers.sort((a, b) => {
            if (b.wins === a.wins) {
              return b.fpts - a.fpts;
            }
            return b.wins - a.wins;
          });

          return (
            <div key={yearData.year} className="mt-4 flex flex-wrap border ">
              <h3 className="text-lg font-semibold w-full text-center">Year: {yearData.year}</h3>
              <ol className='list-decimal marker:text-red-700 list-outside flex flex-wrap justify-evenly items-center'>
                {sortedManagers.map((manager, index) => (
                  <li key={index} className="m-10">
                    <h4 className='text-lg'>{manager.username}</h4>
                    <p>Wins: {manager.wins}</p>
                    <p>Losses: {manager.losses}</p>
                    <p>FPTS: {manager.fpts}</p>
                    <p>FPTS Against: {manager.fpts_against}</p>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>

    

    </div>
  );
};

export default HistoryPage;
