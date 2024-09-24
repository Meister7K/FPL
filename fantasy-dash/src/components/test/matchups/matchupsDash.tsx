// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import useLeagueStore from '../../../store/testStore';
import { getRosterOwnerName } from '@/utils/usernameUtil';
import { getPlayerName, getPlayerPosition } from '@/utils/playerUtils';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MatchupData {
  points: number;
  roster_id: number;
  matchup_id: number;
  starters: string[];
  starters_points: number[];
}

const MatchupsDash: React.FC = () => {
  const leagueMatchups = useLeagueStore((state) => state.leagueMatchups);
  const selectedLeague = useLeagueStore((state) => state.selectedLeague);
  const nflState = useLeagueStore((state) => state.nflState);
  const rosterHistory = useLeagueStore((state) => state.rosterHistory);

  const [selectedWeek, setSelectedWeek] = useState(nflState.week - 1);
  const [selectedYear, setSelectedYear] = useState(rosterHistory[0].season);
  const [league, setLeague] = useState(selectedLeague.league_id);

  const yearToLeagueMap = useMemo(() => {
    return rosterHistory.reduce((acc, roster) => {
      acc[roster.season] = roster.rosters[0].league_id;
      return acc;
    }, {});
  }, [rosterHistory]);

  const matchupData = useMemo(() => {
    if (!leagueMatchups[league] || !leagueMatchups[league][selectedWeek]) return [];

    const currMatches = leagueMatchups[league][selectedWeek];
    const groupedMatchups: { [key: number]: MatchupData[] } = {};

    currMatches.forEach((match: MatchupData) => {
      if (!groupedMatchups[match.matchup_id]) {
        groupedMatchups[match.matchup_id] = [];
      }
      groupedMatchups[match.matchup_id].push(match);
    });

    return Object.values(groupedMatchups);
  }, [leagueMatchups, league, selectedWeek]);

  const years = useMemo(() => {
    return Object.keys(yearToLeagueMap).map(Number).sort((a, b) => b - a);
  }, [yearToLeagueMap]);

  const weeks = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => i + 1);
  }, []);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setLeague(yearToLeagueMap[year]);
    setSelectedWeek(0);
  };

  return (
    <div className="mt-6 p-6 bg-stone-900 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-white">Weekly Matchups</h2>
      
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <select
          className="bg-stone-800 text-white p-2 rounded-md border border-stone-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedYear}
          onChange={(e) => handleYearChange(Number(e.target.value))}
        >
          {years.map(year => (
            <option key={year} value={year}>{year} Season</option>
          ))}
        </select>
        
        <div className="flex items-center space-x-2">
          <label htmlFor="week-select" className="text-white">Week:</label>
          <select
            id="week-select"
            className="bg-stone-800 text-white p-2 rounded-md border border-stone-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedWeek + 1}
            onChange={(e) => setSelectedWeek(Number(e.target.value) - 1)}
          >
            {weeks.map(week => (
              <option key={week} value={week}>Week {week}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {matchupData.map((matchup, index) => {
          const winningTeamIndex = matchup[0].points > matchup[1].points ? 0 : 1;
          return (
            <div key={index} className="bg-stone-800 p-6 rounded-lg shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {matchup.map((team, teamIndex) => (
                  <div key={teamIndex} className={`${teamIndex === winningTeamIndex ? 'bg-green-900' : 'bg-stone-700'} p-4 rounded-lg`}>
                    <h3 className="font-semibold text-white text-xl mb-3">{getRosterOwnerName(team.roster_id)}</h3>
                    <ul className="space-y-2">
                      {team.starters.map((starter, starterIndex) => (
                        <li key={starter} className="text-gray-300 flex justify-between">
                          <span>{getPlayerName(starter)} ({getPlayerPosition(starter)})</span>
                          <span>{team.starters_points[starterIndex].toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="font-bold text-white mt-4 text-xl">Total: {team.points.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchupsDash;