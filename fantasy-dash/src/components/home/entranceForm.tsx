"use client";

import userData from '../../db/fplDB.json';
import { useState, useEffect } from 'react';
import { useFPLStore } from '../../store/fplStore';
import { useRouter } from 'next/router';
import LeagueSelectionModal from './LeagueSelectionModal';

// Utility function to handle API requests
const fetchData = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An error occurred fetching data');
    }
    return response.json();
};

const EnterForm = () => {
    const router = useRouter();
    const [year, setYear] = useState('2023');
    const [selectedUsername, setSelectedUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [leagues, setLeagues] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const setUserData = useFPLStore((state) => state.setUserData);
    const setLeagueData = useFPLStore((state) => state.setLeagueData);
    const setMatchupData = useFPLStore((state) => state.setMatchupData);
    const setRosterData = useFPLStore((state) => state.setRosterData);
    const setLeagueId = useFPLStore((state) => state.setLeagueId);
    const setManagers = useFPLStore((state)=>state.setManagers)

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

            const currentWeek = leagueData.settings.current_week;
            const matchupData = [];
            for (let week = 1; week <= currentWeek; week++) {
                const weekMatchups = await fetchData(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`);
                matchupData.push({ week, matchups: weekMatchups });
            }

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
                            fpts: roster.settings.fpts,
                            fpts_against: roster.settings.fpts_against,
                            players: roster.players, // Assuming `players` contains an array of player IDs/names
                        }
                    };
                })
            );

            setRosterData(rosterData);
            setLeagueData(year, leagueData);
            setMatchupData(matchupData);
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
