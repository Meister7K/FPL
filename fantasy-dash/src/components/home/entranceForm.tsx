"use client"

import userData from '../../db/fplDB.json'
import { useState } from 'react';
import { useFPLStore } from '../../store/fplStore';
import { useRouter } from 'next/router';

const EnterForm = () => {
    const router = useRouter();
  const [year, setYear] = useState('2023');
  const [selectedUsername, setSelectedUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setUserData = useFPLStore((state) => state.setUserData);
  const setLeagueData = useFPLStore((state) => state.setLeagueData);
  const setMatchupData = useFPLStore((state) => state.setMatchupData);
  const setRosterData = useFPLStore((state) => state.setRosterData);

  const leagueID = '996177997512290304';

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
      // Fetch user data
      const userResponse = await fetch(`/api/user?username=${selectedUsername}`);
      const userData = await userResponse.json();

      if (!userResponse.ok) {
        throw new Error(userData.error || 'An error occurred fetching user data');
      }

      setUserData(userData);

      // Fetch league data!!!!
      const leagueResponse = await fetch(`/api/league?userId=${userData.user_id}&year=${year}`);
      const leagueData = await leagueResponse.json();

      if (!leagueResponse.ok) {
        throw new Error(leagueData.error || 'An error occurred fetching league data');
      }

      //Fetch RosterData
      const rosterResponse = await fetch(`https://api.sleeper.app/v1/league/${leagueID}/rosters`)
      const rosterData = await rosterResponse.json();

      if (!rosterResponse.ok) {
        throw new Error(rosterData.error || 'An error occurred fetching roster data');
      }

      setRosterData(rosterData);
      console.log(rosterData)
      setLeagueData(year, leagueData);
      setMatchupData(leagueData.matchupData);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUsername(e.target.value);
  };

  const handleYearSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(e.target.value);
  };

  return (
    <>
      <h1 className='text-center text-xl'>Select User</h1>
      <form onSubmit={handleSubmit} className='mx-auto flex flex-col items-center'>
        <div className="flex flex-col space-y-4">
          <select
            className='text-black p-2 rounded'
            value={year}
            onChange={handleYearSelect}
          >
            <option value='2023'>2023</option>
            <option value='2024'>2024</option>
          </select>
          <select
            className='text-black p-2 rounded'
            value={selectedUsername}
            onChange={handleUsernameSelect}
          >
            <option value="">Select a username</option>
            {userData.map((user) => (
              <option key={user.user_id} value={user.user_id}>
                {user.display_name}
              </option>
            ))}
          </select>
        </div>
        <button 
          className="px-4 py-2 border border-gray hover:bg-slate-700 transition-all duration-500 m-6" 
          type="submit" 
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Get Stats'}
        </button>
      </form>
      {error && <p className="text-red-500">{error}</p>}
    </>
  )
}

export default EnterForm;