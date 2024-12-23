// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import useFetchUserId from '../../hooks/useFetchID';
import useFetchLeagues from '../../hooks/useFetchLeagues';
import useLeagueStore from '../../store/testStore';
import Modal from './Modal';
import { useRouter } from 'next/navigation';
import Loader from '../../components/loader/Loader';
import useFetchLeagueData from '@/hooks/useFetchLeagueData';
import useFetchRosters from '@/hooks/useFetchRosters';
import useFetchLeagueUsers from '@/hooks/useFetchLeagueUsers';
import useFetchLeagueMatchups from '@/hooks/useFetchLeagueMatchups';
import useFetchLeagueBrackets from '@/hooks/useFetchLeagueBrackets';
import useFetchDraftPicks from '../../hooks/useFetchDraftPicks';
import useFetchTransactions from '../../hooks/useFetchTransactions';

const LeagueSelector: React.FC = () => {
    const [username, setUsername] = useState('');
    const [savedUsernames, setSavedUsernames] = useState<string[]>([]);
    const [year, setYear] = useState('2024');
    const [isModalOpen, setModalOpen] = useState(false);
    const [isLoading, setLoading] = useState(false);

    const { fetchUserId } = useFetchUserId();
    const { fetchLeagues } = useFetchLeagues();
    const { fetchLeagueData } = useFetchLeagueData();
    const { fetchCurrentRoster, fetchRosterHistory } = useFetchRosters();
    const { fetchLeagueUsers } = useFetchLeagueUsers();
    const { fetchLeagueMatchups } = useFetchLeagueMatchups();
    const { fetchLeagueBrackets } = useFetchLeagueBrackets();
    const { fetchDraftPicks } = useFetchDraftPicks();
    const { fetchTransactions } = useFetchTransactions();

    const leagues = useLeagueStore((state) => state.leagues);
    const selectLeague = useLeagueStore((state) => state.selectLeague);
    const selectedLeague = useLeagueStore((state) => state.selectedLeague);
    const router = useRouter();

    
    useEffect(() => {
        if (selectedLeague) {
            Promise.all([
                fetchCurrentRoster(selectedLeague.league_id),
                fetchRosterHistory()
            ]).catch(error => {
                console.error("Error fetching roster data:", error);
            });
        }
    }, [selectedLeague, fetchCurrentRoster, fetchRosterHistory]);

    
    useEffect(() => {
        const storedUsernames = localStorage.getItem('usernames');
        if (storedUsernames) {
            setSavedUsernames(JSON.parse(storedUsernames));
        }
    }, []);

    const saveUsernameToLocalStorage = (username: string) => {
        let usernames = savedUsernames;
        if (!usernames.includes(username)) {
            usernames = [...usernames, username];
            localStorage.setItem('usernames', JSON.stringify(usernames));
            setSavedUsernames(usernames);
        }
    };

    const fetchLeaguesForUser = async (username: string, year: string) => {
        setLoading(true);
        try {
            saveUsernameToLocalStorage(username);
            const userId = await fetchUserId(username);
            await fetchLeagues(userId, year);
            setModalOpen(true);
        } catch (error) {
            console.error("An error occurred:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetchLeaguesForUser(username, year);
    };

    const handleSelectLeague = async (league: any) => {
        setLoading(true);
        setModalOpen(false);
        selectLeague(league);

        try {
            
            await Promise.all([
                fetchLeagueData(league.league_id),
                fetchLeagueUsers(league.league_id)
            ]);

         
            await Promise.all([
                fetchLeagueMatchups(),
                fetchLeagueBrackets(),
                fetchCurrentRoster(league.league_id),
                fetchRosterHistory()
            ]);

           
            const leagueData = useLeagueStore.getState().leagueData;

            
            const fetchPromises = [];

            
            if (leagueData && leagueData.length > 0) {
                const transactionPromises = leagueData.map(leagueInfo => 
                    fetchTransactions(league.league_id, leagueInfo.season)
                );
                fetchPromises.push(...transactionPromises);
            }

            
            if (leagueData && leagueData.length > 0 && leagueData[0].draft_id) {
                fetchPromises.push(
                    fetchDraftPicks(leagueData[0].draft_id)
                );
            }

            
            await Promise.all(fetchPromises);

            
            router.push(`/test/${league.league_id}`);
        } catch (error) {
            console.error("Failed to fetch league data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleYearSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setYear(e.target.value);
    };

    const handleExampleClick = () => {
        setUsername('Meister7K');
        setYear('2024');
        fetchLeaguesForUser('Meister7K', '2024');
    };

    const currentYear = new Date().getFullYear();
    const yearsArray = Array.from({ length: currentYear - 2018 + 1 }, (_, i) => 2018 + i);
    const yearOptions = yearsArray.reverse();

    return (
        <div className='w-full items-center mx-auto text-center'>
            <h1 className='text-2xl'>League Selector</h1>
            <form onSubmit={handleSubmit} className="my-4 box-border p-10 border rounded-md max-w-96 mx-auto flex flex-col text-start">
                <div className="mb-4">
                    <label className="block text-gray-500">Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="mt-1 p-2 border text-black border-gray-300 rounded w-full"
                        list="saved-usernames"
                    />
                    <datalist id="saved-usernames">
                        {savedUsernames.map((name) => (
                            <option key={name} value={name} />
                        ))}
                    </datalist>
                </div>
                <div className="mb-4">
                    <label className="block text-gray-500">Year:</label>
                    <select
                        value={year}
                        onChange={handleYearSelect}
                        required
                        className="mt-1 p-2 border text-black border-gray-300 rounded max-w w-full"
                    >
                        {yearOptions.map((year) => (
                            <option key={year} value={year.toString()}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col space-y-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-rose-600 text-white py-2 px-4 rounded hover:bg-rose-500 flex-1"
                    >
                        {isLoading ? 'Loading...' : 'Fetch Leagues'}
                    </button>
                    <button
                        type="button"
                        onClick={handleExampleClick}
                        disabled={isLoading}
                        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 flex-1"
                    >
                        Explore Example
                    </button>
                </div>
            </form>

            {isLoading && <Loader />}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                leagues={leagues}
                onSelectLeague={handleSelectLeague}
            />
        </div>
    );
};

export default LeagueSelector;