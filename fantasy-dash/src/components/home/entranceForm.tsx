// @ts-nocheck
"use client";

import userData from '../../db/fplDB.json';
import { useState, useEffect } from 'react';
import { useFPLStore } from '../../store/fplStore';
import { useRouter } from 'next/router';
import LeagueSelectionModal from './LeagueSelectionModal';
import historyData from '../../db/history.json';

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

const EnterForm = () => {
    const router = useRouter();
    const [year, setYear] = useState('2024');
    const [selectedUsername, setSelectedUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [leagues, setLeagues] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const setUserData = useFPLStore((state: { setUserData: any; }) => state.setUserData);
    const setLeagueData = useFPLStore((state: { setLeagueData: any; }) => state.setLeagueData);
    const setMatchupData = useFPLStore((state: { setMatchupData: any; }) => state.setMatchupData);
    const setRosterData = useFPLStore((state: { setRosterData: any; }) => state.setRosterData);
    const setLeagueId = useFPLStore((state: { setLeagueId: any; }) => state.setLeagueId);
    const setManagers = useFPLStore((state: { setManagers: any; }) => state.setManagers);
    const setHistoricalData = useFPLStore((state: { setHistoricalData: any; }) => state.setHistoricalData);
    const setTotalData = useFPLStore((state: { setTotalData: any; }) => state.setTotalData);
    const setWinnerLoserData = useFPLStore((state: { setWinnerLoserData: any; }) => state.setWinnerLoserData);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!selectedUsername) {
            setError('Please select a username');
            setLoading(false);
            return;
        }

        try {
            const userDataResponse = await fetchData(`/api/user?username=${selectedUsername}`);
            setUserData(userDataResponse);

            const leaguesDataResponse = await fetchData(`https://api.sleeper.app/v1/user/${userDataResponse.user_id}/leagues/nfl/${year}`);
            setLeagues(leaguesDataResponse);
            setShowModal(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleLeagueSelect = async (leagueId: string) => {
        setShowModal(false);
        setLoading(true);

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
                // console.log(currentYear+':'+yearData.managers[1].fpts)
            }
            setWinnerLoserData(winnerLoserData);

            if (leagueData.name === "Fantasy Premier League") {
                const jsonWinnerLoserData = historyData.map(yearData => ({
                  year: yearData.year,
                  data: yearData.season_standings.map(manager => ({
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
                const jsonHistoricalData = historyData.map(yearData => ({
                    year: yearData.year,
                    managers: yearData.season_standings.map(manager => ({
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
                manager.winPercentage = manager.totalWins / (manager.totalWins + manager.totalLosses);
            });

            setHistoricalData(historicalData);
            setTotalData(totalData);
           

 
            const currentWeek = leagueData?.settings?.current_week;
            const effectiveCurrentWeek = currentWeek || 18;  // Assuming a full NFL season

            const matchupData: Record<number, any[]> = {};
            for (let week = 1; week <= effectiveCurrentWeek; week++) {
                try {
                    const weekMatchups = await fetchData(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`);
                    if (weekMatchups && weekMatchups.length > 0) {
                        matchupData[week] = weekMatchups;
                    }
                } catch (error) {
                    console.error(`Error fetching data for week ${week}:`, error);
                }
            }

            setMatchupData(matchupData);

            const managers = await Promise.all(
                rosterData.map(async (roster: any) => {
                    const userResponse = await fetch(`https://api.sleeper.app/v1/user/${roster.owner_id}`);
                    if (!userResponse.ok) {
                        throw new Error(`Failed to fetch user data for ${roster.owner_id}`);
                    }
                    const userData = await userResponse.json();
                    return {
                        user_id: roster.owner_id,
                        username: userData.display_name,
                        roster: {
                            roster_id: roster.roster_id,
                            wins: roster.settings.wins,
                            losses: roster.settings.losses,
                            ties: roster.settings.ties,
                            fpts: ensureNumber(roster.settings.fpts),
                            fpts_against: ensureNumber(roster.settings.fpts_against),
                            players: roster.players,
                        }
                    };
                })
            );

            setRosterData(rosterData);
            setLeagueData(parseInt(leagueData.season), leagueData);
            setLeagueId(leagueId);
            setManagers(managers);

            router.push('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleUsernameSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedUsername(e.target.value);
    };

    const handleYearSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setYear(e.target.value);
    };

    const currentYear = new Date().getFullYear();
    const yearsArray = Array.from({ length: currentYear - 2018 + 1 }, (_, i) => 2018 + i);
    const yearOptions = yearsArray.reverse();

    return (
        <div className="flex flex-col md:flex-col md:justify-evenly md:items-start items-center w-full mx-auto box-border">
            <div className="flex flex-col md:flex-col md:justify-evenly md:items-start items-center w-full mx-auto box-border">
                <h1 className="text-center text-xl w-full">Enter username/id and year</h1>
                <form onSubmit={handleSubmit} className="mx-auto flex flex-col items-center">
                    <div className="flex flex-col space-y-4">
                        <select
                            className="text-black p-2 rounded"
                            value={year}
                            onChange={handleYearSelect}
                        >
                            {yearOptions.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                        <input
                            className="text-black p-2 rounded"
                            list="usernames"
                            value={selectedUsername}
                            onChange={handleUsernameSelect}
                            placeholder="Select a username"
                        />
                        <datalist id="usernames">
                            <option value="">Select a username</option>
                            {userData.map((user) => (
                                <option key={user.user_id} value={user.display_name}>
                                    {user.display_name}
                                </option>
                            ))}
                        </datalist>
                    </div>
                    <button
                        className="px-4 py-2 border border-gray hover:bg-slate-700 transition-all duration-500 m-6"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'Get Data'}
                    </button>
                </form>
                {error && <p className="text-red-500">{error}</p>}
            </div>
            {showModal && (
                <LeagueSelectionModal
                    leagues={leagues}
                    onSelect={handleLeagueSelect}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
};

export default EnterForm;