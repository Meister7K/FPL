import React, { useMemo } from 'react';
import { useProjections } from '../hooks/useProjections';
import { getPlayerName, getPlayerPosition, getPlayerTeam } from '../utils/playerUtils';

interface RosterData {
  points: number;
  players: string[];
  roster_id: number;
  custom_points: any;
  matchup_id: number;
  starters: string[];
  starters_points: number[];
  players_points: Record<string, number>;
}

interface WeeklyMatchupResult {
  week: number;
  leagueId: string;
  matchupId: number;
  rosters: Array<{
    rosterId: number;
    actualPoints: number;
    projectedPoints: number;
    players: Array<{ id: string; actualPoints: number; projectedPoints: number }>;
    isWinner: boolean;
    projectedWinner: boolean;
  }>;
  actualWinner: number;
  projectedWinner: number;
  projectionAccurate: boolean;
  isCompleted: boolean; // New field to track if the game has been played
}

interface RosterRecord {
  rosterId: number;
  actualWins: number;
  actualLosses: number;
  projectedWins: number;
  projectedLosses: number;
  totalActualPoints: number;
  totalProjectedPoints: number;
  averageActualPoints: number;
  averageProjectedPoints: number;
  gamesPlayed: number;
}

interface LeagueUser {
  user_id: string;
  display_name: string;
}

interface CurrentRoster {
  roster_id: number;
  owner_id: string;
  // Add other roster properties as needed
}

interface MatchupProjectionsProps {
  leagueMatchups: Record<string, RosterData[][]>;
  currentRoster: CurrentRoster[];
  leagueUsers: LeagueUser[];
  week: number;
  year: number;
}

