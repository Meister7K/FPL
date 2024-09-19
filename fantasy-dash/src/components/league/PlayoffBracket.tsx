// @ts-nocheck
'use client'

import { useEffect, useState } from 'react';
import { fetchPlayoffBrackets } from '../../utils/fetchPlayoffBracket';
import { useFPLStore } from '../../store/fplStore';

interface Matchup {
    m: number;
    r: number;
    t1: number | { w: number } | null;
    t2: number | { w: number } | null;
    w: number | null;
    l: number | null;
    t1_from?: { w?: number; l?: number };
    t2_from?: { w?: number; l?: number };
    p?: number; // Optional placement in the bracket
}

const PlayoffBracket = ({ leagueId }: { leagueId: string }) => {
    const [winnersBracket, setWinnersBracket] = useState<Matchup[]>([]);
    const [losersBracket, setLosersBracket] = useState<Matchup[]>([]);
    const getManagerById = useFPLStore((state) => state.getManagerById);

    useEffect(() => {
        const fetchBrackets = async () => {
            try {
                const { winnersBracket, losersBracket } = await fetchPlayoffBrackets(leagueId);
                setWinnersBracket(winnersBracket);
                setLosersBracket(losersBracket);
            } catch (error) {
                console.error('Error fetching brackets:', error);
            }
        };

        fetchBrackets();
    }, [leagueId]);

    const getManagerName = (rosterId: number | null | undefined) => {
        if (rosterId === null || rosterId === undefined) return 'TBD';
        const manager = getManagerById(rosterId.toString());
        return manager ? manager.username : `Roster ${rosterId}`;
    };

    const renderMatchup = (matchup: Matchup) => (
        <div key={matchup.m} className="border p-2 mb-2">
            <p>Round: {matchup.r}</p>
            <p>Matchup ID: {matchup.m}</p>
            <p>Team 1: {getManagerName(typeof matchup.t1 === 'number' ? matchup.t1 : null)}</p>
            <p>Team 2: {getManagerName(typeof matchup.t2 === 'number' ? matchup.t2 : null)}</p>
            <p>Winner: {getManagerName(matchup.w)}</p>
            <p>Loser: {getManagerName(matchup.l)}</p>
            {matchup.t1_from && (
                <p>
                    Team 1 From: {matchup.t1_from.w ? `Winner of Match ${matchup.t1_from.w}` : `Loser of Match ${matchup.t1_from.l}`}
                </p>
            )}
            {matchup.t2_from && (
                <p>
                    Team 2 From: {matchup.t2_from.w ? `Winner of Match ${matchup.t2_from.w}` : `Loser of Match ${matchup.t2_from.l}`}
                </p>
            )}
        </div>
    );

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">Playoff Brackets</h1>
            <div className="mt-4">
                <h2 className="text-xl font-semibold">Winners Bracket</h2>
                {winnersBracket.length === 0 ? <p>No matchups available.</p> : winnersBracket.map(renderMatchup)}

                <h2 className="text-xl font-semibold mt-6">Losers Bracket</h2>
                {losersBracket.length === 0 ? <p>No matchups available.</p> : losersBracket.map(renderMatchup)}
            </div>
        </div>
    );
};

export default PlayoffBracket;