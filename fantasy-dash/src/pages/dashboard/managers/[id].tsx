'use client'
// pages/managers/[id].tsx
import { useRouter } from 'next/router';
import { useFPLStore } from '../../../store/fplStore';
import { useEffect, useState } from 'react';

const ManagerPage = () => {
    const router = useRouter();
    const { id } = router.query;
    const [manager, setManager] = useState<any>(null);
    const [rosterPositions, setRosterPositions] = useState<string[]>([]);

    const getManagerById = useFPLStore((state) => state.getManagerById);
    const leagueData = useFPLStore((state) => state.leagueData);

    useEffect(() => {
        if (id) {
            const managerData = getManagerById(id as string);
            setManager(managerData);

            const currentYear = new Date().getFullYear().toString();
            if (leagueData[currentYear]) {
                setRosterPositions(leagueData[currentYear].roster_positions || []);
            }
        }
    }, [id, getManagerById, leagueData]);

    if (!manager) {
        return <p>Loading...</p>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">Manager Details</h1>
            <div className="mt-4">
                <p><strong>Username:</strong> {manager.username}</p>
                <p><strong>Wins:</strong> {manager.roster.wins}</p>
                <p><strong>Losses:</strong> {manager.roster.losses}</p>
                <p><strong>Ties:</strong> {manager.roster.ties}</p>
                <p><strong>Total Points (FPTS):</strong> {manager.roster.fpts}</p>
                <p><strong>Points Against (FPTS Against):</strong> {manager.roster.fpts_against}</p>
                <p><strong>Roster:</strong></p>
                <ul>
                    {manager.roster.players.map((player: string, index: number) => (
                        <li key={player}>
                            {rosterPositions[index] ? `${rosterPositions[index]} - ` : ''}{player}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ManagerPage;