const MatchupProjections: React.FC<MatchupProjectionsProps> = ({
  leagueMatchups,
  currentRoster,
  leagueUsers,
  week,
  year,
}) => {

  // Helper function to get manager name for a roster
  const getManagerName = (rosterId: number): string => {
    const roster = currentRoster?.find(r => r.roster_id === rosterId);
    if (!roster) return `Roster ${rosterId}`;

    const user = leagueUsers?.find(u => u.user_id === roster.owner_id);
    return user?.display_name || `Manager ${rosterId}`;
  };


  // Get the most current league (the one with the most recent data)
  const currentLeague = useMemo(() => {
    let mostCurrentLeague = null;
    let mostRecentWeek = -1;

    Object.entries(leagueMatchups).forEach(([leagueId, weeksData]) => {
      if (!Array.isArray(weeksData) || weeksData.length === 0) return;

      // Find the last week with data
      for (let i = weeksData.length - 1; i >= 0; i--) {
        if (weeksData[i] !== null && Array.isArray(weeksData[i])) {
          if (i > mostRecentWeek) {
            mostRecentWeek = i;
            mostCurrentLeague = { leagueId, weeksData };
          }
          break;
        }
      }
    });

    // console.log(`Selected most current league: ${mostCurrentLeague?.leagueId} with data through week ${mostRecentWeek + 1}`);
    return mostCurrentLeague;
  }, [leagueMatchups]);

  // Get all unique player IDs from the current league only
  const allPlayerIds = useMemo(() => {
    const playerIds = new Set<string>();

    if (!currentLeague) {
      console.log('No current league found');
      return [];
    }

    // console.log(`Processing current league ${currentLeague.leagueId}`);

    // Process ALL weeks from the current league
    currentLeague.weeksData.forEach((weekData: RosterData[] | null) => {
      if (weekData !== null && Array.isArray(weekData)) {
        weekData.forEach((roster: RosterData) => {
          if (roster?.starters && Array.isArray(roster.starters)) {
            roster.starters.forEach((playerId: string) => {
              if (typeof playerId === 'string') {
                playerIds.add(playerId);
              }
            });
          }
        });
      }
    });

    const playerIdsArray: string[] = [];
    playerIds.forEach(id => playerIdsArray.push(id));
    // console.log('Found', playerIdsArray.length, 'unique player IDs in current league');

    return playerIdsArray;
  }, [currentLeague]);

  // State for projections by week
  const [projectionsByWeek, setProjectionsByWeek] = React.useState<Record<number, Record<string, number>>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = React.useState({ completed: 0, total: 0 });

  // Get all weeks that have matchup data
  const allWeeks = useMemo(() => {
    if (!currentLeague) return [];
    
    const weeks: number[] = [];
    currentLeague.weeksData.forEach((weekData, index) => {
      if (weekData !== null && Array.isArray(weekData) && weekData.length > 0) {
        weeks.push(index + 1);
      }
    });
    return weeks;
  }, [currentLeague]);

  // Fetch projections for all weeks that have data
  React.useEffect(() => {
    const fetchProjectionsForAllWeeks = async () => {
      if (allPlayerIds.length === 0 || allWeeks.length === 0) return;

      setLoading(true);
      setError(null);

      try {
        const projectionsService = (await import('../services/projectionsService')).default;
        const projectionsByWeekMap: Record<number, Record<string, number>> = {};

        // Fetch projections for each week
        for (let i = 0; i < allWeeks.length; i++) {
          const week = allWeeks[i];
          setLoadingProgress({ completed: i, total: allWeeks.length });
          
          // console.log(`Fetching projections for week ${week}`);
          const weekProjections = await projectionsService.getProjections(
            allPlayerIds, 
            week, 
            year
          );
          
          projectionsByWeekMap[week] = weekProjections;
        }

        setProjectionsByWeek(projectionsByWeekMap);
        setLoadingProgress({ completed: allWeeks.length, total: allWeeks.length });
      } catch (err) {
        console.error('Error fetching projections:', err);
        setError('Failed to load projections. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectionsForAllWeeks();
  }, [allPlayerIds, allWeeks, year]);

  // Helper function to get projection for specific player and week
  const getPlayerProjectionForWeek = (playerId: string, weekNum: number): number => {
    const weekProjections = projectionsByWeek[weekNum];
    if (!weekProjections) return 0;
    return weekProjections[playerId] || 0;
  };

  const refetch = React.useCallback(() => {
    setProjectionsByWeek({});
    setError(null);
  }, []);

  // State for calculated matchup results
  const [calculateAllWeekResults, setCalculateAllWeekResults] = React.useState<WeeklyMatchupResult[]>([]);
  
  // State for table sorting
  const [sortConfig, setSortConfig] = React.useState<{
    key: keyof RosterRecord | 'projectionDiff';
    direction: 'asc' | 'desc';
  }>({
    key: 'actualWins',
    direction: 'desc',
  });

  // Calculate matchup results when league data changes
  React.useEffect(() => {
    const calculateResults = async () => {
      const results: WeeklyMatchupResult[] = [];

      if (!currentLeague) {
        console.log('No current league to process');
        setCalculateAllWeekResults([]);
        return;
      }

      const { leagueId, weeksData } = currentLeague;

      // Process each week
      for (let weekIndex = 0; weekIndex < weeksData.length; weekIndex++) {
        const weekData = weeksData[weekIndex];
        if (weekData === null || !Array.isArray(weekData)) continue;

        const currentWeek = weekIndex + 1; // Week numbers start at 1

        // console.log(`Processing week ${currentWeek} with projection data`);

        // Group rosters by matchup_id for this week
        const matchups = new Map<number, RosterData[]>();

        weekData.forEach((roster: RosterData) => {
          if (!roster || typeof roster !== 'object') return;

          const matchupId = roster.matchup_id;
          if (typeof matchupId !== 'number') return;

          if (!matchups.has(matchupId)) {
            matchups.set(matchupId, []);
          }
          matchups.get(matchupId)?.push(roster);
        });

        // Calculate results for each matchup in this week
        matchups.forEach((rosters, matchupId) => {
          if (rosters.length < 2) return; // Skip incomplete matchups

          const matchupResult: WeeklyMatchupResult = {
            week: currentWeek,
            leagueId,
            matchupId,
            rosters: rosters.map((roster) => {
              const players = roster.starters
                .filter((playerId): playerId is string => typeof playerId === 'string')
                .map((playerId) => ({
                  id: playerId,
                  actualPoints: roster.players_points[playerId] || 0,
                  projectedPoints: getPlayerProjectionForWeek(playerId, currentWeek), // Use week-specific projections
                }));

              const actualTotal = roster.points || players.reduce((sum, p) => sum + p.actualPoints, 0);
              const projectedTotal = players.reduce((sum, p) => sum + p.projectedPoints, 0);

              return {
                rosterId: roster.roster_id,
                actualPoints: actualTotal,
                projectedPoints: projectedTotal,
                players,
                isWinner: false, // Will be set below
                projectedWinner: false, // Will be set below
              };
            }),
            actualWinner: 0,
            projectedWinner: 0,
            projectionAccurate: false,
            isCompleted: false, // Will be set below
          };

          // Check if the matchup is completed (any roster has actual points > 0)
          const hasActualPoints = matchupResult.rosters.some(roster => roster.actualPoints > 0);
          matchupResult.isCompleted = hasActualPoints;

          if (matchupResult.isCompleted) {
            // Only determine winners if the game has been played
            // Determine actual winner (highest actual points)
            const actualWinnerRoster = matchupResult.rosters.reduce((prev, current) =>
              current.actualPoints > prev.actualPoints ? current : prev
            );
            matchupResult.actualWinner = actualWinnerRoster.rosterId;

            // Mark actual winners
            matchupResult.rosters.forEach(roster => {
              roster.isWinner = roster.rosterId === matchupResult.actualWinner;
            });
          }

          // Only determine projected winner if we have projection data
          const hasProjections = matchupResult.rosters.some(roster => roster.projectedPoints > 0);
          if (hasProjections) {
            const projectedWinnerRoster = matchupResult.rosters.reduce((prev, current) =>
              current.projectedPoints > prev.projectedPoints ? current : prev
            );
            matchupResult.projectedWinner = projectedWinnerRoster.rosterId;

            // Mark projected winners
            matchupResult.rosters.forEach(roster => {
              roster.projectedWinner = roster.rosterId === matchupResult.projectedWinner;
            });
          } else {
            matchupResult.projectedWinner = 0; // No projection available
            matchupResult.rosters.forEach(roster => {
              roster.projectedWinner = false;
            });
          }

          // Check if projection was accurate (only for completed games)
          if (matchupResult.isCompleted) {
            matchupResult.projectionAccurate = matchupResult.actualWinner === matchupResult.projectedWinner;
          }

          results.push(matchupResult);
        });
      }

      // Sort by week, then matchup
      results.sort((a, b) => {
        if (a.week !== b.week) return a.week - b.week;
        return a.matchupId - b.matchupId;
      });

      // console.log(`Calculated ${results.length} total matchup results for current league`);
      setCalculateAllWeekResults(results);
    };

    calculateResults();
  }, [currentLeague, projectionsByWeek]);

  // Track projection errors from calculated results
  const projectionErrors = useMemo(() => {
    const missingPlayers = new Set<string>();
    const playersWithZeroProjections = new Set<string>();
    const rostersMissingData = new Map<number, string[]>();

    calculateAllWeekResults.forEach(matchup => {
      matchup.rosters.forEach(roster => {
        roster.players.forEach(player => {
          if (player.projectedPoints === 0) {
            playersWithZeroProjections.add(player.id);

            const existing = rostersMissingData.get(roster.rosterId) || [];
            rostersMissingData.set(roster.rosterId, [...existing, player.id]);
          }
        });
      });
    });

    const missingPlayersArray: string[] = [];
    const playersWithZeroProjectionsArray: string[] = [];

    missingPlayers.forEach(id => missingPlayersArray.push(id));
    playersWithZeroProjections.forEach(id => playersWithZeroProjectionsArray.push(id));

    const rostersMissingDataArray: Array<{ rosterId: number; players: string[] }> = [];
    rostersMissingData.forEach((players, rosterId) => {
      rostersMissingDataArray.push({
        rosterId,
        players: [...new Set(players)] // Remove duplicates
      });
    });

    return {
      missingPlayers: missingPlayersArray,
      playersWithZeroProjections: playersWithZeroProjectionsArray,
      rostersMissingData: rostersMissingDataArray
    };
  }, [calculateAllWeekResults]);

  // Calculate roster records and summary statistics
  const { summaryStats, rosterRecords } = useMemo(() => {
    const completedMatchups = calculateAllWeekResults.filter(m => m.isCompleted);
    const totalMatchups = completedMatchups.length;
    const accurateProjections = completedMatchups.filter(m => m.projectionAccurate).length;
    const accuracy = totalMatchups > 0 ? (accurateProjections / totalMatchups) * 100 : 0;

    const weeklyStats = new Map<number, { total: number; accurate: number }>();
    const rosterStats = new Map<number, RosterRecord>();

    calculateAllWeekResults.forEach(matchup => {
      // Weekly stats (only count completed games for accuracy)
      if (matchup.isCompleted) {
        const current = weeklyStats.get(matchup.week) || { total: 0, accurate: 0 };
        current.total++;
        if (matchup.projectionAccurate) current.accurate++;
        weeklyStats.set(matchup.week, current);
      }

      // Roster records
      matchup.rosters.forEach(roster => {
        const existing = rosterStats.get(roster.rosterId) || {
          rosterId: roster.rosterId,
          actualWins: 0,
          actualLosses: 0,
          projectedWins: 0,
          projectedLosses: 0,
          totalActualPoints: 0,
          totalProjectedPoints: 0,
          averageActualPoints: 0,
          averageProjectedPoints: 0,
          gamesPlayed: 0
        };

        existing.gamesPlayed++;
        existing.totalProjectedPoints += roster.projectedPoints;

        // Only count actual results for completed games
        if (matchup.isCompleted) {
          existing.totalActualPoints += roster.actualPoints;

          if (roster.isWinner) {
            existing.actualWins++;
          } else {
            existing.actualLosses++;
          }
        }

        // Always count projected results
        if (roster.projectedWinner) {
          existing.projectedWins++;
        } else {
          existing.projectedLosses++;
        }

        // Calculate averages (only for completed games for actual points)
        const completedGames = existing.actualWins + existing.actualLosses;
        existing.averageActualPoints = completedGames > 0 ? existing.totalActualPoints / completedGames : 0;
        existing.averageProjectedPoints = existing.totalProjectedPoints / existing.gamesPlayed;

        rosterStats.set(roster.rosterId, existing);
      });
    });

    const summaryStats = {
      totalMatchups,
      accurateProjections,
      accuracy,
      weeklyStats: Array.from(weeklyStats.entries()).map(([week, stats]) => ({
        week,
        total: stats.total,
        accurate: stats.accurate,
        accuracy: stats.total > 0 ? (stats.accurate / stats.total) * 100 : 0
      }))
    };

    const rosterRecords = Array.from(rosterStats.values()).sort((a, b) => {
      // Sort by actual wins (descending), then by average points (descending)
      if (a.actualWins !== b.actualWins) return b.actualWins - a.actualWins;
      return b.averageActualPoints - a.averageActualPoints;
    });

    return { summaryStats, rosterRecords };
  }, [calculateAllWeekResults]);

  // Sort roster records based on current sort configuration
  const sortedRosterRecords = React.useMemo(() => {
    if (!rosterRecords || !rosterRecords.length) return [];
    
    return [...rosterRecords].sort((a, b) => {
      let aValue: number;
      let bValue: number;
      
      // Handle projection diff specially since it's not a direct property
      if (sortConfig.key === 'projectionDiff') {
        aValue = a.averageActualPoints - a.averageProjectedPoints;
        bValue = b.averageActualPoints - b.averageProjectedPoints;
      } else {
        aValue = a[sortConfig.key] as number;
        bValue = b[sortConfig.key] as number;
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      
      // Secondary sort by actual wins (descending) if values are equal
      if (sortConfig.key !== 'actualWins') {
        return b.actualWins - a.actualWins;
      }
      
      return 0;
    });
  }, [rosterRecords, sortConfig]);
  
  // Handle sort when clicking on column header
  const handleSort = (key: keyof RosterRecord | 'projectionDiff') => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  if (loading) {
    const progressPercentage = loadingProgress.total > 0
      ? Math.round((loadingProgress.completed / loadingProgress.total) * 100)
      : 0;

    return (
      <div className="p-4">
        <div className="flex items-center space-x-4">
          <div className="text-lg">Loading projections...</div>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-sm text-gray-600">
            {loadingProgress.completed} / {loadingProgress.total} ({progressPercentage}%)
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Projections Not Available
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>Sleeper doesn't provide public projection data. To get real projections, you'll need to integrate with:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>FantasyData API</li>
                  <li>ESPN Fantasy API</li>
                  <li>Yahoo Fantasy API</li>
                  <li>A paid projection service</li>
                </ul>
                <p className="mt-2">The component will show actual vs projected analysis once projection data is available.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (calculateAllWeekResults.length === 0) {
    return <div className="p-4">No matchup data found.</div>;
  }

  // Check if we have any non-zero projections
  const hasRealProjections = calculateAllWeekResults.some(matchup =>
    matchup.rosters.some(roster => roster.projectedPoints > 0)
  );

  return (
    <div className="p-4 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Projection Status Notice */}
      {!hasRealProjections && Object.keys(projectionsByWeek).length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Demo Mode - No Projection Data
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                This component is running in demo mode with actual matchup data but no projection data.
                Integrate with a projection API to see actual vs projected analysis.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header with summary stats */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Season Matchup Analysis ({year})</h2>
            {currentLeague && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                League: {currentLeague.leagueId.slice(-6)}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {allPlayerIds.length} players loaded
            </span>
            <button
              onClick={refetch}
              disabled={loading}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 rounded transition-colors text-gray-900 dark:text-white"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Overall accuracy stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summaryStats.totalMatchups}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Matchups</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{summaryStats.accurateProjections}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Accurate Predictions</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{summaryStats.accuracy.toFixed(1)}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Overall Accuracy</div>
          </div>
        </div>

        {/* Weekly accuracy breakdown */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Weekly Accuracy</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {summaryStats.weeklyStats.map(stat => (
              <div key={stat.week} className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                <div className="font-semibold text-gray-900 dark:text-white">Week {stat.week}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.accurate}/{stat.total}</div>
                <div className="text-xs text-gray-500 dark:text-gray-500">{stat.accuracy.toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projection Data Issues Notification */}
      {(projectionErrors.missingPlayers.length > 0 || projectionErrors.playersWithZeroProjections.length > 0) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Projection Data Issues Detected
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                {projectionErrors.missingPlayers.length > 0 && (
                  <div className="mb-2">
                    <strong>{projectionErrors.missingPlayers.length} players</strong> have no projection data available.
                    This may affect accuracy calculations.
                  </div>
                )}
                {projectionErrors.playersWithZeroProjections.length > 0 && (
                  <div className="mb-2">
                    <strong>{projectionErrors.playersWithZeroProjections.length} players</strong> have zero projections.
                    This could indicate missing or incomplete data.
                  </div>
                )}
                {projectionErrors.rostersMissingData.length > 0 && (
                  <div>
                    <strong>Affected rosters:</strong> {projectionErrors.rostersMissingData.map(({ rosterId }) =>
                      getManagerName(rosterId)
                    ).join(', ')}
                  </div>
                )}
              </div>

              {/* Detailed breakdown - collapsible */}
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100">
                  View Detailed Breakdown
                </summary>
                <div className="mt-2 space-y-3">
                  {projectionErrors.missingPlayers.length > 0 && (
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded border border-yellow-200 dark:border-yellow-700">
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                        Missing Projection Data ({projectionErrors.missingPlayers.length} players):
                      </h4>
                      <div className="text-xs text-yellow-700 dark:text-yellow-300 font-mono">
                        {projectionErrors.missingPlayers.join(', ')}
                      </div>
                    </div>
                  )}

                  {projectionErrors.playersWithZeroProjections.length > 0 && (
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded border border-yellow-200 dark:border-yellow-700">
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                        Zero Projections ({projectionErrors.playersWithZeroProjections.length} players):
                      </h4>
                      <div className="text-xs text-yellow-700 dark:text-yellow-300 font-mono">
                        {projectionErrors.playersWithZeroProjections.join(', ')}
                      </div>
                    </div>
                  )}

                  {projectionErrors.rostersMissingData.length > 0 && (
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded border border-yellow-200 dark:border-yellow-700">
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                        Rosters with Missing Data:
                      </h4>
                      <div className="space-y-2">
                        {projectionErrors.rostersMissingData.map(({ rosterId, players }) => (
                          <div key={rosterId} className="text-sm">
                            <span className="font-medium text-yellow-800 dark:text-yellow-200">
                              {getManagerName(rosterId)} (Roster {rosterId}):
                            </span>
                            <div className="text-xs text-yellow-700 dark:text-yellow-300 font-mono ml-2">
                              {players.join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* Roster Records Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Roster Records & Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                <th 
                  className="text-left p-3 font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  onClick={() => handleSort('rosterId')}
                >
                  <div className="flex items-center">
                    Manager
                    {sortConfig.key === 'rosterId' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-center p-3 font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  onClick={() => handleSort('actualWins')}
                >
                  <div className="flex items-center justify-center">
                    Actual Record
                    {sortConfig.key === 'actualWins' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-center p-3 font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  onClick={() => handleSort('projectedWins')}
                >
                  <div className="flex items-center justify-center">
                    Projected Record
                    {sortConfig.key === 'projectedWins' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-center p-3 font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  onClick={() => handleSort('averageActualPoints')}
                >
                  <div className="flex items-center justify-center">
                    Avg Actual Pts
                    {sortConfig.key === 'averageActualPoints' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-center p-3 font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  onClick={() => handleSort('averageProjectedPoints')}
                >
                  <div className="flex items-center justify-center">
                    Avg Projected Pts
                    {sortConfig.key === 'averageProjectedPoints' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-center p-3 font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  onClick={() => handleSort('projectionDiff')}
                >
                  <div className="flex items-center justify-center">
                    Projection Diff
                    {sortConfig.key === 'projectionDiff' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-center p-3 font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  onClick={() => handleSort('gamesPlayed')}
                >
                  <div className="flex items-center justify-center">
                    Games Played
                    {sortConfig.key === 'gamesPlayed' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRosterRecords.map((record, index) => {
                const projectionDiff = record.averageActualPoints - record.averageProjectedPoints;
                const managerName = getManagerName(record.rosterId);
                return (
                  <tr key={record.rosterId} className={`border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 ${index < 3 ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                    <td className="p-3 font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center space-x-2">
                        <div className="flex flex-col">
                          <span className="font-semibold">{managerName}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Roster {record.rosterId}</span>
                        </div>
                        {index === 0 && <span className="text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">1st</span>}
                        {index === 1 && <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">2nd</span>}
                        {index === 2 && <span className="text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 px-2 py-1 rounded">3rd</span>}
                      </div>
                    </td>
                    <td className="text-center p-3">
                      <span className="font-semibold text-green-600 dark:text-green-400">{record.actualWins}</span>
                      <span className="text-gray-500 dark:text-gray-400">-</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">{record.actualLosses}</span>
                    </td>
                    <td className="text-center p-3">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{record.projectedWins}</span>
                      <span className="text-gray-500 dark:text-gray-400">-</span>
                      <span className="font-semibold text-gray-600 dark:text-gray-400">{record.projectedLosses}</span>
                    </td>
                    <td className="text-center p-3 font-mono text-gray-900 dark:text-white">
                      {record.averageActualPoints.toFixed(1)}
                    </td>
                    <td className="text-center p-3 font-mono text-gray-900 dark:text-white">
                      {record.averageProjectedPoints.toFixed(1)}
                    </td>
                    <td className={`text-center p-3 font-mono ${projectionDiff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {projectionDiff >= 0 ? '+' : ''}{projectionDiff.toFixed(1)}
                    </td>
                    <td className="text-center p-3 text-gray-900 dark:text-white">
                      {record.gamesPlayed}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed matchup results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Detailed Results</h3>

        {calculateAllWeekResults.map((matchup) => (
          <div key={`${matchup.leagueId}-${matchup.week}-${matchup.matchupId}`} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Week {matchup.week} - Matchup {matchup.matchupId}
              </h4>
              {matchup.isCompleted ? (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${matchup.projectionAccurate
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                  : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
                  }`}>
                  {matchup.projectionAccurate ? '✓ Accurate' : '✗ Incorrect'}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  🔮 Upcoming
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchup.rosters.map((roster) => {
                const managerName = getManagerName(roster.rosterId);
                const rosterMissingData = projectionErrors.rostersMissingData.find(r => r.rosterId === roster.rosterId);
                const hasMissingData = rosterMissingData && rosterMissingData.players.length > 0;

                return (
                  <div
                    key={roster.rosterId}
                    className={`border rounded p-4 ${roster.isWinner
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                      } ${hasMissingData ? 'ring-2 ring-yellow-300 dark:ring-yellow-600' : ''}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <h5 className="font-medium text-gray-900 dark:text-white">{managerName}</h5>
                          {hasMissingData && (
                            <span className="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 text-xs rounded" title="Missing projection data">
                              ⚠️
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Roster {roster.rosterId}</span>
                      </div>
                      <div className="flex space-x-2">
                        {matchup.isCompleted && roster.isWinner && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 text-xs rounded">
                            Actual Winner
                          </span>
                        )}
                        {roster.projectedWinner && roster.projectedPoints > 0 && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs rounded">
                            {matchup.isCompleted ? 'Projected Winner' : 'Favored'}
                          </span>
                        )}
                        {roster.projectedPoints === 0 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                            No Projections
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className={`text-lg font-bold ${matchup.isCompleted
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-400 dark:text-gray-500'}`}>
                          {matchup.isCompleted ? roster.actualPoints.toFixed(2) : '0.00'}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {matchup.isCompleted ? 'Actual Points' : 'Not Played'}
                        </div>
                      </div>
                      <div>
                        <div className={`text-lg font-bold ${roster.projectedPoints > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
                          {roster.projectedPoints > 0 ? roster.projectedPoints.toFixed(2) : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {roster.projectedPoints > 0 ? 'Projected Points' : 'No Projections'}
                        </div>
                      </div>
                    </div>

                    {matchup.isCompleted ? (
                      <div className="text-sm">
                        <div className="font-medium text-gray-600 dark:text-gray-400 mb-1">Projection Accuracy:</div>
                        <div className={`${Math.abs(roster.actualPoints - roster.projectedPoints) < 10
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                          }`}>
                          {roster.actualPoints > roster.projectedPoints ? '+' : ''}
                          {(roster.actualPoints - roster.projectedPoints).toFixed(1)} pts difference
                        </div>
                        {hasMissingData && (
                          <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                            ⚠️ {rosterMissingData.players.length} player(s) missing projection data
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm">
                        <div className="font-medium text-gray-600 dark:text-gray-400 mb-1">Game Status:</div>
                        <div className="text-gray-500 dark:text-gray-400 italic">
                          Game not yet played
                        </div>
                        {hasMissingData && (
                          <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                            ⚠️ {rosterMissingData.players.length} player(s) missing projection data
                          </div>
                        )}
                      </div>
                    )}

                    {/* Starter Projections Breakdown */}
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 flex items-center space-x-1">
                        <span>View Starter Projections ({roster.players.length} players)</span>
                        <svg className="w-4 h-4 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="mt-2 space-y-1 bg-gray-100 dark:bg-gray-600 rounded p-3 max-h-48 overflow-y-auto">
                        {roster.players.map((player, playerIndex) => {
                          const isMissingProjection = rosterMissingData?.players.includes(player.id);
                          const hasZeroProjection = player.projectedPoints === 0;

                          return (
                            <div
                              key={player.id}
                              className={`flex justify-between items-center text-xs py-1 px-2 rounded ${isMissingProjection
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                                : hasZeroProjection
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                                  : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                                  #{playerIndex + 1}
                                </span>
                                <div className="flex flex-col">
                                  <span className="font-medium">{getPlayerName(player.id)}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {getPlayerPosition(player.id)} - {getPlayerTeam(player.id)}
                                  </span>
                                </div>
                                {isMissingProjection && (
                                  <span className="text-xs bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 px-1 rounded" title="No projection data">
                                    ❌
                                  </span>
                                )}
                                {hasZeroProjection && !isMissingProjection && (
                                  <span className="text-xs bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-1 rounded" title="Zero projection">
                                    ⚠️
                                  </span>
                                )}
                              </div>
                              <div className="flex space-x-3 text-right">
                                {matchup.isCompleted && (
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-green-600 dark:text-green-400">
                                      {player.actualPoints.toFixed(1)}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">actual</span>
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  <span className={`font-semibold ${isMissingProjection
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-blue-600 dark:text-blue-400'
                                    }`}>
                                    {isMissingProjection ? 'N/A' : player.projectedPoints.toFixed(1)}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">proj</span>
                                </div>
                                {matchup.isCompleted && !isMissingProjection && (
                                  <div className="flex flex-col">
                                    <span className={`font-semibold text-xs ${Math.abs(player.actualPoints - player.projectedPoints) < 3
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-red-600 dark:text-red-400'
                                      }`}>
                                      {player.actualPoints > player.projectedPoints ? '+' : ''}
                                      {(player.actualPoints - player.projectedPoints).toFixed(1)}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">diff</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Summary row */}
                        <div className="border-t border-gray-300 dark:border-gray-500 pt-2 mt-2">
                          <div className="flex justify-between items-center text-sm font-semibold">
                            <span className="text-gray-700 dark:text-gray-300">Total ({roster.players.length} starters)</span>
                            <div className="flex space-x-3">
                              {matchup.isCompleted && (
                                <span className="text-green-600 dark:text-green-400">
                                  {roster.actualPoints.toFixed(1)}
                                </span>
                              )}
                              <span className="text-blue-600 dark:text-blue-400">
                                {roster.projectedPoints.toFixed(1)}
                              </span>
                              {matchup.isCompleted && (
                                <span className={`${Math.abs(roster.actualPoints - roster.projectedPoints) < 10
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                                  }`}>
                                  {roster.actualPoints > roster.projectedPoints ? '+' : ''}
                                  {(roster.actualPoints - roster.projectedPoints).toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 text-sm text-gray-500 dark:text-gray-400 flex justify-between">
              {matchup.isCompleted ? (
                <span>
                  Actual margin: {Math.abs(matchup.rosters[0].actualPoints - matchup.rosters[1].actualPoints).toFixed(2)} pts
                </span>
              ) : (
                <span className="italic">
                  Game not yet played
                </span>
              )}
              <span>
                Projected margin: {Math.abs(matchup.rosters[0].projectedPoints - matchup.rosters[1].projectedPoints).toFixed(2)} pts
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchupProjections;
