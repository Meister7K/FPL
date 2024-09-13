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
// import useFetchDraftInfo from '../../hooks/useFetchDraftInfo';
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
    // const {fetchDraftInfo}= useFetchDraftInfo()
    const { fetchTransactions } = useFetchTransactions();

    const leagues = useLeagueStore((state) => state.leagues);
    const selectLeague = useLeagueStore((state) => state.selectLeague);
    const selectedLeague = useLeagueStore((state) => state.selectedLeague);
    const router = useRouter();



    useEffect(() => {
        if (selectedLeague) {
            fetchCurrentRoster(selectedLeague.league_id);
            fetchRosterHistory();
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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

    const handleSelectLeague = async (league: any) => {
        setLoading(true);
        setModalOpen(false);
        selectLeague(league);
        

        try {
            await fetchLeagueData(league.league_id);
            await fetchLeagueUsers(league.league_id);
            await fetchLeagueMatchups();
            await fetchLeagueBrackets();
            await fetchCurrentRoster(league.league_id);
            await fetchRosterHistory();

            // Fetch Draft Info
            

            // Fetch Current and Historical Transactions
            const leagueData = useLeagueStore.getState().leagueData;
            for (const leagueInfo of leagueData) {

                console.log(leagueInfo)

                await fetchTransactions(leagueInfo.league_id, leagueInfo.season);
            }

            const leagueDataState = useLeagueStore.getState().leagueData;
            if (leagueDataState.length > 0 && leagueDataState[0].draft_id) {
                await fetchDraftPicks(leagueDataState[0].draft_id);
            } else {
                console.warn('No draft_id available for fetching draft picks');
            }

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
                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                    {isLoading ? 'Loading...' : 'Fetch Leagues'}
                </button>
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
