import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import usePlayerData from '@/hooks/useFetchStatsProjections';

const ProjectionsTab = ({ players, starters, leagueData }) => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [seasonalAverages, setSeasonalAverages] = useState({
    projectedAvg: 0,
    actualAvg: 0,
  });

//  const test =[]

 console.log(starters)

 const test = starters.forEach(element => {
    usePlayerData(element, 2024)
 });

  return (
    <div className="mt-6">
     {test? test:null}
    </div>
  );
};

export default ProjectionsTab;