// @ts-nocheck
'use client';
import { useState } from 'react';
import { useFPLStore } from '../../store/fplStore';
import FPTSLineChart from '../../components/charts/FPTSHistoryChart';

const HistoryPage = () => {
  const historicalData = useFPLStore((state) => state.historicalData);
  const totalDataFromStore = useFPLStore((state) => state.totalData);
  const winnerLoserData = useFPLStore((state) => state.winnerLoserData);

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

  const getPlacement = (year, rosterId) => {
    // Find the data for the specific year
    const yearData = winnerLoserData.find(data => data.year === year);
  
    // If no data for the year, return an empty string
    if (!yearData) return '';
  
    // Find the entry within that year's data that matches the rosterId
    const rosterData = yearData.data.find(item => item.roster_id === rosterId);
  
    // If no matching rosterId found, return an empty string
    if (!rosterData) return '';
  
    // Return the rank with the appropriate ordinal suffix
    const place = rosterData.rank;
    return place;
  };
  
  const getOrdinalSuffix = (i) => {
    const j = i % 10,
      k = i % 100;
    if (j === 1 && k !== 11) {
      return "st";
    }
    if (j === 2 && k !== 12) {
      return "nd";
    }
    if (j === 3 && k !== 13) {
      return "rd";
    }
    return "th";
  };
  

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
  
  // console.log(winnerLoserData)

  const renderSwitch=(param)=>{
    switch(param) {
      case 1:
        return ' 👑';
        case 2:
          return ' 🥈';
          case 3:
            return ' 🥉';
            case winnerLoserData[0].data.length -1:
              return ' 🤡';
              case winnerLoserData[0].data.length:
              return ' 💩';
      default:
        return '';
    }
  }

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
            <div key={yearData.year} className="mt-4 flex flex-wrap border">
              <h3 className="text-lg font-semibold w-full text-center">Year: {yearData.year}</h3>
              <ol className='list-decimal marker:text-red-700 list-outside flex flex-wrap justify-evenly items-center w-full'>
                {sortedManagers.map((manager, index) => (
                  <li key={index} className="m-10">
                    <h4 className='text-lg font-extrabold'>{manager.username}
                     { renderSwitch(getPlacement(yearData.year, manager.roster_id))}</h4>
                    <p>Wins: {manager.wins}</p>
                    <p>Losses: {manager.losses}</p>
                    <p>FPTS: {manager.fpts}</p>
                    <p>FPTS Against: {manager.fpts_against}</p>
                    <p>Final Rank: {getPlacement(yearData.year, manager.roster_id)}</p> {/* Add Final Rank */}
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
