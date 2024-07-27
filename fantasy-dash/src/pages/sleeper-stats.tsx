"use client"
import { useState, useEffect } from 'react';
import { openDB, IDBPDatabase } from 'idb';
import Link from 'next/link';
import userData from './../db/fplDB.json'

type SleeperData = {
  user: {
    user_id: string;
    username: string;
  };
  leagues: Array<{
    league_id: string;
    name: string;
  }>;
  members: Array<{
    user_id: string;
    display_name: string;
  }>;
  rosters: Array<{
    roster_id: number;
    owner_id: string;
  }>;
};

const SleeperStats: React.FC = () => {
  const [username, setUsername] = useState('');
  const [selectedUsername, setSelectedUsername] = useState('');
  const [sleeperData, setSleeperData] = useState<SleeperData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDB();
  }, []);

  const initDB = async () => {
    await openDB('SleeperDB', 1, {
      upgrade(db) {
        db.createObjectStore('sleeperData');
      },
    });
  };

  const saveToIndexedDB = async (data: SleeperData) => {
    const db = await openDB('SleeperDB', 1);
    await db.put('sleeperData', data, 'latestData');
  };

  const loadFromIndexedDB = async () => {
    const db = await openDB('SleeperDB', 1);
    const data = await db.get('sleeperData', 'latestData');
    if (data) {
      setSleeperData(data);
    } else {
      setError('No saved data found');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const usernameToFetch = selectedUsername || username;

    if (!usernameToFetch) {
      setError('Please enter or select a username');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/sleeper?username=${usernameToFetch}`);
      const data = await response.json();
      console.log(data)
      if (!response.ok) {
        throw new Error(data.error || 'An error occurred');
      }

      setSleeperData(data);
      await saveToIndexedDB(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUsername(e.target.value);
    setUsername(''); // Clear the text input when a dropdown option is selected
  };

  const handleUsernameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setSelectedUsername(''); // Clear the dropdown selection when text is input
  };

  return (
    <div className='flex flex-col h-screen justify-center max-w-screen-md mx-auto my-auto w-full'>
      <h1 className='text-center text-xl'>Sleeper Stats</h1>
      <form onSubmit={handleSubmit} className='mx-auto'>
        <div className="flex flex-col space-y-4">
          <input
            className='text-black p-2 rounded'
            type="text"
            value={username}
            onChange={handleUsernameInput}
            placeholder="Enter Sleeper username"
          />
          <select
            className='text-black p-2 rounded'
            value={selectedUsername}
            onChange={handleUsernameSelect}
          >
            <option value="">Select a username</option>
            {userData.map((user) => (
              <option key={user.user_id} value={user.display_name}>
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

      <button className=" px-4 py-2 border border-gray hover:bg-slate-700 transition-all duration-500 m-6" onClick={loadFromIndexedDB}>Load Saved Data</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {sleeperData && (
        <div>
          <h2>User Info</h2>
          <p>Username: {sleeperData.user.username}</p>
          <p>User ID: {sleeperData.user.user_id}</p>

          <h2>Leagues ({sleeperData.leagues.length})</h2>
          <ul>
            {sleeperData.leagues.map((league) => (
              <li key={league.league_id}>
                <Link href={`/league/${league.league_id}`}>
                  {league.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Add more sections to display members and rosters data */}
        </div>
      )}
    </div>
  );
};

export default SleeperStats;