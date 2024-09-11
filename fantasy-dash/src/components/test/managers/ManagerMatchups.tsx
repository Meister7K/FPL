import React, { useMemo, useState } from 'react';
import useLeagueStore from '../../../store/testStore';
import { getRosterOwnerName } from '@/utils/usernameUtil';

interface ManagerMatchupsProps {
  roster_id: string;
}

interface Matchup {
  points: number;
  roster_id: number;
  matchup_id: number;
  year: number;
  week: number;
  opponent_points?: number;
  opponent_roster_id?: number;
}

interface OpponentStats {
  roster_id: number;
  wins: number;
  losses: number;
  totalMatchups: number;
  winPercentage: number;
  userTotalPoints: number;
  opponentTotalPoints: number;
}

const ManagerMatchups: React.FC<ManagerMatchupsProps> = ({ roster_id }) => {
    const leagueMatchups = useLeagueStore((state) => state.leagueMatchups);
    const rosterHistory = useLeagueStore((state) => state.rosterHistory);
    const [selectedOpponentId, setSelectedOpponentId] = useState<string | null>(null);

    function extractData(nestedArray: any[]): Matchup[] {
        const extractedData: Matchup[] = [];
        let year = 0;
        
        nestedArray.forEach(outerArray => {
            let week = 1;
            
            outerArray.forEach(innerArray => {
                innerArray.forEach(match => {
                    const { points, roster_id, matchup_id } = match;
                    
                    extractedData.push({
                        points,
                        roster_id,
                        matchup_id,
                        year,
                        week
                    });
                });
                
                week++;
            });
            
            year++;
        });
        
        return extractedData;
    }

    const userMatchups = useMemo(() => {
        const test = Object.keys(leagueMatchups).map(key => leagueMatchups[key]);
        const allMatchups = extractData(test);
        
        const userMatchups: Matchup[] = allMatchups.filter(m => m.roster_id === parseInt(roster_id));
        
        userMatchups.forEach(userMatch => {
            const opponentMatch = allMatchups.find(m => 
                m.year === userMatch.year && 
                m.week === userMatch.week && 
                m.matchup_id === userMatch.matchup_id && 
                m.roster_id !== userMatch.roster_id
            );
            
            if (opponentMatch) {
                userMatch.opponent_points = opponentMatch.points;
                userMatch.opponent_roster_id = opponentMatch.roster_id;
            }
        });

        return userMatchups
            .filter(m => m.points !== 0 && m.opponent_points !== 0)
            .sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                return b.week - a.week;
            });
    }, [roster_id, leagueMatchups]);

    const opponentStats = useMemo(() => {
        const stats: { [key: number]: OpponentStats } = {};
        
        if (!userMatchups) return [];  // Return an empty array if userMatchups is undefined
        
        userMatchups.forEach((matchup) => {
            if (!matchup.opponent_roster_id) return;
            
            if (!stats[matchup.opponent_roster_id]) {
                stats[matchup.opponent_roster_id] = {
                    roster_id: matchup.opponent_roster_id,
                    wins: 0,
                    losses: 0,
                    totalMatchups: 0,
                    winPercentage: 0,
                    userTotalPoints: 0,
                    opponentTotalPoints: 0
                };
            }
            
            const opponentStat = stats[matchup.opponent_roster_id];
            opponentStat.totalMatchups++;
            opponentStat.userTotalPoints += matchup.points;
            opponentStat.opponentTotalPoints += matchup.opponent_points || 0;
            
            if (matchup.points > (matchup.opponent_points || 0)) {
                opponentStat.wins++;
            } else if (matchup.points < (matchup.opponent_points || 0)) {
                opponentStat.losses++;
            }
            
            opponentStat.winPercentage = (opponentStat.wins / opponentStat.totalMatchups) * 100;
        });
        
        return Object.values(stats);
    }, [userMatchups]);

    const rival = useMemo(() => {
        return opponentStats.reduce((worstOpponent, currentOpponent) => {
            if (currentOpponent.totalMatchups < 2) return worstOpponent; // Minimum 3 matchups to be considered
            if (!worstOpponent) return currentOpponent;
            if (currentOpponent.winPercentage < worstOpponent.winPercentage) return currentOpponent;
            if (currentOpponent.winPercentage === worstOpponent.winPercentage) {
                return currentOpponent.opponentTotalPoints > worstOpponent.opponentTotalPoints ? currentOpponent : worstOpponent;
            }
            return worstOpponent;
        }, null as OpponentStats | null);
    }, [opponentStats]);

    const cupcake = useMemo(() => {
        return opponentStats.reduce((bestOpponent, currentOpponent) => {
            if (currentOpponent.totalMatchups < 2) return bestOpponent; // Minimum 3 matchups to be considered
            if (!bestOpponent) return currentOpponent;
            if (currentOpponent.winPercentage > bestOpponent.winPercentage) return currentOpponent;
            if (currentOpponent.winPercentage === bestOpponent.winPercentage) {
                return currentOpponent.userTotalPoints > bestOpponent.userTotalPoints ? currentOpponent : bestOpponent;
            }
            return bestOpponent;
        }, null as OpponentStats | null);
    }, [opponentStats]);


    if (!userMatchups || userMatchups.length === 0) {
        return <div>No matchups found for this user.</div>;
    }

    return (
        <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3">Matchups</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-stone-800">
                            <th className="p-2">Year</th>
                            <th className="p-2">Week</th>
                            <th className="p-2">Opponent</th>
                            <th className="p-2">Your Score</th>
                            <th className="p-2">Opponent Score</th>
                            <th className="p-2">Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        {userMatchups.map((matchup) => {
                            const result = matchup.points > (matchup.opponent_points || 0) ? 'Win' : 
                                           matchup.points < (matchup.opponent_points || 0) ? 'Loss' : 'Tie';
                            return (
                                <tr key={`${matchup.year}-${matchup.week}-${matchup.matchup_id}`} className="border-b">
                                    <td className="p-2">{matchup.year}</td>
                                    <td className="p-2">{matchup.week}</td>
                                    <td className="p-2">{getRosterOwnerName(matchup.opponent_roster_id) || 'Unknown'}</td>
                                    <td className="p-2">{matchup.points.toFixed(2)}</td>
                                    <td className="p-2">{matchup.opponent_points?.toFixed(2) || 'N/A'}</td>
                                    <td className="p-2">{result}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <HeadToHeadComparison
                userMatchups={userMatchups}
                roster_id={roster_id}
                rosterHistory={rosterHistory}
                selectedOpponentId={selectedOpponentId}
                setSelectedOpponentId={setSelectedOpponentId}
            />
            <RivalryComponent rival={rival} />
            <CupcakeComponent cupcake={cupcake} />
        </div>
    );
};

interface HeadToHeadComparisonProps {
    userMatchups: Matchup[];
    roster_id: string;
    rosterHistory: any[];
    selectedOpponentId: string | null;
    setSelectedOpponentId: React.Dispatch<React.SetStateAction<string | null>>;
}

const HeadToHeadComparison: React.FC<HeadToHeadComparisonProps> = ({
    userMatchups,
    roster_id,
    rosterHistory,
    selectedOpponentId,
    setSelectedOpponentId
}) => {
    const opponentOptions = useMemo(() => {
        const uniqueOpponents = [...new Set(userMatchups.map(m => m.opponent_roster_id))];
        return uniqueOpponents.map(id => ({
            value: id?.toString() || '',
            label: getRosterOwnerName(id) || 'Unknown'
        }));
    }, [userMatchups]);

    const headToHeadStats = useMemo(() => {
        if (!selectedOpponentId) return null;

        const h2hMatchups = userMatchups.filter(m => m.opponent_roster_id === parseInt(selectedOpponentId));
        const wins = h2hMatchups.filter(m => m.points > (m.opponent_points || 0)).length;
        const losses = h2hMatchups.filter(m => m.points < (m.opponent_points || 0)).length;
        const totalMatchups = h2hMatchups.length;
        const winPercentage = totalMatchups > 0 ? (wins / totalMatchups) * 100 : 0;

        const userTotalPoints = h2hMatchups.reduce((sum, m) => sum + m.points, 0);
        const opponentTotalPoints = h2hMatchups.reduce((sum, m) => sum + (m.opponent_points || 0), 0);

        return {
            wins,
            losses,
            totalMatchups,
            winPercentage,
            userTotalPoints,
            opponentTotalPoints
        };
    }, [userMatchups, selectedOpponentId]);

    return (
        <div className="mt-8">
            <h2 className="text-xl font-semibold mb-3">Head-to-Head Comparison</h2>
            <select
                className="mb-4 p-2 bg-stone-800 rounded"
                value={selectedOpponentId || ''}
                onChange={(e) => setSelectedOpponentId(e.target.value)}
            >
                <option value="">Select an opponent</option>
                {opponentOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>

            {headToHeadStats && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-stone-800 p-4 rounded">
                        <h3 className="text-lg font-semibold mb-2">Record</h3>
                        <p>Wins: {headToHeadStats.wins}</p>
                        <p>Losses: {headToHeadStats.losses}</p>
                        <p>Total Matchups: {headToHeadStats.totalMatchups}</p>
                        <p>Win %: {headToHeadStats.winPercentage.toFixed(2)}%</p>
                    </div>
                    <div className="bg-stone-800 p-4 rounded">
                        <h3 className="text-lg font-semibold mb-2">Points</h3>
                        <p>Your Total Points: {headToHeadStats.userTotalPoints.toFixed(2)}</p>
                        <p>Opponent Total Points: {headToHeadStats.opponentTotalPoints.toFixed(2)}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

interface RivalryComponentProps {
    rival: OpponentStats | null;
}

const RivalryComponent: React.FC<RivalryComponentProps> = ({ rival }) => {
    if (!rival) return null;

    return (
        <div className="mt-8 bg-red-900 p-4 rounded">
            <h2 className="text-xl font-semibold mb-3">Your Rival</h2>
            <p>Manager: {getRosterOwnerName(rival.roster_id)}</p>
            <p>Record: {rival.wins}-{rival.losses}</p>
            <p>Win %: {rival.winPercentage.toFixed(2)}%</p>
            <p>Total Matchups: {rival.totalMatchups}</p>
            <p>Your Total Points: {rival.userTotalPoints.toFixed(2)}</p>
            <p>Their Total Points: {rival.opponentTotalPoints.toFixed(2)}</p>
        </div>
    );
};

interface CupcakeComponentProps {
    cupcake: OpponentStats | null;
}

const CupcakeComponent: React.FC<CupcakeComponentProps> = ({ cupcake }) => {
    if (!cupcake) return null;

    return (
        <div className="mt-8 bg-green-900 p-4 rounded">
            <h2 className="text-xl font-semibold mb-3">Your Cupcake</h2>
            <p>Manager: {getRosterOwnerName(cupcake.roster_id)}</p>
            <p>Record: {cupcake.wins}-{cupcake.losses}</p>
            <p>Win %: {cupcake.winPercentage.toFixed(2)}%</p>
            <p>Total Matchups: {cupcake.totalMatchups}</p>
            <p>Your Total Points: {cupcake.userTotalPoints.toFixed(2)}</p>
            <p>Their Total Points: {cupcake.opponentTotalPoints.toFixed(2)}</p>
        </div>
    );
};

export default ManagerMatchups;