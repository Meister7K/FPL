import React, { useState, useEffect } from 'react';

import usePlayerData from '@/hooks/useFetchStatsProjections';

const ProjectionsTab = ({ players, starters, leagueData }) => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [seasonalAverages, setSeasonalAverages] = useState({
    projectedAvg: 0,
    actualAvg: 0,
  });

//  const test =[]

//  console.log(starters)



  return (
    <div className="mt-6">
    coming soon...
    </div>
  );
};

export default ProjectionsTab;