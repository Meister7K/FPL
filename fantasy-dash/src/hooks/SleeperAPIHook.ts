// @ts-nocheck
import { useState } from 'react';
import { useFPLStore } from '../store/fplStore';
import historyData from '../db/history.json';

interface TotalData {
    username: string;
    totalWins: number;
    totalLosses: number;
    totalFpts: number;
    totalFptsAgainst: number;
    yearsPlayed: number;
    averageFptsPerYear: number;
    avgWinPerYear: number;
    avgLossPerYear: number;
    winPercentage: number;
}

interface HistoricalData {
    year: number;
    managers: {
        owner_id: string;
        username: string;
        wins: number;
        losses: number;
        fpts: number;
        fpts_against: number;
    }[];
}

interface WinnerLoserData {
    year: number;
    winners: number[];
    losers: number[];
}

const fetchData = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An error occurred fetching data');
    }
    return response.json();
};

const ensureNumber = (value: any): number => {
    return typeof value === 'number' && !isNaN(value) ? value : 0;
};

const historData = historyData;

export const useFPLData = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [leagues, setLeagues] = useState([]);

    const setUserData = useFPLStore((state: { setUserData: any; }) => state.setUserData);
    const setLeagueData = useFPLStore((state: { setLeagueData: any; }) => state.setLeagueData);
    const setMatchupData = useFPLStore((state: { setMatchupData: any; }) => state.setMatchupData);
    const setRosterData = useFPLStore((state: { setRosterData: any; }) => state.setRosterData);
    const setLeagueId = useFPLStore((state: { setLeagueId: any; }) => state.setLeagueId);
    const setManagers = useFPLStore((state: { setManagers: any; }) => state.setManagers);
    const setHistoricalData = useFPLStore((state: { setHistoricalData: any; }) => state.setHistoricalData);
    const setTotalData = useFPLStore((state: { setTotalData: any; }) => state.setTotalData);
    const setWinnerLoserData = useFPLStore((state: { setWinnerLoserData: any; }) => state.setWinnerLoserData);

    const fetchUserData = async (username: string) => {
        setLoading(true);
        setError(null);

        try {
            const userDataResponse = await fetchData(`/api/user?username=${username}`);
            setUserData(userDataResponse);

            const leaguesDataResponse = await fetchData(
                `https://api.sleeper.app/v1/user/${userDataResponse.user_id}/leagues/nfl/${new Date().getFullYear()}`
            );
            setLeagues(leaguesDataResponse);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const fetchLeagueData = async (leagueId: string, historyData: any) => {
        setLoading(true);
        setError(null);

        try {
            const leagueData = await fetchData(`https://api.sleeper.app/v1/league/${leagueId}`);
            const rosterData = await fetchData(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);

            const winnerLoserData: WinnerLoserData[] = [];
            let historicalData: HistoricalData[] = [];
            let currentLeagueId = leagueId;
            let currentYear = parseInt(leagueData.season);

            while (currentLeagueId) {
                const [leagueInfo, winnersResponse, losersResponse] = await Promise.all([
                    fetchData(`https://api.sleeper.app/v1/league/${currentLeagueId}`),
                    fetchData(`https://api.sleeper.app/v1/league/${currentLeagueId}/winners_bracket`),
                    fetchData(`https://api.sleeper.app/v1/league/${currentLeagueId}/losers_bracket`)
                ]);

                let losers = [];
                let winners = [];

                // Process the winnersResponse array
                for (const obj of winnersResponse) {
                    if (obj.hasOwnProperty('p')) {
                        const pValue = obj.p;
                        const wValue = obj.w;
                        const lValue = obj.l;

                        // Add winner and loser to the winners array
                        winners.push({
                            rank: pValue,
                            roster_id: wValue
                        });
                        winners.push({
                            rank: pValue + 1,
                            roster_id: lValue
                        });
                    }
                }

                // Process the losersResponse array
                for (const obj of losersResponse) {
                    if (obj.hasOwnProperty('p')) {
                        const pValue = leagueData.total_rosters; // Using total_rosters for "p"
                        const wValue = obj.w;
                        const lValue = obj.l;

                        // Add loser and winner to the losers array
                        losers.push({
                            rank: pValue,
                            roster_id: wValue
                        });
                        losers.push({
                            rank: pValue - 1,
                            roster_id: lValue
                        });
                    }
                }

                // Combine winners and losers into one array
                let combined = [...winners, ...losers];

                // Filter out any non-object values (e.g., numbers or nulls)
                combined = combined.filter(item => typeof item === 'object' && item !== null);

                // Sort combined array by rank
                combined.sort((a, b) => a.rank - b.rank);

                // Add the sorted and filtered data to winnerLoserData
                winnerLoserData.push({ year: currentYear, data: combined });

                const yearData: HistoricalData = {
                    year: currentYear,
                    managers: await Promise.all(rosterData.map(async (roster: any) => {
                        const userData = await fetchData(`https://api.sleeper.app/v1/user/${roster.owner_id}`);
                        return {
                            roster_id:roster.roster_id,
                            owner_id: roster.owner_id,
                            username: userData.display_name,
                            wins: roster.settings.wins,
                            losses: roster.settings.losses,
                            fpts: ensureNumber(roster.settings.fpts),
                            fpts_against: ensureNumber(roster.settings.fpts_against),
                        };
                    }))
                };

                historicalData.push(yearData);

                currentLeagueId = leagueInfo.previous_league_id;
                currentYear--;
            }
            setWinnerLoserData(winnerLoserData);

            if (leagueData.name === "Fantasy Premier League") {
                const jsonWinnerLoserData = historyData.map((yearData: { year: any; season_standings: any[]; }) => ({
                  year: yearData.year,
                  data: yearData.season_standings.map((manager: { rank: any; roster_id: any; }) => ({
                    rank: manager.rank,
                    roster_id: manager.roster_id
                  }))
                }));
              
                setWinnerLoserData([...winnerLoserData, ...jsonWinnerLoserData]);
              } else {
                setWinnerLoserData(winnerLoserData);
              }
            // Merge with historical data from history.json if applicable
            if (leagueData.name === "Fantasy Premier League") {
                const jsonHistoricalData = historyData.map((yearData: { year: any; season_standings: any[]; }) => ({
                    year: yearData.year,
                    managers: yearData.season_standings.map((manager: { roster_id: any; owner_id: any; display_name: any; wins: any; losses: any; fpts: any; fpts_against: any; }) => ({
                        roster_id:manager.roster_id,
                        owner_id: manager.owner_id,
                        username: manager.display_name,
                        wins: manager.wins,
                        losses: manager.losses,
                        fpts: ensureNumber(manager.fpts),
                        fpts_against: ensureNumber(manager.fpts_against),
                    }))
                }));

                historicalData = [...historicalData, ...jsonHistoricalData];
                historicalData.sort((a, b) => b.year - a.year);

                
            }

            // Calculate total data across all years
            const totalData: TotalData[] = historicalData.reduce((acc, yearData) => {
                yearData.managers.forEach(manager => {
                    const existingManager = acc.find(m => m.username === manager.username);
                    if (existingManager) {
                        existingManager.totalWins += manager.wins;
                        existingManager.totalLosses += manager.losses;
                        existingManager.totalFpts += manager.fpts;
                        existingManager.totalFptsAgainst += manager.fpts_against;
                        existingManager.yearsPlayed++;
                    } else {
                        acc.push({
                            username: manager.username,
                            totalWins: manager.wins,
                            totalLosses: manager.losses,
                            totalFpts: manager.fpts,
                            totalFptsAgainst: manager.fpts_against,
                            yearsPlayed: 1,
                            averageFptsPerYear: 0,
                            avgWinPerYear: 0,
                            avgLossPerYear: 0,
                            winPercentage: 0
                        });
                    }
                });
                return acc;
            }, [] as TotalData[]);

            // Calculate average FPTS/year, average wins/year, average losses/year, and win percentage
            totalData.forEach(manager => {
                manager.averageFptsPerYear = manager.totalFpts / manager.yearsPlayed;
                manager.avgWinPerYear = manager.totalWins / manager.yearsPlayed;
                manager.avgLossPerYear = manager.totalLosses / manager.yearsPlayed;
                manager.winPercentage = (manager.totalWins / (manager.totalWins + manager.totalLosses)) * 100;
            });

            setTotalData(totalData);
            setHistoricalData(historicalData);
            setLeagueData(leagueData);
            setRosterData(rosterData);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        leagues,
        fetchUserData,
        fetchLeagueData
    };
};

