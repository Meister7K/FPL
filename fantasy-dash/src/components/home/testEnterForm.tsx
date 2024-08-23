'use client'

import React, { useState } from 'react';
import { useFPLData } from '../../hooks/SleeperAPIHook';

export const TestEnterForm = () => {
    const [username, setUsername] = useState('');
    const [selectedLeague, setSelectedLeague] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const { loading, error, leagues, fetchUserData, fetchLeagueData } = useFPLData();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const isUserFetched = await fetchUserData(username);
        if (isUserFetched) {
            setSubmitted(true);
        }
    };

    const handleLeagueSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedLeague(e.target.value);
        const historyData = await fetch('history.json');
        const historyJson = await historyData.json();
        fetchLeagueData(e.target.value, historyJson);
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <label>
                    Username:
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading || submitted}
                    />
                </label>
                <button type="submit" disabled={loading || submitted}>
                    Submit
                </button>
            </form>

            {error && <div className="error">Error: {error}</div>}

            {submitted && leagues.length > 0 && (
                <div>
                    <label>
                        Select League:
                        <select value={selectedLeague} onChange={handleLeagueSelect}>
                            <option value="">-- Select --</option>
                            {leagues.map((league: any) => (
                                <option key={league.league_id} value={league.league_id}>
                                    {league.name}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            )}
        </div>
    );
};

