// @ts-nocheck
import React, { useMemo } from 'react';
import { ResponsiveBump } from '@nivo/bump';
import { getRosterOwnerName } from '@/utils/usernameUtil'

type RosterData = {
    custom_points: number | null;
    matchup_id: number;
    players: string[];
    players_points: { [key: string]: number };
    points: number;
    roster_id: number;
    starters: string[];
    starters_points: number[];
  };
  
type WeekData = RosterData[];
  
type PowerRankingsData = WeekData[];
  
type PowerRankingsChartProps = {
  data: PowerRankingsData;
};

const calculateCumulativeScores = (data: PowerRankingsData): { [key: number]: number[] } => {
  const cumulativeScores: { [key: number]: number } = {};
  
  return data.reduce((acc, weekData, weekIndex) => {
    weekData.forEach(roster => {
      const pointsEarned = weekData.filter(r => r.points < roster.points).length;
      cumulativeScores[roster.roster_id] = (cumulativeScores[roster.roster_id] || 0) + pointsEarned;
      
      if (!acc[roster.roster_id]) {
        acc[roster.roster_id] = [];
      }
      acc[roster.roster_id][weekIndex] = cumulativeScores[roster.roster_id];
    });

    return acc;
  }, {} as { [key: number]: number[] });
};

const calculateRankings = (cumulativeScores: { [key: number]: number[] }): { [key: number]: number[] } => {
  const weekCount = Math.max(...Object.values(cumulativeScores).map(scores => scores.length));
  const rankings: { [key: number]: number[] } = {};

  for (let week = 0; week < weekCount; week++) {
    const weekScores = Object.entries(cumulativeScores).map(([rosterId, scores]) => ({
      rosterId: Number(rosterId),
      score: scores[week] || 0
    }));

    const sortedRosters = weekScores.sort((a, b) => b.score - a.score);
    
    sortedRosters.forEach((roster, index) => {
      if (!rankings[roster.rosterId]) {
        rankings[roster.rosterId] = [];
      }
      rankings[roster.rosterId][week] = index + 1;  // +1 because ranks start at 1
    });
  }

  return rankings;
};

const PowerRankingsChart: React.FC<PowerRankingsChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const newData = Object.values(data)[0]
    console.log(newData)
    const cumulativeScores = calculateCumulativeScores(newData);
    const rankings = calculateRankings(cumulativeScores);
    
    return Object.entries(rankings).map(([rosterId, ranks]) => ({
      id: `${rosterId}`,
      data: ranks.map((rank, weekIndex) => ({
        x: weekIndex + 1,
        y: rank,
        score: cumulativeScores[Number(rosterId)][weekIndex],
        rosterId: Number(rosterId)
      })),
    }));
  }, [data]);

  return (
    <div className="w-full h-[600px] border border-gray-500 rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-gray-500 border-b border-gray-500">
        <h2 className="text-xl font-semibold text-gray-200">Power Rankings</h2>
      </div>
      <div className="p-4 h-[calc(100%-60px)]">
        <ResponsiveBump
          data={chartData}
          margin={{ top: 40, right: 100, bottom: 40, left: 60 }}
          xOuterPadding={0.3}
          yOuterPadding={0.3}
          startLabelPadding={16}
          colors={{ scheme: 'dark2' }}
          
          lineWidth={20}  // Increased base line thickness
          activeLineWidth={25}
          inactiveLineWidth={10}
          inactiveOpacity={0.5}  // 50% transparency for non-hovered lines
          pointSize={0}
          useMesh={true}
          animate={true}
          isInteractive={true}
          activePointSize={30}
          inactivePointSize={0}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={3}
          activePointBorderWidth={3}
          pointBorderColor={{ from: 'serie.color' }}
          motionConfig="wobbly"
        //   axisTop={{
        //     tickSize: 5,
        //     tickPadding: 5,
        //     tickRotation: 0,
        //     legend: 'Week',
        //     legendPosition: 'middle',
        //     legendOffset: -36
        //   }}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Week',
            legendPosition: 'middle',
            legendOffset: 32
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 10,
            tickRotation: 0,
            legend: 'Rank',
            legendPosition: 'middle',
            legendOffset: -40,
        

          }}
        //   axisRight={{
        //     tickSize: 5,
        //     tickPadding: 5,
        //     tickRotation: 0,
        //     legend: 'Rank',
        //     legendPosition: 'middle',
        //     legendOffset: 40,
        //     format: (value) => chartData.find(d => d.data[0].y === value)?.data[0].rosterId || ''
        //   }}
        theme={{
            axis: {
              ticks: {
                text: {
                  fill: '#cccaca',  // Color for the axis tick labels (red)
                },
              },
              legend: {
                text: {
                  fill: '#cccaca',  // Color for the axis titles (blue)
                  fontSize: 14,     // Font size for axis titles
                  fontWeight: 'bold' // Font weight for axis titles
                },
              },
            },
          }}
          startLabel={false}
          endLabel={(d) => `${getRosterOwnerName(d.data[d.data.length - 1].rosterId)}`}
          pointTooltip={({ point }) => (
            
            <div className="bg-stone-500 p-2 shadow rounded">
              <strong>{ getRosterOwnerName(Math.floor(point.id))}</strong>
              <br />
              Week: {point.data.x}
              <br />
              Rank: {point.data.y}
              <br />
              {/* Score: {point.data.score} */}
            </div>
          )}
        />
      </div>
    </div>
  );
};

export default PowerRankingsChart;