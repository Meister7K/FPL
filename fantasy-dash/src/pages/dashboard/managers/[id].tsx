'use client'
// pages/managers/[id].tsx
import { useRouter } from 'next/router';
import { useFPLStore } from '../../../store/fplStore';
import { useEffect, useState } from 'react';
import playerDB from '../../../db/playerDB.json';


const positionOrder = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF']; // Define the sorting order

const ManagerPage = () => {
    const router = useRouter();
    const { id } = router.query;
    const [manager, setManager] = useState<any>(null);
    const [rosterPositions, setRosterPositions] = useState<string[]>([]);
    const [playersData, setPlayersData] = useState<any[]>([]);

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

            // Map the player IDs from manager's roster to the playerDB object
            const players = managerData.roster.players.map((playerId: string) => {
                // Retrieve player data from playerDB using playerId
                const player = playerDB[playerId] || { name: 'Unknown', position: 'Unknown', team: 'Unknown' };
                
                return {
                    name: player.full_name || 'Unknown',
                    position: player.position || 'Unknown',
                    team: player.team || 'Unknown'
                };
            });

            // Sort players based on defined position order
            players.sort((a, b) => {
                const posA = positionOrder.indexOf(a.position);
                const posB = positionOrder.indexOf(b.position);
                return posA - posB; // Sort by position order
            });

            setPlayersData(players);
        }
    }, [id, getManagerById, leagueData]);

    if (!manager) {
        return <p>Loading...</p>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">Manager Details</h1>
            <div className="mt-4">
            <img className='rounded-full w-36 h-auto border border-slate-200' src={`https://sleepercdn.com/avatars/${manager.avatar}`}  />
                <p><strong>Username:</strong> {manager.username}</p>
                <p><strong>Wins:</strong> {manager.roster.wins}</p>
                <p><strong>Losses:</strong> {manager.roster.losses}</p>
                <p><strong>Ties:</strong> {manager.roster.ties}</p>
                <p><strong>Total Points (FPTS):</strong> {manager.roster.fpts}</p>
                <p><strong>Points Against (FPTS Against):</strong> {manager.roster.fpts_against}</p>
                <p><strong>Roster:</strong></p>
                <ul>
                    {playersData.map((player: any, index: number) => (
                        <li key={index}>
                            {rosterPositions[index] ? `${rosterPositions[index]} - ` : ''}{player.name} ({player.position}, {player.team})
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ManagerPage;